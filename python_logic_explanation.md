# Riad Marrakech Breakfast Optimizer — Python Logic Explanation

This document provides a detailed mathematical and programmatic walkthrough of `riad_optimizer.py`, the Python desktop backend that solves the Riad breakfast optimization problem using **Linear Programming (LP)**.

The script uses `scipy.optimize.linprog` (HiGHS solver) for computing optimal solutions and `numpy` for matrix operations and the manual simplex tableau procedure.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Module 1 — Graphical Method (2 Variables)](#2-module-1--graphical-method-2-variables)
3. [Module 2 — Simplex Method (3 Variables)](#3-module-2--simplex-method-3-variables)
4. [Explicit Simplex Tableau Generation](#4-explicit-simplex-tableau-generation)
5. [Graphical Visualization](#5-graphical-visualization)
6. [GUI Architecture](#6-gui-architecture)

---

## 1. Problem Statement

A Riad in Marrakech prepares breakfast menus each morning for its guests. The manager wants to **minimize the total cost** of all menus prepared, subject to:

- A **minimum number of menus** must be served
- A **minimum total preparation time** must be reached (to ensure staff utilization)
- A **minimum caloric output** must be met (nutritional standards)
- Each menu count must be **non-negative**

This is a standard **Linear Programming minimization** problem with **≥ (greater-than-or-equal)** constraints.

---

## 2. Module 1 — Graphical Method (2 Variables)

This module solves the case with only two menu types: **Continental** ($y_1$) and **Healthy** ($y_2$).

### 2.1 Mathematical Formulation

**Decision Variables:**
- $y_1$ = number of Continental menus
- $y_2$ = number of Healthy menus

**Objective Function (Minimize):**

$$W = c_1 y_1 + c_2 y_2$$

**Subject to:**

$$
\begin{aligned}
y_1 + y_2 &\geq \text{min\_menus} \\
t_1 y_1 + t_2 y_2 &\geq \text{min\_time} \\
\text{cal}_1 y_1 + \text{cal}_2 y_2 &\geq \text{min\_cal} \\
y_1, y_2 &\geq 0
\end{aligned}
$$

### 2.2 Conversion for `linprog`

`scipy.optimize.linprog` is designed for **minimization** with **≤** inequality constraints:

$$\min \mathbf{c}^T \mathbf{x} \quad \text{s.t.} \quad A_{ub}\mathbf{x} \leq \mathbf{b}_{ub}$$

To convert our **≥** constraints, we multiply both sides by $-1$:

$$a_1 y_1 + a_2 y_2 \geq b \quad \Longrightarrow \quad -a_1 y_1 - a_2 y_2 \leq -b$$

### 2.3 Python Implementation

```python
def solve_graphical_model(params):
    # Cost coefficients for the objective function
    c = [params['c1'], params['c2']]

    # Constraint matrix (negated for ≥ → ≤ conversion)
    A_ub = [
        [-1, -1],                               # -(y1 + y2) ≤ -min_menus
        [-params['t1'], -params['t2']],          # -(t1·y1 + t2·y2) ≤ -min_time
        [-params['cal1'], -params['cal2']]       # -(cal1·y1 + cal2·y2) ≤ -min_cal
    ]

    # Right-hand side (negated)
    b_ub = [-params['min_menus'], -params['min_time'], -params['min_cal']]

    # Solve using the HiGHS solver
    res = linprog(c, A_ub=A_ub, b_ub=b_ub, bounds=[(0, None), (0, None)], method='highs')

    if not res.success:
        raise ValueError("Aucune solution réalisable trouvée.")

    return res.x[0], res.x[1], res.fun
```

**Key details:**

| Parameter | Role |
|---|---|
| `c` | Objective coefficients $[c_1, c_2]$ |
| `A_ub` | $3 \times 2$ matrix of negated constraint coefficients |
| `b_ub` | Vector of negated right-hand-side values |
| `bounds` | $(0, +\infty)$ for each variable — enforces non-negativity |
| `method='highs'` | Uses the state-of-the-art HiGHS interior-point / simplex solver |

**Returns:** $(y_1^*, y_2^*, W^*)$ — the optimal menu quantities and minimum cost.

---

## 3. Module 2 — Simplex Method (3 Variables)

This module extends the problem to three menu types: **Continental** ($y_1$), **Healthy** ($y_2$), and **Vegan** ($y_3$). With 3 variables, the problem can no longer be visualized on a 2D graph, so it requires the algebraic **Simplex method**.

### 3.1 Mathematical Formulation

**Objective Function:**

$$Z = c_1 y_1 + c_2 y_2 + c_3 y_3$$

**Subject to:**

$$
\begin{aligned}
y_1 &\geq \text{min\_y1} \\
y_2 &\geq \text{min\_y2} \\
y_3 &\geq \text{min\_y3} \\
t_1 y_1 + t_2 y_2 + t_3 y_3 &\geq \text{min\_time} \\
\text{cal}_1 y_1 + \text{cal}_2 y_2 + \text{cal}_3 y_3 &\geq \text{min\_cal} \\
y_1, y_2, y_3 &\geq 0
\end{aligned}
$$

### 3.2 Python Implementation

```python
def solve_simplex_model(params):
    c = [params['c1'], params['c2'], params['c3']]

    # 5 constraints × 3 variables (all negated for ≥ → ≤)
    A_ub = [
        [-1,  0,  0],                                       # y1 ≥ min_y1
        [ 0, -1,  0],                                       # y2 ≥ min_y2
        [ 0,  0, -1],                                       # y3 ≥ min_y3
        [-params['t1'],   -params['t2'],   -params['t3']],  # time constraint
        [-params['cal1'], -params['cal2'], -params['cal3']] # calorie constraint
    ]

    b_ub = [
        -params['min_y1'], -params['min_y2'], -params['min_y3'],
        -params['min_time'], -params['min_cal']
    ]

    res = linprog(c, A_ub=A_ub, b_ub=b_ub, bounds=[(0, None)] * 3, method='highs')

    if not res.success:
        raise ValueError("Aucune solution réalisable trouvée.")

    return res.x[0], res.x[1], res.x[2], res.fun
```

The structure is identical to Module 1, scaled to 3 decision variables and 5 inequality constraints.

**Returns:** $(y_1^*, y_2^*, y_3^*, Z^*)$

---

## 4. Explicit Simplex Tableau Generation

While `linprog` computes the solution internally, academic environments require seeing the **step-by-step Simplex iterations**. The function `generate_simplex_tableaux` builds these manually.

### 4.1 Dual Formulation Context

The tableaux are generated for the **dual problem**. The primal minimization problem:

$$\min \; \mathbf{c}^T \mathbf{y} \quad \text{s.t.} \quad A\mathbf{y} \geq \mathbf{b}, \; \mathbf{y} \geq 0$$

has the corresponding dual:

$$\max \; \mathbf{b}^T \mathbf{x} \quad \text{s.t.} \quad A^T\mathbf{x} \leq \mathbf{c}, \; \mathbf{x} \geq 0$$

The function receives $A^T$ (the transposed constraint matrix), $\mathbf{c}$ (primal costs, which become the dual RHS), and $\mathbf{b}$ (primal RHS, which becomes the dual objective).

### 4.2 Tableau Structure

The initial simplex tableau is structured as:

$$
\begin{bmatrix}
A^T & I_n & \mathbf{c} \\
-\mathbf{b}^T & \mathbf{0} & 0
\end{bmatrix}
$$

Where:
- $A^T$ is the $n \times m$ transposed constraint matrix
- $I_n$ is the $n \times n$ identity matrix (slack/surplus variables)
- $\mathbf{c}$ is the right-hand side (primal cost coefficients)
- $-\mathbf{b}^T$ is the negated objective row

### 4.3 Python Implementation

```python
def generate_simplex_tableaux(c, A_T, b):
    n, m = len(c), len(b)       # n = 3 variables, m = 5 constraints
    tableaux = []

    # Initialize the tableau matrix: (n+1) rows × (m+n+1) columns
    tableau = np.zeros((n + 1, m + n + 1))
    tableau[:n, :m] = A_T           # Fill in A^T
    tableau[:n, m:m+n] = np.eye(n)  # Identity for slack variables
    tableau[:n, -1] = c             # RHS = primal costs
    tableau[-1, :m] = -np.array(b)  # Objective row = -b

    basis = list(range(m, m + n))   # Initial basis = slack variables

    # Save initial state
    tableaux.append(get_state(tableau, basis))

    for _ in range(10):  # Max 10 iterations (safety bound)
        # ── Step 1: Optimality Check ──
        # If all values in the objective row (last row, excluding RHS) are ≥ 0,
        # the current solution is optimal.
        if np.all(tableau[-1, :-1] >= -1e-7):
            break

        # ── Step 2: Entering Variable (Pivot Column) ──
        # Select the column with the most negative value in the objective row.
        # This is the variable that will improve the objective the fastest.
        p_col = np.argmin(tableau[-1, :-1])

        # ── Step 3: Leaving Variable (Pivot Row) ──
        # Perform the minimum ratio test: RHS / pivot_column_value
        # Only consider positive pivot column entries to avoid division by zero.
        ratios = [
            tableau[i, -1] / tableau[i, p_col]
            if tableau[i, p_col] > 1e-7
            else np.inf
            for i in range(n)
        ]
        p_row = np.argmin(ratios)

        if ratios[p_row] == np.inf:
            break  # Unbounded problem

        # Record pivot position on the current tableau
        tableaux[-1]["pivot_row"], tableaux[-1]["pivot_col"] = p_row, p_col

        # ── Step 4: Gauss-Jordan Elimination (Pivoting) ──
        # Normalize the pivot row so the pivot element becomes 1
        tableau[p_row, :] /= tableau[p_row, p_col]

        # Eliminate all other entries in the pivot column
        for i in range(n + 1):
            if i != p_row:
                tableau[i, :] -= tableau[i, p_col] * tableau[p_row, :]

        # Update the basis
        basis[p_row] = p_col

        # Save state after this iteration
        tableaux.append(get_state(tableau, basis))

    return tableaux
```

### 4.4 Iteration Summary

| Step | Operation | Purpose |
|---|---|---|
| **Optimality Check** | Check if all $z_j - c_j \geq 0$ in objective row | Determines if current BFS is optimal |
| **Pivot Column** | `argmin` of the objective row | Selects the entering variable |
| **Ratio Test** | $\min\left(\frac{\text{RHS}}{a_{ij}}\right)$ for $a_{ij} > 0$ | Selects the leaving variable (tightest constraint) |
| **Pivot** | Gauss-Jordan elimination | Moves to an adjacent vertex of the feasible polytope |

Each iteration produces a new **Basic Feasible Solution (BFS)** that is at least as good as the previous one, converging to the optimum.

---

## 5. Graphical Visualization

The `plot_graph` method (in the `GraphiqueTab` GUI class) renders the 2D feasible region for Module 1 using **Matplotlib**.

### 5.1 Constraint Boundary Lines

Each constraint $a_1 y_1 + a_2 y_2 = b$ is rearranged to express $y_2$ as a function of $y_1$:

$$y_2 = \frac{b - a_1 y_1}{a_2}$$

For the three constraints:

```python
y1 = np.linspace(0, max_y1 * 1.5, 400)

y2_1 = min_menus - y1                          # Menu constraint boundary
y2_2 = (min_time - t1 * y1) / t2               # Time constraint boundary
y2_3 = (min_cal - cal1 * y1) / cal2            # Calorie constraint boundary
```

### 5.2 Feasible Region Shading

Since all constraints are $\geq$, the feasible region lies **above** all constraint lines. The lower boundary (envelope) of the feasible region is computed via:

```python
y2_max = np.maximum(np.maximum(y2_1, y2_2), y2_3)
```

`np.maximum` performs element-wise comparison, producing the highest $y_2$ value required at each $y_1$ across all constraints. The area from this envelope upward is shaded as the feasible region using `fill_between`.

### 5.3 Optimal Point and Objective Line

The objective function at the optimum is drawn as a dashed line:

$$y_2 = \frac{W^* - c_1 y_1}{c_2}$$

The optimal point $(y_1^*, y_2^*)$ is plotted as a red star marker at the vertex of the feasible region that achieves the minimum cost.

---

## 6. GUI Architecture

The desktop application is built with **Tkinter** and organized into three main classes:

| Class | Role |
|---|---|
| `ScrollableFrame` | Reusable scrollable container for forms and result panels |
| `GraphiqueTab` | Module 1 tab — parameter inputs, solver call, Matplotlib chart |
| `SimplexeTab` | Module 2 tab — parameter inputs, solver call, tableau display using `ttk.Treeview` |
| `RiadApp` | Main `tk.Tk` window — header, themed `ttk.Notebook` with both tabs |

### Data Flow

```
User Input → get_params() → solve_*_model() → Update Labels
                                             → plot_graph() / display_tableaux()
```

The separation between **solver logic** (pure functions at the top of the file) and **GUI components** (classes below) ensures the mathematical core can be reused independently — which is exactly what was done when porting the logic to JavaScript for the web version in `Riad_Web/app.js`.
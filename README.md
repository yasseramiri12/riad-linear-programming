# 🏨 Riad Marrakech — Breakfast Optimizer

A **Linear Programming** application that finds the optimal breakfast menu allocation for a Moroccan Riad, minimizing total cost while satisfying constraints on quantity, preparation time, and caloric requirements.

Built as both a **Python desktop GUI** (Tkinter + SciPy) and a fully static **Web application** (HTML/CSS/JS + Highcharts) deployable on GitHub Pages.

> **Course:** Programmation Linéaire — 2025–2026  
> **Authors:** El Mehdi Aya · Mouissi Charifa · Amiri Yasser · Misky Yahya  
> **Supervisors:** Abdelati Reha & Mourad Hikki

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Mathematical Model](#mathematical-model)
- [Getting Started](#getting-started)
  - [Web Application](#web-application)
  - [Python Desktop Application](#python-desktop-application)
- [Screenshots](#screenshots)
- [Technologies](#technologies)
- [Documentation](#documentation)
- [License](#license)

---

## Overview

A traditional Riad in Marrakech serves multiple breakfast menu types to its guests each morning. The manager must decide **how many of each menu type to prepare** to minimize total cost, while ensuring:

- A minimum number of total menus is prepared
- A minimum total preparation time is met (staff utilization)
- A minimum total caloric output is achieved (nutritional standards)

This project solves this real-world optimization problem using two classic LP methods:

| Module | Method | Variables | Description |
|--------|--------|-----------|-------------|
| **Module 1** | Graphical Method | 2 (Continental, Healthy) | Visualizes the feasible region and optimal point on a 2D plot |
| **Module 2** | Simplex + Duality | 3 (Continental, Healthy, Vegan) | Solves via the Simplex algorithm with step-by-step tableau display |

---

## Features

- **Graphical Method Solver** — Interactive 2D chart showing constraint lines, the feasible region, and the optimal vertex
- **Simplex Method Solver** — Full step-by-step tableau iterations with pivot highlighting
- **Dual Problem** — Extracts and displays the dual solution from the final simplex tableau
- **Adjustable Parameters** — All costs, constraints, and coefficients are editable in real-time
- **Responsive Web UI** — Moroccan-inspired glassmorphism design, works on desktop and mobile
- **Python Desktop GUI** — Tkinter application with Matplotlib graphing (standalone alternative)

---

## Project Structure

```
riad-linear-programming/
├── Riad_Web/                        # Static web application (GitHub Pages)
│   ├── index.html                   # Main HTML — two-tab layout
│   ├── style.css                    # Moroccan-themed CSS with glassmorphism
│   └── app.js                       # LP solvers ported to pure JavaScript
├── riad_optimizer.py                # Python desktop GUI (Tkinter + SciPy)
├── python_logic_explanation.md      # Detailed explanation of the Python math logic
└── README.md                        # This file
```

---

## Mathematical Model

### Objective Function (Minimize)

$$W = c_1 y_1 + c_2 y_2 \quad (\text{Module 1}) \qquad Z = c_1 y_1 + c_2 y_2 + c_3 y_3 \quad (\text{Module 2})$$

### Constraints

| Constraint | Module 1 | Module 2 |
|---|---|---|
| Minimum menus | $y_1 + y_2 \geq M$ | $y_i \geq m_i \; (i=1,2,3)$ |
| Prep time | $t_1 y_1 + t_2 y_2 \geq T$ | $t_1 y_1 + t_2 y_2 + t_3 y_3 \geq T$ |
| Calories | $\text{cal}_1 y_1 + \text{cal}_2 y_2 \geq C$ | $\text{cal}_1 y_1 + \text{cal}_2 y_2 + \text{cal}_3 y_3 \geq C$ |
| Non-negativity | $y_1, y_2 \geq 0$ | $y_1, y_2, y_3 \geq 0$ |

### Default Parameters

| Parameter | y₁ Continental | y₂ Healthy | y₃ Vegan |
|---|---|---|---|
| Cost (DH) | 35 | 50 | 45 |
| Prep time (min) | 5 | 10 | 8 |
| Calories (kcal) | 500 | 650 | 550 |

| Constraint | Value |
|---|---|
| Min total menus | 40 |
| Min prep time | 350 min |
| Min calories | 20 000 kcal |

---

## Getting Started

### Web Application

The web app is fully static — no build step or server required.

**Option 1 — GitHub Pages (Live)**

Visit the deployed site:
```
https://yasseramiri12.github.io/riad-linear-programming/Riad_Web/
```

**Option 2 — Local**

```bash
git clone https://github.com/yasseramiri12/riad-linear-programming.git
cd riad-linear-programming/Riad_Web
# Open index.html in any browser
start index.html      # Windows
open index.html       # macOS
xdg-open index.html   # Linux
```

### Python Desktop Application

**Prerequisites:** Python 3.8+, pip

```bash
pip install numpy scipy matplotlib
python riad_optimizer.py
```

The Tkinter GUI will launch with two tabs: *Méthode Graphique* and *Méthode Simplexe / Dualité*.

---

## Screenshots

### Module 1 — Graphical Method
> Interactive chart showing constraint boundaries, shaded feasible region, and the optimal point marked with a red triangle.

### Module 2 — Simplex Tableaux
> Step-by-step iteration tables with pivot elements highlighted, plus the dual solution summary.

---

## Technologies

| Layer | Technology |
|---|---|
| **Web Frontend** | HTML5, CSS3 (Vanilla), JavaScript (ES6+) |
| **Charting** | [Highcharts](https://www.highcharts.com/) |
| **Typography** | [Outfit](https://fonts.google.com/specimen/Outfit), [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) |
| **Python Backend** | Python 3, NumPy, SciPy (`linprog` — HiGHS solver), Matplotlib |
| **Python GUI** | Tkinter |
| **Hosting** | GitHub Pages |

---

## Documentation

For a detailed walkthrough of the mathematical logic and Python implementation, see:

📄 [`python_logic_explanation.md`](python_logic_explanation.md)

---

## License

This project was developed as part of an academic course at ENSA. It is available for educational purposes.

import tkinter as tk
from tkinter import ttk, messagebox
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from pulp import LpMinimize, LpProblem, LpVariable, LpStatus, value, PULP_CBC_CMD

# ==========================================
# OPTIMIZATION LOGIC (PuLP)
# ==========================================

def solve_graphical_model(params):
    """Résout le problème d'optimisation pour 2 variables avec PuLP."""
    prob = LpProblem("Riad_Graphique", LpMinimize)

    y1 = LpVariable("y1", lowBound=0)
    y2 = LpVariable("y2", lowBound=0)

    prob += params['c1'] * y1 + params['c2'] * y2, "Cout_Total"

    prob += y1 + y2 >= params['min_menus'], "Min_Menus"
    prob += params['t1'] * y1 + params['t2'] * y2 >= params['min_time'], "Min_Temps"
    prob += params['cal1'] * y1 + params['cal2'] * y2 >= params['min_cal'], "Min_Calories"

    prob.solve(PULP_CBC_CMD(msg=0))  # msg=0 suppresses console output

    if LpStatus[prob.status] != "Optimal":
        raise ValueError("Aucune solution réalisable trouvée.")

    return value(y1), value(y2), value(prob.objective)


def solve_simplex_model(params):
    """Résout le problème d'optimisation pour 3 variables avec PuLP."""
    prob = LpProblem("Riad_Simplex", LpMinimize)

    y1 = LpVariable("y1", lowBound=0)
    y2 = LpVariable("y2", lowBound=0)
    y3 = LpVariable("y3", lowBound=0)

    prob += params['c1'] * y1 + params['c2'] * y2 + params['c3'] * y3, "Cout_Total"

    prob += y1 >= params['min_y1'], "Min_Y1"
    prob += y2 >= params['min_y2'], "Min_Y2"
    prob += y3 >= params['min_y3'], "Min_Y3"
    prob += params['t1'] * y1 + params['t2'] * y2 + params['t3'] * y3 >= params['min_time'], "Min_Temps"
    prob += params['cal1'] * y1 + params['cal2'] * y2 + params['cal3'] * y3 >= params['min_cal'], "Min_Calories"

    prob.solve(PULP_CBC_CMD(msg=0))

    if LpStatus[prob.status] != "Optimal":
        raise ValueError("Aucune solution réalisable trouvée.")

    dual_values = {}
    for name, constraint in prob.constraints.items():
        dual_values[name] = constraint.pi if constraint.pi is not None else 0.0

    return value(y1), value(y2), value(y3), value(prob.objective), dual_values


def generate_simplex_tableaux(c, A_T, b):
    """Génère les tableaux itératifs du simplexe (pour affichage pédagogique)."""
    n, m = len(c), len(b)
    tableaux = []

    tableau = np.zeros((n + 1, m + n + 1))
    tableau[:n, :m] = A_T
    tableau[:n, m:m+n] = np.eye(n)
    tableau[:n, -1] = c
    tableau[-1, :m] = -np.array(b)

    basis = list(range(m, m + n))

    def get_state(tab, b_list, p_row=None, p_col=None):
        return {"matrix": tab.copy(), "basis": b_list.copy(), "pivot_row": p_row, "pivot_col": p_col}

    tableaux.append(get_state(tableau, basis))

    for _ in range(10):
        if np.all(tableau[-1, :-1] >= -1e-7): break

        p_col = int(np.argmin(tableau[-1, :-1]))
        ratios = [tableau[i, -1] / tableau[i, p_col] if tableau[i, p_col] > 1e-7 else np.inf for i in range(n)]
        p_row = int(np.argmin(ratios))

        if ratios[p_row] == np.inf: break

        tableaux[-1]["pivot_row"], tableaux[-1]["pivot_col"] = p_row, p_col

        tableau[p_row, :] /= tableau[p_row, p_col]
        for i in range(n + 1):
            if i != p_row:
                tableau[i, :] -= tableau[i, p_col] * tableau[p_row, :]

        basis[p_row] = p_col
        # Clean floating point noise (e.g. -1.2e-15 → 0.0)
        tableau[np.abs(tableau) < 1e-9] = 0.0
        tableaux.append(get_state(tableau, basis))

    return tableaux

# ==========================================
# GUI COMPONENTS (Tkinter)
# ==========================================

class ScrollableFrame(tk.Frame):
    def __init__(self, container, bg_color="#FDF5E6", *args, **kwargs):
        super().__init__(container, bg=bg_color, *args, **kwargs)
        self.canvas = tk.Canvas(self, bg=bg_color, highlightthickness=0)
        scrollbar = ttk.Scrollbar(self, orient="vertical", command=self.canvas.yview)
        self.scrollable_frame = tk.Frame(self.canvas, bg=bg_color)

        self.scrollable_frame.bind("<Configure>", lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all")))
        self.canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        self.canvas.configure(yscrollcommand=scrollbar.set)

        self.canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")


class GraphiqueTab(tk.Frame):
    def __init__(self, parent):
        super().__init__(parent, bg="#FDF5E6")

        self.left_panel = tk.Frame(self, bg="#FDF5E6", width=350)
        self.left_panel.pack(side="left", fill="y", padx=10, pady=10)
        self.left_panel.pack_propagate(False)

        _sf1 = ScrollableFrame(self.left_panel)
        _sf1.pack(fill="both", expand=True)
        self.params_frame = _sf1.scrollable_frame

        tk.Label(self.params_frame, text="Paramètres", font=('Arial', 14, 'bold'), bg="#FDF5E6", fg="#8B1A1A").pack(pady=10)

        self.entries = {}
        fields = [
            ("Coût Continental (y1)", "c1", 35), ("Coût Healthy (y2)", "c2", 50),
            ("Min menus (y1+y2)", "min_menus", 40), ("Min temps total", "min_time", 350),
            ("Temps par y1", "t1", 5), ("Temps par y2", "t2", 10),
            ("Min calories", "min_cal", 20000), ("Calories par y1", "cal1", 500), ("Calories par y2", "cal2", 650)
        ]

        for label, key, default in fields:
            frame = tk.Frame(self.params_frame, bg="#FDF5E6")
            frame.pack(fill="x", pady=2)
            tk.Label(frame, text=f"{label}:", bg="#FDF5E6", width=20, anchor="w").pack(side="left")
            ent = tk.Entry(frame, width=10)
            ent.insert(0, str(default))
            ent.pack(side="right", padx=10)
            self.entries[key] = (ent, default)

        btn_frame = tk.Frame(self.params_frame, bg="#FDF5E6")
        btn_frame.pack(fill="x", pady=20)
        tk.Button(btn_frame, text="Résoudre", bg="#8B1A1A", fg="white", font=('Arial', 11, 'bold'), command=self.solve).pack(side="left", padx=5, expand=True, fill="x")
        tk.Button(btn_frame, text="Réinit", bg="#556B2F", fg="white", font=('Arial', 11, 'bold'), command=self.reset).pack(side="right", padx=5, expand=True, fill="x")

        self.res_frame = tk.Frame(self.params_frame, bg="#D8E4BC", bd=2, relief="groove")
        self.res_frame.pack(fill="x", pady=10, ipady=10)
        self.lbl_y1 = tk.Label(self.res_frame, text="y1* = -", bg="#D8E4BC", font=('Arial', 12, 'bold'))
        self.lbl_y1.pack()
        self.lbl_y2 = tk.Label(self.res_frame, text="y2* = -", bg="#D8E4BC", font=('Arial', 12, 'bold'))
        self.lbl_y2.pack()
        self.lbl_w = tk.Label(self.res_frame, text="W* = -", bg="#D8E4BC", font=('Arial', 14, 'bold'), fg="#8B1A1A")
        self.lbl_w.pack(pady=(5, 0))

        self.right_panel = tk.Frame(self, bg="white", bd=2, relief="sunken")
        self.right_panel.pack(side="right", fill="both", expand=True, padx=10, pady=10)

        self.fig, self.ax = plt.subplots(figsize=(6, 5), dpi=100)
        self.canvas = FigureCanvasTkAgg(self.fig, master=self.right_panel)
        self.canvas.get_tk_widget().pack(fill="both", expand=True)
        self.reset()

    def get_params(self):
        return {k: float(v[0].get()) for k, v in self.entries.items()}

    def reset(self):
        for ent, default in self.entries.values():
            ent.delete(0, tk.END)
            ent.insert(0, str(default))
        self.lbl_y1.config(text="y1* = -")
        self.lbl_y2.config(text="y2* = -")
        self.lbl_w.config(text="W* = -")
        self.ax.clear()
        self.ax.set_title("Région Réalisable et Solution Optimale")
        self.canvas.draw()

    def solve(self):
        try:
            params = self.get_params()
            y1_opt, y2_opt, w_opt = solve_graphical_model(params)
            self.lbl_y1.config(text=f"y1* = {y1_opt:.2f}")
            self.lbl_y2.config(text=f"y2* = {y2_opt:.2f}")
            self.lbl_w.config(text=f"W* = {w_opt:.2f} DH")
            self.plot_graph(params, y1_opt, y2_opt, w_opt)
        except Exception as e:
            messagebox.showerror("Erreur", str(e))

    def plot_graph(self, p, y1_opt, y2_opt, w_opt):
        self.ax.clear()
        max_y1 = max(80, y1_opt * 1.5) if y1_opt > 0 else 80
        max_y2 = max(80, y2_opt * 1.5) if y2_opt > 0 else 80
        y1 = np.linspace(0, max_y1 * 1.5, 400)

        y2_1 = p['min_menus'] - y1
        y2_2 = (p['min_time'] - p['t1'] * y1) / p['t2'] if p['t2'] != 0 else np.zeros_like(y1)
        y2_3 = (p['min_cal'] - p['cal1'] * y1) / p['cal2'] if p['cal2'] != 0 else np.zeros_like(y1)

        self.ax.plot(y1, y2_1, label=f'y1+y2>={p["min_menus"]}', color='blue')
        self.ax.plot(y1, y2_2, label=f'{p["t1"]}y1+{p["t2"]}y2>={p["min_time"]}', color='green')
        self.ax.plot(y1, y2_3, label=f'{p["cal1"]}y1+{p["cal2"]}y2>={p["min_cal"]}', color='orange')

        y2_max = np.maximum(np.maximum(y2_1, y2_2), y2_3)
        self.ax.fill_between(y1, y2_max, max_y2 * 1.5, where=(y2_max <= max_y2 * 1.5) & (y1 >= 0), color='gray', alpha=0.3)

        y2_obj = (w_opt - p['c1'] * y1) / p['c2'] if p['c2'] != 0 else np.zeros_like(y1)
        self.ax.plot(y1, y2_obj, 'r--', label=f'Objectif W={w_opt:.2f}')
        self.ax.plot(y1_opt, y2_opt, 'r*', markersize=15, label='Point optimal')

        self.ax.set(xlim=(0, max_y1), ylim=(0, max_y2), xlabel='y1', ylabel='y2', title="Solution Optimale")
        self.ax.legend()
        self.ax.grid(True, linestyle='--', alpha=0.6)
        self.canvas.draw()


class SimplexeTab(tk.Frame):
    def __init__(self, parent):
        super().__init__(parent, bg="#FDF5E6")

        self.left_panel = tk.Frame(self, bg="#FDF5E6", width=350)
        self.left_panel.pack(side="left", fill="y", padx=10, pady=10)
        self.left_panel.pack_propagate(False)
        _sf2 = ScrollableFrame(self.left_panel)
        _sf2.pack(fill="both", expand=True)
        self.params_frame = _sf2.scrollable_frame

        tk.Label(self.params_frame, text="Paramètres", font=('Arial', 14, 'bold'), bg="#FDF5E6", fg="#8B1A1A").pack(pady=10)

        self.entries = {}
        fields = [
            ("Coût y1, y2, y3", ["c1", "c2", "c3"], [35, 50, 45]),
            ("Min y1, y2, y3", ["min_y1", "min_y2", "min_y3"], [20, 10, 10]),
            ("Min temps total", ["min_time"], [350]),
            ("Temps y1, y2, y3", ["t1", "t2", "t3"], [5, 10, 8]),
            ("Min cal totales", ["min_cal"], [20000]),
            ("Cal y1, y2, y3", ["cal1", "cal2", "cal3"], [500, 650, 550])
        ]

        for label, keys, defaults in fields:
            frame = tk.Frame(self.params_frame, bg="#FDF5E6")
            frame.pack(fill="x", pady=2)
            tk.Label(frame, text=label + ":", bg="#FDF5E6", width=18, anchor="w").pack(side="left")
            for key, default in zip(keys, defaults):
                ent = tk.Entry(frame, width=5)
                ent.insert(0, str(default))
                ent.pack(side="left", padx=2)
                self.entries[key] = (ent, default)

        btn_frame = tk.Frame(self.params_frame, bg="#FDF5E6")
        btn_frame.pack(fill="x", pady=20)
        tk.Button(btn_frame, text="Résoudre", bg="#8B1A1A", fg="white", font=('Arial', 11, 'bold'), command=self.solve).pack(side="left", padx=5, expand=True, fill="x")
        tk.Button(btn_frame, text="Réinit", bg="#556B2F", fg="white", font=('Arial', 11, 'bold'), command=self.reset).pack(side="right", padx=5, expand=True, fill="x")

        self.res_frame = tk.Frame(self.params_frame, bg="#D8E4BC", bd=2, relief="groove")
        self.res_frame.pack(fill="x", pady=10, ipady=10)
        self.lbl_y = tk.Label(self.res_frame, text="y* = (-)", bg="#D8E4BC", font=('Arial', 12, 'bold'))
        self.lbl_y.pack()
        self.lbl_w = tk.Label(self.res_frame, text="W* = -", bg="#D8E4BC", font=('Arial', 14, 'bold'), fg="#8B1A1A")
        self.lbl_w.pack()
        self.lbl_dual = tk.Label(self.res_frame, text="Solution Duale: -", bg="#D8E4BC", font=('Arial', 10, 'italic'))
        self.lbl_dual.pack()

        self.right_panel = tk.Frame(self, bg="white", bd=2, relief="sunken")
        self.right_panel.pack(side="right", fill="both", expand=True, padx=10, pady=10)
        tk.Label(self.right_panel, text="Itérations du Simplexe", font=('Arial', 14, 'bold'), bg="white", fg="#8B1A1A").pack(pady=10)
        _sf3 = ScrollableFrame(self.right_panel, bg_color="white")
        _sf3.pack(fill="both", expand=True)
        self.tableaux_frame = _sf3.scrollable_frame

        self.reset()

    def get_params(self):
        return {k: float(v[0].get()) for k, v in self.entries.items()}

    def reset(self):
        for ent, default in self.entries.values():
            ent.delete(0, tk.END)
            ent.insert(0, str(default))
        self.lbl_y.config(text="y* = (-)")
        self.lbl_w.config(text="W* = -")
        self.lbl_dual.config(text="Solution Duale: -")
        for widget in self.tableaux_frame.winfo_children():
            widget.destroy()

    def solve(self):
        try:
            p = self.get_params()
            y1_opt, y2_opt, y3_opt, w_opt, dual_vals = solve_simplex_model(p)
            self.lbl_y.config(text=f"y* = ({y1_opt:.2f}, {y2_opt:.2f}, {y3_opt:.2f})")
            self.lbl_w.config(text=f"W* = {w_opt:.2f} DH")

            dual_text = "Dual: " + "  ".join(f"{k}={v:.2f}" for k, v in dual_vals.items())
            self.lbl_dual.config(text=dual_text)

            A_T = np.array([
                [1, 0, 0, p['t1'], p['cal1']],
                [0, 1, 0, p['t2'], p['cal2']],
                [0, 0, 1, p['t3'], p['cal3']]
            ])
            b_primal = [p['min_y1'], p['min_y2'], p['min_y3'], p['min_time'], p['min_cal']]
            tableaux = generate_simplex_tableaux([p['c1'], p['c2'], p['c3']], A_T, b_primal)
            self.display_tableaux(tableaux)
        except Exception as e:
            messagebox.showerror("Erreur", str(e))

    def display_tableaux(self, tableaux):
        for widget in self.tableaux_frame.winfo_children():
            widget.destroy()

        style = ttk.Style()
        style.configure("Treeview", font=('Arial', 9), rowheight=25)

        for idx, state in enumerate(tableaux):
            tk.Label(self.tableaux_frame, text=f"Itération {idx}", font=('Arial', 11, 'bold'), bg="white").pack(anchor="w", pady=(10, 0))
            cols = ["Basis", "x1", "x2", "x3", "x4", "x5", "e1", "e2", "e3", "RHS"]
            tree = ttk.Treeview(self.tableaux_frame, columns=cols, show="headings", height=len(state["matrix"]))
            for col in cols:
                tree.heading(col, text=col)
                tree.column(col, width=55, anchor="center")

            basis_names = [f"x{b+1}" if b < 5 else f"e{b-4}" for b in state["basis"]] + ["Z"]
            for r_idx, row in enumerate(state["matrix"]):
                tree.insert("", "end", values=[basis_names[r_idx]] + [f"{val:.2f}" for val in row])
            tree.pack(fill="x", padx=10, pady=5)


class RiadApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Optimisation Petit-Déjeuner - Riad Marrakech")
        self.geometry("1100x750")
        self.configure(bg="#FDF5E6")

        header = tk.Frame(self, bg="#FDF5E6")
        header.pack(fill="x", pady=15)

        tk.Label(header, text="Optimisation Petit-Déjeuner", font=('Georgia', 26, 'bold'), bg="#FDF5E6", fg="#8B1A1A").pack()
        tk.Label(header, text="Riad Marrakech", font=('Georgia', 16, 'italic'), bg="#FDF5E6", fg="#C89B3C").pack(pady=(2, 10))
        tk.Label(header, text="— ◊ —", font=('Georgia', 14), bg="#FDF5E6", fg="#C89B3C").pack(pady=(0, 10))
        tk.Label(header, text="El Mehdi Aya • Mouissi Charifa • Amiri Yasser • Misky Yahya", font=('Helvetica', 12, 'bold'), bg="#FDF5E6", fg="#2A2118").pack()
        tk.Label(header, text="Encadrants : Abdelati Reha & Mourad Hikki — 2025–2026", font=('Helvetica', 11, 'italic'), bg="#FDF5E6", fg="#5C6B3A").pack(pady=(2, 0))

        style = ttk.Style()
        style.theme_use('clam')
        style.configure("TNotebook", background="#FDF5E6")
        style.configure("TNotebook.Tab", background="#E8DCC4", foreground="#8B1A1A", font=('Arial', 11, 'bold'), padding=[10, 5])
        style.map("TNotebook.Tab", background=[("selected", "#8B1A1A")], foreground=[("selected", "#FDF5E6")])

        notebook = ttk.Notebook(self)
        notebook.pack(fill="both", expand=True, padx=20, pady=10)
        notebook.add(GraphiqueTab(notebook), text="Méthode Graphique")
        notebook.add(SimplexeTab(notebook), text="Méthode Simplexe / Dualité")


if __name__ == "__main__":
    RiadApp().mainloop()

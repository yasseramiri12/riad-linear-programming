import tkinter as tk
from tkinter import ttk, messagebox
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from scipy.optimize import linprog
import itertools

class ScrollableFrame(tk.Frame):
    def __init__(self, container, bg_color="#FDF5E6", *args, **kwargs):
        super().__init__(container, bg=bg_color, *args, **kwargs)
        self.canvas = tk.Canvas(self, bg=bg_color, highlightthickness=0)
        scrollbar = ttk.Scrollbar(self, orient="vertical", command=self.canvas.yview)
        self.scrollable_frame = tk.Frame(self.canvas, bg=bg_color)

        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: self.canvas.configure(
                scrollregion=self.canvas.bbox("all")
            )
        )

        self.canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        self.canvas.configure(yscrollcommand=scrollbar.set)

        self.canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

class GraphiqueTab(tk.Frame):
    def __init__(self, parent):
        super().__init__(parent, bg="#FDF5E6")
        
        # Left Panel (Parameters)
        self.left_panel = tk.Frame(self, bg="#FDF5E6", width=350)
        self.left_panel.pack(side="left", fill="y", padx=10, pady=10)
        self.left_panel.pack_propagate(False)
        
        scroll_left = ScrollableFrame(self.left_panel)
        scroll_left.pack(fill="both", expand=True)
        self.params_frame = scroll_left.scrollable_frame
        
        tk.Label(self.params_frame, text="Paramètres (Modifiables)", font=('Arial', 14, 'bold'), bg="#FDF5E6", fg="#8B1A1A").pack(pady=10)
        
        self.e_c1 = self.create_entry("Coût Continental (y1):", 35)
        self.e_c2 = self.create_entry("Coût Healthy (y2):", 50)
        
        tk.Label(self.params_frame, text="Contraintes:", font=('Arial', 12, 'bold'), bg="#FDF5E6", fg="#556B2F").pack(pady=(15,5), anchor="w")
        self.e_min_menus = self.create_entry("Min menus (y1+y2):", 40)
        self.e_min_time = self.create_entry("Min temps total:", 350)
        self.e_t1 = self.create_entry("Temps par y1:", 5)
        self.e_t2 = self.create_entry("Temps par y2:", 10)
        self.e_min_cal = self.create_entry("Min calories totales:", 20000)
        self.e_cal1 = self.create_entry("Calories par y1:", 500)
        self.e_cal2 = self.create_entry("Calories par y2:", 650)
        
        # Buttons
        btn_frame = tk.Frame(self.params_frame, bg="#FDF5E6")
        btn_frame.pack(fill="x", pady=20)
        tk.Button(btn_frame, text="Résoudre", bg="#8B1A1A", fg="white", font=('Arial', 11, 'bold'), command=self.solve).pack(side="left", padx=5, expand=True, fill="x")
        tk.Button(btn_frame, text="Réinitialiser", bg="#556B2F", fg="white", font=('Arial', 11, 'bold'), command=self.reset).pack(side="right", padx=5, expand=True, fill="x")
        
        # Results
        self.res_frame = tk.Frame(self.params_frame, bg="#D8E4BC", bd=2, relief="groove")
        self.res_frame.pack(fill="x", pady=10, ipady=10)
        self.lbl_res_y1 = tk.Label(self.res_frame, text="y1* = -", bg="#D8E4BC", font=('Arial', 12, 'bold'))
        self.lbl_res_y1.pack()
        self.lbl_res_y2 = tk.Label(self.res_frame, text="y2* = -", bg="#D8E4BC", font=('Arial', 12, 'bold'))
        self.lbl_res_y2.pack()
        self.lbl_res_w = tk.Label(self.res_frame, text="W* = -", bg="#D8E4BC", font=('Arial', 14, 'bold'), fg="#8B1A1A")
        self.lbl_res_w.pack(pady=(5,0))
        
        # Right Panel (Plot)
        self.right_panel = tk.Frame(self, bg="white", bd=2, relief="sunken")
        self.right_panel.pack(side="right", fill="both", expand=True, padx=10, pady=10)
        
        self.fig = plt.Figure(figsize=(6, 5), dpi=100)
        self.ax = self.fig.add_subplot(111)
        self.canvas = FigureCanvasTkAgg(self.fig, master=self.right_panel)
        self.canvas.get_tk_widget().pack(fill="both", expand=True)
        
        self.reset()
        
    def create_entry(self, label_text, default_val):
        frame = tk.Frame(self.params_frame, bg="#FDF5E6")
        frame.pack(fill="x", pady=2)
        lbl = tk.Label(frame, text=label_text, bg="#FDF5E6", width=20, anchor="w")
        lbl.pack(side="left")
        ent = tk.Entry(frame, width=10)
        ent.insert(0, str(default_val))
        ent.pack(side="right", padx=10)
        return ent

    def reset(self):
        entries = [
            (self.e_c1, 35), (self.e_c2, 50),
            (self.e_min_menus, 40),
            (self.e_min_time, 350), (self.e_t1, 5), (self.e_t2, 10),
            (self.e_min_cal, 20000), (self.e_cal1, 500), (self.e_cal2, 650)
        ]
        for ent, val in entries:
            ent.delete(0, tk.END)
            ent.insert(0, str(val))
            
        self.lbl_res_y1.config(text="y1* = -")
        self.lbl_res_y2.config(text="y2* = -")
        self.lbl_res_w.config(text="W* = -")
        self.ax.clear()
        self.ax.set_title("Région Réalisable et Solution Optimale")
        self.canvas.draw()

    def solve(self):
        try:
            c1 = float(self.e_c1.get())
            c2 = float(self.e_c2.get())
            min_menus = float(self.e_min_menus.get())
            min_time = float(self.e_min_time.get())
            t1 = float(self.e_t1.get())
            t2 = float(self.e_t2.get())
            min_cal = float(self.e_min_cal.get())
            cal1 = float(self.e_cal1.get())
            cal2 = float(self.e_cal2.get())
            
            c = [c1, c2]
            A_ub = [
                [-1, -1],
                [-t1, -t2],
                [-cal1, -cal2]
            ]
            b_ub = [-min_menus, -min_time, -min_cal]
            
            res = linprog(c, A_ub=A_ub, b_ub=b_ub, bounds=[(0, None), (0, None)], method='highs')
            
            if res.success:
                y1_opt = res.x[0]
                y2_opt = res.x[1]
                w_opt = res.fun
                
                self.lbl_res_y1.config(text=f"y1* (Continental) = {y1_opt:.2f}")
                self.lbl_res_y2.config(text=f"y2* (Healthy) = {y2_opt:.2f}")
                self.lbl_res_w.config(text=f"W* = {w_opt:.2f} DH")
                
                self.plot_graph(c1, c2, min_menus, min_time, t1, t2, min_cal, cal1, cal2, y1_opt, y2_opt, w_opt)
            else:
                messagebox.showerror("Erreur", "Aucune solution réalisable trouvée.")
        except Exception as e:
            messagebox.showerror("Erreur", str(e))

    def plot_graph(self, c1, c2, min_menus, min_time, t1, t2, min_cal, cal1, cal2, y1_opt, y2_opt, w_opt):
        self.ax.clear()
        
        max_y1 = max(80, y1_opt * 1.5) if y1_opt > 0 else 80
        max_y2 = max(80, y2_opt * 1.5) if y2_opt > 0 else 80
        y1 = np.linspace(0, max_y1 * 1.5, 400)
        
        y2_1 = min_menus - y1
        y2_2 = (min_time - t1*y1)/t2 if t2 != 0 else np.zeros_like(y1)
        y2_3 = (min_cal - cal1*y1)/cal2 if cal2 != 0 else np.zeros_like(y1)
        
        self.ax.plot(y1, y2_1, label=f'y1+y2>={min_menus}', color='blue')
        self.ax.plot(y1, y2_2, label=f'{t1}y1+{t2}y2>={min_time}', color='green')
        self.ax.plot(y1, y2_3, label=f'{cal1}y1+{cal2}y2>={min_cal}', color='orange')
        
        y2_max = np.maximum(np.maximum(y2_1, y2_2), y2_3)
        y2_top = max_y2 * 1.5
        self.ax.fill_between(y1, y2_max, y2_top, where=(y2_max <= y2_top) & (y1 >= 0), color='gray', alpha=0.3, label='Région réalisable')
        
        # Sommets
        vertices = []
        lines = [
            (1, 1, min_menus),
            (t1, t2, min_time),
            (cal1, cal2, min_cal),
            (1, 0, 0),
            (0, 1, 0)
        ]
        for L_A, L_B in itertools.combinations(lines, 2):
            a1, b1, c_1 = L_A
            a2, b2, c_2 = L_B
            det = a1*b2 - a2*b1
            if abs(det) > 1e-7:
                x = (c_1*b2 - c_2*b1) / det
                y = (a1*c_2 - a2*c_1) / det
                if x >= -1e-5 and y >= -1e-5:
                    if x + y >= min_menus - 1e-5 and \
                       t1*x + t2*y >= min_time - 1e-5 and \
                       cal1*x + cal2*y >= min_cal - 1e-5:
                        vertices.append((round(x, 2), round(y, 2)))
                        
        vertices = list(set(vertices))
        labels = ['A', 'B', 'C', 'D', 'E']
        for i, v in enumerate(vertices):
            self.ax.plot(v[0], v[1], 'ko')
            self.ax.annotate(f'{labels[i%len(labels)]}({v[0]}, {v[1]})', (v[0], v[1]), textcoords="offset points", xytext=(10,10), ha='center')
            
        # Droite objectif
        y2_obj = (w_opt - c1*y1)/c2 if c2 != 0 else np.zeros_like(y1)
        self.ax.plot(y1, y2_obj, 'r--', label=f'Objectif W={w_opt:.2f}')
        
        # Point optimal
        self.ax.plot(y1_opt, y2_opt, 'r*', markersize=15, label='Point optimal')
        
        self.ax.set_xlim(0, max_y1)
        self.ax.set_ylim(0, max_y2)
        self.ax.set_xlabel('y1 (Continental)')
        self.ax.set_ylabel('y2 (Healthy)')
        self.ax.set_title("Région Réalisable et Solution Optimale")
        self.ax.legend()
        self.ax.grid(True, linestyle='--', alpha=0.6)
        
        self.canvas.draw()


def generate_simplex_tableaux(c, A_T, b):
    n = len(c)
    m = len(b)
    tableaux = []
    
    tableau = np.zeros((n + 1, m + n + 1))
    tableau[:n, :m] = A_T
    tableau[:n, m:m+n] = np.eye(n)
    tableau[:n, -1] = c
    tableau[-1, :m] = -np.array(b)
    
    basis = list(range(m, m + n))
    
    def get_tableau_state(tab, basis, pivot_row=None, pivot_col=None):
        return {
            "matrix": tab.copy(),
            "basis": basis.copy(),
            "pivot_row": pivot_row,
            "pivot_col": pivot_col
        }
    
    tableaux.append(get_tableau_state(tableau, basis))
    
    iteration = 0
    while True:
        if np.all(tableau[-1, :-1] >= -1e-7):
            break
        if iteration > 10:
            break
            
        pivot_col = np.argmin(tableau[-1, :-1])
        
        ratios = []
        for i in range(n):
            if tableau[i, pivot_col] > 1e-7:
                ratios.append(tableau[i, -1] / tableau[i, pivot_col])
            else:
                ratios.append(np.inf)
                
        pivot_row = np.argmin(ratios)
        if ratios[pivot_row] == np.inf:
            break
            
        tableaux[-1]["pivot_row"] = pivot_row
        tableaux[-1]["pivot_col"] = pivot_col
        
        pivot_val = tableau[pivot_row, pivot_col]
        tableau[pivot_row, :] = tableau[pivot_row, :] / pivot_val
        for i in range(n + 1):
            if i != pivot_row:
                tableau[i, :] -= tableau[i, pivot_col] * tableau[pivot_row, :]
                
        basis[pivot_row] = pivot_col
        iteration += 1
        
        tableaux.append(get_tableau_state(tableau, basis))
        
    return tableaux

class SimplexeTab(tk.Frame):
    def __init__(self, parent):
        super().__init__(parent, bg="#FDF5E6")
        
        self.left_panel = tk.Frame(self, bg="#FDF5E6", width=350)
        self.left_panel.pack(side="left", fill="y", padx=10, pady=10)
        self.left_panel.pack_propagate(False)
        
        scroll_left = ScrollableFrame(self.left_panel)
        scroll_left.pack(fill="both", expand=True)
        self.params_frame = scroll_left.scrollable_frame
        
        tk.Label(self.params_frame, text="Paramètres (Modifiables)", font=('Arial', 14, 'bold'), bg="#FDF5E6", fg="#8B1A1A").pack(pady=10)
        
        self.e_c1 = self.create_entry("Coût Continental (y1):", 35)
        self.e_c2 = self.create_entry("Coût Healthy (y2):", 50)
        self.e_c3 = self.create_entry("Coût Vegan (y3):", 45)
        
        tk.Label(self.params_frame, text="Contraintes (Minima):", font=('Arial', 12, 'bold'), bg="#FDF5E6", fg="#556B2F").pack(pady=(15,5), anchor="w")
        self.e_min_y1 = self.create_entry("Min y1:", 20)
        self.e_min_y2 = self.create_entry("Min y2:", 10)
        self.e_min_y3 = self.create_entry("Min y3:", 10)
        self.e_min_time = self.create_entry("Min temps total:", 350)
        self.e_t1 = self.create_entry("Temps y1:", 5)
        self.e_t2 = self.create_entry("Temps y2:", 10)
        self.e_t3 = self.create_entry("Temps y3:", 8)
        self.e_min_cal = self.create_entry("Min cal totales:", 20000)
        self.e_cal1 = self.create_entry("Cal y1:", 500)
        self.e_cal2 = self.create_entry("Cal y2:", 650)
        self.e_cal3 = self.create_entry("Cal y3:", 550)
        
        # Buttons
        btn_frame = tk.Frame(self.params_frame, bg="#FDF5E6")
        btn_frame.pack(fill="x", pady=20)
        tk.Button(btn_frame, text="Résoudre", bg="#8B1A1A", fg="white", font=('Arial', 11, 'bold'), command=self.solve).pack(side="left", padx=5, expand=True, fill="x")
        tk.Button(btn_frame, text="Réinitialiser", bg="#556B2F", fg="white", font=('Arial', 11, 'bold'), command=self.reset).pack(side="right", padx=5, expand=True, fill="x")
        
        # Results
        self.res_frame = tk.Frame(self.params_frame, bg="#D8E4BC", bd=2, relief="groove")
        self.res_frame.pack(fill="x", pady=10, ipady=10)
        self.lbl_res_y = tk.Label(self.res_frame, text="y* = (-)", bg="#D8E4BC", font=('Arial', 12, 'bold'))
        self.lbl_res_y.pack()
        self.lbl_res_w = tk.Label(self.res_frame, text="W* = -", bg="#D8E4BC", font=('Arial', 14, 'bold'), fg="#8B1A1A")
        self.lbl_res_w.pack(pady=(5,5))
        self.lbl_dual = tk.Label(self.res_frame, text="Solution Duale: -", bg="#D8E4BC", font=('Arial', 10, 'italic'))
        self.lbl_dual.pack()
        
        # Right Panel (Tableaux)
        self.right_panel = tk.Frame(self, bg="white", bd=2, relief="sunken")
        self.right_panel.pack(side="right", fill="both", expand=True, padx=10, pady=10)
        
        tk.Label(self.right_panel, text="Itérations du Simplexe (Problème Dual)", font=('Arial', 14, 'bold'), bg="white", fg="#8B1A1A").pack(pady=10)
        
        self.tableaux_container = ScrollableFrame(self.right_panel, bg_color="white")
        self.tableaux_container.pack(fill="both", expand=True)
        self.tableaux_frame = self.tableaux_container.scrollable_frame
        
        self.reset()
        
    def create_entry(self, label_text, default_val):
        frame = tk.Frame(self.params_frame, bg="#FDF5E6")
        frame.pack(fill="x", pady=2)
        lbl = tk.Label(frame, text=label_text, bg="#FDF5E6", width=18, anchor="w")
        lbl.pack(side="left")
        ent = tk.Entry(frame, width=8)
        ent.insert(0, str(default_val))
        ent.pack(side="right", padx=10)
        return ent

    def reset(self):
        entries = [
            (self.e_c1, 35), (self.e_c2, 50), (self.e_c3, 45),
            (self.e_min_y1, 20), (self.e_min_y2, 10), (self.e_min_y3, 10),
            (self.e_min_time, 350), (self.e_t1, 5), (self.e_t2, 10), (self.e_t3, 8),
            (self.e_min_cal, 20000), (self.e_cal1, 500), (self.e_cal2, 650), (self.e_cal3, 550)
        ]
        for ent, val in entries:
            ent.delete(0, tk.END)
            ent.insert(0, str(val))
            
        self.lbl_res_y.config(text="y* = (-)")
        self.lbl_res_w.config(text="W* = -")
        self.lbl_dual.config(text="Solution Duale: -")
        
        for widget in self.tableaux_frame.winfo_children():
            widget.destroy()

    def solve(self):
        try:
            c1, c2, c3 = float(self.e_c1.get()), float(self.e_c2.get()), float(self.e_c3.get())
            min_y1, min_y2, min_y3 = float(self.e_min_y1.get()), float(self.e_min_y2.get()), float(self.e_min_y3.get())
            min_time = float(self.e_min_time.get())
            t1, t2, t3 = float(self.e_t1.get()), float(self.e_t2.get()), float(self.e_t3.get())
            min_cal = float(self.e_min_cal.get())
            cal1, cal2, cal3 = float(self.e_cal1.get()), float(self.e_cal2.get()), float(self.e_cal3.get())
            
            c = [c1, c2, c3]
            A_ub = [
                [-1, 0, 0],
                [0, -1, 0],
                [0, 0, -1],
                [-t1, -t2, -t3],
                [-cal1, -cal2, -cal3]
            ]
            b_ub = [-min_y1, -min_y2, -min_y3, -min_time, -min_cal]
            
            res = linprog(c, A_ub=A_ub, b_ub=b_ub, bounds=[(0, None)]*3, method='highs')
            
            if res.success:
                y1_opt, y2_opt, y3_opt = res.x
                w_opt = res.fun
                
                self.lbl_res_y.config(text=f"y* = ({y1_opt:.2f}, {y2_opt:.2f}, {y3_opt:.2f})")
                self.lbl_res_w.config(text=f"W* = {w_opt:.2f} DH")
                
                # Dual generator
                A_T = np.array([
                    [1, 0, 0, t1, cal1],
                    [0, 1, 0, t2, cal2],
                    [0, 0, 1, t3, cal3]
                ])
                b_primal = [min_y1, min_y2, min_y3, min_time, min_cal]
                
                tableaux = generate_simplex_tableaux(c, A_T, b_primal)
                self.display_tableaux(tableaux)
                
                # Extract dual solution from final tableau
                final_tab = tableaux[-1]
                final_matrix = final_tab["matrix"]
                final_basis = final_tab["basis"]
                
                dual_sol = [0.0] * 5
                for i, b_idx in enumerate(final_basis):
                    if b_idx < 5:
                        dual_sol[b_idx] = final_matrix[i, -1]
                        
                Z_opt = final_matrix[-1, -1]
                
                dual_text = f"x1={dual_sol[0]:.2f}, x3={dual_sol[2]:.2f}, x4={dual_sol[3]:.2f}\nZ={Z_opt:.2f}"
                self.lbl_dual.config(text=f"Solution Duale:\n{dual_text}")
                
            else:
                messagebox.showerror("Erreur", "Aucune solution réalisable trouvée.")
        except Exception as e:
            messagebox.showerror("Erreur", str(e))

    def display_tableaux(self, tableaux):
        for widget in self.tableaux_frame.winfo_children():
            widget.destroy()
            
        style = ttk.Style()
        style.configure("Treeview", font=('Arial', 9), rowheight=25)
        style.configure("Treeview.Heading", font=('Arial', 9, 'bold'))
        
        for idx, state in enumerate(tableaux):
            lbl = tk.Label(self.tableaux_frame, text=f"Itération {idx} {'(Tableau Initial)' if idx==0 else ''}", font=('Arial', 11, 'bold'), bg="white", fg="#8B1A1A")
            lbl.pack(anchor="w", pady=(15, 5), padx=10)
            
            tab = state["matrix"]
            pivot_r = state.get("pivot_row")
            pivot_c = state.get("pivot_col")
            
            columns = ["Basis", "x1", "x2", "x3", "x4", "x5", "e1", "e2", "e3", "RHS"]
            tree = ttk.Treeview(self.tableaux_frame, columns=columns, show="headings", height=len(tab))
            for col in columns:
                tree.heading(col, text=col)
                w = 50 if col == "Basis" else 65
                tree.column(col, width=w, anchor="center")
            
            basis_names = ["e1", "e2", "e3", "Z"]
            if idx >= 0:
                for i, b_idx in enumerate(state["basis"]):
                    if b_idx < 5:
                        basis_names[i] = f"x{b_idx+1}"
                    else:
                        basis_names[i] = f"e{b_idx-5+1}"
                        
            tree.tag_configure('pivot_row', background='#D8E4BC')
            
            for r_idx, row in enumerate(tab):
                values = [basis_names[r_idx]] + [f"{val:.2f}" for val in row]
                tags = ()
                if pivot_r is not None and r_idx == pivot_r:
                    tags = ('pivot_row',)
                tree.insert("", "end", values=values, tags=tags)
                
            tree.pack(fill="x", padx=10)
            
            if pivot_r is not None and pivot_c is not None:
                col_name = columns[pivot_c + 1]
                p_lbl = tk.Label(self.tableaux_frame, text=f"Pivot: Ligne {basis_names[pivot_r]}, Colonne {col_name} (Valeur = {state['matrix'][pivot_r, pivot_c]:.2f})", bg="white", fg="#556B2F", font=('Arial', 10, 'italic'))
                p_lbl.pack(anchor="w", padx=10, pady=(2,0))

class RiadApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Optimisation Petit-Déjeuner - Riad Marrakech")
        self.geometry("1100x750")
        self.configure(bg="#FDF5E6")
        
        # Header
        header = tk.Frame(self, bg="#FDF5E6")
        header.pack(fill="x", pady=10)

        title = tk.Label(header, text="Optimisation Petit-Déjeuner - Riad Marrakech", font=('Arial', 20, 'bold'), bg="#FDF5E6", fg="#8B1A1A")
        title.pack()

        authors = tk.Label(header, text="Auteurs : El Mehdi Aya, Mouissi Charifa, Amiri Yasser, Misky Yahya", font=('Arial', 12), bg="#FDF5E6", fg="#556B2F")
        authors.pack()

        encadreurs = tk.Label(header, text="Encadrants : Abdelati REHA & Mourad Hikki — Année 2025-2026", font=('Arial', 10, 'italic'), bg="#FDF5E6", fg="#556B2F")
        encadreurs.pack()
        
        # Notebook Style
        style = ttk.Style()
        style.theme_use('clam')
        style.configure("TNotebook", background="#FDF5E6")
        style.configure("TNotebook.Tab", background="#E8DCC4", foreground="#8B1A1A", font=('Arial', 11, 'bold'), padding=[10, 5])
        style.map("TNotebook.Tab", background=[("selected", "#8B1A1A")], foreground=[("selected", "#FDF5E6")])
        
        notebook = ttk.Notebook(self)
        notebook.pack(fill="both", expand=True, padx=20, pady=10)

        tab1 = GraphiqueTab(notebook)
        tab2 = SimplexeTab(notebook)

        notebook.add(tab1, text="MODULE 1 : Méthode Graphique")
        notebook.add(tab2, text="MODULE 2 : Méthode Simplexe / Dualité")

if __name__ == "__main__":
    app = RiadApp()
    app.mainloop()

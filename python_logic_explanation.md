# Documentation du Codebase : `riad_optimizer.py`

Ce document explique en détail le fonctionnement du script Python `riad_optimizer.py`, qui constitue la version Desktop (application lourde) de l'Optimiseur de Petit-Déjeuner du Riad Marrakech.

L'architecture du code est divisée en deux grandes parties : la **logique mathématique d'optimisation** (indépendante de l'interface) et les **composants de l'interface graphique** (GUI) utilisant `tkinter`.

---

## 1. Importations et Dépendances

```python
import tkinter as tk
from tkinter import ttk, messagebox
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from scipy.optimize import linprog
```

- **`tkinter` / `ttk` / `messagebox`** : Utilisés pour construire l'interface utilisateur fenêtrée (boutons, champs de saisie, onglets, alertes d'erreur).
- **`numpy`** : Librairie de calcul matriciel, essentielle pour manipuler les tableaux (tableaux du simplexe) et calculer les intersections/vecteurs pour les graphiques.
- **`matplotlib.pyplot` / `FigureCanvasTkAgg`** : Utilisés pour dessiner le graphique de la région admissible (Méthode Graphique) et l'intégrer nativement dans la fenêtre Tkinter.
- **`scipy.optimize.linprog`** : Le puissant solveur mathématique qui effectue la résolution réelle du problème de programmation linéaire.

---

## 2. Le Cœur Mathématique (Logique d'Optimisation)

Afin d'assurer un code propre et maintenable, la logique de résolution est séparée de l'interface.

### A. `solve_graphical_model(params)`
Cette fonction résout le problème pour **2 variables** (Menus Continental et Healthy).
- **Entrées** : Un dictionnaire `params` contenant tous les coûts et contraintes.
- **Vecteur Objectif (`c`)** : Contient les coûts $c_1, c_2$.
- **Matrice des Contraintes (`A_ub` & `b_ub`)** : Puisque `linprog` minimise par défaut et gère des contraintes de type $\le$, nous multiplions nos contraintes $\ge$ par $-1$.
- **Solveur** : Utilise la méthode `highs` de SciPy.
- **Sortie** : Retourne les valeurs optimales $y_1^*, y_2^*$ et le coût minimum $W^*$.

### B. `solve_simplex_model(params)`
Cette fonction résout le problème pour **3 variables** (+ Menu Vegan).
- La logique est identique à la précédente, mais la matrice s'élargit pour inclure les paramètres liés à la variable $y_3$.
- Elle retourne $y_1^*, y_2^*, y_3^*$ et le coût $W^*$.

### C. `generate_simplex_tableaux(c, A_T, b)`
Cette fonction est le **moteur pédagogique** du programme. Même si `linprog` trouve la solution instantanément, nous avons besoin d'afficher les étapes itératives à l'utilisateur.
- Elle construit le grand tableau initial du simplexe (incluant les variables d'écart).
- Elle applique l'algorithme du pivot de Gauss itération par itération.
- À chaque étape, elle enregistre l'état de la matrice, la base actuelle, ainsi que la ligne et la colonne du pivot.
- **Sortie** : Une liste contenant "l'historique" de tous les tableaux successifs, qui sera envoyée à l'interface pour affichage.

---

## 3. L'Interface Graphique (Composants Tkinter)

### A. Composant Utilitaire : `ScrollableFrame`
Une classe personnalisée permettant de créer une zone défilante (scrollable). Étant donné la quantité de paramètres à saisir et de tableaux à afficher, un Canvas avec une Scrollbar verticale était nécessaire pour éviter que l'application ne dépasse de l'écran.

### B. Onglet 1 : `GraphiqueTab`
C'est la vue dédiée à la méthode graphique (2 variables).
1. **Panneau Gauche (Paramètres)** : 
   - Génère dynamiquement des champs de saisie (`tk.Entry`) pour les coûts et contraintes.
   - Boutons **Résoudre** et **Réinit** (Remise à zéro).
   - Une zone d'affichage (en vert olive) pour montrer le résultat optimal ($y_1^*, y_2^*, W^*$).
2. **Panneau Droit (Graphique Matplotlib)** :
   - `plot_graph()` prend les résultats et utilise `matplotlib` pour dessiner les droites des équations.
   - La fonction `fill_between` colorie dynamiquement la région admissible.
   - Le point optimal est marqué par une grande étoile rouge.

### C. Onglet 2 : `SimplexeTab`
C'est la vue dédiée à la résolution algorithmique (3 variables).
1. **Panneau Gauche (Paramètres)** :
   - Similaire à l'onglet graphique, mais aligne les champs horizontalement pour gagner de la place (3 saisies par ligne).
   - Affiche les résultats optimaux ainsi que la **Solution Duale** (récupérée à partir de la dernière itération du tableau du simplexe généré manuellement).
2. **Panneau Droit (Tableaux Itératifs)** :
   - Au lieu d'un graphique, ce panneau utilise un widget `ttk.Treeview` (un tableau de données natif).
   - La fonction `display_tableaux()` boucle sur l'historique des matrices fourni par `generate_simplex_tableaux()`.
   - Pour chaque itération, elle crée un nouveau `Treeview`, le formate avec les noms des colonnes (Base, $x_1...x_5, e_1...e_3$, RHS) et insère les valeurs arrondies à 2 décimales.

### D. La Fenêtre Principale : `RiadApp`
Classe héritant de `tk.Tk`, elle constitue la fenêtre racine de l'application.
- **Configuration** : Dimensions (`1100x750`), titre de la fenêtre, et application de la couleur de fond globale (Crème/Sand `#FDF5E6`).
- **En-tête (Header)** : Construit l'en-tête premium en haut de l'écran, affichant le titre de l'application, l'ornement séparateur en diamant (`— ◊ —`), les noms de l'équipe étudiante et les professeurs encadrants. Les polices (`Georgia`, `Helvetica`) et couleurs (`Terracotta`, `Gold`, `Olive`) imitent parfaitement l'esthétique du site web.
- **Notebook (Système d'onglets)** : Utilise `ttk.Notebook` pour permettre à l'utilisateur de basculer facilement entre le `GraphiqueTab` et le `SimplexeTab`.
- Le bloc `if __name__ == "__main__":` lance la boucle d'événements principale (`mainloop()`), gardant l'application ouverte et réactive.
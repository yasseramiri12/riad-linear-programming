# 🚀 Guide de Démarrage — Riad Breakfast Optimizer

## Prérequis

- **Python 3.9+** installé → [python.org/downloads](https://www.python.org/downloads/)
- **Un navigateur web** (Chrome, Firefox, Edge)
- **Aucun autre logiciel requis**

---

## ⚡ Installation (une seule fois)

Ouvrez un terminal dans le dossier du projet et exécutez :

```bash
pip install -r requirements.txt
```

Cela installe automatiquement : `flask`, `flask-cors`, `pulp`, `numpy`, `matplotlib`, `scipy`

---

## 🌐 Version Web (Interface Navigateur avec Python)

### Étape 1 — Démarrer le serveur Python

```bash
python api.py
```

Vous devriez voir :
```
=======================================================
  Riad Optimizer API — démarrage...
  Serveur: http://localhost:5000
  Ouvrez index.html dans votre navigateur.
=======================================================
```

> ⚠️ **Gardez ce terminal ouvert** pendant toute la session.

### Étape 2 — Ouvrir l'application

Ouvrez le fichier suivant dans votre navigateur :

```
Riad_Web/index.html
```

> Double-cliquez dessus ou glissez-le dans votre navigateur.

### Utilisation

1. Choisissez **2 Menus** (Continental + Healthy) → Méthode Graphique
2. Choisissez **3 Menus** (+ Vegan) → Méthode Simplexe & Dualité
3. Cliquez **Suivant** → remplissez les paramètres → **Calculer l'Optimum**

---

## 🖥️ Version Desktop (Interface Tkinter)

Pour lancer l'application bureau (sans navigateur) :

```bash
python optimizer.py
```

L'application s'ouvre directement avec deux onglets :
- **Méthode Graphique** — pour 2 variables
- **Méthode Simplexe / Dualité** — pour 3 variables

---

## 📁 Structure du Projet

```
PL & Python/
├── api.py                ← Serveur Flask (backend Python)
├── optimizer.py          ← Logique PuLP + Interface Tkinter
├── requirements.txt      ← Dépendances Python
└── Riad_Web/
    ├── index.html        ← Application Web (ouvrir dans le navigateur)
    ├── app_local.js      ← JS de l'interface (appelle api.py)
    ├── app.js            ← Version GitHub Pages (JS pur, sans Python)
    └── style.css         ← Design Glassmorphism
```

---

## ❓ Problèmes fréquents

| Problème | Solution |
|---|---|
| `pip` not found | Utilisez `pip3` à la place |
| `ModuleNotFoundError: pulp` | Exécutez `pip install -r requirements.txt` |
| Le graphique ne s'affiche pas | Vérifiez que `python api.py` est bien lancé |
| Port 5000 déjà utilisé | Changez le port dans `api.py` : `app.run(port=5001)` et `API_BASE` dans `app_local.js` |
| Erreur CORS | Ouvrez `index.html` directement (pas via un autre serveur HTTP) |

---

## 👥 Équipe

**El Mehdi Aya • Mouissi Charifa • Amiri Yasser • Misky Yahya**  
*Encadrants : Abdelati Reha & Mourad Hikki — 2025–2026*

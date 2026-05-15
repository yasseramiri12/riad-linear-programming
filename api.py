"""
api.py — Flask REST API for Riad Breakfast Optimizer
Run with: python api.py
Then open index.html in the browser.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

# Import the PuLP-based optimization functions from optimizer.py
from optimizer import solve_graphical_model, solve_simplex_model, generate_simplex_tableaux

app = Flask(__name__)
CORS(app)  # Allow browser requests from file:// or any origin


def _compute_graphique_vertices(params):
    """Compute intersection vertices of the constraint lines for plotting."""
    c1, c2 = params['c1'], params['c2']
    min_menus = params['min_menus']
    min_time = params['min_time']
    min_cal = params['min_cal']
    t1, t2 = params['t1'], params['t2']
    cal1, cal2 = params['cal1'], params['cal2']

    lines = [
        {'a': 1,    'b': 1,    'c': min_menus},
        {'a': t1,   'b': t2,   'c': min_time},
        {'a': cal1, 'b': cal2, 'c': min_cal},
        {'a': 1,    'b': 0,    'c': 0},
        {'a': 0,    'b': 1,    'c': 0},
    ]

    vertices = []
    n = len(lines)
    for i in range(n):
        for j in range(i + 1, n):
            l1, l2 = lines[i], lines[j]
            det = l1['a'] * l2['b'] - l2['a'] * l1['b']
            if abs(det) < 1e-7:
                continue
            x = (l1['c'] * l2['b'] - l2['c'] * l1['b']) / det
            y = (l1['a'] * l2['c'] - l2['a'] * l1['c']) / det
            if x < -1e-5 or y < -1e-5:
                continue
            if (x + y >= min_menus - 1e-5 and
                    t1 * x + t2 * y >= min_time - 1e-5 and
                    cal1 * x + cal2 * y >= min_cal - 1e-5):
                # Deduplicate
                dup = any(abs(v['x'] - x) < 1e-4 and abs(v['y'] - y) < 1e-4 for v in vertices)
                if not dup:
                    vertices.append({'x': round(max(0, x), 4), 'y': round(max(0, y), 4)})

    return vertices


def _tableau_to_json(tableaux):
    """Convert numpy tableau states to JSON-serialisable dicts."""
    result = []
    for state in tableaux:
        result.append({
            'matrix': state['matrix'].tolist(),
            'basis': state['basis'],
            'pivot_row': state['pivot_row'],
            'pivot_col': state['pivot_col'],
        })
    return result


@app.route('/solve/graphique', methods=['POST'])
def solve_graphique():
    """Solve the 2-variable graphical optimization problem."""
    try:
        data = request.get_json()
        params = {k: float(v) for k, v in data.items()}

        y1_opt, y2_opt, w_opt = solve_graphical_model(params)
        vertices = _compute_graphique_vertices(params)

        return jsonify({
            'success': True,
            'y1': round(y1_opt, 4),
            'y2': round(y2_opt, 4),
            'W': round(w_opt, 4),
            'vertices': vertices,
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/solve/simplexe', methods=['POST'])
def solve_simplexe():
    """Solve the 3-variable simplex/duality optimization problem."""
    try:
        data = request.get_json()
        params = {k: float(v) for k, v in data.items()}

        y1_opt, y2_opt, y3_opt, w_opt, dual_vals = solve_simplex_model(params)

        # Build tableaux for pedagogical display
        A_T = np.array([
            [1, 0, 0, params['t1'],   params['cal1']],
            [0, 1, 0, params['t2'],   params['cal2']],
            [0, 0, 1, params['t3'],   params['cal3']],
        ])
        b_primal = [
            params['min_y1'], params['min_y2'], params['min_y3'],
            params['min_time'], params['min_cal']
        ]
        tableaux = generate_simplex_tableaux(
            [params['c1'], params['c2'], params['c3']], A_T, b_primal
        )

        return jsonify({
            'success': True,
            'y1': round(y1_opt, 4),
            'y2': round(y2_opt, 4),
            'y3': round(y3_opt, 4),
            'W': round(w_opt, 4),
            'dual': {k: round(v, 4) for k, v in dual_vals.items()},
            'tableaux': _tableau_to_json(tableaux),
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/health', methods=['GET'])
def health():
    """Simple health check so the frontend can detect if the API is running."""
    return jsonify({'status': 'ok', 'solver': 'PuLP'})


if __name__ == '__main__':
    print("=" * 55)
    print("  Riad Optimizer API — démarrage...")
    print("  Serveur: http://localhost:5000")
    print("  Ouvrez index.html dans votre navigateur.")
    print("=" * 55)
    app.run(debug=False, port=5000)

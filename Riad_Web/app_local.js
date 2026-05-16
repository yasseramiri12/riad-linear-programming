/* app_local.js — Version Présentation Locale (Python PuLP API uniquement)
 * Requiert que api.py soit lancé : python api.py
 * Ne contient AUCUNE logique mathématique JS — tout est calculé côté Python.
 */

const API_BASE = 'http://localhost:5000';

// ── Navigation ────────────────────────────────────────────────────────────────

function goToStep1() {
    document.getElementById('step1-setup').style.display = 'block';
    document.getElementById('step2-inputs').style.display = 'none';
    document.getElementById('step3-results').style.display = 'none';
}

function goToStep2() {
    const numVars = parseInt(document.getElementById('numVariables').value);
    document.getElementById('step1-setup').style.display = 'none';
    document.getElementById('step3-results').style.display = 'none';
    document.getElementById('step2-inputs').style.display = 'block';
    generateDynamicForm(numVars);
}

// ── Dynamic Form ──────────────────────────────────────────────────────────────

function generateDynamicForm(numVars) {
    const container = document.getElementById('dynamic-form-container');
    container.innerHTML = '';

    let html = `
    <div style="display: flex; flex-wrap: wrap; gap: 20px;">
        <div class="card-glass" style="flex: 1; min-width: 300px;">
            <h3 class="card-title"><span class="card-title-icon">💰</span> Coûts des menus</h3>
            <div class="form-group">
                <label for="dyn_c1">Continental (y₁)</label>
                <div class="input-wrap"><input type="number" id="dyn_c1" value="35"><span class="input-unit">DH</span></div>
            </div>
            <div class="form-group">
                <label for="dyn_c2">Healthy (y₂)</label>
                <div class="input-wrap"><input type="number" id="dyn_c2" value="50"><span class="input-unit">DH</span></div>
            </div>
            ${numVars === 3 ? `
            <div class="form-group">
                <label for="dyn_c3">Vegan (y₃)</label>
                <div class="input-wrap"><input type="number" id="dyn_c3" value="45"><span class="input-unit">DH</span></div>
            </div>` : ''}
        </div>

        <div class="card-glass" style="flex: 1; min-width: 300px;">
            <h3 class="card-title"><span class="card-title-icon">⚖️</span> Contraintes Générales</h3>
            ${numVars === 2 ? `
            <div class="form-group">
                <label for="dyn_min_menus">Min menus totaux</label>
                <div class="input-wrap"><input type="number" id="dyn_min_menus" value="40"></div>
            </div>` : `
            <div class="form-group">
                <label for="dyn_min_y1">Min Continental (y₁)</label>
                <div class="input-wrap"><input type="number" id="dyn_min_y1" value="20"></div>
            </div>
            <div class="form-group" style="margin-top:10px;">
                <label for="dyn_min_y2">Min Healthy (y₂)</label>
                <div class="input-wrap"><input type="number" id="dyn_min_y2" value="10"></div>
            </div>
            <div class="form-group" style="margin-top:10px;">
                <label for="dyn_min_y3">Min Vegan (y₃)</label>
                <div class="input-wrap"><input type="number" id="dyn_min_y3" value="10"></div>
            </div>
            `}
            <div class="form-group" style="margin-top:10px;">
                <label for="dyn_min_time">Min temps total</label>
                <div class="input-wrap"><input type="number" id="dyn_min_time" value="350"><span class="input-unit">min</span></div>
            </div>
            <div class="form-group" style="margin-top:10px;">
                <label for="dyn_min_cal">Min calories</label>
                <div class="input-wrap"><input type="number" id="dyn_min_cal" value="20000"><span class="input-unit">kcal</span></div>
            </div>
        </div>

        <div class="card-glass" style="flex: 1; min-width: 300px;">
            <h3 class="card-title"><span class="card-title-icon">⏱️</span> Détails Techniques</h3>
            <div class="form-group"><label for="dyn_t1">Temps par y₁</label><div class="input-wrap"><input type="number" id="dyn_t1" value="5"><span class="input-unit">m</span></div></div>
            <div class="form-group"><label for="dyn_t2">Temps par y₂</label><div class="input-wrap"><input type="number" id="dyn_t2" value="10"><span class="input-unit">m</span></div></div>
            ${numVars === 3 ? `<div class="form-group"><label for="dyn_t3">Temps par y₃</label><div class="input-wrap"><input type="number" id="dyn_t3" value="8"><span class="input-unit">m</span></div></div>` : ''}
            <div style="height: 1px; background: var(--glass-border); margin: 15px 0;"></div>
            <div class="form-group"><label for="dyn_cal1">Cal par y₁</label><div class="input-wrap"><input type="number" id="dyn_cal1" value="500"><span class="input-unit">k</span></div></div>
            <div class="form-group"><label for="dyn_cal2">Cal par y₂</label><div class="input-wrap"><input type="number" id="dyn_cal2" value="650"><span class="input-unit">k</span></div></div>
            ${numVars === 3 ? `<div class="form-group"><label for="dyn_cal3">Cal par y₃</label><div class="input-wrap"><input type="number" id="dyn_cal3" value="550"><span class="input-unit">k</span></div></div>` : ''}
        </div>
    </div>`;
    container.innerHTML = html;
}

// ── Collect form values into a plain object ───────────────────────────────────

function getFormParams(numVars) {
    const p = {};
    const ids = numVars === 2
        ? ['dyn_c1','dyn_c2','dyn_min_menus','dyn_min_time','dyn_t1','dyn_t2','dyn_min_cal','dyn_cal1','dyn_cal2']
        : ['dyn_c1','dyn_c2','dyn_c3','dyn_min_y1','dyn_min_y2','dyn_min_y3','dyn_min_time','dyn_t1','dyn_t2','dyn_t3','dyn_min_cal','dyn_cal1','dyn_cal2','dyn_cal3'];
    ids.forEach(id => p[id.replace('dyn_', '')] = parseFloat(document.getElementById(id).value) || 0);
    return p;
}

// ── Run Optimization (API only) ───────────────────────────────────────────────

async function runOptimization() {
    const numVars = parseInt(document.getElementById('numVariables').value);

    document.getElementById('step2-inputs').style.display = 'none';
    document.getElementById('step3-results').style.display = 'block';
    setTimeout(() => window.dispatchEvent(new Event('resize')), 100);

    if (numVars === 2) {
        document.getElementById('result-graph-container').style.display = 'block';
        document.getElementById('result-simplex-container').style.display = 'none';
    } else {
        document.getElementById('result-graph-container').style.display = 'none';
        document.getElementById('result-simplex-container').style.display = 'block';
    }

    const params = getFormParams(numVars);

    if (numVars === 2) await solveGraphique(params);
    else await solveSimplexe(params);
}

// ── API: Méthode Graphique ────────────────────────────────────────────────────

async function solveGraphique(params) {
    try {
        const res = await fetch(`${API_BASE}/solve/graphique`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        document.getElementById('m1_y1_res').textContent = data.y1.toFixed(2);
        document.getElementById('m1_y2_res').textContent = data.y2.toFixed(2);
        document.getElementById('m1_w_res').textContent  = data.W.toFixed(2);
        document.getElementById('m1_error').style.display = 'none';

        setTimeout(() => {
            plotGraphique(params, data.y1, data.y2, data.W, data.vertices);
        }, 150);
    } catch (e) {
        const el = document.getElementById('m1_error');
        el.style.display = 'block';
        el.textContent = '❌ Erreur API: ' + e.message + ' — Vérifiez que python api.py est lancé.';
    }
}

// ── API: Simplexe & Dualité ───────────────────────────────────────────────────

async function solveSimplexe(params) {
    try {
        const res = await fetch(`${API_BASE}/solve/simplexe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        document.getElementById('m2_y1_res').textContent = data.y1.toFixed(2);
        document.getElementById('m2_y2_res').textContent = data.y2.toFixed(2);
        document.getElementById('m2_y3_res').textContent = data.y3.toFixed(2);
        document.getElementById('m2_w_res').textContent  = data.W.toFixed(2);

        const dualParts = Object.entries(data.dual).map(([k, v]) => `${k}=${v.toFixed(2)}`);
        document.getElementById('m2_dual_res').innerHTML =
            dualParts.join(', ') + `<br>Z=${data.W.toFixed(2)}`;

        document.getElementById('m2_error').style.display = 'none';

        displayTableaux(data.tableaux, 5, 3);
    } catch (e) {
        const el = document.getElementById('m2_error');
        el.style.display = 'block';
        el.textContent = '❌ Erreur API: ' + e.message + ' — Vérifiez que python api.py est lancé.';
    }
}

// ── Plotly Graph Renderer ─────────────────────────────────────────────────────

function plotGraphique(params, opt_x, opt_y, opt_w, vertices) {
    const { c1, c2, min_menus, min_time, t1, t2, min_cal, cal1, cal2 } = params;

    const x_max = Math.max(80, opt_x * 1.5) || 80;
    const y_max = Math.max(80, opt_y * 1.5) || 80;
    const x_vals = [0, x_max];

    const y2_1 = x_vals.map(x => min_menus - x);
    const y2_2 = x_vals.map(x => t2 !== 0 ? (min_time - t1*x)/t2 : 0);
    const y2_3 = x_vals.map(x => cal2 !== 0 ? (min_cal - cal1*x)/cal2 : 0);
    const y_obj = x_vals.map(x => c2 !== 0 ? (opt_w - c1*x)/c2 : 0);

    const data = [
        { x: x_vals, y: y2_1, mode:'lines', name:`y₁+y₂≥${min_menus}`, line:{color:'#5C6B3A',width:2} },
        { x: x_vals, y: y2_2, mode:'lines', name:`${t1}y₁+${t2}y₂≥${min_time}m`, line:{color:'#C89B3C',width:2} },
        { x: x_vals, y: y2_3, mode:'lines', name:`${cal1}y₁+${cal2}y₂≥${min_cal}kcal`, line:{color:'#8A7A5E',width:2} },
        { x: x_vals, y: y_obj, mode:'lines', name:`W*=${opt_w.toFixed(2)}`, line:{color:'#C1613A',width:2,dash:'dash'} },
        {
            x: vertices.map(v => v.x), y: vertices.map(v => v.y),
            mode:'markers+text', name:'Sommets',
            text: vertices.map((_, i) => String.fromCharCode(65+i)),
            textposition:'top center',
            marker:{size:10,color:'#2A2118'},
            textfont:{family:'Outfit',size:14,color:'#2A2118'}
        },
        { x:[opt_x], y:[opt_y], mode:'markers', name:'Optimum', marker:{size:14,color:'#C1613A',symbol:'star'} }
    ];

    // Feasible region shading
    const sorted_v = [...vertices].sort((a,b) => a.x - b.x);
    const y_int = Math.max(min_menus, t2!==0?min_time/t2:0, cal2!==0?min_cal/cal2:0, 0);
    const x_int = Math.max(min_menus, t1!==0?min_time/t1:0, cal1!==0?min_cal/cal1:0, 0);
    const poly_x = [x_max, 0, 0, ...sorted_v.map(v=>v.x), x_int, x_max];
    const poly_y = [y_max, y_max, y_int, ...sorted_v.map(v=>v.y), 0, 0];
    data.unshift({ x:poly_x, y:poly_y, fill:'toself', fillcolor:'rgba(92,107,58,0.15)', line:{color:'transparent'}, name:'Région Admissible', hoverinfo:'none' });

    Plotly.newPlot('plot', data, {
        margin:{l:50,r:20,t:30,b:50},
        xaxis:{title:'y₁ (Continental)',range:[0,x_max],showgrid:true,gridcolor:'rgba(42,33,24,0.1)'},
        yaxis:{title:'y₂ (Healthy)',range:[0,y_max],showgrid:true,gridcolor:'rgba(42,33,24,0.1)'},
        paper_bgcolor:'transparent', plot_bgcolor:'transparent',
        font:{family:'Outfit',color:'#2A2118'},
        showlegend:true, legend:{orientation:'h',y:-0.2}
    }, {responsive:true, displayModeBar:false});
}

// ── Simplex Tableaux Renderer ─────────────────────────────────────────────────

function displayTableaux(tableaux, m, n) {
    const container = document.getElementById('tableaux-container');
    container.innerHTML = '';

    const col_names = ['Basis'];
    for (let i=0; i<m; i++) col_names.push(`x${i+1}`);
    for (let i=0; i<n; i++) col_names.push(`e${i+1}`);
    col_names.push('RHS');

    tableaux.forEach((state, idx) => {
        const title = idx === 0 ? 'Itération 0 (Tableau Initial)' : `Itération ${idx}`;
        const block = document.createElement('div');
        block.className = 'iteration-block';

        const h4 = document.createElement('h4');
        h4.textContent = title;
        block.appendChild(h4);

        const wrapper = document.createElement('div');
        wrapper.className = 'simplex-table-wrapper';

        const table = document.createElement('table');
        table.className = 'simplex-table';

        const trHead = document.createElement('tr');
        col_names.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col;
            trHead.appendChild(th);
        });
        table.appendChild(trHead);

        const basis_names = [];
        for (const b_idx of state.basis) {
            basis_names.push(b_idx < m ? `x${b_idx+1}` : `e${b_idx-m+1}`);
        }
        basis_names.push('Z');

        // Reorder: Z row first, then the rest
        const rowCount = state.matrix.length;
        const renderOrder = [rowCount - 1, ...Array.from({length: rowCount - 1}, (_, i) => i)];

        renderOrder.forEach(r_idx => {
            const row = state.matrix[r_idx];
            const tr = document.createElement('tr');
            if (state.pivot_row !== null && r_idx === state.pivot_row) tr.classList.add('pivot-row');

            const tdBasis = document.createElement('td');
            tdBasis.textContent = basis_names[r_idx];
            tr.appendChild(tdBasis);

            row.forEach((val, c_idx) => {
                const td = document.createElement('td');
                let num = typeof val === 'number' ? val : parseFloat(val);
                if (Math.abs(num) < 1e-9) num = 0;
                td.textContent = num.toFixed(2);
                if (num < -1e-9 && c_idx < row.length - 1) {
                    td.style.color = '#C1613A';
                    td.style.fontWeight = '600';
                }
                tr.appendChild(td);
            });
            table.appendChild(tr);
        });

        wrapper.appendChild(table);
        block.appendChild(wrapper);

        if (state.pivot_row !== null && state.pivot_col !== null) {
            const pivot_info = document.createElement('p');
            pivot_info.className = 'pivot-info';
            const pivot_val = parseFloat(state.matrix[state.pivot_row][state.pivot_col]).toFixed(2);
            pivot_info.textContent = `Pivot: Ligne ${basis_names[state.pivot_row]}, Colonne ${col_names[state.pivot_col+1]} (Valeur = ${pivot_val})`;
            block.appendChild(pivot_info);
        }

        container.appendChild(block);
    });
}

/* app.js - Refactored for Wizard Flow */

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
                <div class="input-wrap"><input type="number" id="dyn_c3" value="65"><span class="input-unit">DH</span></div>
            </div>` : ''}
        </div>
        
        <div class="card-glass" style="flex: 1; min-width: 300px;">
            <h3 class="card-title"><span class="card-title-icon">⚖️</span> Contraintes Générales</h3>
            <div class="form-group">
                <label for="dyn_min_menus">Min menus totaux</label>
                <div class="input-wrap"><input type="number" id="dyn_min_menus" value="${numVars === 2 ? '40' : '60'}"></div>
            </div>
            <div class="form-group" style="margin-top:10px;">
                <label for="dyn_min_time">Min temps total</label>
                <div class="input-wrap"><input type="number" id="dyn_min_time" value="${numVars === 2 ? '350' : '600'}"><span class="input-unit">min</span></div>
            </div>
            <div class="form-group" style="margin-top:10px;">
                <label for="dyn_min_cal">Min calories</label>
                <div class="input-wrap"><input type="number" id="dyn_min_cal" value="${numVars === 2 ? '20000' : '35000'}"><span class="input-unit">kcal</span></div>
            </div>
        </div>
        
        <div class="card-glass" style="flex: 1; min-width: 300px;">
            <h3 class="card-title"><span class="card-title-icon">⏱️</span> Détails Techniques</h3>
            <div class="form-group"><label for="dyn_t1">Temps par y₁</label><div class="input-wrap"><input type="number" id="dyn_t1" value="5"><span class="input-unit">m</span></div></div>
            <div class="form-group"><label for="dyn_t2">Temps par y₂</label><div class="input-wrap"><input type="number" id="dyn_t2" value="10"><span class="input-unit">m</span></div></div>
            ${numVars === 3 ? `<div class="form-group"><label for="dyn_t3">Temps par y₃</label><div class="input-wrap"><input type="number" id="dyn_t3" value="15"><span class="input-unit">m</span></div></div>` : ''}
            
            <div style="height: 1px; background: var(--glass-border); margin: 15px 0;"></div>
            
            <div class="form-group"><label for="dyn_cal1">Cal par y₁</label><div class="input-wrap"><input type="number" id="dyn_cal1" value="500"><span class="input-unit">k</span></div></div>
            <div class="form-group"><label for="dyn_cal2">Cal par y₂</label><div class="input-wrap"><input type="number" id="dyn_cal2" value="650"><span class="input-unit">k</span></div></div>
            ${numVars === 3 ? `<div class="form-group"><label for="dyn_cal3">Cal par y₃</label><div class="input-wrap"><input type="number" id="dyn_cal3" value="900"><span class="input-unit">k</span></div></div>` : ''}
        </div>
    </div>
    `;
    container.innerHTML = html;
}

function runOptimization() {
    const numVars = parseInt(document.getElementById('numVariables').value);
    
    document.getElementById('step2-inputs').style.display = 'none';
    document.getElementById('step3-results').style.display = 'block';
    
    setTimeout(() => {
        window.dispatchEvent(new Event('resize')); 
    }, 100);
    
    if (numVars === 2) {
        document.getElementById('result-graph-container').style.display = 'block';
        document.getElementById('result-simplex-container').style.display = 'none';
        
        mapInputsToIDs(2);
        solveModule1();
    } else {
        document.getElementById('result-graph-container').style.display = 'none';
        document.getElementById('result-simplex-container').style.display = 'block';
        
        mapInputsToIDs(3);
        solveModule2();
    }
}

function mapInputsToIDs(numVars) {
    const hiddenContainer = document.getElementById('hidden-inputs');
    if (numVars === 2) {
        const mappings = {
            'dyn_c1': 'm1_c1', 'dyn_c2': 'm1_c2',
            'dyn_min_menus': 'm1_min_menus', 'dyn_min_time': 'm1_min_time',
            'dyn_t1': 'm1_t1', 'dyn_t2': 'm1_t2',
            'dyn_min_cal': 'm1_min_cal', 'dyn_cal1': 'm1_cal1', 'dyn_cal2': 'm1_cal2'
        };
        createHiddenInputs(mappings, hiddenContainer);
    } else {
        const mappings = {
            'dyn_c1': 'm2_c1', 'dyn_c2': 'm2_c2', 'dyn_c3': 'm2_c3',
            'dyn_min_menus': 'm2_min_y1', 
            'dyn_min_time': 'm2_min_time',
            'dyn_t1': 'm2_t1', 'dyn_t2': 'm2_t2', 'dyn_t3': 'm2_t3',
            'dyn_min_cal': 'm2_min_cal', 'dyn_cal1': 'm2_cal1', 'dyn_cal2': 'm2_cal2', 'dyn_cal3': 'm2_cal3'
        };
        createHiddenInputs(mappings, hiddenContainer);
        
        let totalMenus = parseFloat(document.getElementById('dyn_min_menus').value);
        let third = totalMenus / 3;
        setHiddenVal('m2_min_y1', third, hiddenContainer);
        setHiddenVal('m2_min_y2', third, hiddenContainer);
        setHiddenVal('m2_min_y3', third, hiddenContainer);
    }
}

function setHiddenVal(id, val, container) {
    let el = document.getElementById(id);
    if (!el) {
        el = document.createElement('input');
        el.type = 'hidden';
        el.id = id;
        container.appendChild(el);
    }
    el.value = val;
}

function createHiddenInputs(mappings, container) {
    for (let dynId in mappings) {
        let realId = mappings[dynId];
        let val = document.getElementById(dynId).value;
        setHiddenVal(realId, val, container);
    }
}

function getValue(id) {
    return parseFloat(document.getElementById(id).value) || 0;
}

function setValue(id, value) {
    document.getElementById(id).textContent = value;
}

// Module 1 Logic
function solveModule1() {
    let c1 = getValue('m1_c1');
    let c2 = getValue('m1_c2');
    let min_menus = getValue('m1_min_menus');
    let min_time = getValue('m1_min_time');
    let t1 = getValue('m1_t1');
    let t2 = getValue('m1_t2');
    let min_cal = getValue('m1_min_cal');
    let cal1 = getValue('m1_cal1');
    let cal2 = getValue('m1_cal2');
    
    let lines = [
        {a: 1, b: 1, c: min_menus},
        {a: t1, b: t2, c: min_time},
        {a: cal1, b: cal2, c: min_cal},
        {a: 1, b: 0, c: 0}, 
        {a: 0, b: 1, c: 0}  
    ];
    
    let vertices = [];
    
    for (let i = 0; i < lines.length; i++) {
        for (let j = i + 1; j < lines.length; j++) {
            let l1 = lines[i];
            let l2 = lines[j];
            let det = l1.a * l2.b - l2.a * l1.b;
            if (Math.abs(det) > 1e-7) {
                let x = (l1.c * l2.b - l2.c * l1.b) / det;
                let y = (l1.a * l2.c - l2.a * l1.c) / det;
                
                if (x >= -1e-5 && y >= -1e-5) {
                    if (x + y >= min_menus - 1e-5 && 
                        t1 * x + t2 * y >= min_time - 1e-5 && 
                        cal1 * x + cal2 * y >= min_cal - 1e-5) {
                        
                        let isDup = false;
                        for (let v of vertices) {
                            if (Math.abs(v.x - x) < 1e-4 && Math.abs(v.y - y) < 1e-4) {
                                isDup = true;
                                break;
                            }
                        }
                        if (!isDup) vertices.push({x: Math.max(0, x), y: Math.max(0, y)});
                    }
                }
            }
        }
    }
    
    if (vertices.length === 0) {
        document.getElementById('m1_error').style.display = 'block';
        document.getElementById('m1_error').textContent = "Aucune solution réalisable.";
        return;
    }
    document.getElementById('m1_error').style.display = 'none';
    
    let opt_w = Infinity;
    let opt_v = null;
    for (let v of vertices) {
        let w = c1 * v.x + c2 * v.y;
        if (w < opt_w) {
            opt_w = w;
            opt_v = v;
        }
    }
    
    setValue('m1_y1_res', opt_v.x.toFixed(2));
    setValue('m1_y2_res', opt_v.y.toFixed(2));
    setValue('m1_w_res', opt_w.toFixed(2));
    
    // Slight delay to ensure DOM is fully visible before Highcharts calculates its width
    setTimeout(() => {
        plotModule1(c1, c2, min_menus, min_time, t1, t2, min_cal, cal1, cal2, opt_v.x, opt_v.y, opt_w, vertices);
    }, 150);
}

function plotModule1(c1, c2, min_menus, min_time, t1, t2, min_cal, cal1, cal2, opt_x, opt_y, opt_w, vertices) {
    let x_max = Math.max(80, opt_x * 1.5) || 80;
    let y_max = Math.max(80, opt_y * 1.5) || 80;
    
    let x_vals = [0, x_max];
    let y2_1 = x_vals.map(x => min_menus - x);
    let y2_2 = x_vals.map(x => t2 !== 0 ? (min_time - t1*x)/t2 : 0);
    let y2_3 = x_vals.map(x => cal2 !== 0 ? (min_cal - cal1*x)/cal2 : 0);
    let y_obj = x_vals.map(x => c2 !== 0 ? (opt_w - c1*x)/c2 : 0);

    let data = [];

    data.push({
        x: x_vals, y: y2_1,
        mode: 'lines',
        name: `y₁ + y₂ ≥ ${min_menus}`,
        line: {color: '#5C6B3A', width: 2}
    });

    data.push({
        x: x_vals, y: y2_2,
        mode: 'lines',
        name: `${t1}y₁ + ${t2}y₂ ≥ ${min_time}m`,
        line: {color: '#C89B3C', width: 2}
    });

    data.push({
        x: x_vals, y: y2_3,
        mode: 'lines',
        name: `${cal1}y₁ + ${cal2}y₂ ≥ ${min_cal}kcal`,
        line: {color: '#8A7A5E', width: 2}
    });

    data.push({
        x: x_vals, y: y_obj,
        mode: 'lines',
        name: `Coût Optimal W=${opt_w.toFixed(2)}`,
        line: {color: '#C1613A', width: 2, dash: 'dash'}
    });

    let vx = vertices.map(v => v.x);
    let vy = vertices.map(v => v.y);
    let vtext = vertices.map((v, i) => `${String.fromCharCode(65+i)}`);
    
    data.push({
        x: vx, y: vy,
        mode: 'markers+text',
        name: 'Sommets',
        text: vtext,
        textposition: 'top center',
        marker: {size: 10, color: '#2A2118'},
        textfont: {family: 'Outfit', size: 14, color: '#2A2118'}
    });

    data.push({
        x: [opt_x], y: [opt_y],
        mode: 'markers',
        name: 'Optimum',
        marker: {size: 14, color: '#C1613A', symbol: 'star'}
    });

    let sorted_v = [...vertices].sort((a,b) => a.x - b.x);
    let poly_x = [x_max, 0];
    let poly_y = [y_max, y_max];
    
    let y_int = Math.max(min_menus, t2!==0 ? min_time/t2 : 0, cal2!==0 ? min_cal/cal2 : 0, 0);
    poly_x.push(0); poly_y.push(y_int);
    
    for(let v of sorted_v) {
        poly_x.push(v.x);
        poly_y.push(v.y);
    }
    
    let x_int = Math.max(min_menus, t1!==0 ? min_time/t1 : 0, cal1!==0 ? min_cal/cal1 : 0, 0);
    poly_x.push(x_int); poly_y.push(0);
    
    poly_x.push(x_max); poly_y.push(0);
    
    data.unshift({
        x: poly_x, y: poly_y,
        fill: 'toself',
        fillcolor: 'rgba(92, 107, 58, 0.15)',
        line: {color: 'transparent'},
        name: 'Région Admissible',
        hoverinfo: 'none'
    });

    let layout = {
        title: '',
        margin: {l: 50, r: 20, t: 30, b: 50},
        xaxis: {title: 'y₁ (Continental)', range: [0, x_max], showgrid: true, gridcolor: 'rgba(42,33,24,0.1)'},
        yaxis: {title: 'y₂ (Healthy)', range: [0, y_max], showgrid: true, gridcolor: 'rgba(42,33,24,0.1)'},
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: {family: 'Outfit', color: '#2A2118'},
        showlegend: true,
        legend: {orientation: 'h', y: -0.2}
    };

    let config = {responsive: true, displayModeBar: false};

    Plotly.newPlot('plot', data, layout, config);
}

// Module 2 Logic (Simplex)
function generate_simplex_tableaux(c, A_T, b) {
    let n = c.length;
    let m = b.length;
    let tableaux = [];
    
    let rows = n + 1;
    let cols = m + n + 1;
    
    let tableau = Array(rows).fill().map(() => Array(cols).fill(0));
    
    for(let i=0; i<n; i++) {
        for(let j=0; j<m; j++) {
            tableau[i][j] = A_T[i][j];
        }
        tableau[i][m+i] = 1; 
        tableau[i][cols-1] = c[i]; 
    }
    
    for(let j=0; j<m; j++) {
        tableau[n][j] = -b[j];
    }
    
    let basis = [];
    for(let i=0; i<n; i++) {
        basis.push(m + i);
    }
    
    function copyTableau(tab) {
        return tab.map(row => [...row]);
    }
    
    function getState(tab, b, p_row=null, p_col=null) {
        return {
            matrix: copyTableau(tab),
            basis: [...b],
            pivot_row: p_row,
            pivot_col: p_col
        };
    }
    
    tableaux.push(getState(tableau, basis));
    
    let iter = 0;
    while(iter < 20) {
        let optimal = true;
        for(let j=0; j<cols-1; j++) {
            if(tableau[n][j] < -1e-7) {
                optimal = false;
                break;
            }
        }
        if(optimal) break;
        
        let pivot_col = 0;
        let min_val = 0;
        for(let j=0; j<cols-1; j++) {
            if(tableau[n][j] < min_val) {
                min_val = tableau[n][j];
                pivot_col = j;
            }
        }
        
        let ratios = [];
        for(let i=0; i<n; i++) {
            if(tableau[i][pivot_col] > 1e-7) {
                ratios.push(tableau[i][cols-1] / tableau[i][pivot_col]);
            } else {
                ratios.push(Infinity);
            }
        }
        
        let pivot_row = 0;
        let min_ratio = Infinity;
        for(let i=0; i<n; i++) {
            if(ratios[i] < min_ratio) {
                min_ratio = ratios[i];
                pivot_row = i;
            }
        }
        
        if(min_ratio === Infinity) break; 
        
        tableaux[tableaux.length - 1].pivot_row = pivot_row;
        tableaux[tableaux.length - 1].pivot_col = pivot_col;
        
        let pivot_val = tableau[pivot_row][pivot_col];
        for(let j=0; j<cols; j++) {
            tableau[pivot_row][j] /= pivot_val;
        }
        
        for(let i=0; i<rows; i++) {
            if(i !== pivot_row) {
                let factor = tableau[i][pivot_col];
                for(let j=0; j<cols; j++) {
                    tableau[i][j] -= factor * tableau[pivot_row][j];
                }
            }
        }
        
        basis[pivot_row] = pivot_col;
        iter++;
        
        tableaux.push(getState(tableau, basis));
    }
    
    return tableaux;
}

function displayTableaux(tableaux, m, n) {
    let container = document.getElementById('tableaux-container');
    container.innerHTML = '';
    
    let col_names = ["Basis"];
    for (let i=0; i<m; i++) col_names.push(`x${i+1}`);
    for (let i=0; i<n; i++) col_names.push(`e${i+1}`);
    col_names.push("RHS");
    
    tableaux.forEach((state, idx) => {
        let title = idx === 0 ? "Itération 0 (Tableau Initial)" : `Itération ${idx}`;
        let block = document.createElement('div');
        block.className = 'iteration-block';
        
        let h4 = document.createElement('h4');
        h4.textContent = title;
        block.appendChild(h4);
        
        let wrapper = document.createElement('div');
        wrapper.className = 'simplex-table-wrapper';
        
        let table = document.createElement('table');
        table.className = 'simplex-table';
        
        // Header
        let trHead = document.createElement('tr');
        col_names.forEach(col => {
            let th = document.createElement('th');
            th.textContent = col;
            trHead.appendChild(th);
        });
        table.appendChild(trHead);
        
        // Body
        let basis_names = [];
        for(let b_idx of state.basis) {
            if (b_idx < m) basis_names.push(`x${b_idx+1}`);
            else basis_names.push(`e${b_idx-m+1}`);
        }
        basis_names.push("Z");
        
        state.matrix.forEach((row, r_idx) => {
            let tr = document.createElement('tr');
            if (state.pivot_row !== null && r_idx === state.pivot_row) {
                tr.classList.add('pivot-row');
            }
            
            let tdBasis = document.createElement('td');
            tdBasis.textContent = basis_names[r_idx];
            tr.appendChild(tdBasis);
            
            row.forEach(val => {
                let td = document.createElement('td');
                td.textContent = val.toFixed(2);
                tr.appendChild(td);
            });
            
            table.appendChild(tr);
        });
        
        wrapper.appendChild(table);
        block.appendChild(wrapper);
        
        if (state.pivot_row !== null && state.pivot_col !== null) {
            let pivot_info = document.createElement('p');
            pivot_info.className = 'pivot-info';
            let pivot_val = state.matrix[state.pivot_row][state.pivot_col].toFixed(2);
            pivot_info.textContent = `Pivot: Ligne ${basis_names[state.pivot_row]}, Colonne ${col_names[state.pivot_col+1]} (Valeur = ${pivot_val})`;
            block.appendChild(pivot_info);
        }
        
        container.appendChild(block);
    });
}

function solveModule2() {
    try {
        let c1 = getValue('m2_c1'), c2 = getValue('m2_c2'), c3 = getValue('m2_c3');
        let min_y1 = getValue('m2_min_y1'), min_y2 = getValue('m2_min_y2'), min_y3 = getValue('m2_min_y3');
        let min_time = getValue('m2_min_time');
        let t1 = getValue('m2_t1'), t2 = getValue('m2_t2'), t3 = getValue('m2_t3');
        let min_cal = getValue('m2_min_cal');
        let cal1 = getValue('m2_cal1'), cal2 = getValue('m2_cal2'), cal3 = getValue('m2_cal3');
        
        let c = [c1, c2, c3];
        let A_T = [
            [1, 0, 0, t1, cal1],
            [0, 1, 0, t2, cal2],
            [0, 0, 1, t3, cal3]
        ];
        let b_primal = [min_y1, min_y2, min_y3, min_time, min_cal];
        
        let tableaux = generate_simplex_tableaux(c, A_T, b_primal);
        let final_tab = tableaux[tableaux.length - 1];
        let final_matrix = final_tab.matrix;
        let final_basis = final_tab.basis;
        
        let n = c.length;
        let m = b_primal.length;
        let y_opt = [];
        for (let i = 0; i < n; i++) {
            y_opt.push(final_matrix[n][m + i]);
        }
        
        let dual_sol = Array(m).fill(0);
        for (let i = 0; i < n; i++) {
            let b_idx = final_basis[i];
            if (b_idx < m) {
                dual_sol[b_idx] = final_matrix[i][m + n];
            }
        }
        
        let Z_opt = final_matrix[n][m + n];
        
        setValue('m2_y1_res', y_opt[0].toFixed(2));
        setValue('m2_y2_res', y_opt[1].toFixed(2));
        setValue('m2_y3_res', y_opt[2].toFixed(2));
        setValue('m2_w_res', Z_opt.toFixed(2));
        
        document.getElementById('m2_dual_res').innerHTML = `x₁=${dual_sol[0].toFixed(2)}, x₂=${dual_sol[1].toFixed(2)}, x₃=${dual_sol[2].toFixed(2)}, x₄=${dual_sol[3].toFixed(2)}, x₅=${dual_sol[4].toFixed(2)}<br>Z=${Z_opt.toFixed(2)}`;
        
        displayTableaux(tableaux, m, n);
        
    } catch (e) {
        let errorEl = document.getElementById('m2_error');
        errorEl.style.display = 'block';
        errorEl.textContent = "Erreur: " + e.message;
    }
}

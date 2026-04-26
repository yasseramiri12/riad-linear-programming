// Utilities
function getValue(id) {
    return parseFloat(document.getElementById(id).value) || 0;
}

function setValue(id, value) {
    document.getElementById(id).textContent = value;
}

// Tabs
function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
    
    // redraw plot if needed
    if (tabId === 'module1') {
        window.dispatchEvent(new Event('resize'));
    }
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
        {a: 1, b: 0, c: 0}, // y1 = 0
        {a: 0, b: 1, c: 0}  // y2 = 0
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
    
    plotModule1(c1, c2, min_menus, min_time, t1, t2, min_cal, cal1, cal2, opt_v.x, opt_v.y, opt_w, vertices);
}

function plotModule1(c1, c2, min_menus, min_time, t1, t2, min_cal, cal1, cal2, opt_x, opt_y, opt_w, vertices) {
    let x_max = Math.max(80, opt_x * 1.5) || 80;
    let y_max = Math.max(80, opt_y * 1.5) || 80;
    
    let x_vals = [];
    let y2_1 = [], y2_2 = [], y2_3 = [];
    
    let region_x = [];
    let region_y = [];
    let region_y_top = [];
    
    for (let i = 0; i <= 400; i++) {
        let x = (i / 400) * x_max * 1.5;
        x_vals.push(x);
        
        let y_1 = min_menus - x;
        let y_2 = t2 !== 0 ? (min_time - t1*x)/t2 : 0;
        let y_3 = cal2 !== 0 ? (min_cal - cal1*x)/cal2 : 0;
        
        y2_1.push(y_1);
        y2_2.push(y_2);
        y2_3.push(y_3);
        
        let max_y = Math.max(y_1, y_2, y_3, 0);
        
        if (max_y <= y_max * 1.5) {
            region_x.push(x);
            region_y.push(max_y);
            region_y_top.push(y_max * 1.5);
        }
    }
    
    let traces = [];
    
    traces.push({x: x_vals, y: y2_1, mode: 'lines', name: `y1+y2>=${min_menus}`, line: {color: 'blue'}});
    traces.push({x: x_vals, y: y2_2, mode: 'lines', name: `${t1}y1+${t2}y2>=${min_time}`, line: {color: 'green'}});
    traces.push({x: x_vals, y: y2_3, mode: 'lines', name: `${cal1}y1+${cal2}y2>=${min_cal}`, line: {color: 'orange'}});
    
    traces.push({
        x: region_x, 
        y: region_y, 
        mode: 'lines', 
        line: {width: 0}, 
        showlegend: false,
        hoverinfo: 'none'
    });
    traces.push({
        x: region_x, 
        y: region_y_top, 
        mode: 'none', 
        fill: 'tonexty', 
        fillcolor: 'rgba(128,128,128,0.3)', 
        name: 'Région réalisable'
    });
    
    let vx = vertices.map(v => v.x);
    let vy = vertices.map(v => v.y);
    let v_text = vertices.map((v, i) => String.fromCharCode(65+i) + `(${v.x.toFixed(2)}, ${v.y.toFixed(2)})`);
    
    traces.push({
        x: vx, y: vy, mode: 'markers+text', name: 'Sommets', 
        marker: {color: 'black', size: 8},
        text: v_text, textposition: 'top right'
    });
    
    let y_obj = x_vals.map(x => c2 !== 0 ? (opt_w - c1*x)/c2 : 0);
    traces.push({x: x_vals, y: y_obj, mode: 'lines', name: `Objectif W=${opt_w.toFixed(2)}`, line: {color: 'red', dash: 'dash'}});
    
    traces.push({
        x: [opt_x], y: [opt_y], mode: 'markers', name: 'Point optimal',
        marker: {color: 'red', symbol: 'star', size: 15}
    });
    
    let layout = {
        title: 'Région Réalisable et Solution Optimale',
        xaxis: {title: 'y1 (Continental)', range: [0, x_max]},
        yaxis: {title: 'y2 (Healthy)', range: [0, y_max]},
        margin: {l: 50, r: 20, b: 50, t: 50}
    };
    
    let config = {responsive: true};
    Plotly.newPlot('plot', traces, layout, config);
}

function resetModule1() {
    document.getElementById('m1_c1').value = 35;
    document.getElementById('m1_c2').value = 50;
    document.getElementById('m1_min_menus').value = 40;
    document.getElementById('m1_min_time').value = 350;
    document.getElementById('m1_t1').value = 5;
    document.getElementById('m1_t2').value = 10;
    document.getElementById('m1_min_cal').value = 20000;
    document.getElementById('m1_cal1').value = 500;
    document.getElementById('m1_cal2').value = 650;
    
    setValue('m1_y1_res', '-');
    setValue('m1_y2_res', '-');
    setValue('m1_w_res', '-');
    document.getElementById('m1_error').style.display = 'none';
    
    Plotly.purge('plot');
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

function solveModule2() {
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
    
    document.getElementById('m2_dual_res').innerHTML = `x1=${dual_sol[0].toFixed(2)}, x3=${dual_sol[2].toFixed(2)}, x4=${dual_sol[3].toFixed(2)}<br>Z=${Z_opt.toFixed(2)}`;
    
    displayTableaux(tableaux, m, n);
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

function resetModule2() {
    document.getElementById('m2_c1').value = 35;
    document.getElementById('m2_c2').value = 50;
    document.getElementById('m2_c3').value = 45;
    document.getElementById('m2_min_y1').value = 20;
    document.getElementById('m2_min_y2').value = 10;
    document.getElementById('m2_min_y3').value = 10;
    document.getElementById('m2_min_time').value = 350;
    document.getElementById('m2_t1').value = 5;
    document.getElementById('m2_t2').value = 10;
    document.getElementById('m2_t3').value = 8;
    document.getElementById('m2_min_cal').value = 20000;
    document.getElementById('m2_cal1').value = 500;
    document.getElementById('m2_cal2').value = 650;
    document.getElementById('m2_cal3').value = 550;
    
    setValue('m2_y1_res', '-');
    setValue('m2_y2_res', '-');
    setValue('m2_y3_res', '-');
    setValue('m2_w_res', '-');
    document.getElementById('m2_dual_res').textContent = '-';
    
    document.getElementById('tableaux-container').innerHTML = '';
}

// Initial draw
setTimeout(() => {
    solveModule1();
    solveModule2();
}, 500);

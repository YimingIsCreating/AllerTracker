// ============================================
// 热力图组件
// ============================================

const Heatmap = {
    /**
     * 生成热力图
     */
    generate(records, analysis) {
        const grid = document.getElementById('heatmapGrid');
        const months = document.getElementById('heatmapMonths');
        grid.classList.remove('skeleton');
        months.classList.remove('skeleton');
        grid.innerHTML = '';
        months.innerHTML = '';
        
        const end = new Date();
        const start = new Date(end);
        start.setDate(start.getDate() - 364);
        if (start.getDay() !== 0) start.setDate(start.getDate() - start.getDay());
        
        const byDate = {};
        if (records && records.length > 0) {
            records.forEach(r => { 
                if (!byDate[r.date]) byDate[r.date] = []; 
                byDate[r.date].push(r); 
            });
        }
        
        const foodConfidence = {};
        if (analysis && analysis.results) {
            analysis.results.forEach(f => {
                foodConfidence[f.food] = f.score / 100;
            });
        }
        const knownAllergens = new Set(analysis?.known_allergens || []);

        const risk = {};
        Object.keys(byDate).forEach(d => {
            const recs = byDate[d];
            const hasSym = recs.some(r => r.symptoms?.length);

            if (!hasSym) {
                risk[d] = recs.length ? 'very-low' : 'none';
            } else {
                // 吃了一个你已经手动确认过的过敏原、又记录了症状 —— 这已经是实锤,不需要
                // 靠统计置信度去"猜":这类食物你本来就很少吃(因为知道要避开),统计次数往往
                // 攒不到 min_occurrences,容易被误判成证据不足的浅色。直接判定为最高等级。
                const ateKnownAllergen = recs.some(r => r.foods.some(food => knownAllergens.has(food)));
                if (ateKnownAllergen) {
                    risk[d] = 'very-high';
                    return;
                }

                let maxConfidence = 0;
                recs.forEach(r => {
                    r.foods.forEach(food => {
                        if (foodConfidence[food] !== undefined) {
                            maxConfidence = Math.max(maxConfidence, foodConfidence[food]);
                        }
                    });
                });

                if (maxConfidence >= 0.95) risk[d] = 'very-high';
                else if (maxConfidence >= 0.85) risk[d] = 'high';
                else if (maxConfidence >= 0.70) risk[d] = 'medium-high';
                else if (maxConfidence >= 0.55) risk[d] = 'medium';
                else if (maxConfidence >= 0.40) risk[d] = 'medium-low';
                else if (maxConfidence >= 0.25) risk[d] = 'low';
                else risk[d] = 'mild';  // 有症状但相关食物置信度很低——和"very-low"(完全没有症状的安全日)区分开,避免共用同一个颜色
            }
        });
        
        let weekCount = 0;
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) weekCount++;
        const columnTemplate = `repeat(${weekCount}, minmax(6px, 1fr))`;
        grid.style.gridTemplateColumns = columnTemplate;
        months.style.gridTemplateColumns = columnTemplate;

        let curr = new Date(start);
        let mon = -1;

        while (curr <= end) {
            const m = curr.getMonth();

            if (m !== mon && curr.getDate() <= 7) {
                mon = m;
                const lbl = document.createElement('div');
                lbl.className = 'heatmap-month';
                lbl.textContent = curr.toLocaleDateString('en', {month: 'short'});
                months.appendChild(lbl);
            } else {
                const sp = document.createElement('div');
                sp.className = 'heatmap-month';
                months.appendChild(sp);
            }

            for (let i = 0; i < 7; i++) {
                const day = document.createElement('div');
                day.className = 'heatmap-day';
                const ds = curr.toISOString().split('T')[0];
                day.setAttribute('data-risk', risk[ds] || 'none');
                day.setAttribute('data-date', ds);
                day.onmouseenter = this.showTooltip;
                day.onmouseleave = this.hideTooltip;
                grid.appendChild(day);
                curr.setDate(curr.getDate() + 1);
            }
        }
    },

    /**
     * 显示工具提示
     */
    showTooltip(e) {
        const tip = document.getElementById('heatmapTooltip');
        const date = e.target.getAttribute('data-date');
        const recs = State.currentRecords.filter(r => r.date === date);
        
        let html = `<div class="tooltip-date">${new Date(date + 'T00:00').toLocaleDateString('en', {weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'})}</div>`;
        
        if (!recs.length) {
            html += '<div style="color:#8b949e;font-style:italic;">No meals</div>';
        } else {
            const foods = [...new Set(recs.flatMap(r => r.foods))];
            const symp = [...new Set(recs.flatMap(r => r.symptoms || []))];
            html += `<div class="tooltip-foods">🍽️ ${foods.join(', ')}</div>`;
            html += symp.length ? `<div class="tooltip-symptoms">🤧 ${symp.join(', ')}</div>` : '<div style="color:#3fb950;">✅ No symptoms</div>';
        }
        
        tip.innerHTML = html;
        tip.style.display = 'block';
        const rect = e.target.getBoundingClientRect();
        tip.style.left = rect.left - tip.offsetWidth / 2 + 6 + 'px';
        tip.style.top = rect.top - tip.offsetHeight - 12 + 'px';
    },

    /**
     * 隐藏工具提示
     */
    hideTooltip() { 
        document.getElementById('heatmapTooltip').style.display = 'none'; 
    }
};
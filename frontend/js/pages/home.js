const HomePage = {
    async load() {
        const [recs, anal] = await Promise.all([
            AllerTrackAPI.getRecords(),
            AllerTrackAPI.getAnalysis()
        ]);
        
        State.currentRecords = recs.records;
        State.currentAnalysis = anal;
        
        this.renderStats(anal);
        this.renderTopRiskFoods(anal);
        Heatmap.generate(recs.records, anal);
        this.renderPredictionPreview();
    },

    renderStats(analysis) {
        document.getElementById('statsGrid').innerHTML = `
            <div class="stat-card">
                <div class="stat-info">
                    <div class="stat-label">Total Meals</div>
                    <div class="stat-number">${analysis.total_meals || 0}</div>
                </div>
                <div class="stat-icon meals">🍽️</div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <div class="stat-label">With Symptoms</div>
                    <div class="stat-number">${analysis.meals_with_symptoms || 0}</div>
                </div>
                <div class="stat-icon symptoms">🤧</div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <div class="stat-label">Foods Analyzed</div>
                    <div class="stat-number">${analysis.foods_analyzed || 0}</div>
                </div>
                <div class="stat-icon foods">🔬</div>
            </div>
        `;
    },

    renderTopRiskFoods(analysis) {
        const top = analysis.results?.slice(0, 10) || [];
        const container = document.getElementById('topRiskFoods');
        
        if (!top.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <div class="empty-title">No risk data available yet</div>
                    <div class="empty-desc">Add at least 3 meals with symptoms to see food analysis</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = top.map((f, i) => `
            <div class="risk-food-item ${f.risk_level.toLowerCase()}">
                <div class="risk-rank">${i + 1}</div>
                <div class="risk-food-name">${f.food}</div>
                <div class="risk-score">${f.score}%</div>
                <div class="risk-badge-small ${f.risk_level.toLowerCase()}">${f.risk_level}</div>
            </div>
        `).join('');
    },

    async renderPredictionPreview() {
        const container = document.getElementById('homePredictionPreview');
        
        container.innerHTML = `
            <div class="analyzing-loader">
                <div class="loader-spinner"></div>
                <div class="loader-text">Loading prediction graph...</div>
            </div>
        `;
        
        try {
            const graphData = await AllerTrackAPI.getPredictions();
            
            if (!graphData.has_data) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🔮</div>
                        <div class="empty-title">Not enough data for predictions</div>
                        <div class="empty-desc">Add more meals with symptoms to see allergen relationships</div>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = '<div id="homePredictionGraph" class="prediction-graph-container"></div>';
            this.renderPredictionGraph(graphData);
            
        } catch (error) {
            console.error('Failed to load prediction preview:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <div class="empty-title">Failed to load prediction</div>
                </div>
            `;
        }
    },

    renderPredictionGraph(data) {
        const container = document.getElementById('homePredictionGraph');
        if (!container) return;
        
        const width = container.offsetWidth;
        const height = 350;
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.style.background = '#f6f8fa';
        svg.style.borderRadius = '8px';
        container.innerHTML = '';
        container.appendChild(svg);
        
        if (!data.nodes || data.nodes.length === 0) return;
        
        const nodes = data.nodes.map(n => ({
            ...n,
            x: width / 2 + (Math.random() - 0.5) * 200,
            y: height / 2 + (Math.random() - 0.5) * 200,
            vx: 0,
            vy: 0
        }));
        
        const edges = data.edges || [];
        const edgeElements = [];
        
        edges.forEach(edge => {
            const source = nodes.find(n => n.id === edge.source);
            const target = nodes.find(n => n.id === edge.target);
            
            if (source && target) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('stroke', '#d0d7de');
                line.setAttribute('stroke-width', Math.min(edge.weight * 2, 4));
                line.setAttribute('opacity', 0.6);
                svg.appendChild(line);
                edgeElements.push({ line, source, target });
            }
        });
        
        nodes.forEach(node => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('r', node.size);
            circle.setAttribute('fill', node.type === 'confirmed' ? '#cf222e' : node.type === 'high_risk' ? '#fd8c73' : '#8b949e');
            circle.setAttribute('stroke', '#fff');
            circle.setAttribute('stroke-width', '3');
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dy', node.size + 18);
            text.setAttribute('font-size', '12');
            text.setAttribute('font-weight', '600');
            text.setAttribute('fill', '#24292f');
            text.textContent = node.label;
            
            g.appendChild(circle);
            g.appendChild(text);
            svg.appendChild(g);
            node.element = g;
        });
        
        let iteration = 0;
        const maxIterations = 200;
        
        const simulate = () => {
            if (iteration++ > maxIterations) return;
            
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[j].x - nodes[i].x;
                    const dy = nodes[j].y - nodes[i].y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = 800 / (dist * dist);
                    
                    nodes[i].vx -= (dx / dist) * force;
                    nodes[i].vy -= (dy / dist) * force;
                    nodes[j].vx += (dx / dist) * force;
                    nodes[j].vy += (dy / dist) * force;
                }
            }
            
            edgeElements.forEach(edge => {
                const dx = edge.target.x - edge.source.x;
                const dy = edge.target.y - edge.source.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = (dist - 120) * 0.01;
                
                edge.source.vx += (dx / dist) * force;
                edge.source.vy += (dy / dist) * force;
                edge.target.vx -= (dx / dist) * force;
                edge.target.vy -= (dy / dist) * force;
            });
            
            const centerX = width / 2;
            const centerY = height / 2;
            nodes.forEach(node => {
                node.vx += (centerX - node.x) * 0.002;
                node.vy += (centerY - node.y) * 0.002;
                node.vx *= 0.85;
                node.vy *= 0.85;
                node.x += node.vx;
                node.y += node.vy;
                
                const margin = node.size + 40;
                node.x = Math.max(margin, Math.min(width - margin, node.x));
                node.y = Math.max(margin, Math.min(height - margin, node.y));
                
                node.element.setAttribute('transform', `translate(${node.x}, ${node.y})`);
            });
            
            edgeElements.forEach(edge => {
                edge.line.setAttribute('x1', edge.source.x);
                edge.line.setAttribute('y1', edge.source.y);
                edge.line.setAttribute('x2', edge.target.x);
                edge.line.setAttribute('y2', edge.target.y);
            });
            
            requestAnimationFrame(simulate);
        };
        
        simulate();
    }
};

window.generateReport = () => {
    Utils.showAlert('Generate Report', 'Compile all data into comprehensive analysis?', () => {
        Navigation.showSubPage('report', false);
        document.querySelectorAll('.nav-sub-item').forEach((item, index) => {
            item.classList.toggle('active', index === 1);
        });
    });
};
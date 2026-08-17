const HomePage = {
    async load() {
        this.renderLoading();

        const slowHintTimer = setTimeout(() => this.showSlowLoadingHint(), 4000);

        try {
            const [recs, anal] = await Promise.all([
                AllerTrackAPI.getRecords(),
                AllerTrackAPI.getAnalysis()
            ]);

            clearTimeout(slowHintTimer);

            State.currentRecords = recs.records;
            State.currentAnalysis = anal;

            this.renderStats(anal);
            this.renderTopRiskFoods(anal);
            Heatmap.generate(recs.records, anal);
            this.renderPredictionPreview();
        } catch (error) {
            clearTimeout(slowHintTimer);
            console.error('Failed to load home data:', error);
            this.renderLoadError();
        }
    },

    renderLoading() {
        document.getElementById('statsGrid').innerHTML = `
            <div class="stat-card skeleton"></div>
            <div class="stat-card skeleton"></div>
            <div class="stat-card skeleton"></div>
        `;

        document.getElementById('topRiskFoods').innerHTML = `
            <div class="analyzing-loader">
                <div class="loader-spinner"></div>
                <div class="loader-text" id="homeLoaderText">Loading your data...</div>
                <div class="loader-subtext" id="homeLoaderSubtext" style="display: none;"></div>
            </div>
        `;

        document.getElementById('heatmapGrid').classList.add('skeleton');
        document.getElementById('heatmapMonths').classList.add('skeleton');
    },

    showSlowLoadingHint() {
        const text = document.getElementById('homeLoaderText');
        const subtext = document.getElementById('homeLoaderSubtext');
        if (text) text.textContent = 'Still waking up the server...';
        if (subtext) {
            subtext.style.display = 'block';
            subtext.textContent = 'Our free-tier backend goes to sleep when idle, so the first load after a break can take up to a minute. Thanks for your patience!';
        }
    },

    renderLoadError() {
        document.getElementById('statsGrid').innerHTML = '';
        document.getElementById('topRiskFoods').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <div class="empty-title">Couldn't reach the server</div>
                <div class="empty-desc">Please check your connection and try again.</div>
                <button class="action-btn" style="margin-top: 16px;" onclick="HomePage.load()"><span>🔄</span>Retry</button>
            </div>
        `;
        document.getElementById('heatmapGrid').classList.remove('skeleton');
        document.getElementById('heatmapMonths').classList.remove('skeleton');
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
        // Known allergens already have their own confirmed home (Known Allergens page) —
        // this widget is for foods the algorithm suspects, not ones you've already confirmed.
        const top = (analysis.results || []).filter(f => !f.confirmed).slice(0, 10);
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
            <div class="risk-food-item ${f.risk_level.toLowerCase()} ${i < 3 ? 'top-rank' : ''}">
                <div class="risk-rank">${i + 1}</div>
                <div class="risk-food-name">${f.food}</div>
                <div class="risk-score">${f.score}%</div>
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
            NetworkGraph.render(document.getElementById('homePredictionGraph'), graphData);

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

};

window.generateReport = () => {
    Utils.showAlert('Generate Report', 'Compile all data into comprehensive analysis?', () => {
        Navigation.showSubPage('report');
    });
};
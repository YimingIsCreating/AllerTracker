// ============================================
// AI预测组件
// ============================================

const PredictionComponent = {
    /**
     * 加载预测页面
     */
    async load(forceRefresh = false) {
        const container = document.getElementById('predictContent');
        
        if (!forceRefresh && State.pageCache.predict.data && State.pageCache.predict.timestamp) {
            this.render(
                State.pageCache.predict.data.graphData, 
                State.pageCache.predict.data.aiPredictions,
                State.pageCache.predict.timestamp,
                false
            );
            return;
        }
        
        if (State.pageCache.predict.isLoading) return;
        
        State.pageCache.predict.isLoading = true;
        
        container.innerHTML = `
            <div class="compact-banner">
                🔮 Predictions are AI-generated and for reference only.
            </div>
            <div class="section-card">
                <div class="prediction-loading">
                    <div class="loading-spinner-large"></div>
                    <div style="font-size: var(--font-sm); color: var(--color-text-secondary);">Loading allergen relationship data...</div>
                </div>
            </div>
        `;
        
        try {
            const graphData = await AllerTrackAPI.getPredictions();

            const fallbackKnownAllergens = {
                confirmed: State.currentAnalysis?.known_allergens || [],
                high_risk: State.currentAnalysis?.results?.filter(f => f.score > 80).map(f => f.food) || []
            };

            let aiPredictions;
            try {
                const crossReactivity = await AllerTrackAPI.getCrossReactivityPredictions();
                aiPredictions = {
                    predictions: crossReactivity.predictions || [],
                    // 后端在"没有过敏原数据"时会把 known_allergens 返回成空数组而不是 {confirmed, high_risk} 对象,这里做兼容
                    known_allergens: (crossReactivity.known_allergens && !Array.isArray(crossReactivity.known_allergens))
                        ? crossReactivity.known_allergens
                        : fallbackKnownAllergens
                };
            } catch (error) {
                console.error('Failed to load cross-reactivity predictions:', error);
                aiPredictions = { predictions: [], known_allergens: fallbackKnownAllergens };
            }

            State.pageCache.predict.data = { graphData, aiPredictions };
            State.pageCache.predict.timestamp = new Date().toISOString();
            
            this.render(graphData, aiPredictions, State.pageCache.predict.timestamp, true);
        } catch (error) {
            console.error('Failed to load predictions:', error);
            container.innerHTML = `
                <div class="compact-banner">
                    🔮 Predictions are AI-generated and for reference only.
                </div>
                <div class="section-card">
                    <div class="empty-state">
                        <div class="empty-icon">⚠️</div>
                        <div class="empty-title">Unable to load prediction data</div>
                        <div class="empty-desc">Please try again later</div>
                    </div>
                </div>
            `;
        } finally {
            State.pageCache.predict.isLoading = false;
        }
    },

    render(graphData, aiPredictions, timestamp, isNewData) {
    const container = document.getElementById('predictContent');
    const timeAgo = Utils.getTimeAgo(new Date(timestamp));
    
    const knownAllergens = aiPredictions.known_allergens || { confirmed: [], high_risk: [] };
    const predictions = aiPredictions.predictions || [];
    
    if (knownAllergens.confirmed.length === 0 && knownAllergens.high_risk.length === 0) {
        container.innerHTML = `
            <div class="compact-banner">
                🔮 Predictions are AI-generated and for reference only.
            </div>
            <div class="section-card">
                <div class="empty-state">
                    <div class="empty-icon">🍽️</div>
                    <div class="empty-title">No allergen data available</div>
                    <div class="empty-desc">Add confirmed allergens or track meals with symptoms to enable AI predictions</div>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="compact-banner">
            🔮 Predictions are AI-generated and for reference only.
        </div>
        <div class="page-header" style="border-bottom: none; padding-bottom: 0;">
            <div class="page-info">
                <div class="page-meta">
                    <span class="page-timestamp">
                        ${isNewData ? '✨ Just generated' : `📅 Generated ${timeAgo}`}
                    </span>
                </div>
            </div>
            <button class="refresh-btn" onclick="PredictionComponent.load(true)">
                <span>🔄</span>
                <span>Refresh Prediction</span>
            </button>
        </div>
        
        <div class="section-card">
            <div class="known-allergens-section">
                <div class="known-allergens-title">📋 Your Known Allergens</div>
                <div class="allergen-chips">
                    ${knownAllergens.confirmed.map(food => `
                        <div class="allergen-chip confirmed">
                            <span>⚠️</span>
                            <span>${food}</span>
                        </div>
                    `).join('')}
                    ${knownAllergens.high_risk.map(food => `
                        <div class="allergen-chip high-risk">
                            <span>🔴</span>
                            <span>${food}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${predictions.length > 0 ? `
                <div class="ai-prediction-section">
                    <div class="section-title" style="margin-bottom: 8px;">
                        <span>🤖 AI Predicted Cross-Reactive Foods</span>
                        <span style="font-size: var(--font-sm); font-weight: 500; color: var(--color-text-secondary);">
                            ${predictions.length} prediction${predictions.length > 1 ? 's' : ''}
                        </span>
                    </div>
                    <div style="font-size: var(--font-sm); color: var(--color-text-secondary); margin-bottom: 16px;">
                        Foods you've never eaten that might trigger allergic reactions
                    </div>
                    
                    <div class="prediction-grid">
                        ${predictions.map(pred => this.renderCard(pred)).join('')}
                    </div>
                </div>
            ` : `
                <div class="empty-state" style="margin-top: 20px;">
                    <div class="empty-icon">✅</div>
                    <div class="empty-title">No cross-reactive foods predicted</div>
                    <div class="empty-desc">Based on your current allergens, AI found no significant cross-reactivity risks</div>
                </div>
            `}
            

    `;


    },

    renderCard(pred) {
        const severity = pred.severity || 'low';
        return `
            <div class="prediction-card ${severity}-severity">
                <div class="prediction-header">
                    <div class="prediction-food-name">
                        <span class="prediction-icon">🍽️</span>
                        ${pred.food}
                    </div>
                    <div class="prediction-confidence">
                        <div class="confidence-score">${pred.confidence}%</div>
                        <div class="confidence-label">Confidence</div>
                    </div>
                </div>
                <div class="prediction-reason">${pred.reason || ''}</div>
                <div class="prediction-meta">
                    ${pred.category ? `<span class="prediction-badge category-badge">${pred.category.replace(/_/g, ' ')}</span>` : ''}
                    <span class="prediction-badge severity-badge ${severity}">${severity} severity</span>
                </div>
            </div>
        `;
    }
};
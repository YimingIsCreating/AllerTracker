// ============================================
// 分析页面模块
// ============================================

const AnalysisPage = {
    async loadFoodConfidence() {
        await RecordsPage.load();
        this.renderFoodsTable();
    },

    async loadReport() {
        await this.loadReportWithCache();
    },

    sortFoods(order) {
        State.foodsSortOrder = order;
        State.displayedFoodsCount = 20;
        document.getElementById('sortDescBtn').classList.toggle('active', order === 'desc');
        document.getElementById('sortAscBtn').classList.toggle('active', order === 'asc');
        this.renderFoodsTable();
    },

    loadMoreFoodItems() {
        State.displayedFoodsCount += 20;
        this.renderFoodsTable();
    },

    async clearFood(foodName) {
        if (!confirm(`Mark "${foodName}" as not the culprit? It will be excluded from all risk analysis until you restore it from Known Allergens.`)) return;

        try {
            await AllerTrackAPI.clearFood(foodName);
            State.clearCache();
            await this.loadFoodConfidence();
        } catch (e) {
            Utils.showAlert('Error', 'Failed to exclude food');
        }
    },

    renderFoodsTable() {
        const tbody = document.getElementById('foodsTableBody');
        
        if (!State.currentAnalysis || !State.currentAnalysis.results || State.currentAnalysis.results.length === 0) {
            tbody.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔬</div>
                    <div class="empty-title">No food confidence data available</div>
                    <div class="empty-desc">Add at least 3 meals with symptoms to analyze food patterns</div>
                </div>
            `;
            document.getElementById('loadMoreFoods').style.display = 'none';
            return;
        }

        const sortedFoods = [...State.currentAnalysis.results].sort((a, b) => {
            return State.foodsSortOrder === 'desc' ? b.score - a.score : a.score - b.score;
        });

        const displayedFoods = sortedFoods.slice(0, State.displayedFoodsCount);
        
        tbody.innerHTML = displayedFoods.map((f, i) => {
            const cl = f.risk_level.toLowerCase();
            const bg = cl === 'high' ? '#D22334,var(--color-danger)' : cl === 'medium' ? '#EFA346,#d4731c' : 'var(--color-success-dark),var(--color-success)';
            const textColor = cl === 'high' ? 'var(--color-danger)' : cl === 'medium' ? 'var(--color-warning)' : 'var(--color-success)';

            return `
                <div class="food-row">
                    <div><span class="record-id-badge">#${i + 1}</span></div>
                    <div style="font-weight: 600; font-size: var(--font-sm); color: var(--color-text-primary);">${f.food}${f.confirmed ? ' <span class="confirmed-tag">✓ Confirmed</span>' : ''}</div>
                    <div>
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <div style="flex: 1; height: 10px; background: var(--color-border-subtle); border-radius: 5px; overflow: hidden;">
                                <div style="height: 100%; width: ${f.score}%; background: linear-gradient(90deg, ${bg}); border-radius: 5px;"></div>
                            </div>
                            <span style="min-width: 60px; text-align: right; font-weight: 700; font-size: var(--font-sm); color: var(--color-text-primary);">${f.score}%</span>
                        </div>
                    </div>
                    <div style="font-weight: 600; font-size: var(--font-sm); color: ${textColor};">${f.risk_level}</div>
                    <div>
                        <button class="action-icon-btn delete" title="Not the culprit — exclude from analysis" onclick="AnalysisPage.clearFood('${f.food}')">✕</button>
                    </div>
                </div>
            `;
        }).join('');
        
        const loadMoreBtn = document.getElementById('loadMoreFoods');
        if (State.displayedFoodsCount < sortedFoods.length) {
            loadMoreBtn.style.display = 'block';
        } else {
            loadMoreBtn.style.display = 'none';
        }
    },

    async loadReportWithCache(forceRefresh = false) {
        if (!forceRefresh && State.pageCache.report.data && State.pageCache.report.timestamp) {
            this.renderReportFromCache(State.pageCache.report.data);
            return;
        }
        
        if (State.pageCache.report.isLoading) return;
        
        State.pageCache.report.isLoading = true;
        this.showReportLoading();
        
        try {
            const [recs, anal] = await Promise.all([
                AllerTrackAPI.getRecords(),
                AllerTrackAPI.getAnalysis()
            ]);
            
            State.pageCache.report.data = { recs, anal };
            State.pageCache.report.timestamp = new Date().toISOString();
            
            if (anal.results?.length) {
                this.renderRecentHighRiskFoods(recs.records, anal);
                this.renderHighConfidenceFoods(anal);
                this.renderTestRecommendations(recs.records, anal);
                this.renderConfirmedAllergens(anal);
            } else {
                document.getElementById('recentHighRiskFoods').innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📊</div>
                        <div class="empty-title">Not enough data</div>
                        <div class="empty-desc">Add at least 3 meals with symptoms to generate report</div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Failed to load report:', error);
            this.showReportError();
        } finally {
            State.pageCache.report.isLoading = false;
        }
    },

    renderReportFromCache(data) {
        const { recs, anal } = data;
        if (anal.results?.length) {
            this.renderRecentHighRiskFoods(recs.records, anal);
            this.renderHighConfidenceFoods(anal);
            this.renderTestRecommendations(recs.records, anal);
            this.renderConfirmedAllergens(anal);
        }
    },

    showReportLoading() {
        document.getElementById('recentHighRiskFoods').innerHTML = `
            <div class="analyzing-loader">
                <div class="loader-spinner"></div>
                <div class="loader-text">Loading report...</div>
            </div>
        `;
    },

    showReportError() {
        document.getElementById('recentHighRiskFoods').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <div class="empty-title">Failed to load report</div>
                <div class="empty-desc">Please try again later</div>
            </div>
        `;
    },

    renderRecentHighRiskFoods(records, analysis) {
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        
        const confirmedAllergens = new Set(analysis.known_allergens || []);
        const highRiskFoods = new Set();
        
        analysis.results.forEach(f => {
            if (f.score > 80 && !confirmedAllergens.has(f.food)) {
                highRiskFoods.add(f.food);
            }
        });
        
        const recentRecords = records
            .filter(r => {
                const recordDate = new Date(r.date);
                const hasHighRiskFood = r.foods.some(food => highRiskFoods.has(food));
                const hasSymptoms = r.symptoms && r.symptoms.length > 0;
                return recordDate >= twoWeeksAgo && hasHighRiskFood && hasSymptoms;
            })
            .sort((a, b) => new Date(b.date + ' ' + b.meal_time) - new Date(a.date + ' ' + a.meal_time));
        
        const div = document.getElementById('recentHighRiskFoods');
        
        if (recentRecords.length === 0) {
            div.innerHTML = `
                <div class="report-empty">
                    <div class="report-empty-icon">✅</div>
                    <div class="report-empty-text">No high-risk foods consumed in the last 2 weeks</div>
                </div>
            `;
            return;
        }
        
        div.innerHTML = `
            <div class="timeline-container">
                ${recentRecords.map(r => {
                    const riskFoods = r.foods.filter(f => highRiskFoods.has(f));
                    const recordDate = new Date(r.date + ' ' + r.meal_time);
                    const timeAgo = Utils.getTimeAgo(recordDate);
                    
                    return `
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <div class="timeline-header">
                                    <span class="timeline-time">${r.date} ${r.meal_time}</span>
                                    <span class="timeline-ago">${timeAgo}</span>
                                </div>
                                <div class="timeline-info">
                                    <span style="font-size:var(--font-sm);color:var(--color-text-primary);font-weight:600;margin-right:8px;">Foods:</span>
                                    ${riskFoods.map(f => `<span class="timeline-food-tag">${f}</span>`).join('')}
                                    <span style="font-size:var(--font-sm);color:var(--color-text-secondary);margin:0 12px;">•</span>
                                    <span style="font-size:var(--font-sm);color:var(--color-text-secondary);margin-right:6px;">Symptoms:</span>
                                    ${r.symptoms.map(s => `<span class="tag symptom-tag">${s}</span>`).join('')}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    renderHighConfidenceFoods(analysis) {
        const highConfidence = analysis.results.filter(f => f.score > 60);
        const div = document.getElementById('highConfidenceFoods');
        
        if (highConfidence.length === 0) {
            div.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">✅</div>
                    <div class="empty-title">No high confidence allergens detected</div>
                </div>
            `;
            return;
        }
        
        div.innerHTML = `
            <div class="records-table">
                <div style="display: grid; grid-template-columns: 80px 1fr 1fr 1fr; gap: 16px; padding: 12px 20px; background: var(--color-page-bg); border-bottom: 1px solid var(--color-border); font-size: var(--font-3xs); font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase;">
                    <div>Rank</div>
                    <div>Food</div>
                    <div>Confidence</div>
                    <div>Common Symptoms</div>
                </div>
                <div class="records-table-body">
                    ${highConfidence.map((f, i) => {
                        const relatedSymptoms = new Set();
                        State.currentRecords.forEach(r => {
                            if (r.foods.includes(f.food) && r.symptoms && r.symptoms.length > 0) {
                                r.symptoms.forEach(s => relatedSymptoms.add(s));
                            }
                        });
                        
                        const cl = f.risk_level.toLowerCase();
                        const bg = cl === 'high' ? '#D22334,var(--color-danger)' : cl === 'medium' ? '#EFA346,#d4731c' : 'var(--color-success-dark),var(--color-success)';
                        
                        return `
                            <div style="display: grid; grid-template-columns: 80px 1fr 1fr 1fr; gap: 16px; padding: 16px 20px; border-bottom: ${i < highConfidence.length - 1 ? '1px solid var(--color-border-subtle)' : 'none'}; font-size: var(--font-sm); transition: all 0.2s;" onmouseover="this.style.background='var(--color-page-bg)'" onmouseout="this.style.background=''">
                                <div><span class="record-id-badge">#${i + 1}</span></div>
                                <div style="font-weight: 600; color: var(--color-text-primary);">${f.food}</div>
                                <div>
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <div style="flex: 1; height: 10px; background: var(--color-border-subtle); border-radius: 5px; overflow: hidden;">
                                            <div style="height: 100%; width: ${f.score}%; background: linear-gradient(90deg, ${bg}); border-radius: 5px;"></div>
                                        </div>
                                        <span style="font-weight: 700; font-size: var(--font-sm); min-width: 50px; text-align: right;">${f.score}%</span>
                                    </div>
                                </div>
                                <div>
                                    ${[...relatedSymptoms].map(s => `<span class="tag symptom-tag">${s}</span>`).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    renderTestRecommendations(records, analysis) {
        const div = document.getElementById('testRecommendations');
        
        const allSymptoms = new Set();
        records.forEach(r => {
            if (r.symptoms) r.symptoms.forEach(s => allSymptoms.add(s));
        });
        
        const highRiskFoods = analysis.results
            .filter(f => f.score > 80)
            .map(f => f.food);
        
        if (allSymptoms.size === 0 || highRiskFoods.length === 0) {
            div.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🥼</div>
                    <div class="empty-title">Not enough data for medical recommendations</div>
                </div>
            `;
            return;
        }
        
        // 直接显示通用建议,不调用 AI API
        div.innerHTML = `
            <div style="background:var(--color-warning-bg);border-left:4px solid var(--color-warning);padding:20px;border-radius:8px;">
                <div style="font-size:var(--font-base);font-weight:700;color:var(--color-warning);margin-bottom:12px;">
                    💡 General Allergy Testing Recommendations
                </div>
                <div style="color:var(--color-text-primary);margin-bottom:16px;font-size:var(--font-sm);">
                    Based on your symptoms: ${[...allSymptoms].join(', ')}
                </div>
                <div style="font-weight:600;margin-bottom:10px;color:var(--color-text-primary);font-size:var(--font-sm);">Consider these allergy tests:</div>
                <ul style="margin:0;padding-left:20px;color:var(--color-text-primary);font-size:var(--font-sm);">
                    <li style="margin-bottom:8px;">IgE Blood Test (for immediate allergic reactions)</li>
                    <li style="margin-bottom:8px;">Skin Prick Test (identifies specific allergens)</li>
                    <li style="margin-bottom:8px;">Food Elimination Diet (under medical supervision)</li>
                    <li style="margin-bottom:8px;">Oral Food Challenge (performed in clinical setting)</li>
                </ul>
                <div style="margin-top:16px;padding:12px;background:var(--color-link-bg);border-radius:6px;font-size:var(--font-3xs);color:var(--color-link);">
                    💡 <strong>Note:</strong> AI-powered personalized recommendations are temporarily unavailable. 
                    Please consult with an allergist for personalized testing advice.
                </div>
            </div>
        `;
    },

    renderConfirmedAllergens(analysis) {
        const div = document.getElementById('confirmedAllergens');
        const confirmedList = analysis.known_allergens || [];
        
        if (confirmedList.length === 0) {
            div.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <div class="empty-title">No confirmed allergens yet</div>
                    <div class="empty-desc">Add known allergens manually to track them separately</div>
                </div>
            `;
            return;
        }
        
        div.innerHTML = `
            <div class="records-table">
                <div style="display: grid; grid-template-columns: 1fr 200px; gap: 16px; padding: 12px 20px; background: var(--color-page-bg); border-bottom: 1px solid var(--color-border); font-size: var(--font-3xs); font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase;">
                    <div>Allergen Name</div>
                    <div>Status</div>
                </div>
                <div class="records-table-body">
                    ${confirmedList.map((allergen, i) => `
                        <div style="display: grid; grid-template-columns: 1fr 200px; gap: 16px; padding: 16px 20px; border-bottom: ${i < confirmedList.length - 1 ? '1px solid var(--color-border-subtle)' : 'none'}; font-size: var(--font-sm); transition: all 0.2s;" onmouseover="this.style.background='var(--color-page-bg)'" onmouseout="this.style.background=''">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 18px;">⚠️</span>
                                <span style="font-weight: 600; font-size: var(--font-sm); color: var(--color-danger);">${allergen}</span>
                            </div>
                            <div>
                                <span class="tag symptom-tag">User confirmed</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div style="margin-top: 16px; padding: 12px; background: var(--color-danger-bg); border-left: 4px solid var(--color-danger); border-radius: 6px; font-size: var(--font-3xs); color: var(--color-danger);">
                <strong>⚠️ Critical:</strong> These allergens are confirmed and must be strictly avoided
            </div>
        `;
    }
};


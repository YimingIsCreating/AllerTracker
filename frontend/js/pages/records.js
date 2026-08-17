const RecordsPage = {
    async load() {
        await this.loadMealRecords();
    },

    async loadMealRecords() {
        const tbody = document.getElementById('recordsTableBody');
        tbody.innerHTML = `
            <div class="analyzing-loader">
                <div class="loader-spinner"></div>
                <div class="loader-text">Loading your data...</div>
            </div>
        `;

        try {
            const [recs, anal] = await Promise.all([
                AllerTrackAPI.getRecords(),
                AllerTrackAPI.getAnalysis()
            ]);

            State.currentRecords = recs.records;
            State.filteredRecords = recs.records;
            State.currentAnalysis = anal;

            this.renderMealRecords();
        } catch (error) {
            console.error('Failed to load meal records:', error);
            tbody.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <div class="empty-title">Couldn't reach the server</div>
                    <div class="empty-desc">Please check your connection and try again.</div>
                    <button class="action-btn" style="margin-top: 16px;" onclick="RecordsPage.loadMealRecords()"><span>🔄</span>Retry</button>
                </div>
            `;
        }
    },

    async loadKnownAllergens() {
        const tbody = document.getElementById('knownAllergensTableBody');
        const clearedTbody = document.getElementById('clearedFoodsTableBody');
        tbody.innerHTML = `
            <div class="analyzing-loader">
                <div class="loader-spinner"></div>
                <div class="loader-text">Loading your data...</div>
            </div>
        `;
        clearedTbody.innerHTML = '';

        try {
            const [anal, cleared] = await Promise.all([
                AllerTrackAPI.getAnalysis(),
                AllerTrackAPI.getClearedFoods()
            ]);
            State.currentAnalysis = anal;
            State.clearedFoods = cleared.cleared_foods || [];
            this.renderKnownAllergens();
            this.renderClearedFoods();
        } catch (error) {
            console.error('Failed to load known allergens:', error);
            tbody.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <div class="empty-title">Couldn't reach the server</div>
                    <div class="empty-desc">Please check your connection and try again.</div>
                    <button class="action-btn" style="margin-top: 16px;" onclick="RecordsPage.loadKnownAllergens()"><span>🔄</span>Retry</button>
                </div>
            `;
        }
    },

    filter() {
        const date = document.getElementById('filterDate').value;
        const food = document.getElementById('filterFood').value.toLowerCase();
        const symp = document.getElementById('filterSymptom').value.toLowerCase();
        
        State.filteredRecords = State.currentRecords.filter(r =>
            (!date || r.date === date) &&
            (!food || r.foods.some(f => f.toLowerCase().includes(food))) &&
            (!symp || r.symptoms?.some(s => s.toLowerCase().includes(symp)))
        );
        
        this.renderMealRecords();
    },

    renderMealRecords() {
        const tbody = document.getElementById('recordsTableBody');
        
        if (!State.filteredRecords.length) {
            tbody.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🍽️</div>
                    <div class="empty-title">No meal records found</div>
                    <div class="empty-desc">Start tracking your meals to identify potential food allergies</div>
                </div>
            `;
            return;
        }
        
        tbody.innerHTML = State.filteredRecords.map(r => `
            <div class="record-row">
                <div><span class="record-id-badge">#${r.id}</span></div>
                <div style="color:var(--color-text-secondary);">${r.date} ${r.meal_time}</div>
                <div>${r.foods.map(f => '<span class="tag food-tag">' + f + '</span>').join('')}</div>
                <div>${r.symptoms?.length ? r.symptoms.map(s => '<span class="tag symptom-tag">' + s + '</span>').join('') : '<span class="no-symptoms-badge">✅ None</span>'}</div>
                <div style="display:flex;gap:4px;">
                    <button class="action-icon-btn" onclick="alert('Edit feature coming soon')">✏️</button>
                    <button class="action-icon-btn delete" onclick="alert('Delete feature coming soon')">🗑️</button>
                </div>
            </div>
        `).join('');
        
        this.updateDateFilter();
    },

    renderKnownAllergens() {
        const tbody = document.getElementById('knownAllergensTableBody');
        const allergens = State.currentAnalysis?.known_allergens || [];
        
        if (!allergens.length) {
            tbody.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <div class="empty-title">No known allergens yet</div>
                    <div class="empty-desc">Click "Add Known Allergen" button to add medically confirmed allergens</div>
                </div>
            `;
            return;
        }
        
        tbody.innerHTML = allergens.map(allergen => `
            <div class="allergen-row">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">⚠️</span>
                    <span style="font-weight: 600; font-size: var(--font-sm); color: var(--color-danger);">${allergen}</span>
                </div>
                <div style="color:var(--color-text-secondary);">User confirmed</div>
                <div style="display:flex;gap:4px;">
                    <button class="action-icon-btn delete" onclick="RecordsPage.deleteAllergen('${allergen}')">🗑️</button>
                </div>
            </div>
        `).join('');
    },

    renderClearedFoods() {
        const tbody = document.getElementById('clearedFoodsTableBody');
        const foods = State.clearedFoods || [];

        if (!foods.length) {
            tbody.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">✅</div>
                    <div class="empty-title">No excluded foods</div>
                    <div class="empty-desc">Use the ✕ button on the Food Confidence page to rule out a food that isn't really the culprit</div>
                </div>
            `;
            return;
        }

        tbody.innerHTML = foods.map(food => `
            <div class="allergen-row">
                <div style="font-weight: 600; font-size: var(--font-sm); color: var(--color-text-secondary);">${food}</div>
                <div style="color:var(--color-text-secondary);">Excluded from analysis</div>
                <div style="display:flex;gap:4px;">
                    <button class="action-icon-btn" title="Restore to analysis" onclick="RecordsPage.restoreFood('${food}')">↩️</button>
                </div>
            </div>
        `).join('');
    },

    async restoreFood(foodName) {
        try {
            await AllerTrackAPI.restoreClearedFood(foodName);
            State.clearCache();
            this.loadKnownAllergens();
        } catch (error) {
            Utils.showAlert('Error', 'Failed to restore food');
        }
    },

    async deleteAllergen(allergenName) {
        if (!confirm(`Are you sure you want to delete allergen "${allergenName}"?`)) return;
        
        try {
            await AllerTrackAPI.deleteAllergen(allergenName);
            State.clearCache();
            Utils.showAlert('Success', `Deleted allergen: ${allergenName}`, () => this.loadKnownAllergens());
        } catch (error) {
            Utils.showAlert('Error', 'Failed to delete allergen');
        }
    },

    updateDateFilter() {
        const dateInput = document.getElementById('filterDate');
        if (!dateInput) return;
        
        const datesWithRecords = [...new Set(State.currentRecords.map(r => r.date))];
        const newDateInput = dateInput.cloneNode(true);
        dateInput.parentNode.replaceChild(newDateInput, dateInput);
        
        newDateInput.addEventListener('input', function(e) {
            const selectedDate = e.target.value;
            if (selectedDate && !datesWithRecords.includes(selectedDate)) {
                e.target.value = '';
                Utils.showAlert('No Records', 'No meal records found for this date');
                return;
            }
            RecordsPage.filter();
        });
        
        if (datesWithRecords.length > 0) {
            const sortedDates = datesWithRecords.sort();
            newDateInput.setAttribute('min', sortedDates[0]);
            newDateInput.setAttribute('max', sortedDates[sortedDates.length - 1]);
        }
    }
};
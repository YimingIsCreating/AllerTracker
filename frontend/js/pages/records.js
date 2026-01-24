const RecordsPage = {
    async load() {
        this.loadMealRecords();
    },

    async loadMealRecords() {
        const [recs, anal] = await Promise.all([
            AllerTrackAPI.getRecords(),
            AllerTrackAPI.getAnalysis()
        ]);
        
        State.currentRecords = recs.records;
        State.filteredRecords = recs.records;
        State.currentAnalysis = anal;
        
        this.renderMealRecords();
    },

    async loadKnownAllergens() {
        const anal = await AllerTrackAPI.getAnalysis();
        State.currentAnalysis = anal;
        this.renderKnownAllergens();
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
                <div style="color:#57606a;">${r.date} ${r.meal_time}</div>
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
            <div class="record-row">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">⚠️</span>
                    <span style="font-weight: 600; font-size: 15px; color: #cf222e;">${allergen}</span>
                </div>
                <div style="color:#57606a;">User confirmed</div>
                <div style="display:flex;gap:4px;">
                    <button class="action-icon-btn delete" onclick="RecordsPage.deleteAllergen('${allergen}')">🗑️</button>
                </div>
            </div>
        `).join('');
    },

    async deleteAllergen(allergenName) {
        if (!confirm(`Are you sure you want to delete allergen "${allergenName}"?`)) return;
        
        try {
            await AllerTrackAPI.deleteAllergen(allergenName);
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

window.generateReport = () => {
    Utils.showAlert('Generate Report', 'Compile all data into comprehensive analysis?', () => {
        Navigation.showSubPage('report', false);
        document.querySelectorAll('.nav-sub-item').forEach((item, index) => {
            item.classList.toggle('active', index === 1);
        });
    });
};
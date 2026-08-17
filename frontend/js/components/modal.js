// ============================================
// 弹窗组件模块
// ============================================

const Modal = {
    openAddMeal() { 
        document.getElementById('addMealModal').classList.add('active'); 
    },
    
    closeAddMeal() {
        document.getElementById('addMealModal').classList.remove('active');
        document.getElementById('smartMealInput').value = '';
        document.getElementById('manualMealInput').value = '';
        document.getElementById('ai-analysis-result').style.display = 'none';
        State.currentIngredients = [];
        document.getElementById('smart-input-mode').style.display = 'block';
        document.getElementById('manual-input-mode').style.display = 'none';
    },
    
    openAddSymptoms() { 
        document.getElementById('addSymptomsModal').classList.add('active'); 
    },
    
    closeAddSymptoms() {
        document.getElementById('addSymptomsModal').classList.remove('active');
        document.getElementById('symptomsRecordIdInput').value = '';
        document.getElementById('symptomsInput').value = '';
    },

    switchInputMethod(method) {
        document.querySelectorAll('.method-tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
        document.getElementById('smart-input-mode').style.display = method === 'smart' ? 'block' : 'none';
        document.getElementById('manual-input-mode').style.display = method === 'manual' ? 'block' : 'none';
    },

    async analyzeMeal() {
        const input = document.getElementById('smartMealInput').value.trim();
        if (!input) { 
            Utils.showAlert('Missing Input', 'Please describe what you ate'); 
            return; 
        }
        
        const div = document.getElementById('ai-analysis-result');
        div.style.display = 'block';
        div.innerHTML = '<div class="analyzing-loader"><div class="loader-spinner"></div><div class="loader-text">🤖 Analyzing...</div></div>';
        
        try {
            const data = await AllerTrackAPI.analyzeMeal(input); 
            this.displayAIResult(data);
        } catch(e) {
            div.innerHTML = '<div style="text-align:center;padding:20px;color:var(--color-danger);">❌ ' + e.message + '</div>';
        }
    },

    displayAIResult(res) {
        State.currentIngredients = res.ingredients || [];
        const container = document.getElementById('ai-analysis-result');
        container.innerHTML = `
            <div class="result-header">
                <span class="result-title">🔍 AI Analysis Result</span>
                <button class="edit-result-btn" onclick="Modal.editAIResult()">✏️ Add More</button>
            </div>
            ${res.restaurant ? '<div class="info-row"><span class="info-label">Restaurant:</span><span>' + res.restaurant + '</span></div>' : ''}
            ${res.dishes?.length ? '<div class="info-row"><span class="info-label">Dishes:</span><span>' + res.dishes.join(', ') + '</span></div>' : ''}
            <div class="ingredients-header">Ingredients (${State.currentIngredients.length}):</div>
            <div id="ingredientTags" class="ingredient-tags">
                ${State.currentIngredients.map((ing, i) => 
                    '<span class="ingredient-tag">' + ing + '<span class="remove-tag" onclick="Modal.removeIngredient(' + i + ')">×</span></span>'
                ).join('')}
            </div>
            <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--color-border);color:var(--color-text-secondary);font-size:var(--font-3xs);">
                💡 AI confidence: ${res.confidence || 85}%
            </div>
        `;
    },

    removeIngredient(index) {
        State.currentIngredients.splice(index, 1);
        document.getElementById('ingredientTags').innerHTML = State.currentIngredients.map((ing, idx) => 
            '<span class="ingredient-tag">' + ing + '<span class="remove-tag" onclick="Modal.removeIngredient(' + idx + ')">×</span></span>'
        ).join('');
    },

    editAIResult() {
        const ing = prompt('Add ingredient:');
        if (ing?.trim()) {
            State.currentIngredients.push(ing.trim());
            document.getElementById('ingredientTags').innerHTML = State.currentIngredients.map((ing, i) => 
                '<span class="ingredient-tag">' + ing + '<span class="remove-tag" onclick="Modal.removeIngredient(' + i + ')">×</span></span>'
            ).join('');
        }
    },

    async submitMeal() {
        let foods = [];
        const isSmart = document.getElementById('smart-input-mode').style.display !== 'none';
        
        if (isSmart) {
            if (!State.currentIngredients.length) { 
                Utils.showAlert('No Ingredients', 'Analyze first or switch to manual'); 
                return; 
            }
            foods = State.currentIngredients;
        } else {
            const v = document.getElementById('manualMealInput').value;
            if (!v.trim()) { 
                Utils.showAlert('Missing Info', 'Enter at least one food'); 
                return; 
            }
            foods = v.split(',').map(f => f.trim()).filter(f => f);
        }
        
        const btn = document.getElementById('submitMealBtn');
        btn.disabled = true;
        try {
            const data = await AllerTrackAPI.addMeal(foods);
            this.closeAddMeal();
            State.clearCache();
            Utils.showAlert('Success', 'Meal added! ID: #' + data.record.id, () => HomePage.load());
        } catch(e) {
            Utils.showAlert('Error', 'Failed to add meal');
        } finally {
            btn.disabled = false;
        }
    },

    async submitSymptoms() {
        const id = parseInt(document.getElementById('symptomsRecordIdInput').value);
        const symp = document.getElementById('symptomsInput').value;

        if (!id || !symp.trim()) {
            Utils.showAlert('Missing Info', 'Enter both fields');
            return;
        }

        const symptoms = symp.split(',').map(s => s.trim()).filter(s => s);

        const btn = document.getElementById('submitSymptomsBtn');
        btn.disabled = true;
        try {
            await AllerTrackAPI.addSymptoms(id, symptoms);
            this.closeAddSymptoms();
            State.clearCache();
            Utils.showAlert('Success', 'Symptoms added to #' + id, () => HomePage.load());
        } catch(e) {
            Utils.showAlert('Error', e.message);
        } finally {
            btn.disabled = false;
        }
    },
    async openAddKnownAllergen() {
        const allergenName = prompt('Enter confirmed allergen name:');
        if (!allergenName?.trim()) return;

        try {
            await AllerTrackAPI.addKnownAllergen(allergenName.trim());
            State.clearCache();
            Utils.showAlert('Success', `Added allergen: ${allergenName}`, () => RecordsPage.loadKnownAllergens());
        } catch (error) {
            Utils.showAlert('Error', 'Failed to add allergen');
        }
    }
};



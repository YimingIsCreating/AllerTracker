// ============================================
// API 调用类 - 管理所有网络请求
// ============================================

class AllerTrackAPI {
    
    // 方法 1：获取所有记录
    static async getRecords() {
        const response = await fetch(`${CONFIG.API_URL}/api/records`);
        return response.json();
    }

    // 方法 2：获取分析结果
    static async getAnalysis() {
        const response = await fetch(`${CONFIG.API_URL}/api/analysis`);
        return response.json();
    }

    // 方法 3：添加新的 Meal
    static async addMeal(foods) {
        const response = await fetch(`${CONFIG.API_URL}/api/meal`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({foods})
        });
        if (!response.ok) {
            throw new Error(`Failed to add meal (${response.status})`);
        }
        return response.json();
    }

    // 方法 4：添加症状
    static async addSymptoms(recordId, symptoms) {
        const response = await fetch(`${CONFIG.API_URL}/api/symptoms`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({record_id: recordId, symptoms})
        });
        if (!response.ok) {
            const err = await response.json().catch(() => null);
            throw new Error(err?.detail || `Failed to add symptoms (${response.status})`);
        }
        return response.json();
    }

    // 方法 5：AI 分析食物
    static async analyzeMeal(text) {
        const response = await fetch(`${CONFIG.API_URL}/api/analyze-meal`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({text})
        });
        if (!response.ok) {
            throw new Error('Analysis failed');
        }
        return response.json();
    }

    static async getMedicalAdvice(symptoms, highRiskFoods) {
    const response = await fetch(`${CONFIG.API_URL}/api/generate-medical-advice`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            symptoms: symptoms,
            high_risk_foods: highRiskFoods
        })
    });
    return response.json();
    }

    //1，21
    // 在 AllerTrackAPI 类中添加
    static async getPredictions() {
        const response = await fetch(`${CONFIG.API_URL}/api/predict`);
        if (!response.ok) {
            throw new Error(`Failed to load predictions (${response.status})`);
        }
        return response.json();
    }

    static async getCrossReactivityPredictions() {
        const response = await fetch(`${CONFIG.API_URL}/api/predict-cross-reactivity`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
        if (!response.ok) {
            throw new Error('AI prediction failed');
        }
        return response.json();
    }
  
    // 在 AllerTrackAPI 类中添加
    static async getChatHistory() {
        const response = await fetch(`${CONFIG.API_URL}/api/chat-history`);
        return response.json();
    }

    static async sendChatMessage(message) {
        const response = await fetch(`${CONFIG.API_URL}/api/chat`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({message})
        });
        if (!response.ok) {
            throw new Error('Chat failed');
        }
        return response.json();
    }

    static async clearChatHistory() {
        const response = await fetch(`${CONFIG.API_URL}/api/chat-history`, {
            method: 'DELETE'
        });
        return response.json();
    }
    static async deleteAllergen(allergenName) {
    const response = await fetch(`${CONFIG.API_URL}/api/allergens/${encodeURIComponent(allergenName)}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        throw new Error('Failed to delete allergen');
    }
    return response.json();
    }

    static async addKnownAllergen(allergenName) {
        const response = await fetch(`${CONFIG.API_URL}/api/allergens`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name: allergenName})
        });
        return response.json();
    }

    static async getClearedFoods() {
        const response = await fetch(`${CONFIG.API_URL}/api/cleared-foods`);
        if (!response.ok) {
            throw new Error(`Failed to load cleared foods (${response.status})`);
        }
        return response.json();
    }

    static async clearFood(foodName) {
        const response = await fetch(`${CONFIG.API_URL}/api/cleared-foods`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name: foodName})
        });
        if (!response.ok) {
            throw new Error(`Failed to clear food (${response.status})`);
        }
        return response.json();
    }

    static async restoreClearedFood(foodName) {
        const response = await fetch(`${CONFIG.API_URL}/api/cleared-foods/${encodeURIComponent(foodName)}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Failed to restore food');
        }
        return response.json();
    }
}


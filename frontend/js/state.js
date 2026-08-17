// ============================================
// 状态管理模块
// ============================================

const State = {
    // 数据状态
    currentRecords: [],
    filteredRecords: [],
    currentAnalysis: null,
    currentIngredients: [],
    clearedFoods: [],
    
    // UI状态
    foodsSortOrder: 'desc',
    displayedFoodsCount: 20,
    isAiTyping: false,
    
    // 页面缓存
    pageCache: {
        predict: {
            data: null,
            timestamp: null,
            isLoading: false
        },
        report: {
            data: null,
            timestamp: null,
            isLoading: false
        },
        foodConfidence: {
            data: null,
            timestamp: null,
            isLoading: false
        }
    },

    /**
     * 重置状态
     */
    reset() {
        this.currentRecords = [];
        this.filteredRecords = [];
        this.currentAnalysis = null;
        this.currentIngredients = [];
        this.displayedFoodsCount = 20;
    },

    /**
     * 清空缓存
     */
    clearCache(pageName = null) {
        if (pageName) {
            this.pageCache[pageName] = {
                data: null,
                timestamp: null,
                isLoading: false
            };
        } else {
            Object.keys(this.pageCache).forEach(key => {
                this.pageCache[key] = {
                    data: null,
                    timestamp: null,
                    isLoading: false
                };
            });
        }
    }
};

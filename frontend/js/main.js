// ============================================
// 主入口文件 - 初始化和全局事件
// ============================================

window.onload = () => {
    HomePage.load();
    
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.onclick = e => { 
            if (e.target === overlay) {
                overlay.classList.remove('active'); 
            }
        };
    });
};

// 暴露全局函数给HTML调用
window.showPage = (page) => Navigation.showPage(page);
window.showSubPage = (subPage, fromParent) => Navigation.showSubPage(subPage, fromParent);
window.showRecordsSubPage = (subPage) => Navigation.showRecordsSubPage(subPage);  // 添加这行!
window.goToFoodConfidence = () => Navigation.goToFoodConfidence();

window.openAddMealModal = () => Modal.openAddMeal();
window.closeAddMealModal = () => Modal.closeAddMeal();
window.openAddSymptomsModal = () => Modal.openAddSymptoms();
window.closeAddSymptomsModal = () => Modal.closeAddSymptoms();

window.switchInputMethod = (method) => Modal.switchInputMethod(method);
window.analyzeMeal = () => Modal.analyzeMeal();
window.submitMeal = () => Modal.submitMeal();
window.submitSymptoms = () => Modal.submitSymptoms();

window.filterRecords = () => RecordsPage.filter();
window.sortFoods = (order) => AnalysisPage.sortFoods(order);
window.loadMoreFoodItems = () => AnalysisPage.loadMoreFoodItems();

window.closeAlert = () => Utils.closeAlert();
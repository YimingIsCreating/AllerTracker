// ============================================
// 主入口文件 - 初始化和全局事件
// ============================================

window.onload = async () => {
    const overlay = document.getElementById('globalLoadingOverlay');
    const overlaySubtext = document.getElementById('globalLoadingSubtext');

    const slowHintTimer = setTimeout(() => {
        overlaySubtext.textContent = 'Our free-tier backend goes to sleep when idle, so the first load after a break can take up to a minute. Thanks for your patience!';
        overlaySubtext.style.display = 'block';
    }, 4000);

    await HomePage.load();

    clearTimeout(slowHintTimer);
    overlay.classList.add('hidden');

    document.querySelectorAll('.modal-overlay').forEach(modalOverlay => {
        modalOverlay.onclick = e => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('active');
            }
        };
    });
};

// 暴露全局函数给HTML调用
window.showPage = (page) => Navigation.showPage(page);
window.showSubPage = (subPage) => Navigation.showSubPage(subPage);
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
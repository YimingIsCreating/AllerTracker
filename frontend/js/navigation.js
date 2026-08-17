// ============================================
// 导航模块
// ============================================

const Navigation = {
    /**
     * 显示主页面
     */
    showPage(page) {
    // 移除所有active状态
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.nav-sub-item').forEach(i => i.classList.remove('active'));

    // 如果是Analysis页面,显示第一个子页面
    if (page === 'analysis') {
        this.showSubPage('foodConfidence');
        return;
    }
    // 如果是Records页面,显示第一个子页面 - 新增这段!
    if (page === 'records') {
        this.showRecordsSubPage('mealRecords');
        return;
    }

    // 设置当前页面active
    document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');

    // 隐藏所有页面
    ['homePage', 'recordsPage', 'analysisPage'].forEach(p => 
        document.getElementById(p).style.display = 'none'
    );
    
    // 显示目标页面
    document.getElementById(page + 'Page').style.display = 'block';
    
    // 加载页面数据
    if (page === 'home') {
        HomePage.load();
    }
    // } else if (page === 'records') {
    //     RecordsPage.load();
    // }
},

    /**
     * 显示子页面
     */
    showSubPage(subPage) {
        // 移除所有active状态
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.nav-sub-item').forEach(i => i.classList.remove('active'));

        // 设置Analysis父项为active
        document.getElementById('analysisParent').classList.add('active');

        // 按目标子页面匹配对应的侧边栏项,而不是依赖触发点击的元素
        // (这样从首页的"Full Analysis"链接或"Generate Report"按钮跳转过来时也能正确高亮)
        document.querySelectorAll(`.nav-sub-item[data-subpage="${subPage}"]`).forEach(i => i.classList.add('active'));

        // 隐藏所有主页面
        ['homePage', 'recordsPage', 'analysisPage'].forEach(p => 
            document.getElementById(p).style.display = 'none'
        );
        
        // 显示Analysis页面
        document.getElementById('analysisPage').style.display = 'block';
        
        // 隐藏所有子内容
        ['foodConfidenceContent', 'reportContent', 'aiAssistantContent', 'predictContent'].forEach(c => {
            const elem = document.getElementById(c);
            if (elem) elem.style.display = 'none';
        });
        
        // 显示目标子页面并加载数据
        if (subPage === 'foodConfidence') {
            document.getElementById('foodConfidenceContent').style.display = 'block';
            AnalysisPage.loadFoodConfidence();
        } else if (subPage === 'report') {
            document.getElementById('reportContent').style.display = 'block';
            AnalysisPage.loadReport();
        } else if (subPage === 'aiAssistant') {
            document.getElementById('aiAssistantContent').style.display = 'block';
            ChatComponent.load();
        } else if (subPage === 'predict') {
            document.getElementById('predictContent').style.display = 'block';
            PredictionComponent.load();
        }
    },

    /**
     * 跳转到Food Confidence页面
     */
    goToFoodConfidence() {
        State.displayedFoodsCount = 20;
        this.showSubPage('foodConfidence');
    },
    // 新增 Records 子页面导航方法
    showRecordsSubPage(subPage) {
        // 移除所有 active 状态
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.nav-sub-item').forEach(i => i.classList.remove('active'));

        // 设置 Records 父项为 active
        document.getElementById('recordsParent').classList.add('active');

        // 按目标子页面匹配对应的侧边栏项,而不是依赖触发点击的元素
        document.querySelectorAll(`.nav-sub-item[data-subpage="${subPage}"]`).forEach(i => i.classList.add('active'));

        // 隐藏所有主页面
        ['homePage', 'recordsPage', 'analysisPage'].forEach(p => 
            document.getElementById(p).style.display = 'none'
        );
        
        // 显示 Records 页面
        document.getElementById('recordsPage').style.display = 'block';
        
        // 隐藏所有子内容
        ['mealRecordsContent', 'knownAllergensContent'].forEach(c => {
            const elem = document.getElementById(c);
            if (elem) elem.style.display = 'none';
        });
        
        // 显示目标子页面并加载数据
        if (subPage === 'mealRecords') {
            document.getElementById('mealRecordsContent').style.display = 'block';
            RecordsPage.loadMealRecords();
        } else if (subPage === 'knownAllergens') {
            document.getElementById('knownAllergensContent').style.display = 'block';
            RecordsPage.loadKnownAllergens();
        }
    }

};
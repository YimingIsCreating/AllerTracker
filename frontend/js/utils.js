// ============================================
// 工具函数模块
// ============================================

const Utils = {
    /**
     * 计算时间差
     */
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        
        if (diffDays === 0) {
            if (diffHours === 0) return 'Just now';
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        }
    },

    /**
     * HTML转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/\n/g, '<br>');
    },

    /**
     * 显示Alert弹窗
     */
    showAlert(title, message, callback) {
        document.getElementById('alertTitle').textContent = title;
        document.getElementById('alertBody').innerHTML = `<p>${message}</p>`;
        document.getElementById('alertModal').classList.add('active');
        document.getElementById('alertConfirmBtn').onclick = () => { 
            Utils.closeAlert(); 
            if (callback) callback(); 
        };
    },

    /**
     * 关闭Alert弹窗
     */
    closeAlert() { 
        document.getElementById('alertModal').classList.remove('active'); 
    }
};
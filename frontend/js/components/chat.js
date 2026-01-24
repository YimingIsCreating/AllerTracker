// ============================================
// AI聊天助手组件
// ============================================

const ChatComponent = {
    /**
     * 加载聊天界面
     */
    async load() {
        const container = document.getElementById('aiAssistantContent');
        
        // 直接渲染对话框,不要外框
        container.innerHTML = `
            <div class="chat-container">
                <div class="chat-messages" id="chatMessages"></div>
                
                <div class="chat-input-container">
                    <div class="chat-input-wrapper">
                        <textarea 
                            id="chatInput" 
                            class="chat-input" 
                            placeholder="Ask me anything about your allergies..."
                            rows="1"
                            onkeydown="ChatComponent.handleKeyPress(event)"
                        ></textarea>
                        <button class="chat-send-btn" onclick="ChatComponent.sendMessage()">
                            Send
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // 加载历史消息
        try {
            const history = await AllerTrackAPI.getChatHistory();
            if (history.messages && history.messages.length > 0) {
                this.renderMessages(history.messages);
            } else {
                this.showWelcome();
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
            this.showWelcome();
        }
        
        // 设置输入框自动调整高度
        const input = document.getElementById('chatInput');
        input.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
    },

    /**
     * 显示欢迎界面
     */
    showWelcome() {
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = `
            <div class="chat-welcome">
                <div class="chat-welcome-icon">👋</div>
                <div class="chat-welcome-title">Hi! I'm your Allergy Assistant</div>
                <div class="chat-welcome-desc">
                    I can help you understand your allergy data, answer questions about your symptoms,
                    and provide personalized recommendations. Try asking me something!
                </div>
                <div class="chat-suggestions">
                    <div class="chat-suggestion" onclick="ChatComponent.askSuggestion('What am I allergic to?')">
                        💭 What am I allergic to?
                    </div>
                    <div class="chat-suggestion" onclick="ChatComponent.askSuggestion('What foods should I avoid?')">
                        🚫 What foods should I avoid?
                    </div>
                    <div class="chat-suggestion" onclick="ChatComponent.askSuggestion('Summarize my allergy history')">
                        📊 Summarize my allergy history
                    </div>
                    <div class="chat-suggestion" onclick="ChatComponent.askSuggestion('What are my recent symptoms?')">
                        🤧 What are my recent symptoms?
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 渲染消息列表
     */
    renderMessages(messages) {
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = messages.map(msg => this.createBubble(msg)).join('');
        this.scrollToBottom();
    },

    /**
     * 创建消息气泡
     */
    createBubble(message) {
        const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        
        return `
            <div class="chat-message ${message.role}">
                <div class="chat-message-content">
                    <div class="chat-bubble">${Utils.escapeHtml(message.content)}</div>
                    <div class="chat-timestamp">${time}</div>
                </div>
            </div>
        `;
    },

    /**
     * 使用建议问题
     */
    askSuggestion(question) {
        document.getElementById('chatInput').value = question;
        this.sendMessage();
    },

    /**
     * 处理键盘按键
     */
    handleKeyPress(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            ChatComponent.sendMessage();
        }
    },

    /**
     * 发送消息
     */
    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message || State.isAiTyping) return;
        
        input.value = '';
        input.style.height = 'auto';
        
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer.querySelector('.chat-welcome')) {
            messagesContainer.innerHTML = '';
        }
        
        const userMsg = {
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        };
        this.appendMessage(userMsg);
        
        State.isAiTyping = true;
        this.showTypingIndicator();
        
        try {
            const response = await AllerTrackAPI.sendChatMessage(message);
            this.removeTypingIndicator();
            this.appendMessage(response.message);
        } catch (error) {
            console.error('Chat error:', error);
            this.removeTypingIndicator();
            
            const errorMsg = {
                role: 'assistant',
                content: '❌ Sorry, I encountered an error. Please try again.',
                timestamp: new Date().toISOString()
            };
            this.appendMessage(errorMsg);
        } finally {
            State.isAiTyping = false;
        }
    },

    /**
     * 添加消息
     */
    appendMessage(message) {
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.insertAdjacentHTML('beforeend', this.createBubble(message));
        this.scrollToBottom();
    },

    /**
     * 显示正在输入指示器
     */
    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatMessages');
        const typingHtml = `
            <div class="chat-message assistant" id="typingIndicator">
                <div class="chat-message-content">
                    <div class="chat-bubble">
                        <div class="chat-typing">
                            <div class="chat-typing-dot"></div>
                            <div class="chat-typing-dot"></div>
                            <div class="chat-typing-dot"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        messagesContainer.insertAdjacentHTML('beforeend', typingHtml);
        this.scrollToBottom();
    },

    /**
     * 移除正在输入指示器
     */
    removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();
    },

    /**
     * 滚动到底部
     */
    scrollToBottom() {
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
};
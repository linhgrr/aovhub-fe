import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatbotService, ChampionSuggestion } from '../services/chatbotService';
import './Chatbot.css';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    suggestions?: ChampionSuggestion[];
    sources?: string[];
}

export const Chatbot: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: inputValue,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        setError(null);

        try {
            const response = await chatbotService.sendMessage(inputValue, conversationId || undefined);

            setConversationId(response.conversation_id);

            const assistantMessage: Message = {
                role: 'assistant',
                content: response.message,
                timestamp: new Date(),
                suggestions: response.suggestions,
                sources: response.sources,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra';
            setError(errorMessage);

            // Add error as system message
            const errorMsg: Message = {
                role: 'assistant',
                content: `❌ ${errorMessage}. Vui lòng thử lại.`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleDeleteConversation = async () => {
        if (!conversationId) {
            // Just clear local messages
            setMessages([]);
            return;
        }

        try {
            await chatbotService.deleteConversation(conversationId);
            setMessages([]);
            setConversationId(null);
            setError(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Không thể xóa cuộc trò chuyện';
            setError(errorMessage);
        }
    };

    return (
        <div className="chatbot-container">
            {/* Messages Area */}
            <div className="chatbot-messages">
                {messages.length === 0 ? (
                    <div className="chatbot-welcome">
                        <div className="chatbot-welcome-icon">
                            <img src="https://i.ibb.co/20KhSst0/image.png" alt="Chatbot" />
                        </div>
                        <h2>Xin chào! 👋</h2>
                        <p>Tôi là AI Trợ Lý Liên Quân: Chuối nho nhỏ. Tôi có thể giúp bạn:</p>
                        <div className="chatbot-suggestions-grid">
                            <div className="chatbot-suggestion-card" onClick={() => setInputValue('Gợi ý tướng đi rừng cho rank Kim Cương')}>
                                <span>Gợi ý tướng phù hợp</span>
                            </div>
                            <div className="chatbot-suggestion-card" onClick={() => setInputValue('Cách chơi Nakroth hiệu quả')}>
                                <span>Hướng dẫn cách chơi</span>
                            </div>
                            <div className="chatbot-suggestion-card" onClick={() => setInputValue('Meta tướng mạnh hiện tại')}>
                                <span>Phân tích meta</span>
                            </div>
                            <div className="chatbot-suggestion-card" onClick={() => setInputValue('Lên đồ Florentino như thế nào?')}>
                                <span>Build trang bị</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="chatbot-messages-list">
                        {messages.map((message, index) => (
                            <div key={index} className={`chatbot-message chatbot-message-${message.role}`}>
                                <div className="chatbot-message-content">
                                    <div className="chatbot-message-bubble">
                                        <div className="chatbot-message-text">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>
                                        {message.suggestions && message.suggestions.length > 0 && (
                                            <div className="chatbot-champion-suggestions">
                                                {message.suggestions.map((suggestion, idx) => (
                                                    <div key={idx} className="chatbot-champion-card">
                                                        <div className="chatbot-champion-header">
                                                            <h3 className="chatbot-champion-name">{suggestion.ten_tuong}</h3>
                                                        </div>
                                                        <p className="chatbot-champion-reason">{suggestion.ly_do}</p>
                                                        {suggestion.cach_choi_tom_tat && (
                                                            <div className="chatbot-champion-tips">
                                                                <span className="chatbot-champion-tips-label">💡 Mẹo:</span>
                                                                <p>{suggestion.cach_choi_tom_tat}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <span className="chatbot-message-time">
                                        {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="chatbot-message chatbot-message-assistant">
                                <div className="chatbot-message-content">
                                    <div className="chatbot-message-bubble">
                                        <div className="chatbot-typing-indicator">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="chatbot-input-area">
                {error && (
                    <div className="chatbot-error">
                        <span>⚠️ {error}</span>
                        <button onClick={() => setError(null)}>✕</button>
                    </div>
                )}
                <div className="chatbot-input-wrapper">
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Hỏi về tướng, cách chơi, build đồ..."
                        className="chatbot-input"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        className="chatbot-send-btn"
                        title="Gửi tin nhắn"
                    >
                        {isLoading ? (
                            <div className="chatbot-spinner"></div>
                        ) : (
                            <img src="/assets/images/send.svg" alt="Send" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

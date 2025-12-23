import { API_BASE_URL } from '../constants';

export interface ChampionSuggestion {
    ten_tuong: string;
    ly_do: string;
    cach_choi_tom_tat?: string;
}

export interface ChatRequest {
    message: string;
    conversation_id?: string;
}

export interface ChatResponse {
    message: string;
    suggestions: ChampionSuggestion[];
    sources: string[];
    conversation_id: string;
}

export interface ConversationMessage {
    role: string;
    content: string;
    timestamp: string;
}

export interface Conversation {
    id: string;
    user_id: string;
    messages: ConversationMessage[];
    created_at: string;
    updated_at: string;
}

const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('auth_token'); // Changed from 'access_token' to match authContext
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export const chatbotService = {
    async sendMessage(message: string, conversationId?: string): Promise<ChatResponse> {
        const response = await fetch(`${API_BASE_URL}/chatbot/chat`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                message,
                conversation_id: conversationId,
            } as ChatRequest),
        });

        if (!response.ok) {
            // Handle 403 - token invalid or expired
            if (response.status === 403 || response.status === 401) {
                localStorage.clear(); // Clear all auth data
                window.location.hash = 'login'; // Redirect to login
                throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            }

            const error = await response.json().catch(() => ({ detail: 'Failed to send message' }));
            throw new Error(error.detail || 'Failed to send message');
        }

        return response.json();
    },

    async getConversation(conversationId: string): Promise<Conversation> {
        const response = await fetch(`${API_BASE_URL}/chatbot/conversation/${conversationId}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to get conversation' }));
            throw new Error(error.detail || 'Failed to get conversation');
        }

        return response.json();
    },

    async deleteConversation(conversationId: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/chatbot/conversation/${conversationId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to delete conversation' }));
            throw new Error(error.detail || 'Failed to delete conversation');
        }
    },
};

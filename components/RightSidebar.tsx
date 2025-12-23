import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Users, User as UserIcon, Plus, Search, X, ChevronLeft, Send, Smile, Paperclip, Check, CheckCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/authContext';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { CreateGroupModal } from './CreateGroupModal';
import { GroupMembersModal } from './GroupMembersModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/v1';

interface SuggestedUser {
    id: string;
    username: string;
    avatar_url: string | null;
    is_following: boolean;
}

interface ConversationListItem {
    id: string;
    type: 'DIRECT' | 'GROUP';
    name: string | null;
    avatar_url: string | null;
    last_message_content: string | null;
    last_message_at: string | null;
    unread_count: number;
}

interface MediaAttachment {
    url: string;
    type: 'image' | 'video';
    thumbnail_url?: string;
}

interface MessageItem {
    id: string;
    conversation_id: string;
    sender_id: string;
    sender_username: string | null;
    sender_avatar: string | null;
    content: string | null;
    type: string;
    media: MediaAttachment[];
    status: 'SENT' | 'DELIVERED' | 'SEEN';
    reply_to_message_id: string | null;
    created_at: string;
}

export const RightSidebar: React.FC = () => {
    const { user, token } = useAuth();
    const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
    const [conversations, setConversations] = useState<ConversationListItem[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);

    // Chat state
    const [selectedConversation, setSelectedConversation] = useState<{
        id: string;
        name: string;
        avatar_url: string | null;
        type: 'DIRECT' | 'GROUP';
    } | null>(null);
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGroupMembers, setShowGroupMembers] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    const currentUserId = user?.id || null;

    useEffect(() => {
        if (token) {
            fetchSuggestedUsers();
            fetchConversations();
            setupWebSocket();
        }
        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, [token]);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation.id);
        }
    }, [selectedConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const setupWebSocket = () => {
        if (!token || wsRef.current?.readyState === WebSocket.OPEN) return;

        const ws = new WebSocket(`${WS_URL}/ws?token=${token}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            } catch (e) {
                console.error('Failed to parse WebSocket message:', e);
            }
        };

        ws.onclose = () => {
            setTimeout(() => {
                if (wsRef.current === ws) setupWebSocket();
            }, 3000);
        };
    };

    const handleWebSocketMessage = (data: any) => {
        if (data.type === 'NEW_MESSAGE') {
            // Refresh conversation list for new messages
            fetchConversations();

            if (selectedConversation && data.conversationId === selectedConversation.id) {
                const newMessage: MessageItem = {
                    id: data.messageId,
                    conversation_id: data.conversationId,
                    sender_id: data.senderId,
                    sender_username: data.senderUsername,
                    sender_avatar: data.senderAvatar,
                    content: data.content,
                    type: data.messageType || 'TEXT',
                    media: data.media || [],
                    status: 'DELIVERED',
                    reply_to_message_id: null,
                    created_at: data.createdAt || new Date().toISOString(),
                };
                setMessages(prev => {
                    if (prev.find(m => m.id === newMessage.id)) return prev;
                    return [...prev, newMessage];
                });
            }
        } else if (data.type === 'TYPING' && selectedConversation && data.conversationId === selectedConversation.id) {
            setTypingUsers(prev => {
                if (data.userId !== currentUserId && !prev.includes(data.username)) {
                    return [...prev, data.username];
                }
                return prev;
            });
            setTimeout(() => {
                setTypingUsers(prev => prev.filter(u => u !== data.username));
            }, 3000);
        }
    };

    const fetchSuggestedUsers = async () => {
        try {
            setIsLoadingUsers(true);
            const response = await fetch(`${API_URL}/users/suggested?limit=5`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSuggestedUsers(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch suggested users:', error);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const fetchConversations = async () => {
        try {
            setIsLoadingChats(true);
            const response = await fetch(`${API_URL}/messages/conversations?limit=5`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setConversations(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setIsLoadingChats(false);
        }
    };

    const fetchMessages = async (conversationId: string) => {
        try {
            setIsLoadingMessages(true);
            const response = await fetch(`${API_URL}/messages/conversations/${conversationId}/messages?limit=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setMessages(data.data || []);
                markConversationSeen(conversationId, data.data?.[data.data.length - 1]?.id);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const markConversationSeen = async (conversationId: string, messageId?: string) => {
        if (!messageId) return;
        try {
            await fetch(
                `${API_URL}/messages/conversations/${conversationId}/seen?message_id=${encodeURIComponent(messageId)}`,
                {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
        } catch (error) {
            console.error('Failed to mark conversation as seen:', error);
        }
    };

    const handleFollow = async (userId: string, isFollowing: boolean) => {
        try {
            const method = isFollowing ? 'DELETE' : 'POST';
            const response = await fetch(`${API_URL}/friendships/${userId}/follow`, {
                method,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setSuggestedUsers(prev => prev.map(u =>
                    u.id === userId ? { ...u, is_following: !isFollowing } : u
                ));
            }
        } catch (error) {
            console.error('Failed to follow/unfollow:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isSending || !selectedConversation) return;

        const content = inputValue.trim();
        setInputValue('');
        setIsSending(true);

        const tempId = `temp-${Date.now()}`;
        const tempMessage: MessageItem = {
            id: tempId,
            conversation_id: selectedConversation.id,
            sender_id: currentUserId || '',
            sender_username: 'Bạn',
            sender_avatar: null,
            content,
            type: 'TEXT',
            media: [],
            status: 'SENT',
            reply_to_message_id: null,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempMessage]);

        try {
            const response = await fetch(`${API_URL}/messages/conversations/${selectedConversation.id}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content }),
            });

            if (response.ok) {
                const data = await response.json();
                setMessages(prev => prev.map(m => m.id === tempId ? data.data : m));
                fetchConversations();
            } else {
                setMessages(prev => prev.filter(m => m.id !== tempId));
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const sendTyping = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN && selectedConversation) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            wsRef.current.send(JSON.stringify({
                type: 'TYPING',
                conversationId: selectedConversation.id,
            }));
            typingTimeoutRef.current = setTimeout(() => {
                typingTimeoutRef.current = null;
            }, 2000);
        }
    };

    const formatTimeAgo = (dateString: string | null) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Vừa xong';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}p`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const isOwnMessage = (message: MessageItem) => message.sender_id === currentUserId;

    const getStatusIcon = (status: string) => {
        if (status === 'SEEN') return <CheckCheck className="w-3 h-3 text-primary" />;
        if (status === 'DELIVERED') return <CheckCheck className="w-3 h-3 text-[#7f7f7f]" />;
        return <Check className="w-3 h-3 text-[#7f7f7f]" />;
    };

    // Inline Chat View
    if (selectedConversation) {
        return (
            <aside className="w-[420px] hidden xl:flex flex-col pt-[150px] pb-10 pr-6 h-screen sticky top-0">
                <div className="bg-bg-secondary rounded-[20px] shadow-xl flex-1 flex flex-col overflow-hidden">
                    {/* Chat Header */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                        <button
                            onClick={() => setSelectedConversation(null)}
                            className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-white/5 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-white/60" />
                        </button>

                        {selectedConversation.avatar_url ? (
                            <img
                                src={selectedConversation.avatar_url}
                                alt=""
                                className="w-[38px] h-[38px] rounded-[10px] object-cover"
                            />
                        ) : (
                            <div className="w-[38px] h-[38px] rounded-[10px] bg-bg-main flex items-center justify-center">
                                {selectedConversation.type === 'GROUP' ? (
                                    <Users className="w-4 h-4 text-[#7f7f7f]" />
                                ) : (
                                    <UserIcon className="w-4 h-4 text-[#7f7f7f]" />
                                )}
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <h3 className="font-montserrat font-semibold text-[12px] text-white truncate">
                                {selectedConversation.name}
                            </h3>
                            {typingUsers.length > 0 && (
                                <p className="text-[9px] text-primary">Đang nhập...</p>
                            )}
                        </div>

                        {selectedConversation.type === 'GROUP' && (
                            <button
                                onClick={() => setShowGroupMembers(true)}
                                className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-white/5 transition-colors"
                            >
                                <Users className="w-4 h-4 text-primary" />
                            </button>
                        )}
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 no-scrollbar">
                        {isLoadingMessages ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center py-8 text-[#7f7f7f]">
                                <p className="text-[11px] font-montserrat">Bắt đầu trò chuyện...</p>
                            </div>
                        ) : (
                            messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex items-end gap-2 ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
                                >
                                    {!isOwnMessage(message) && selectedConversation.type === 'GROUP' && (
                                        <div className="flex-shrink-0 w-5 h-5">
                                            {message.sender_avatar ? (
                                                <img src={message.sender_avatar} alt="" className="w-5 h-5 rounded-[4px] object-cover" />
                                            ) : (
                                                <div className="w-5 h-5 rounded-[4px] bg-bg-main flex items-center justify-center">
                                                    <UserIcon className="w-2.5 h-2.5 text-[#7f7f7f]" />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className={`max-w-[80%] ${isOwnMessage(message) ? 'order-first' : ''}`}>
                                        {!isOwnMessage(message) && selectedConversation.type === 'GROUP' && (
                                            <p className="text-[9px] text-[#7f7f7f] mb-0.5 ml-1">{message.sender_username}</p>
                                        )}

                                        <div className={`rounded-[10px] px-3 py-2 ${isOwnMessage(message)
                                            ? 'bg-primary text-white rounded-br-[3px]'
                                            : 'bg-bg-main text-white/90 rounded-bl-[3px]'
                                            }`}>
                                            {message.content && (
                                                <p className="text-[11px] whitespace-pre-wrap break-words leading-relaxed">
                                                    {message.content}
                                                </p>
                                            )}
                                        </div>

                                        <div className={`flex items-center gap-1 mt-0.5 ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}>
                                            <span className="text-[8px] text-[#7f7f7f]">{formatTime(message.created_at)}</span>
                                            {isOwnMessage(message) && getStatusIcon(message.status)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Typing indicator */}
                    {typingUsers.length > 0 && (
                        <div className="px-4 py-1 text-[9px] text-[#7f7f7f] italic">
                            {typingUsers.join(', ')} đang gõ...
                        </div>
                    )}

                    {/* Input */}
                    <div className="border-t border-white/5 p-3">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                                <textarea
                                    ref={inputRef}
                                    value={inputValue}
                                    onChange={(e) => {
                                        setInputValue(e.target.value);
                                        if (e.target.value.length > 0 && !typingTimeoutRef.current) sendTyping();
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Nhập tin nhắn..."
                                    rows={1}
                                    className="w-full px-3 py-2 bg-bg-main/50 border border-white/10 rounded-[8px] text-[11px] text-white placeholder-[#7f7f7f] focus:outline-none focus:border-primary/50 resize-none max-h-20 font-montserrat transition-colors"
                                    style={{ minHeight: '36px' }}
                                />
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-white/5 transition-colors"
                                >
                                    <Smile className="w-4 h-4 text-[#7f7f7f]" />
                                </button>
                                {showEmojiPicker && (
                                    <div className="absolute bottom-10 right-0 z-50">
                                        <EmojiPicker
                                            theme={Theme.DARK}
                                            onEmojiClick={(emojiData: EmojiClickData) => {
                                                setInputValue(prev => prev + emojiData.emoji);
                                                setShowEmojiPicker(false);
                                            }}
                                            width={260}
                                            height={320}
                                        />
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim() || isSending}
                                className="w-8 h-8 flex items-center justify-center rounded-[6px] bg-primary hover:bg-primary/90 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                            >
                                <Send className="w-3.5 h-3.5 text-white" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Group Members Modal */}
                {selectedConversation.type === 'GROUP' && (
                    <GroupMembersModal
                        isOpen={showGroupMembers}
                        onClose={() => setShowGroupMembers(false)}
                        conversationId={selectedConversation.id}
                        conversationName={selectedConversation.name}
                        currentUserId={currentUserId || ''}
                        onLeaveGroup={() => setSelectedConversation(null)}
                    />
                )}
            </aside>
        );
    }

    // Default Sidebar View
    return (
        <aside className="w-[550px] hidden xl:flex flex-col gap-6 pt-[150px] pb-10 pr-6 h-screen sticky top-0 overflow-y-auto no-scrollbar pb-4 md:pb-10 pr-4 md:pr-20">
            {/* Suggested Section */}
            <div className="bg-bg-secondary rounded-[20px] p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-montserrat font-extrabold text-[13px] text-white uppercase tracking-wider">GỢI Ý CHO BẠN</h3>
                    <button className="opacity-40 hover:opacity-100 transition-opacity flex gap-[3px]">
                        <div className="w-[3px] h-[3px] bg-white rounded-full"></div>
                        <div className="w-[3px] h-[3px] bg-white rounded-full"></div>
                        <div className="w-[3px] h-[3px] bg-white rounded-full"></div>
                    </button>
                </div>
                <div className="space-y-5">
                    {isLoadingUsers ? (
                        <div className="flex items-center justify-center py-4">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : suggestedUsers.length === 0 ? (
                        <p className="text-[10px] text-[#7f7f7f] text-center py-4">Không có gợi ý nào</p>
                    ) : (
                        suggestedUsers.map(user => (
                            <div key={user.id} className="flex items-center justify-between group">
                                <a href={`#profile/${user.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} className="w-[52px] h-[52px] rounded-[12px] object-cover transition-transform group-hover:scale-105" alt="" />
                                    ) : (
                                        <div className="w-[52px] h-[52px] rounded-[12px] bg-bg-main flex items-center justify-center">
                                            <UserIcon className="w-6 h-6 text-[#7f7f7f]" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="font-montserrat font-medium text-[13px] text-white truncate group-hover:text-primary transition-colors">{user.username}</p>
                                        <p className="text-[#7f7f7f] text-[11px] mt-0.5">Gợi ý cho bạn</p>
                                    </div>
                                </a>
                                <button
                                    onClick={() => handleFollow(user.id, user.is_following)}
                                    className={`px-5 py-2 rounded-[8px] text-[12px] font-semibold transition-all hover:scale-105 ${user.is_following
                                        ? 'bg-white/10 text-white hover:bg-white/20'
                                        : 'bg-primary text-white hover:bg-primary/90'
                                        }`}
                                >
                                    {user.is_following ? 'Đang theo dõi' : 'Theo dõi'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Live Chat Section */}
            <div className="bg-bg-secondary rounded-[20px] p-6 shadow-xl flex-1 min-h-0 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-montserrat font-extrabold text-[13px] text-white uppercase tracking-wider">TIN NHẮN</h3>
                    <button
                        onClick={() => setShowCreateGroup(true)}
                        className="text-primary text-[12px] font-semibold border border-primary/30 px-4 py-2 rounded-[8px] hover:bg-primary/10 transition-all active:scale-95"
                    >
                        Tạo nhóm
                    </button>
                </div>
                <div className="space-y-4 overflow-y-auto flex-1 no-scrollbar">
                    {isLoadingChats ? (
                        <div className="flex items-center justify-center py-4">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="text-center py-6 text-[#7f7f7f]">
                            <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
                            <p className="text-[10px]">Chưa có tin nhắn nào</p>
                        </div>
                    ) : (
                        conversations.map(chat => (
                            <button
                                key={chat.id}
                                onClick={() => setSelectedConversation({
                                    id: chat.id,
                                    name: chat.name || 'Cuộc trò chuyện',
                                    avatar_url: chat.avatar_url,
                                    type: chat.type,
                                })}
                                className={`w-full flex items-start gap-3 relative group text-left p-2 -mx-2 rounded-[10px] hover:bg-white/5 transition-colors ${chat.unread_count > 0 ? 'bg-primary/5' : ''
                                    }`}
                            >
                                <div className="relative flex-shrink-0">
                                    {chat.avatar_url ? (
                                        <img src={chat.avatar_url} className="w-[52px] h-[52px] rounded-[12px] object-cover transition-transform group-hover:scale-105" alt="" />
                                    ) : (
                                        <div className="w-[52px] h-[52px] rounded-[12px] bg-bg-main flex items-center justify-center">
                                            {chat.type === 'GROUP' ? (
                                                <Users className="w-6 h-6 text-[#7f7f7f]" />
                                            ) : (
                                                <UserIcon className="w-6 h-6 text-[#7f7f7f]" />
                                            )}
                                        </div>
                                    )}
                                    {/* Online indicator */}
                                    <div className="absolute -bottom-0.5 -right-0.5 w-[8px] h-[8px] bg-[#22c55e] rounded-full border-2 border-bg-secondary"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className={`font-montserrat font-medium text-[13px] truncate group-hover:text-primary transition-colors ${chat.unread_count > 0 ? 'text-white' : 'text-white/90'
                                            }`}>
                                            {chat.name || 'Cuộc trò chuyện'}
                                        </p>
                                        <p className="text-[#7f7f7f] text-[12px] flex-shrink-0 ml-2">{formatTimeAgo(chat.last_message_at)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className={`text-[12px] line-clamp-1 leading-relaxed flex-1 ${chat.unread_count > 0 ? 'text-white/70 font-medium' : 'text-white/50'
                                            }`}>
                                            {chat.last_message_content || 'Bắt đầu trò chuyện...'}
                                        </p>
                                        {chat.unread_count > 0 && (
                                            <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-bold text-white bg-primary rounded-full">
                                                {chat.unread_count > 99 ? '99+' : chat.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Create Group Modal */}
            <CreateGroupModal
                isOpen={showCreateGroup}
                onClose={() => setShowCreateGroup(false)}
                onGroupCreated={(groupId, groupName) => {
                    setSelectedConversation({
                        id: groupId,
                        name: groupName,
                        avatar_url: null,
                        type: 'GROUP',
                    });
                    fetchConversations();
                }}
            />
        </aside>
    );
};

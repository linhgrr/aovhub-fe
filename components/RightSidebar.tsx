import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Users, User as UserIcon, Plus, Search, X, ChevronLeft, Send, Smile, Paperclip, Check, CheckCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/authContext';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { CreateGroupModal } from './CreateGroupModal';
import { GroupMembersModal } from './GroupMembersModal';
import { formatChatTime, formatTime as formatTimeUtil, formatTimeAgo } from '../utils/timeUtils';
import { getAvatarUrl } from '../utils/avatarUtils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/v1';

interface SuggestedUser {
    id: string;
    username: string;
    avatar_url: string | null;
    rank: string | null;
    level: number | null;
    mutual_friends_count: number;
    suggestion_score: number;
}

interface OnlineFriend {
    id: string;
    username: string;
    avatar_url: string | null;
    rank: string | null;
    level: number | null;
    is_online: boolean;
    last_active_at: string | null;
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
    const [onlineFriends, setOnlineFriends] = useState<OnlineFriend[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const [isLoadingOnline, setIsLoadingOnline] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);

    // Chat state
    const [selectedConversation, setSelectedConversation] = useState<{
        id: string;
        name: string;
        avatar_url: string | null;
        type: 'DIRECT' | 'GROUP';
        otherUserId?: string | null;
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
            fetchOnlineFriends();
            setupWebSocket();

            // Refresh online friends every 30 seconds
            const onlineInterval = setInterval(fetchOnlineFriends, 30000);
            return () => {
                clearInterval(onlineInterval);
                if (wsRef.current) wsRef.current.close();
            };
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

    const fetchOnlineFriends = async () => {
        try {
            setIsLoadingOnline(true);
            const response = await fetch(`${API_URL}/friends/online`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setOnlineFriends(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch online friends:', error);
        } finally {
            setIsLoadingOnline(false);
        }
    };

    const startChatWithUser = async (userId: string, username: string, avatarUrl: string | null) => {
        try {
            const response = await fetch(`${API_URL}/messages/direct/${userId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSelectedConversation({
                    id: data.data.id,
                    name: username,
                    avatar_url: avatarUrl,
                    type: 'DIRECT',
                    otherUserId: userId,
                });
            }
        } catch (error) {
            console.error('Failed to start chat:', error);
        }
    };

    const fetchSuggestedUsers = async () => {
        try {
            setIsLoadingUsers(true);
            const response = await fetch(`${API_URL}/friends/suggestions?limit=20`, {
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

    // Use shared time utilities
    const formatTimeAgo = (dateString: string | null) => {
        if (!dateString) return '';
        return formatChatTime(dateString);
    };

    const formatTime = (dateString: string) => formatTimeUtil(dateString);

    const isOwnMessage = (message: MessageItem) => message.sender_id === currentUserId;

    const getStatusIcon = (status: string) => {
        if (status === 'SEEN') return <CheckCheck className="w-3 h-3 text-primary" />;
        if (status === 'DELIVERED') return <CheckCheck className="w-3 h-3 text-[#7f7f7f]" />;
        return <Check className="w-3 h-3 text-[#7f7f7f]" />;
    };

    // Inline Chat View
    if (selectedConversation) {
        return (
            <aside className="w-[420px] hidden xl:flex flex-col pt-10 pb-10 pr-6 h-[calc(100vh-90px)] sticky top-[90px] overflow-hidden">
                <div className="bg-bg-secondary rounded-[20px] shadow-xl flex-1 flex flex-col overflow-hidden">
                    {/* Chat Header */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                        <button
                            onClick={() => setSelectedConversation(null)}
                            className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-white/5 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-white/60" />
                        </button>

                        {selectedConversation.type === 'DIRECT' && selectedConversation.otherUserId ? (
                            <a href={`#profile/${selectedConversation.otherUserId}`} className="block hover:opacity-80 transition-all active:scale-95">
                                <img
                                    src={getAvatarUrl(selectedConversation.avatar_url, selectedConversation.name || undefined)}
                                    alt={selectedConversation.name || ''}
                                    className="w-[38px] h-[38px] rounded-[10px] object-cover"
                                />
                            </a>
                        ) : (
                            <img
                                src={selectedConversation.type === 'GROUP'
                                    ? (selectedConversation.avatar_url || '/assets/images/home.svg')
                                    : getAvatarUrl(selectedConversation.avatar_url, selectedConversation.name || undefined)
                                }
                                alt={selectedConversation.name || ''}
                                className="w-[38px] h-[38px] rounded-[10px] object-cover"
                            />
                        )}

                        <div className="flex-1 min-w-0">
                            {selectedConversation.type === 'DIRECT' && selectedConversation.otherUserId ? (
                                <a
                                    href={`#profile/${selectedConversation.otherUserId}`}
                                    className="font-montserrat font-semibold text-[12px] text-white truncate hover:text-primary transition-colors block"
                                >
                                    {selectedConversation.name}
                                </a>
                            ) : (
                                <h3 className="font-montserrat font-semibold text-[12px] text-white truncate">
                                    {selectedConversation.name}
                                </h3>
                            )}
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
        <aside className="w-[420px] hidden xl:flex flex-col gap-6 pt-10 pb-10 pr-6 h-[calc(100vh-90px)] sticky top-[90px] overflow-y-auto no-scrollbar pb-4 md:pb-10 pr-4 md:pr-8">
            {/* Suggested Section */}
            <div className="bg-bg-secondary rounded-[20px] p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-montserrat font-extrabold text-[13px] text-white uppercase tracking-wider">GỢI Ý CHO BẠN</h3>
                </div>
                <div className="space-y-5 max-h-[275px] overflow-y-auto no-scrollbar">
                    {isLoadingUsers ? (
                        <div className="flex items-center justify-center py-4">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : suggestedUsers.length === 0 ? (
                        <p className="text-[10px] text-[#7f7f7f] text-center py-4">Đã hết danh sách bạn bè gợi ý</p>
                    ) : (
                        suggestedUsers.map(user => (
                            <div key={user.id} className="flex items-center justify-between group">
                                <a href={`#profile/${user.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="relative">
                                        <div className="p-[2px] bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-[14px]">
                                            <img
                                                src={getAvatarUrl(user.avatar_url, user.username)}
                                                className="w-[52px] h-[52px] rounded-[12px] object-cover transition-transform group-hover:scale-105"
                                                alt={user.username}
                                            />
                                        </div>
                                        {user.rank && (
                                            <img
                                                src={`/assets/images/rank/${user.rank.toLowerCase()}.png`}
                                                alt={user.rank}
                                                className="absolute -bottom-1 -right-1 w-[24px] h-[24px] object-contain shadow-lg"
                                            />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-montserrat font-medium text-[13px] text-white truncate group-hover:text-primary transition-colors">{user.username}</p>
                                        <p className="text-[#7f7f7f] text-[10px] mt-0.5">
                                            {user.mutual_friends_count} bạn chung
                                        </p>
                                    </div>
                                </a>
                                <button
                                    onClick={async () => {
                                        try {
                                            const response = await fetch(`${API_URL}/friends/request/${user.id}`, {
                                                method: 'POST',
                                                headers: { 'Authorization': `Bearer ${token}` }
                                            });
                                            if (response.ok) {
                                                setSuggestedUsers(prev => prev.filter(u => u.id !== user.id));
                                            }
                                        } catch (error) {
                                            console.error('Failed to send friend request:', error);
                                        }
                                    }}
                                    className="px-4 py-2 rounded-[8px] text-[11px] font-semibold transition-all hover:scale-105 bg-primary text-white hover:bg-primary/90"
                                >
                                    Kết bạn
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Online Friends Section - Messenger Style */}
            <div className="bg-bg-secondary rounded-[20px] p-6 shadow-xl flex-1 min-h-[420px] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-montserrat font-extrabold text-[13px] text-white uppercase tracking-wider">
                        Người liên hệ
                    </h3>
                </div>

                <div className="space-y-1 overflow-y-auto flex-1 no-scrollbar">
                    {isLoadingOnline ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : onlineFriends.length === 0 ? (
                        <div className="text-center py-8 text-[#7f7f7f]">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                                <UserIcon className="w-6 h-6 opacity-40" />
                            </div>
                            <p className="text-[12px]">Chưa có bạn bè</p>
                        </div>
                    ) : (
                        onlineFriends.map((friend) => (
                            <button
                                key={friend.id}
                                onClick={() => startChatWithUser(friend.id, friend.username, friend.avatar_url)}
                                className="w-full flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-white/5 transition-colors group"
                            >
                                <div className="relative flex-shrink-0">
                                    <img
                                        src={getAvatarUrl(friend.avatar_url, friend.username)}
                                        alt={friend.username}
                                        className="w-[52px] h-[52px] rounded-[12px] object-cover transition-transform group-hover:scale-105"
                                    />
                                    {/* Online/Offline indicator */}
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-[12px] h-[12px] rounded-full border-2 border-bg-secondary ${friend.is_online ? 'bg-[#31a24c]' : 'bg-[#7f7f7f]'
                                        }`}></div>
                                </div>
                                <div className="flex flex-col items-start min-w-0 flex-1">
                                    <span className="font-medium text-[14px] text-white/90 group-hover:text-white transition-colors truncate w-full text-left">
                                        {friend.username}
                                    </span>
                                    {!friend.is_online && friend.last_active_at && (
                                        <span className="text-[11px] text-[#7f7f7f] truncate w-full text-left">
                                            {formatTimeAgo(friend.last_active_at)}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

        </aside>
    );
};

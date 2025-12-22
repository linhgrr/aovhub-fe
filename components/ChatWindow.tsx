import React, { useState, useEffect, useRef } from 'react';
import { Send, X, ChevronLeft, User as UserIcon, Users, Smile, Paperclip, Check, CheckCheck, Loader2 } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useAuth } from '../contexts/authContext';
import { GroupMembersModal } from './GroupMembersModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/v1';

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

interface ChatWindowProps {
    conversationId: string;
    conversationName: string;
    conversationAvatar: string | null;
    conversationType: 'DIRECT' | 'GROUP';
    onBack: () => void;
    onClose: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    conversationId,
    conversationName,
    conversationAvatar,
    conversationType,
    onBack,
    onClose,
}) => {
    const { user, token } = useAuth();
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [pendingMedia, setPendingMedia] = useState<MediaAttachment[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGroupMembers, setShowGroupMembers] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    const currentUserId = user?.id || null;

    useEffect(() => {
        fetchMessages();
        if (token) setupWebSocket();

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, [conversationId, token]);

    const setupWebSocket = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

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
        if (data.type === 'NEW_MESSAGE' && data.conversationId === conversationId) {
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
        } else if (data.type === 'TYPING' && data.conversationId === conversationId) {
            setTypingUsers(prev => {
                if (data.userId !== currentUserId && !prev.includes(data.username)) {
                    return [...prev, data.username];
                }
                return prev;
            });
            setTimeout(() => {
                setTypingUsers(prev => prev.filter(u => u !== data.username));
            }, 3000);
        } else if (data.type === 'MESSAGE_STATUS' && data.conversationId === conversationId) {
            setMessages(prev => prev.map(m =>
                m.id === data.messageId ? { ...m, status: data.status } : m
            ));
        } else if (data.type === 'MESSAGE_SEEN' && data.conversationId === conversationId) {
            setMessages(prev => prev.map(m =>
                m.sender_id === currentUserId && m.status !== 'SEEN'
                    ? { ...m, status: 'SEEN' }
                    : m
            ));
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const markConversationSeen = async (messageId: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

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

    const fetchMessages = async (cursor?: string) => {
        try {
            if (!cursor) setIsLoading(true);
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            let url = `${API_URL}/messages/conversations/${conversationId}/messages?limit=50`;
            if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (cursor) {
                    setMessages(prev => [...data.data, ...prev]);
                } else {
                    setMessages(data.data || []);
                }
                setNextCursor(data.next_cursor);
                setHasMore(data.has_more);

                if (data.data && data.data.length > 0) {
                    const lastMessage = data.data[data.data.length - 1];
                    markConversationSeen(lastMessage.id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || !token) return;

        setIsUploading(true);

        for (const file of Array.from(files)) {
            const isVideo = file.type.startsWith('video/');

            try {
                if (isVideo) {
                    const requestResponse = await fetch(`${API_URL}/videos/upload-request`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            filename: file.name,
                            content_type: file.type,
                        }),
                    });

                    if (!requestResponse.ok) continue;

                    const { video_id, upload_url } = await requestResponse.json();

                    const uploadResponse = await fetch(upload_url, {
                        method: 'PUT',
                        headers: { 'Content-Type': file.type },
                        body: file,
                    });

                    if (!uploadResponse.ok) continue;

                    const completeResponse = await fetch(`${API_URL}/videos/${video_id}/complete`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                    });

                    if (completeResponse.ok) {
                        const videoInfo = await fetch(`${API_URL}/videos/${video_id}`, {
                            headers: { 'Authorization': `Bearer ${token}` },
                        });
                        const videoData = await videoInfo.json();
                        const videoUrl = videoData.play_url || upload_url.split('?')[0];

                        setPendingMedia(prev => [...prev, {
                            url: videoUrl,
                            type: 'video',
                            thumbnail_url: videoData.thumbnail_url,
                        }]);
                    }
                } else {
                    const formData = new FormData();
                    formData.append('image', file);

                    const response = await fetch(`${API_URL}/auth/upload-image`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData,
                    });

                    if (response.ok) {
                        const result = await response.json();
                        setPendingMedia(prev => [...prev, {
                            url: result.url,
                            type: 'image',
                        }]);
                    }
                }
            } catch (err) {
                console.error('Upload failed:', err);
            }
        }

        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removePendingMedia = (index: number) => {
        setPendingMedia(prev => prev.filter((_, i) => i !== index));
    };

    const handleSendMessage = async () => {
        if ((!inputValue.trim() && pendingMedia.length === 0) || isSending) return;

        const content = inputValue.trim();
        const mediaToSend = [...pendingMedia];
        setInputValue('');
        setPendingMedia([]);
        setIsSending(true);

        const tempId = `temp-${Date.now()}`;
        const tempMessage: MessageItem = {
            id: tempId,
            conversation_id: conversationId,
            sender_id: currentUserId || '',
            sender_username: 'Bạn',
            sender_avatar: null,
            content: content || null,
            type: mediaToSend.length > 0 ? (content ? 'MIXED' : 'IMAGE') : 'TEXT',
            media: mediaToSend,
            status: 'SENT',
            reply_to_message_id: null,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempMessage]);

        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            const response = await fetch(`${API_URL}/messages/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: content || null,
                    media: mediaToSend.length > 0 ? mediaToSend : undefined
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setMessages(prev => prev.map(m => m.id === tempId ? data.data : m));
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
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            wsRef.current.send(JSON.stringify({
                type: 'TYPING',
                conversationId: conversationId,
            }));

            typingTimeoutRef.current = setTimeout(() => {
                typingTimeoutRef.current = null;
            }, 2000);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);
        if (e.target.value.length > 0 && !typingTimeoutRef.current) sendTyping();
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateHeader = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Hôm nay';
        if (date.toDateString() === yesterday.toDateString()) return 'Hôm qua';
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const shouldShowDateHeader = (message: MessageItem, index: number) => {
        if (index === 0) return true;
        const prevDate = new Date(messages[index - 1].created_at).toDateString();
        const currDate = new Date(message.created_at).toDateString();
        return prevDate !== currDate;
    };

    const isOwnMessage = (message: MessageItem) => message.sender_id === currentUserId;

    const lastSeenOwnMessageIndex = (() => {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].sender_id === currentUserId && messages[i].status === 'SEEN') return i;
        }
        return -1;
    })();

    const getStatusIcon = (status: string, index: number) => {
        if (status === 'SEEN') {
            if (index === lastSeenOwnMessageIndex) {
                return <span className="text-[9px] text-primary font-medium">Đã xem</span>;
            }
            return <CheckCheck className="w-3 h-3 text-primary" />;
        } else if (status === 'DELIVERED') {
            return <CheckCheck className="w-3 h-3 text-[#7f7f7f]" />;
        }
        return <Check className="w-3 h-3 text-[#7f7f7f]" />;
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-0">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Chat Window */}
            <div className="relative bg-bg-secondary border border-white/10 rounded-[12px] md:rounded-none w-full max-w-md md:max-w-sm h-[80vh] md:h-full md:fixed md:right-0 md:top-0 md:bottom-0 shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 flex-shrink-0 bg-bg-secondary">
                    <button
                        onClick={onBack}
                        className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-white/5 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-white/60" />
                    </button>

                    {/* Avatar */}
                    {conversationAvatar ? (
                        <img
                            src={conversationAvatar}
                            alt=""
                            className="w-[40px] h-[40px] rounded-[10px] object-cover"
                        />
                    ) : (
                        <div className="w-[40px] h-[40px] rounded-[10px] bg-bg-main flex items-center justify-center">
                            {conversationType === 'GROUP' ? (
                                <Users className="w-5 h-5 text-[#7f7f7f]" />
                            ) : (
                                <UserIcon className="w-5 h-5 text-[#7f7f7f]" />
                            )}
                        </div>
                    )}

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-montserrat font-semibold text-[13px] text-white truncate">{conversationName}</h3>
                        {typingUsers.length > 0 && (
                            <p className="text-[10px] text-primary font-medium">Đang nhập...</p>
                        )}
                    </div>

                    {/* Actions */}
                    {conversationType === 'GROUP' && (
                        <button
                            onClick={() => setShowGroupMembers(true)}
                            className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-white/5 transition-colors"
                            title="Thành viên nhóm"
                        >
                            <Users className="w-4 h-4 text-primary" />
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-white/5 transition-colors"
                    >
                        <X className="w-4 h-4 text-white/60" />
                    </button>
                </div>

                {/* Messages */}
                <div
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto px-4 py-3 space-y-2 no-scrollbar"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-12 text-[#7f7f7f]">
                            <p className="text-[12px] font-montserrat">Bắt đầu cuộc trò chuyện...</p>
                        </div>
                    ) : (
                        <>
                            {hasMore && (
                                <button
                                    onClick={() => fetchMessages(nextCursor || undefined)}
                                    className="w-full text-center py-2 text-[11px] text-primary hover:text-primary/80 font-medium transition-colors"
                                >
                                    Tải thêm tin nhắn
                                </button>
                            )}

                            {messages.map((message, index) => (
                                <React.Fragment key={message.id}>
                                    {shouldShowDateHeader(message, index) && (
                                        <div className="flex items-center justify-center py-2">
                                            <span className="text-[10px] text-[#7f7f7f] bg-bg-main/50 px-3 py-1 rounded-full font-montserrat">
                                                {formatDateHeader(message.created_at)}
                                            </span>
                                        </div>
                                    )}

                                    <div className={`flex items-end gap-2 ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}>
                                        {/* Avatar for others in group */}
                                        {!isOwnMessage(message) && conversationType === 'GROUP' && (
                                            <div className="flex-shrink-0 w-6 h-6">
                                                {message.sender_avatar ? (
                                                    <img
                                                        src={message.sender_avatar}
                                                        alt=""
                                                        className="w-6 h-6 rounded-[6px] object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-6 h-6 rounded-[6px] bg-bg-main flex items-center justify-center">
                                                        <UserIcon className="w-3 h-3 text-[#7f7f7f]" />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Message Bubble */}
                                        <div className={`max-w-[75%] ${isOwnMessage(message) ? 'order-first' : ''}`}>
                                            {/* Sender name for group */}
                                            {!isOwnMessage(message) && conversationType === 'GROUP' && (
                                                <p className="text-[10px] text-[#7f7f7f] mb-1 ml-1 font-montserrat">
                                                    {message.sender_username}
                                                </p>
                                            )}

                                            <div className={`rounded-[12px] px-4 py-2.5 ${isOwnMessage(message)
                                                ? 'bg-primary text-white rounded-br-[4px]'
                                                : 'bg-bg-main text-white/90 rounded-bl-[4px]'
                                            }`}>
                                                {/* Media */}
                                                {message.media && message.media.length > 0 && (
                                                    <div className="mb-2">
                                                        {message.media.map((m, i) => (
                                                            m.type === 'image' ? (
                                                                <img
                                                                    key={i}
                                                                    src={m.url}
                                                                    alt=""
                                                                    className="rounded-[8px] max-w-full"
                                                                />
                                                            ) : (
                                                                <video
                                                                    key={i}
                                                                    src={m.url}
                                                                    controls
                                                                    className="rounded-[8px] max-w-full"
                                                                />
                                                            )
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Text */}
                                                {message.content && (
                                                    <p className="text-[12px] whitespace-pre-wrap break-words leading-relaxed">
                                                        {message.content}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Time and status */}
                                            <div className={`flex items-center gap-1 mt-1 ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}>
                                                <span className="text-[9px] text-[#7f7f7f]">
                                                    {formatTime(message.created_at)}
                                                </span>
                                                {isOwnMessage(message) && getStatusIcon(message.status, index)}
                                            </div>
                                        </div>
                                    </div>
                                </React.Fragment>
                            ))}
                        </>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                    <div className="px-4 py-1 text-[10px] text-[#7f7f7f] italic font-montserrat">
                        {typingUsers.join(', ')} đang gõ...
                    </div>
                )}

                {/* Input Area */}
                <div className="flex-shrink-0 border-t border-white/10 bg-bg-secondary p-3">
                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {/* Media Preview */}
                    {pendingMedia.length > 0 && (
                        <div className="mb-2 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {pendingMedia.map((item, index) => (
                                <div key={index} className="relative flex-shrink-0">
                                    {item.type === 'image' ? (
                                        <img src={item.url} alt="" className="w-14 h-14 object-cover rounded-[8px]" />
                                    ) : (
                                        <video src={item.url} className="w-14 h-14 object-cover rounded-[8px]" />
                                    )}
                                    <button
                                        onClick={() => removePendingMedia(index)}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
                                    >
                                        <X className="w-3 h-3 text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        {/* Attachment button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-[8px] hover:bg-white/5 transition-colors disabled:opacity-50"
                        >
                            {isUploading ? (
                                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                            ) : (
                                <Paperclip className="w-5 h-5 text-[#7f7f7f]" />
                            )}
                        </button>

                        {/* Input */}
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Nhập tin nhắn..."
                                rows={1}
                                className="w-full px-4 py-2.5 bg-bg-main/50 border border-white/10 rounded-[10px] text-[12px] text-white placeholder-[#7f7f7f] focus:outline-none focus:border-primary/50 resize-none max-h-28 font-montserrat transition-colors"
                                style={{ minHeight: '40px' }}
                            />
                        </div>

                        {/* Emoji */}
                        <div className="relative">
                            <button
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-[8px] hover:bg-white/5 transition-colors"
                            >
                                <Smile className="w-5 h-5 text-[#7f7f7f]" />
                            </button>
                            {showEmojiPicker && (
                                <div className="absolute bottom-12 right-0 z-50">
                                    <EmojiPicker
                                        theme={Theme.DARK}
                                        onEmojiClick={(emojiData: EmojiClickData) => {
                                            setInputValue(prev => prev + emojiData.emoji);
                                            setShowEmojiPicker(false);
                                        }}
                                        width={280}
                                        height={350}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Send */}
                        <button
                            onClick={handleSendMessage}
                            disabled={(!inputValue.trim() && pendingMedia.length === 0) || isSending || isUploading}
                            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-[8px] bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                        >
                            <Send className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Group Members Modal */}
            {conversationType === 'GROUP' && (
                <GroupMembersModal
                    isOpen={showGroupMembers}
                    onClose={() => setShowGroupMembers(false)}
                    conversationId={conversationId}
                    conversationName={conversationName}
                    currentUserId={currentUserId || ''}
                    onLeaveGroup={onBack}
                />
            )}
        </div>
    );
};

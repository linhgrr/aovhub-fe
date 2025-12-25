import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Search, Plus, Users, User as UserIcon, X, GripVertical } from 'lucide-react';
import { ChatWindow } from './ChatWindow';
import { CreateGroupModal } from './CreateGroupModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const MIN_WIDTH = 400;
const MAX_WIDTH = 1000;
const DEFAULT_WIDTH = 500;


interface ConversationListItem {
    id: string;
    type: 'DIRECT' | 'GROUP';
    name: string | null;
    avatar_url: string | null;
    last_message_content: string | null;
    last_message_at: string | null;
    unread_count: number;
}

interface SearchUser {
    id: string;
    username: string;
    avatar_url: string | null;
}

interface MessagesProps {
    isOpen: boolean;
    onClose: () => void;
    onRefreshUnread?: () => void;
    pendingDirectMessage?: { userId: string; username: string; avatar_url: string | null } | null;
    onDirectMessageOpened?: () => void;
}

export const Messages: React.FC<MessagesProps> = ({ isOpen, onClose, onRefreshUnread, pendingDirectMessage, onDirectMessageOpened }) => {
    const [conversations, setConversations] = useState<ConversationListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState<{
        id: string;
        name: string;
        avatar_url: string | null;
        type: 'DIRECT' | 'GROUP';
    } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [panelWidth, setPanelWidth] = useState(() => {
        const saved = localStorage.getItem('messages_panel_width');
        return saved ? Math.min(Math.max(parseInt(saved), MIN_WIDTH), MAX_WIDTH) : DEFAULT_WIDTH;
    });
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const resizeRef = useRef<HTMLDivElement>(null);

    // Handle resize
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = window.innerWidth - e.clientX;
            const clampedWidth = Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH);
            setPanelWidth(clampedWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            localStorage.setItem('messages_panel_width', panelWidth.toString());
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, panelWidth]);

    useEffect(() => {
        if (isOpen) fetchConversations();
    }, [isOpen]);

    // Handle pending direct message from Friends page
    useEffect(() => {
        if (isOpen && pendingDirectMessage && !selectedConversation) {
            const openPendingChat = async () => {
                try {
                    const token = localStorage.getItem('auth_token');
                    if (!token) return;

                    const response = await fetch(`${API_URL}/messages/direct/${pendingDirectMessage.userId}`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setSelectedConversation({
                            id: data.data.id,
                            name: data.data.name || pendingDirectMessage.username,
                            avatar_url: data.data.avatar_url || pendingDirectMessage.avatar_url,
                            type: 'DIRECT',
                        });
                        onDirectMessageOpened?.();
                    }
                } catch (error) {
                    console.error('Failed to open direct chat:', error);
                    onDirectMessageOpened?.();
                }
            };
            openPendingChat();
        }
    }, [isOpen, pendingDirectMessage, selectedConversation, onDirectMessageOpened]);

    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        if (searchQuery.trim().length > 0) {
            searchTimeoutRef.current = setTimeout(() => searchUsers(searchQuery), 300);
        } else {
            setSearchResults([]);
        }

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [searchQuery]);

    const searchUsers = async (query: string) => {
        try {
            setIsSearching(true);
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            const response = await fetch(
                `${API_URL}/messages/search/users?q=${encodeURIComponent(query)}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.data || []);
            }
        } catch (error) {
            console.error('Failed to search users:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const fetchConversations = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            const response = await fetch(`${API_URL}/messages/conversations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setConversations(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const openDirectChat = async (user: SearchUser) => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            const response = await fetch(`${API_URL}/messages/direct/${user.id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setSelectedConversation({
                    id: data.data.id,
                    name: data.data.name || user.username,
                    avatar_url: data.data.avatar_url || user.avatar_url,
                    type: 'DIRECT',
                });
                setSearchQuery('');
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Failed to create conversation:', error);
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
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    };

    const filteredConversations = searchQuery
        ? conversations.filter(conv =>
            conv.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : conversations;

    if (!isOpen) return null;

    // Chat Window View
    if (selectedConversation) {
        return (
            <ChatWindow
                conversationId={selectedConversation.id}
                conversationName={selectedConversation.name}
                conversationAvatar={selectedConversation.avatar_url}
                conversationType={selectedConversation.type}
                onBack={() => {
                    setSelectedConversation(null);
                    fetchConversations();
                    onRefreshUnread?.();
                }}
                onClose={() => {
                    onClose();
                    onRefreshUnread?.();
                }}
            />
        );
    }

    const showSearchResults = searchQuery.trim().length > 0 && searchResults.length > 0;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-0">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Messages Panel */}
            <div
                ref={containerRef}
                style={{ width: window.innerWidth >= 768 ? `${panelWidth}px` : undefined }}
                className={`relative bg-bg-secondary border border-white/10 rounded-[12px] md:rounded-none w-full h-[80vh] md:h-full md:fixed md:right-0 md:top-0 md:bottom-0 shadow-2xl flex flex-col overflow-hidden ${isResizing ? 'select-none' : ''}`}
            >
                {/* Resize Handle - Only visible on desktop */}
                <div
                    ref={resizeRef}
                    onMouseDown={handleResizeStart}
                    className="hidden md:flex absolute left-0 top-0 bottom-0 w-[6px] cursor-ew-resize items-center justify-center group hover:bg-primary/20 transition-colors z-10"
                    title="Kéo để thay đổi kích thước"
                >
                    <div className={`w-[3px] h-16 rounded-full transition-all ${isResizing ? 'bg-primary' : 'bg-white/20 group-hover:bg-primary/60'}`} />
                </div>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0 bg-bg-secondary">
                    <div className="flex items-center gap-3">
                        <MessageCircle className="w-5 h-5 text-primary" />
                        <h2 className="font-montserrat font-bold text-[14px] text-white">Tin nhắn</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowCreateGroup(true)}
                            className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-primary hover:bg-primary/90 transition-all hover:scale-105"
                            title="Tạo nhóm chat"
                        >
                            <Plus className="w-4 h-4 text-white" />
                        </button>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-white/5 hover:bg-white/10 transition-all"
                        >
                            <X className="w-4 h-4 text-white/60" />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="px-4 py-3 border-b border-white/5">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#7f7f7f]" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm người dùng hoặc nhóm..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-bg-main/50 border border-white/10 rounded-[10px] text-[12px] text-white placeholder-[#7f7f7f] focus:outline-none focus:border-primary/50 transition-colors font-montserrat"
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Search Results */}
                {showSearchResults && (
                    <div className="border-b border-white/5 max-h-48 overflow-y-auto">
                        <div className="px-4 py-2 text-[10px] text-[#7f7f7f] font-montserrat font-medium uppercase tracking-wider">
                            Người dùng
                        </div>
                        {searchResults.map((user) => (
                            <button
                                key={user.id}
                                onClick={() => openDirectChat(user)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left group"
                            >
                                {user.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt=""
                                        className="w-[40px] h-[40px] rounded-[10px] object-cover transition-transform group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-[40px] h-[40px] rounded-[10px] bg-bg-main flex items-center justify-center">
                                        <UserIcon className="w-4 h-4 text-[#7f7f7f]" />
                                    </div>
                                )}
                                <div>
                                    <span className="font-montserrat font-medium text-[12px] text-white">{user.username}</span>
                                    <p className="text-[10px] text-[#7f7f7f]">Nhấn để nhắn tin</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {searchQuery && filteredConversations.length > 0 && (
                        <div className="px-4 py-2 text-[10px] text-[#7f7f7f] font-montserrat font-medium uppercase tracking-wider">
                            Cuộc trò chuyện
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : filteredConversations.length === 0 && !showSearchResults ? (
                        <div className="text-center py-12 text-[#7f7f7f]">
                            <MessageCircle className="w-14 h-14 mx-auto mb-3 opacity-40" />
                            <p className="text-[12px] font-montserrat">
                                {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có tin nhắn nào'}
                            </p>
                            {!searchQuery && (
                                <p className="text-[10px] mt-2 text-[#5f5f5f]">Tìm kiếm người dùng để bắt đầu</p>
                            )}
                        </div>
                    ) : (
                        filteredConversations.map((conversation) => (
                            <button
                                key={conversation.id}
                                onClick={() => setSelectedConversation({
                                    id: conversation.id,
                                    name: conversation.name || 'Cuộc trò chuyện',
                                    avatar_url: conversation.avatar_url,
                                    type: conversation.type,
                                })}
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left group ${conversation.unread_count > 0 ? 'bg-primary/5' : ''
                                    }`}
                            >
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    {conversation.avatar_url ? (
                                        <img
                                            src={conversation.avatar_url}
                                            alt=""
                                            className="w-[43px] h-[43px] rounded-[10px] object-cover transition-transform group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-[43px] h-[43px] rounded-[10px] bg-bg-main flex items-center justify-center">
                                            {conversation.type === 'GROUP' ? (
                                                <Users className="w-5 h-5 text-[#7f7f7f]" />
                                            ) : (
                                                <UserIcon className="w-5 h-5 text-[#7f7f7f]" />
                                            )}
                                        </div>
                                    )}
                                    {/* Online indicator */}
                                    <div className="absolute -bottom-0.5 -right-0.5 w-[8px] h-[8px] bg-[#22c55e] rounded-full border-2 border-bg-secondary"></div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`font-montserrat font-medium text-[11px] truncate group-hover:text-primary transition-colors ${conversation.unread_count > 0 ? 'text-white' : 'text-white/90'
                                            }`}>
                                            {conversation.name || 'Cuộc trò chuyện'}
                                        </span>
                                        <span className="text-[10px] text-[#7f7f7f] flex-shrink-0 ml-2">
                                            {formatTimeAgo(conversation.last_message_at)}
                                        </span>
                                    </div>
                                    <p className={`text-[10px] truncate leading-relaxed ${conversation.unread_count > 0 ? 'text-white/70 font-medium' : 'text-white/50'
                                        }`}>
                                        {conversation.last_message_content || 'Bắt đầu cuộc trò chuyện...'}
                                    </p>
                                </div>

                                {/* Unread badge */}
                                {conversation.unread_count > 0 && (
                                    <div className="flex-shrink-0">
                                        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[10px] font-bold text-white bg-primary rounded-full">
                                            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                                        </span>
                                    </div>
                                )}
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
        </div>
    );
};

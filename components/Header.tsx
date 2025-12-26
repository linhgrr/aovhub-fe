import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, User as UserIcon, Settings, LogOut, X, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/authContext';
import { PostDetailModal } from './PostDetailModal';
import { Messages } from './Messages';
import { formatTimeAgo } from '../utils/timeUtils';
import { getAvatarUrl } from '../utils/avatarUtils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface MediaItem {
    url: string;
    type: 'image' | 'video';
    thumbnail_url?: string;
}

interface PostAuthor {
    id: string;
    username: string;
    avatar_url: string | null;
    rank: string | null;
    level: number | null;
}

interface FeedPost {
    id: string;
    author_id: string;
    author: PostAuthor;
    content: string;
    media: MediaItem[];
    like_count: number;
    comment_count: number;
    is_liked: boolean;
    created_at: string;
}

interface HeaderProps {
    onNavigate: (route: string) => void;
}

interface NotificationActor {
    id: string;
    username: string;
    avatar_url: string | null;
}

interface NotificationItem {
    id: string;
    type: string;
    actor_id: string;
    actor: NotificationActor;
    content: string;
    post_id: string | null;
    comment_id: string | null;
    is_read: boolean;
    created_at: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
    const { user, logout } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

    const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
    const [showAllNotifications, setShowAllNotifications] = useState(false);
    const [allNotifications, setAllNotifications] = useState<NotificationItem[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const [showMessages, setShowMessages] = useState(false);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [searchValue, setSearchValue] = useState('');
    const [pendingDirectMessage, setPendingDirectMessage] = useState<{ userId: string; username: string; avatar_url: string | null } | null>(null);

    const notificationRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const allNotificationsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchUnreadCount();
        fetchUnreadMessagesCount();
    }, []);

    // Listen for openDirectMessage event from Friends page
    useEffect(() => {
        const handleOpenDirectMessage = (event: CustomEvent<{ userId: string; username: string; avatar_url: string | null }>) => {
            setPendingDirectMessage(event.detail);
            setShowMessages(true);
        };

        window.addEventListener('openDirectMessage', handleOpenDirectMessage as EventListener);
        return () => window.removeEventListener('openDirectMessage', handleOpenDirectMessage as EventListener);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            const response = await fetch(`${API_URL}/notifications/unread-count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.unread_count);
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    const fetchUnreadMessagesCount = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            const response = await fetch(`${API_URL}/messages/conversations?limit=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const totalUnread = (data.data || []).reduce(
                    (sum: number, conv: any) => sum + (conv.unread_count || 0),
                    0
                );
                setUnreadMessagesCount(totalUnread);
            }
        } catch (error) {
            console.error('Failed to fetch unread messages count:', error);
        }
    };

    const fetchNotifications = async (cursor?: string, forFullPanel?: boolean) => {
        try {
            if (!cursor) setIsLoadingNotifications(true);
            else setIsLoadingMore(true);

            const token = localStorage.getItem('auth_token');
            if (!token) return;

            const limit = forFullPanel ? 20 : 10;
            let url = `${API_URL}/notifications?limit=${limit}`;
            if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (forFullPanel) {
                    if (cursor) setAllNotifications(prev => [...prev, ...data.data]);
                    else setAllNotifications(data.data);
                    setNextCursor(data.next_cursor);
                    setHasMore(data.has_more);
                } else {
                    setNotifications(data.data);
                }
                setUnreadCount(data.unread_count);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoadingNotifications(false);
            setIsLoadingMore(false);
        }
    };

    const handleNotificationClick = () => {
        setShowNotifications(!showNotifications);
        setShowProfileMenu(false);
        if (!showNotifications) fetchNotifications();
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            await fetch(`${API_URL}/notifications/read-all`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    // Use shared time utility
    const formatTimeAgoLocal = formatTimeAgo;

    const handleNotificationItemClick = async (notification: NotificationItem) => {
        setShowNotifications(false);
        if (notification.post_id) {
            try {
                const authToken = localStorage.getItem('auth_token');
                if (!authToken) return;
                const response = await fetch(`${API_URL}/posts/${notification.post_id}`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setSelectedPost(data.data || data);
                }
            } catch (error) {
                console.error('Failed to fetch post:', error);
            }
        }
    };

    return (
        <>
            {/* Responsive Header - full width on mobile, offset on desktop */}
            <header className="fixed top-0 left-0 md:left-[126px] right-0 h-[70px] md:h-[110px] bg-bg-main z-30 pl-4 md:pl-20 pr-4 md:pr-20 flex items-center border-b border-white/5 md:border-0">
                <div className="w-full flex items-center justify-between gap-3 md:gap-8">

                    {/* Mobile Logo */}
                    <button
                        onClick={() => window.location.hash = 'feed'}
                        className="md:hidden flex-shrink-0"
                    >
                        <img src="https://i.ibb.co/84t6d1dq/image-removebg-preview-1-1.png" alt="Logo" className="h-[40px] w-auto object-contain" />
                    </button>

                    {/* Search Bar - Responsive */}
                    <div className="flex-1 max-w-[200px] sm:max-w-[300px] md:max-w-[526px]">
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if (searchValue.trim()) {
                                window.location.hash = `search?q=${encodeURIComponent(searchValue.trim())}`;
                            }
                        }} className="relative group">
                            <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 opacity-50 group-focus-within:opacity-100 transition-opacity">
                                <img src="/assets/images/search.svg" alt="" className="w-full h-full filter-white" />
                            </div>
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                placeholder="Tìm kiếm"
                                className="w-full bg-bg-secondary h-[44px] md:h-[62px] rounded-[12px] md:rounded-[20px] pl-[44px] md:pl-[66px] pr-4 md:pr-6 text-white placeholder-[#8f8f8f] text-[14px] md:text-[18px] focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                            />
                        </form>
                    </div>

                    {/* Action Icons - Responsive */}
                    <div className="flex items-center gap-2 md:gap-6">

                        {/* Notifications - First per Figma design */}
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={handleNotificationClick}
                                className={`w-[40px] h-[40px] md:w-[62px] md:h-[62px] bg-bg-secondary rounded-[12px] md:rounded-[20px] flex items-center justify-center transition-all group ${showNotifications ? 'bg-primary/20 ring-1 ring-primary/30' : 'hover:bg-bg-secondary/80'}`}
                            >
                                <img src="/assets/images/notification.svg" alt="" className={`w-5 h-5 md:w-6 md:h-6 filter-white transition-opacity ${showNotifications ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-[2px] right-[2px] md:top-[4px] md:right-[4px] w-[10px] h-[10px] md:w-[14px] md:h-[14px] bg-primary rounded-full border-2 border-bg-secondary"></span>
                                )}
                            </button>

                            {/* Notifications Dropdown (Figma-inspired minimal) */}
                            {showNotifications && (
                                <div className="absolute right-0 top-full mt-4 w-[350px] bg-bg-secondary border border-white/5 rounded-[20px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                                        <h3 className="font-montserrat font-bold text-white text-sm">THÔNG BÁO</h3>
                                        <button onClick={markAllAsRead} className="text-[10px] text-primary hover:underline">Đánh dấu đã đọc</button>
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="p-10 text-center text-[#7f7f7f] text-xs">Chưa có thông báo</div>
                                        ) : (
                                            notifications.map(n => (
                                                <div
                                                    key={n.id}
                                                    onClick={() => handleNotificationItemClick(n)}
                                                    className="px-6 py-4 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                                                >
                                                    <div className="flex gap-3">
                                                        <img src={getAvatarUrl(n.actor.avatar_url, n.actor.username)} className="w-8 h-8 rounded-lg object-cover" alt="" />
                                                        <div className="flex-1">
                                                            <p className="text-xs text-white leading-relaxed">{n.content}</p>
                                                            <p className="text-[10px] text-[#7f7f7f] mt-1">{formatTimeAgoLocal(n.created_at)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Messages - Second per Figma design */}
                        <button
                            onClick={() => setShowMessages(true)}
                            className="w-[40px] h-[40px] md:w-[62px] md:h-[62px] bg-bg-secondary rounded-[12px] md:rounded-[20px] flex items-center justify-center hover:bg-bg-secondary/80 transition-all relative group"
                        >
                            <img src="/assets/images/chat-header.svg" alt="" className="w-5 h-5 md:w-6 md:h-6 filter-white opacity-70 group-hover:opacity-100 transition-opacity" />
                            {unreadMessagesCount > 0 && (
                                <span className="absolute top-1 right-1 md:top-2 md:right-2 w-[8px] h-[8px] md:w-[10px] md:h-[10px] bg-red-500 rounded-full border-2 border-bg-secondary"></span>
                            )}
                        </button>

                        {/* Profile Menu */}
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className={`w-[40px] h-[40px] md:w-[62px] md:h-[62px] rounded-[12px] md:rounded-[20px] overflow-hidden border-2 transition-all ${showProfileMenu ? 'border-primary' : 'border-transparent'}`}
                            >
                                <img
                                    src={getAvatarUrl(user?.avatar_url, user?.username)}
                                    alt={user?.username || 'User'}
                                    className="w-full h-full object-cover"
                                />
                            </button>

                            {showProfileMenu && (
                                <div className="absolute right-0 top-full mt-4 w-[200px] bg-bg-secondary border border-white/5 rounded-[20px] shadow-2xl overflow-hidden">
                                    {(user?.is_superuser ||
                                        user?.role === 'ADMIN' ||
                                        user?.role === 'admin' ||
                                        (user as any)?.role === 'MODERATOR' ||
                                        (user as any)?.role === 'moderator') && (
                                            <button
                                                onClick={() => { onNavigate('admin'); setShowProfileMenu(false); }}
                                                className="w-full px-6 py-4 flex items-center gap-3 hover:bg-white/5 transition-colors text-white text-sm border-b border-white/5"
                                            >
                                                <LayoutDashboard size={16} className="text-primary" /> Quản trị
                                            </button>
                                        )}
                                    <button
                                        onClick={() => { onNavigate('profile'); setShowProfileMenu(false); }}
                                        className="w-full px-6 py-4 flex items-center gap-3 hover:bg-white/5 transition-colors text-white text-sm"
                                    >
                                        <UserIcon size={16} /> Hồ sơ
                                    </button>
                                    <button
                                        onClick={() => { onNavigate('settings'); setShowProfileMenu(false); }}
                                        className="w-full px-6 py-4 flex items-center gap-3 hover:bg-white/5 transition-colors text-white text-sm"
                                    >
                                        <Settings size={16} /> Cài đặt
                                    </button>
                                    <button
                                        onClick={() => logout()}
                                        className="w-full px-6 py-4 flex items-center gap-3 hover:bg-red-500/10 transition-colors text-red-400 text-sm"
                                    >
                                        <LogOut size={16} /> Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Modals and Overlays */}
            {selectedPost && (
                <PostDetailModal
                    post={selectedPost}
                    isOpen={!!selectedPost}
                    onClose={() => setSelectedPost(null)}
                    onPostUpdate={(updatedPost) => setSelectedPost(updatedPost)}
                />
            )}

            <Messages
                isOpen={showMessages}
                onClose={() => {
                    setShowMessages(false);
                    setPendingDirectMessage(null);
                }}
                onRefreshUnread={fetchUnreadMessagesCount}
                pendingDirectMessage={pendingDirectMessage}
                onDirectMessageOpened={() => setPendingDirectMessage(null)}
            />
        </>
    );
};

import React, { useState, useEffect } from 'react';
import { Search, User as UserIcon, Users, ChevronLeft, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface SearchUser {
    id: string;
    username: string;
    avatar_url: string | null;
    rank?: string;
    level?: number;
}

interface SearchResultsProps {
    query: string;
    onNavigate: (route: string) => void;
}

type TabType = 'users' | 'groups';

export const SearchResults: React.FC<SearchResultsProps> = ({ query, onNavigate }) => {
    const [activeTab, setActiveTab] = useState<TabType>('users');
    const [users, setUsers] = useState<SearchUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch users when query changes
    useEffect(() => {
        if (query) {
            searchUsers(query);
        }
    }, [query]);

    const searchUsers = async (q: string) => {
        if (!q.trim()) return;

        try {
            setIsLoading(true);
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            const response = await fetch(
                `${API_URL}/search/users?q=${encodeURIComponent(q)}&limit=20`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.ok) {
                const data = await response.json();
                setUsers(data.data || []);
            }
        } catch (error) {
            console.error('Failed to search users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserClick = (userId: string) => {
        window.location.hash = `profile/${userId}`;
    };

    const getRankColor = (rank?: string) => {
        if (!rank) return 'text-[#7f7f7f]';
        const rankLower = rank.toLowerCase();
        if (rankLower.includes('cao thủ') || rankLower.includes('thách đấu')) return 'text-red-400';
        if (rankLower.includes('tinh anh')) return 'text-purple-400';
        if (rankLower.includes('kim cương')) return 'text-cyan-400';
        if (rankLower.includes('bạch kim')) return 'text-emerald-400';
        if (rankLower.includes('vàng')) return 'text-yellow-400';
        if (rankLower.includes('bạc')) return 'text-slate-300';
        return 'text-amber-700';
    };

    return (
        <div className="w-full max-w-[1200px] pb-24 md:pb-20 pt-6 md:pt-10 px-4 md:px-10 animate-in fade-in duration-500">
            {/* Header section with Query info */}
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                    <button
                        onClick={() => window.history.back()}
                        className="p-2 rounded-xl bg-bg-secondary border border-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-[#7f7f7f]" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-montserrat font-bold text-white uppercase tracking-tight">
                            Tìm kiếm
                        </h1>
                        <p className="text-[#7f7f7f] text-sm">
                            {query ? `Kết quả cho "${query}"` : 'Nhập từ khóa để tìm kiếm'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation - Consistent with Profile */}
            <div className="flex border-b border-white/5 mb-8">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-8 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'users'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-[#7f7f7f] hover:text-white'
                        }`}
                >
                    <UserIcon className="w-4 h-4" />
                    Người dùng
                </button>
                <button
                    onClick={() => setActiveTab('groups')}
                    className={`flex items-center gap-2 px-8 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'groups'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-[#7f7f7f] hover:text-white'
                        }`}
                >
                    <Users className="w-4 h-4" />
                    Nhóm
                </button>
            </div>

            {/* Content Area */}
            <div className="space-y-4">
                {activeTab === 'users' ? (
                    <>
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                                <p className="text-[#7f7f7f] animate-pulse">Đang tìm kiếm...</p>
                            </div>
                        ) : users.length === 0 ? (
                            <div className="text-center py-20 bg-bg-secondary rounded-[20px] border border-white/5">
                                <Search className="w-16 h-16 mx-auto mb-4 text-[#7f7f7f] opacity-20" />
                                <h3 className="text-lg font-medium text-white mb-2">Không tìm thấy kết quả</h3>
                                <p className="text-[#7f7f7f] text-sm max-w-xs mx-auto">
                                    {query 
                                        ? `Chúng tôi không tìm thấy người dùng nào phù hợp với "${query}"` 
                                        : 'Thử tìm kiếm theo tên người dùng hoặc ID'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {users.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleUserClick(user.id)}
                                        className="group relative flex items-center gap-4 p-4 rounded-[20px] bg-bg-secondary border border-white/5 hover:border-primary/30 hover:bg-white/5 transition-all text-left overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronLeft className="w-4 h-4 text-primary rotate-180" />
                                        </div>

                                        {/* Avatar */}
                                        <div className="relative flex-shrink-0">
                                            {user.avatar_url ? (
                                                <img
                                                    src={user.avatar_url}
                                                    alt={user.username}
                                                    className="w-14 h-14 rounded-[12px] object-cover border-2 border-white/5 group-hover:border-primary/50 transition-colors"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-[12px] bg-primary/20 flex items-center justify-center border-2 border-white/5 group-hover:border-primary/50 transition-colors">
                                                    <span className="text-primary font-bold text-xl">
                                                        {user.username.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            {user.level && (
                                                <div className="absolute -bottom-1 -right-1 bg-bg-main px-1.5 py-0.5 rounded-md border border-white/10">
                                                    <span className="text-[9px] font-bold text-primary">LV.{user.level}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-montserrat font-bold text-white truncate group-hover:text-primary transition-colors">
                                                {user.username}
                                            </p>
                                            {user.rank && (
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <div className={`text-[10px] font-bold uppercase tracking-wider ${getRankColor(user.rank)}`}>
                                                        {user.rank}
                                                    </div>
                                                </div>
                                            )}
                                            <p className="text-[10px] text-[#7f7f7f] mt-1 truncate opacity-60">
                                                UID: {user.id.slice(0, 8)}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    /* Groups Tab - Styled consistent with empty states */
                    <div className="text-center py-24 bg-bg-secondary rounded-[20px] border border-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"></div>
                        <div className="relative z-10">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-[24px] bg-bg-main flex items-center justify-center border border-white/5">
                                <Users className="w-12 h-12 text-[#7f7f7f]" />
                            </div>
                            <h3 className="text-xl font-montserrat font-bold text-white mb-2 uppercase tracking-tight">Tính năng đang phát triển</h3>
                            <p className="text-sm text-[#7f7f7f] max-w-sm mx-auto">
                                Hệ thống tìm kiếm đội và nhóm đang được nâng cấp để mang lại trải nghiệm tốt nhất.
                            </p>
                            <div className="mt-8">
                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                                    Coming Soon
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

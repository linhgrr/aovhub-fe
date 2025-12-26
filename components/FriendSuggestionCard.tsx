import React from 'react';
import { UserPlus, Users, Award, Loader2 } from 'lucide-react';

interface FriendSuggestion {
    id: string;
    username: string;
    avatar_url: string | null;
    rank: string | null;
    level: number | null;
    mutual_friends_count: number;
    suggestion_score: number;
}

interface FriendSuggestionCardProps {
    suggestion: FriendSuggestion;
    onAddFriend: (userId: string) => Promise<void>;
    isLoading?: boolean;
}

const RANK_COLORS: Record<string, string> = {
    BRONZE: 'from-orange-600 to-orange-800',
    SILVER: 'from-gray-400 to-gray-600',
    GOLD: 'from-yellow-400 to-yellow-600',
    PLATINUM: 'from-cyan-400 to-cyan-600',
    DIAMOND: 'from-blue-400 to-blue-600',
    VETERAN: 'from-purple-500 to-purple-700',
    MASTER: 'from-pink-500 to-pink-700',
    CONQUEROR: 'from-red-500 to-red-700',
};

const RANK_LABELS: Record<string, string> = {
    BRONZE: 'Đồng',
    SILVER: 'Bạc',
    GOLD: 'Vàng',
    PLATINUM: 'Bạch Kim',
    DIAMOND: 'Kim Cương',
    VETERAN: 'Cao Thủ',
    MASTER: 'Tinh Anh',
    CONQUEROR: 'Chinh Phục',
};

export const FriendSuggestionCard: React.FC<FriendSuggestionCardProps> = ({
    suggestion,
    onAddFriend,
    isLoading = false,
}) => {
    const [isAdding, setIsAdding] = React.useState(false);

    const handleAddFriend = async () => {
        setIsAdding(true);
        try {
            await onAddFriend(suggestion.id);
        } catch (error) {
            console.error('Failed to send friend request:', error);
        } finally {
            setIsAdding(false);
        }
    };

    const rankGradient = suggestion.rank ? RANK_COLORS[suggestion.rank] : 'from-gray-500 to-gray-700';
    const rankLabel = suggestion.rank ? RANK_LABELS[suggestion.rank] : 'N/A';

    return (
        <div className="group relative bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200/50 dark:border-gray-700/50">
            {/* Background Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative flex items-center gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                        {suggestion.avatar_url ? (
                            <img
                                src={suggestion.avatar_url}
                                alt={suggestion.username}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center">
                                <span className="text-2xl font-bold text-white">
                                    {suggestion.username.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Level Badge */}
                    {suggestion.level && (
                        <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full px-2 py-0.5 text-xs font-bold text-white shadow-md">
                            {suggestion.level}
                        </div>
                    )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                        {suggestion.username}
                    </h3>

                    {/* Rank Badge */}
                    {suggestion.rank && (
                        <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-gradient-to-r ${rankGradient} text-white text-xs font-medium shadow-sm`}>
                            <Award className="w-3 h-3" />
                            <span>{rankLabel}</span>
                        </div>
                    )}

                    {/* Mutual Friends */}
                    {suggestion.mutual_friends_count > 0 && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-600 dark:text-gray-400">
                            <Users className="w-3 h-3" />
                            <span>{suggestion.mutual_friends_count} bạn chung</span>
                        </div>
                    )}
                </div>

                {/* Add Friend Button */}
                <button
                    onClick={handleAddFriend}
                    disabled={isAdding || isLoading}
                    className="flex-shrink-0 group/btn relative bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    {isAdding ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <UserPlus className="w-4 h-4 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-100 group-hover/btn:opacity-0 transition-opacity" />
                            <span className="opacity-0 group-hover/btn:opacity-100 transition-opacity text-sm">
                                Kết bạn
                            </span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Users, Clock, Trophy, Target, LogOut, ExternalLink } from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { useAuth } from '../contexts/authContext';
import { TeamDetail, TeamMemberInfo } from '../types';
import { TeamChat } from './TeamChat';
import { VoiceChat } from './VoiceChat';

interface TeamMemberDashboardProps {
    teamId: string;
    onBack: () => void;
}

// Helper to translate rank
const translateRank = (rank?: string): string => {
    const rankMap: Record<string, string> = {
        'BRONZE': 'Đồng',
        'SILVER': 'Bạc',
        'GOLD': 'Vàng',
        'PLATINUM': 'Bạch Kim',
        'DIAMOND': 'Kim Cương',
        'VETERAN': 'Tinh Anh',
        'MASTER': 'Cao Thủ',
        'CONQUEROR': 'Thách Đấu',
    };
    return rank ? rankMap[rank] || rank : 'Chưa xác định';
};

// Helper to translate game role
const translateRole = (role?: string): string => {
    const roleMap: Record<string, string> = {
        'TOP': 'Đường Caesar',
        'JUNGLE': 'Rừng',
        'MID': 'Đường Giữa',
        'AD': 'Xạ Thủ',
        'SUPPORT': 'Trợ Thủ',
    };
    return role ? roleMap[role] || role : '';
};

// Helper to get remaining time
const getRemainingTime = (expiresAt: string): string => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Đã hết hạn';

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const TeamMemberDashboard: React.FC<TeamMemberDashboardProps> = ({ teamId, onBack }) => {
    const { token } = useAuth();
    const [team, setTeam] = useState<TeamDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLeaving, setIsLeaving] = useState(false);
    const [remainingTime, setRemainingTime] = useState('');

    const fetchTeamData = useCallback(async () => {
        if (!token) return;

        try {
            const teamRes = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!teamRes.ok) throw new Error('Failed to fetch team');
            const teamData = await teamRes.json();
            setTeam(teamData);
            setRemainingTime(getRemainingTime(teamData.expires_at));
        } catch (err) {
            setError('Không thể tải thông tin team');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token, teamId]);

    useEffect(() => {
        fetchTeamData();
    }, [fetchTeamData]);

    // Update countdown every second
    useEffect(() => {
        if (!team) return;
        const interval = setInterval(() => {
            setRemainingTime(getRemainingTime(team.expires_at));
        }, 1000);
        return () => clearInterval(interval);
    }, [team]);

    const handleLeaveTeam = async () => {
        if (!token || !confirm('Bạn có chắc muốn rời khỏi phòng này?')) return;
        setIsLeaving(true);

        try {
            const res = await fetch(`${API_BASE_URL}/teams/${teamId}/leave`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Failed to leave');
            }
            onBack();
        } catch (err: any) {
            alert(err.message || 'Không thể rời phòng');
            setIsLeaving(false);
        }
    };

    const handleNavigateToProfile = (userId: string) => {
        window.location.hash = `profile/${userId}`;
    };

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto p-4 pt-6 flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !team) {
        return (
            <div className="max-w-3xl mx-auto p-4 pt-6">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4">
                    <ArrowLeft className="w-4 h-4" /> Quay lại
                </button>
                <div className="text-center text-red-400">{error || 'Team không tồn tại'}</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 pb-24 md:pb-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
                    <div className="w-8 h-8 bg-slate-800 border border-slate-600 group-hover:border-primary flex items-center justify-center rounded-lg transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span className="font-bold uppercase tracking-wide text-sm">Quay lại</span>
                </button>
                <button
                    onClick={handleLeaveTeam}
                    disabled={isLeaving}
                    className="flex items-center gap-2 bg-slate-700/50 text-slate-400 hover:bg-red-900/40 hover:text-red-400 pr-4 pl-3 py-2 border border-slate-600 hover:border-red-900/50 rounded-lg transition-all disabled:opacity-50 group"
                >
                    <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="font-bold uppercase tracking-wide text-sm">{isLeaving ? 'Đang rời...' : 'Rời phòng'}</span>
                </button>
            </div>

            {/* Team Info Card */}
            <div className="bg-slate-800/60 border border-slate-700/50 p-6 mb-8 relative overflow-hidden shadow-xl rounded-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-tl-xl rounded-bl-xl"></div>

                <div className="flex flex-col md:flex-row items-start justify-between mb-4 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 border border-blue-500/20 uppercase tracking-wider font-bold rounded">
                                Thành viên
                            </span>
                        </div>
                        <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wide glow-text mb-2">
                            {team.name}
                        </h1>
                        <div className="flex items-center gap-4 text-sm font-mono border-t border-slate-800 pt-3">
                            <span className={`text-primary font-bold flex items-center gap-1.5 ${getRemainingTime(team.expires_at) === 'Đã hết hạn' ? 'text-red-400' : ''}`}>
                                <Clock className="w-4 h-4" /> Còn {remainingTime}
                            </span>
                            <span className="text-slate-600">|</span>
                            <span className="text-slate-400 flex items-center gap-1.5 font-bold">
                                <Users className="w-4 h-4" /> {team.current_members}/{team.max_members} Thành viên
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4 md:mt-0">
                        <div className="bg-slate-800 border border-slate-600 p-2 text-center min-w-[100px] rounded-lg">
                            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Chế độ</div>
                            <div className="text-primary font-bold">{team.game_mode}</div>
                        </div>
                        <div className="bg-slate-800 border border-slate-600 p-2 text-center min-w-[100px] rounded-lg">
                            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Rank</div>
                            <div className="text-white font-bold">{translateRank(team.rank)}</div>
                        </div>
                    </div>
                </div>
                <p className="text-slate-300 italic border-l-2 border-slate-600 pl-4 py-2 bg-slate-800/30 text-sm">
                    "{team.description}"
                </p>
            </div>

            {/* Voice Chat Section at top */}
            <div className="mb-8">
                <VoiceChat teamId={teamId} />
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-start">
                {/* Current Members */}
                <div className="lg:col-span-1 bg-slate-800/60 border border-slate-700/50 shadow-lg rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                            <div className="w-2 h-2 bg-blue-500 rotate-45"></div>
                            Thành viên
                            <span className="bg-slate-700 text-blue-400 text-xs px-2 py-0.5 rounded-full">{team.members.length}/{team.max_members}</span>
                        </h2>
                    </div>
                    <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                        {team.members.map((member: TeamMemberInfo, index: number) => (
                            <div
                                key={member.id}
                                className={`flex items-center gap-3 p-3 bg-slate-800/30 border transition-all group rounded-lg ${index === 0 ? 'border-primary/50 bg-primary/5' : 'border-slate-700 hover:border-slate-500'}`}
                            >
                                <img
                                    src={member.avatar_url || 'https://via.placeholder.com/40'}
                                    alt={member.username}
                                    className={`w-10 h-10 object-cover bg-slate-800 rounded-lg ${index === 0 ? 'border-2 border-primary' : 'border border-slate-600'}`}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleNavigateToProfile(member.user_id)}
                                            className="text-white font-bold hover:text-primary transition-colors flex items-center gap-1 truncate"
                                        >
                                            {member.username}
                                            <ExternalLink className="w-3 h-3 text-slate-500" />
                                        </button>
                                        {index === 0 && (
                                            <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 font-bold uppercase tracking-wider rounded">
                                                Chủ phòng
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Trophy className="w-3 h-3 text-primary" />
                                            {translateRank(member.rank)}
                                        </span>
                                        {member.main_role && (
                                            <>
                                                <span className="text-slate-600">|</span>
                                                <span className="flex items-center gap-1 text-slate-300">
                                                    <Target className="w-3 h-3" />
                                                    {translateRole(member.main_role)}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Empty Slots */}
                        {Array.from({ length: team.max_members - team.members.length }).map((_, i) => (
                            <div key={`empty-${i}`} className="p-3 border border-dashed border-slate-700/50 bg-slate-900/20 flex items-center gap-3 opacity-50 rounded-lg">
                                <div className="w-10 h-10 object-cover bg-slate-800/50 rounded-lg flex items-center justify-center">
                                    <Users className="w-4 h-4 text-slate-600" />
                                </div>
                                <span className="text-sm text-slate-500 italic">Còn trống</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Team Chat */}
                <div className="lg:col-span-2">
                    {team.conversation_id && (
                        <TeamChat
                            conversationId={team.conversation_id}
                            teamName={team.name}
                            className="h-[600px] shadow-lg rounded-xl overflow-hidden border border-slate-700/50"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};



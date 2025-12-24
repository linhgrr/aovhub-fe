import React, { useState, useEffect, useCallback } from 'react';
import { Users, Clock, Trophy, ChevronLeft, ChevronRight, Filter, Settings, Plus, Eye, MessageSquare } from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { useAuth } from '../contexts/authContext';
import { TeamListItem, TeamDetail, TeamsResponse, CreateTeamInput, GameMode } from '../types';
import { TeamDetailModal } from './TeamDetailModal';
import { CreateTeamModal } from './CreateTeamModal';
import { TeamOwnerDashboard } from './TeamOwnerDashboard';
import { TeamMemberDashboard } from './TeamMemberDashboard';

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

// Helper to get remaining time
const getRemainingTime = (expiresAt: string): { text: string; urgent: boolean } => {
   const now = new Date();
   const expires = new Date(expiresAt);
   const diff = expires.getTime() - now.getTime();

   if (diff <= 0) return { text: 'Hết hạn', urgent: true };

   const minutes = Math.floor(diff / 60000);
   const seconds = Math.floor((diff % 60000) / 1000);

   return {
      text: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      urgent: minutes < 5
   };
};

const RANK_OPTIONS = [
   { value: '', label: 'Tất cả rank' },
   { value: 'BRONZE', label: 'Đồng' },
   { value: 'SILVER', label: 'Bạc' },
   { value: 'GOLD', label: 'Vàng' },
   { value: 'PLATINUM', label: 'Bạch Kim' },
   { value: 'DIAMOND', label: 'Kim Cương' },
   { value: 'VETERAN', label: 'Tinh Anh' },
   { value: 'MASTER', label: 'Cao Thủ' },
   { value: 'CONQUEROR', label: 'Thách Đấu' },
];

const PAGE_SIZE = 5;

export const LFG: React.FC = () => {
   const { token, user } = useAuth();

   // State
   const [teams, setTeams] = useState<TeamListItem[]>([]);
   const [loading, setLoading] = useState(true);
   const [page, setPage] = useState(1);
   const [total, setTotal] = useState(0);
   const [hasMore, setHasMore] = useState(false);
   const [rankFilter, setRankFilter] = useState('');

   // Modal states
   const [showCreateModal, setShowCreateModal] = useState(false);
   const [isCreating, setIsCreating] = useState(false);
   const [selectedTeam, setSelectedTeam] = useState<TeamDetail | null>(null);
   const [showDetailModal, setShowDetailModal] = useState(false);
   const [isJoining, setIsJoining] = useState(false);
   const [loadingTeamDetail, setLoadingTeamDetail] = useState<string | null>(null);

   // My team state
   const [myTeam, setMyTeam] = useState<TeamDetail | null>(null);
   const [showMyTeamDashboard, setShowMyTeamDashboard] = useState(false);
   
   // Joined team state (when user is a member but not owner)
   const [joinedTeam, setJoinedTeam] = useState<TeamDetail | null>(null);
   const [showJoinedTeamDashboard, setShowJoinedTeamDashboard] = useState(false);

   // Countdown refresh
   const [, setTick] = useState(0);

   // Fetch teams
   const fetchTeams = useCallback(async () => {
      if (!token) return;

      setLoading(true);
      try {
         let url = `${API_BASE_URL}/teams?page=${page}&page_size=${PAGE_SIZE}`;
         if (rankFilter) {
            url += `&rank=${rankFilter}`;
         }

         const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
         });

         if (!res.ok) throw new Error('Failed to fetch teams');

         const data: TeamsResponse = await res.json();
         setTeams(data.data);
         setTotal(data.total);
         setHasMore(data.has_more);
      } catch (err) {
         console.error('Error fetching teams:', err);
      } finally {
         setLoading(false);
      }
   }, [token, page, rankFilter]);

   // Fetch my team (as owner)
   const fetchMyTeam = useCallback(async () => {
      if (!token) return;

      try {
         const res = await fetch(`${API_BASE_URL}/teams/my-team`, {
            headers: { Authorization: `Bearer ${token}` },
         });

         if (res.ok) {
            const data = await res.json();
            setMyTeam(data);
         } else {
            setMyTeam(null);
         }
      } catch (err) {
         console.error('Error fetching my team:', err);
      }
   }, [token]);

   // Fetch joined team (as member, not owner)
   const fetchJoinedTeam = useCallback(async () => {
      if (!token) return;

      try {
         const res = await fetch(`${API_BASE_URL}/teams/joined`, {
            headers: { Authorization: `Bearer ${token}` },
         });

         if (res.ok) {
            const data = await res.json();
            setJoinedTeam(data);
         } else {
            setJoinedTeam(null);
         }
      } catch (err) {
         console.error('Error fetching joined team:', err);
      }
   }, [token]);

   useEffect(() => {
      fetchTeams();
      fetchMyTeam();
      fetchJoinedTeam();
   }, [fetchTeams, fetchMyTeam, fetchJoinedTeam]);

   // Update countdown every second
   useEffect(() => {
      const interval = setInterval(() => {
         setTick(t => t + 1);
      }, 1000);
      return () => clearInterval(interval);
   }, []);

   // Handlers
   const handleViewDetail = async (teamId: string) => {
      if (!token) return;

      setLoadingTeamDetail(teamId);
      try {
         const res = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
            headers: { Authorization: `Bearer ${token}` },
         });

         if (!res.ok) throw new Error('Failed to fetch team details');

         const data: TeamDetail = await res.json();
         setSelectedTeam(data);
         setShowDetailModal(true);
      } catch (err) {
         console.error('Error fetching team detail:', err);
         alert('Không thể tải thông tin team');
      } finally {
         setLoadingTeamDetail(null);
      }
   };

   const handleJoinRequest = async () => {
      if (!token || !selectedTeam) return;

      setIsJoining(true);
      try {
         const res = await fetch(`${API_BASE_URL}/teams/${selectedTeam.id}/join`, {
            method: 'POST',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: '' }),
         });

         if (!res.ok) {
            const data = await res.json();
            throw new Error(data.detail || 'Failed to send join request');
         }

         // Refresh the team detail to show updated status
         const updatedRes = await fetch(`${API_BASE_URL}/teams/${selectedTeam.id}`, {
            headers: { Authorization: `Bearer ${token}` },
         });
         if (updatedRes.ok) {
            const updatedData = await updatedRes.json();
            setSelectedTeam(updatedData);
         }

         alert('Đã gửi yêu cầu tham gia!');
      } catch (err: any) {
         alert(err.message || 'Không thể gửi yêu cầu');
      } finally {
         setIsJoining(false);
      }
   };

   const handleCreateTeam = async (data: CreateTeamInput) => {
      if (!token) return;

      setIsCreating(true);
      try {
         const res = await fetch(`${API_BASE_URL}/teams`, {
            method: 'POST',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
         });

         if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || 'Failed to create team');
         }

         setShowCreateModal(false);
         fetchTeams();
         fetchMyTeam();
      } catch (err: any) {
         alert(err.message || 'Không thể tạo phòng');
      } finally {
         setIsCreating(false);
      }
   };

   const handleRankFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setRankFilter(e.target.value);
      setPage(1); // Reset to first page when filter changes
   };

   const totalPages = Math.ceil(total / PAGE_SIZE);

   // Show owner dashboard if requested
   if (showMyTeamDashboard && myTeam) {
      return (
         <TeamOwnerDashboard
            teamId={myTeam.id}
            onBack={() => {
               setShowMyTeamDashboard(false);
               fetchTeams();
               fetchMyTeam();
               fetchJoinedTeam();
            }}
         />
      );
   }

   // Show member dashboard if requested
   if (showJoinedTeamDashboard && joinedTeam) {
      return (
         <TeamMemberDashboard
            teamId={joinedTeam.id}
            onBack={() => {
               setShowJoinedTeamDashboard(false);
               fetchTeams();
               fetchMyTeam();
               fetchJoinedTeam();
            }}
         />
      );
   }

   return (
      <div className="max-w-3xl mx-auto p-4 pb-24 md:pb-8 w-full pt-6">
         {/* Header */}
         <header className="bg-bg-secondary rounded-[16px] border border-white/5 p-4 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div>
                  <span className="text-primary text-[13px] font-medium tracking-wide">Tìm Đồng Đội</span>
                  <h2 className="text-white text-[22px] md:text-[28px] font-bold mt-1 tracking-tight">Sảnh Chờ</h2>
                  <div className="flex items-center gap-2 mt-2">
                     <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                     <p className="text-white/40 text-[13px]">{total} phòng đang mở</p>
                  </div>
               </div>
               <div className="flex gap-2 w-full md:w-auto">
                  {myTeam ? (
                     <button
                        onClick={() => setShowMyTeamDashboard(true)}
                        className="flex-1 md:flex-none bg-white/5 hover:bg-white/10 text-white font-semibold py-2.5 px-6 rounded-full transition-all flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 text-[13px]"
                     >
                        <Settings className="w-4 h-4" />
                        Phòng của tôi
                     </button>
                  ) : joinedTeam ? (
                     <button
                        onClick={() => setShowJoinedTeamDashboard(true)}
                        className="flex-1 md:flex-none bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-semibold py-2.5 px-6 rounded-full transition-all flex items-center justify-center gap-2 border border-blue-500/30 text-[13px]"
                     >
                        <MessageSquare className="w-4 h-4" />
                        Phòng đã tham gia
                     </button>
                  ) : (
                     <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 px-6 rounded-full shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 text-[13px]"
                     >
                        <Plus className="w-4 h-4" />
                        Tạo phòng
                     </button>
                  )}
               </div>
            </div>
         </header>

         {/* Filters */}
         <div className="flex items-center gap-4 mb-6 bg-bg-secondary p-3 rounded-[12px] border border-white/5">
            <div className="flex items-center gap-2 px-2">
               <Filter className="w-4 h-4 text-primary" />
               <span className="text-[13px] font-medium text-white/40 mr-2">Bộ lọc:</span>
               <select
                  value={rankFilter}
                  onChange={handleRankFilterChange}
                  className="bg-black/30 border border-white/10 text-white px-3 py-1.5 text-[13px] focus:border-primary/50 focus:outline-none transition-all rounded-lg"
               >
                  {RANK_OPTIONS.map(opt => (
                     <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
               </select>
            </div>
         </div>

         {/* Teams List */}
         {loading ? (
            <div className="flex items-center justify-center h-64">
               <div className="relative">
                  <div className="w-12 h-12 border-4 border-white/10 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
               </div>
            </div>
         ) : teams.length === 0 ? (
            <div className="bg-bg-secondary rounded-[16px] border border-white/5 p-12 text-center">
               <div className="w-20 h-20 bg-white/5 rounded-full mx-auto flex items-center justify-center mb-6">
                  <Users className="w-10 h-10 text-white/20" />
               </div>
               <h3 className="text-lg font-semibold text-white mb-2">Không tìm thấy phòng</h3>
               <p className="text-white/40 text-[13px]">
                  {rankFilter ? 'Thử thay đổi bộ lọc hoặc ' : ''}Hãy tạo phòng mới để tìm đồng đội!
               </p>
            </div>
         ) : (
            <div className="space-y-4">
               {teams.map(team => {
                  const remaining = getRemainingTime(team.expires_at);
                  return (
                     <div key={team.id} className="bg-bg-secondary relative border border-white/5 hover:border-primary/30 rounded-[16px] transition-all duration-300 group overflow-hidden">
                        <div className="p-4 md:p-5 relative z-10 flex flex-col md:flex-row gap-4 md:gap-6">
                           {/* Left: Owner Info */}
                           <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:w-1/5 md:min-w-[140px] border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0 md:pr-4">
                              <div className="relative group-hover:scale-105 transition-transform">
                                 <img
                                    src={team.owner.avatar_url || 'https://via.placeholder.com/56'}
                                    alt={team.owner.username}
                                    className="w-14 h-14 object-cover rounded-full ring-2 ring-white/5 group-hover:ring-primary/30 transition-colors"
                                 />
                                 <div className="absolute -bottom-1 -right-1 bg-primary/20 text-[9px] text-primary px-1.5 py-0.5 font-medium rounded-full">
                                    Host
                                 </div>
                              </div>
                              <div>
                                 <h3 className="font-semibold text-white text-[14px] leading-tight truncate max-w-[120px]">{team.owner.username}</h3>
                                 {team.owner.win_rate && (
                                    <div className="text-[11px] text-white/40 mt-1">
                                       WR: <span className="text-green-400 font-semibold">{team.owner.win_rate.toFixed(1)}%</span>
                                    </div>
                                 )}
                                 <div className="mt-2">
                                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${team.rank === 'DIAMOND' || team.rank === 'MASTER' || team.rank === 'CONQUEROR'
                                       ? 'bg-purple-500/20 text-purple-400'
                                       : 'bg-white/5 text-white/60'
                                       }`}>
                                       {translateRank(team.rank)}
                                    </span>
                                 </div>
                              </div>
                           </div>

                           {/* Middle: Team Info */}
                           <div className="flex-1 flex flex-col justify-between">
                              <div>
                                 <div className="flex items-center gap-2 mb-2">
                                    <Trophy className="w-4 h-4 text-primary" />
                                    <span className="text-[11px] font-semibold text-primary">{team.game_mode}</span>
                                    {remaining.urgent && (
                                       <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full ml-auto animate-pulse font-medium">Sắp hết hạn</span>
                                    )}
                                 </div>
                                 <h4 className="text-white font-semibold text-[16px] md:text-[18px] mb-2">{team.name}</h4>
                                 <p className="text-white/40 text-[13px] line-clamp-2 leading-relaxed">
                                    {team.description}
                                 </p>
                              </div>

                              <div className="flex gap-4 mt-4 text-[12px] border-t border-white/5 pt-3">
                                 <span className={`flex items-center gap-1.5 font-medium ${remaining.urgent ? 'text-red-400' : 'text-white/40'}`}>
                                    <Clock className="w-3.5 h-3.5" />
                                    {remaining.text}
                                 </span>
                                 <span className="flex items-center gap-1.5 text-blue-400 font-medium">
                                    <Users className="w-3.5 h-3.5" />
                                    {team.current_members}/{team.max_members}
                                 </span>
                              </div>
                           </div>

                           {/* Right: Actions */}
                           <div className="flex flex-row md:flex-col justify-end md:justify-center items-center gap-2">
                              <button
                                 onClick={() => handleViewDetail(team.id)}
                                 disabled={loadingTeamDetail === team.id}
                                 className="flex-1 md:w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 text-white font-medium py-2.5 px-4 rounded-full transition-all text-[13px] flex items-center justify-center gap-2"
                              >
                                 {loadingTeamDetail === team.id ? (
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                 ) : (
                                    <>
                                       <Eye className="w-4 h-4" />
                                       Chi tiết
                                    </>
                                 )}
                              </button>
                           </div>
                        </div>
                     </div>
                  );
               })}
            </div>
         )}

         {/* Pagination */}
         {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
               <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-10 h-10 flex items-center justify-center bg-bg-secondary border border-white/5 text-white/40 hover:text-white hover:border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-full"
               >
                  <ChevronLeft className="w-5 h-5" />
               </button>
               <span className="text-white/40 text-[13px] bg-bg-secondary px-4 py-2 rounded-full border border-white/5">
                  Trang <span className="text-white font-semibold">{page}</span> / {totalPages}
               </span>
               <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={!hasMore}
                  className="w-10 h-10 flex items-center justify-center bg-bg-secondary border border-white/5 text-white/40 hover:text-white hover:border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-full"
               >
                  <ChevronRight className="w-5 h-5" />
               </button>
            </div>
         )}

         {/* Empty State for Create */}
         {!loading && teams.length > 0 && (
            <div className="border border-dashed border-white/10 rounded-[16px] p-6 text-center opacity-60 hover:opacity-100 transition-opacity cursor-pointer bg-bg-secondary mt-6" onClick={() => !myTeam && setShowCreateModal(true)}>
               <div className="w-12 h-12 bg-white/5 rounded-full mx-auto flex items-center justify-center mb-3">
                  <Users className="w-6 h-6 text-white/30" />
               </div>
               <h3 className="text-white font-semibold mb-1 text-[14px]">Không tìm thấy phòng phù hợp?</h3>
               <p className="text-white/40 text-[13px]">
                  {myTeam ? 'Bạn đang có phòng hoạt động' : 'Tự tạo phòng và rủ rê bạn bè ngay'}
               </p>
            </div>
         )}

         {/* Modals */}
         <CreateTeamModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateTeam}
            isCreating={isCreating}
         />

         {selectedTeam && (
            <TeamDetailModal
               team={selectedTeam}
               isOpen={showDetailModal}
               onClose={() => {
                  setShowDetailModal(false);
                  setSelectedTeam(null);
               }}
               onJoinRequest={handleJoinRequest}
               isJoining={isJoining}
            />
         )}
      </div>
   );
};
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/authContext';
import { UserPlus, Users, Check, X, Loader, User, Crown, ChevronRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Rank display mapping
const RANK_DISPLAY: Record<string, string> = {
  BRONZE: 'Đồng',
  SILVER: 'Bạc',
  GOLD: 'Vàng',
  PLATINUM: 'Bạch Kim',
  DIAMOND: 'Kim Cương',
  VETERAN: 'Tinh Anh',
  MASTER: 'Cao Thủ',
  CONQUEROR: 'Thách Đấu',
};

interface FriendData {
  id: string;
  username: string;
  avatar_url: string | null;
  rank: string | null;
  level: number | null;
}

interface PendingRequest {
  friendship_id: string;
  requester: FriendData;
  created_at: string;
}

export const Friends: React.FC = () => {
  const { token, isAuthenticated } = useAuth();
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  // Fetch friends list
  useEffect(() => {
    const fetchFriends = async () => {
      if (!token) return;
      
      try {
        const response = await fetch(`${API_URL}/friends`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setFriends(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch friends:', error);
      } finally {
        setIsLoadingFriends(false);
      }
    };

    fetchFriends();
  }, [token]);

  // Fetch pending requests
  useEffect(() => {
    const fetchPending = async () => {
      if (!token) return;
      
      try {
        const response = await fetch(`${API_URL}/friends/pending`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setPendingRequests(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch pending requests:', error);
      } finally {
        setIsLoadingPending(false);
      }
    };

    fetchPending();
  }, [token]);

  const handleRespondToRequest = async (friendshipId: string, accept: boolean) => {
    if (!token) return;
    setRespondingTo(friendshipId);
    
    try {
      const response = await fetch(`${API_URL}/friends/respond/${friendshipId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accept }),
      });

      if (response.ok) {
        // Remove from pending list
        const acceptedRequest = pendingRequests.find(r => r.friendship_id === friendshipId);
        setPendingRequests(prev => prev.filter(r => r.friendship_id !== friendshipId));
        
        // If accepted, add to friends list
        if (accept && acceptedRequest) {
          setFriends(prev => [...prev, acceptedRequest.requester]);
        }
      }
    } catch (error) {
      console.error('Failed to respond to request:', error);
    } finally {
      setRespondingTo(null);
    }
  };

  const handleViewProfile = (userId: string) => {
    window.location.hash = `profile/${userId}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Vui lòng đăng nhập để xem danh sách bạn bè</p>
          <button 
            onClick={() => window.location.hash = 'login'}
            className="mt-4 bg-gold-500 text-slate-900 font-bold py-2 px-6 rounded hover:bg-gold-400 transition-colors"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24 md:pb-8 w-full animate-fade-in pt-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bakbak font-bold text-white flex items-center gap-4 uppercase">
          <Users className="w-8 h-8 text-primary" />
          BẠN BÈ
        </h1>
        <p className="text-[#7f7f7f] mt-2 font-montserrat text-sm uppercase tracking-widest">Quản lý danh sách bạn bè và lời mời kết bạn</p>
      </div>

      {/* Pending Friend Requests Section */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-6">
          <UserPlus className="w-4 h-4 text-primary" />
          <h2 className="text-[12px] font-montserrat font-extrabold text-white uppercase tracking-wider">LỜI MỜI KẾT BẠN</h2>
          {pendingRequests.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </div>

        <div className="bg-bg-secondary rounded-[20px] overflow-hidden border border-white/5 shadow-xl">
          {isLoadingPending ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-12 text-[#7f7f7f]">
              <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Không có lời mời kết bạn nào</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {pendingRequests.map((request) => (
                <div key={request.friendship_id} className="p-6 flex items-center gap-4 hover:bg-white/5 transition-colors">
                  {/* Avatar */}
                  <div 
                    className="w-14 h-14 rounded-[15px] overflow-hidden border-2 border-white/5 cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleViewProfile(request.requester.id)}
                  >
                    <img 
                      src={request.requester.avatar_url || '/assets/images/home.svg'} 
                      alt={request.requester.username}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div 
                      className="font-montserrat font-bold text-white text-[15px] truncate cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleViewProfile(request.requester.id)}
                    >
                      {request.requester.username}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#7f7f7f] mt-1">
                      {request.requester.rank && (
                        <span className="flex items-center gap-1.5 text-primary/80">
                          <Crown className="w-3 h-3" />
                          {RANK_DISPLAY[request.requester.rank] || request.requester.rank}
                        </span>
                      )}
                      {request.requester.level && (
                        <span className="bg-bg-main px-2 py-0.5 rounded border border-white/5 text-[10px]">Lv.{request.requester.level}</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    {respondingTo === request.friendship_id ? (
                      <Loader className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                      <>
                        <button
                          onClick={() => handleRespondToRequest(request.friendship_id, true)}
                          className="w-10 h-10 bg-primary/20 text-primary rounded-[12px] flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/10"
                          title="Chấp nhận"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleRespondToRequest(request.friendship_id, false)}
                          className="w-10 h-10 bg-white/5 text-[#7f7f7f] rounded-[12px] flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all"
                          title="Từ chối"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Friends List Section */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-4 h-4 text-primary" />
          <h2 className="text-[12px] font-montserrat font-extrabold text-white uppercase tracking-wider">DANH SÁCH BẠN BÈ</h2>
          <span className="bg-bg-secondary text-[#7f7f7f] text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/5">
            {friends.length}
          </span>
        </div>

        <div className="bg-bg-secondary rounded-[20px] overflow-hidden border border-white/5 shadow-xl">
          {isLoadingFriends ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-16 text-[#7f7f7f]">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="mb-2">Chưa có bạn bè nào</p>
              <p className="text-xs uppercase tracking-widest opacity-60">Tìm kiếm và kết bạn ngay!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-y divide-white/5">
              {friends.map((friend) => (
                <div 
                  key={friend.id} 
                  className="p-6 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer group"
                  onClick={() => handleViewProfile(friend.id)}
                >
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-[15px] overflow-hidden border-2 border-white/5 group-hover:border-primary transition-colors flex-shrink-0">
                    <img 
                      src={friend.avatar_url || '/assets/images/home.svg'} 
                      alt={friend.username}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-montserrat font-bold text-white text-[15px] truncate group-hover:text-primary transition-colors">
                      {friend.username}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#7f7f7f] mt-1">
                      {friend.rank && (
                        <span className="flex items-center gap-1.5 text-primary/80">
                          <Crown className="w-3 h-3" />
                          {RANK_DISPLAY[friend.rank] || friend.rank}
                        </span>
                      )}
                      {friend.level && (
                        <span className="bg-bg-main px-2 py-0.5 rounded border border-white/5 text-[10px]">Lv.{friend.level}</span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

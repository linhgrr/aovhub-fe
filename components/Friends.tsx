import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/authContext';
import { UserPlus, Users, Check, X, Loader, User, Crown, ChevronRight, Trash2, MessageCircle } from 'lucide-react';

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
  const [removingFriend, setRemovingFriend] = useState<string | null>(null);
  const [friendToRemove, setFriendToRemove] = useState<FriendData | null>(null);

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

  const handleRemoveFriend = async (userId: string) => {
    if (!token) return;
    setRemovingFriend(userId);

    try {
      const response = await fetch(`${API_URL}/friends/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remove from friends list
        setFriends(prev => prev.filter(f => f.id !== userId));
        setFriendToRemove(null);
      }
    } catch (error) {
      console.error('Failed to remove friend:', error);
    } finally {
      setRemovingFriend(null);
    }
  };

  const handleMessageFriend = (friend: FriendData) => {
    // Dispatch custom event to open Messages modal and start chat with this friend
    window.dispatchEvent(new CustomEvent('openDirectMessage', {
      detail: {
        userId: friend.id,
        username: friend.username,
        avatar_url: friend.avatar_url
      }
    }));
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
    <div className="max-w-3xl mx-auto p-4 pb-24 md:pb-8 w-full pt-6">
      {/* Header */}
      <div className="bg-bg-secondary rounded-[16px] border border-white/5 p-4 md:p-6 mb-6">
        <span className="text-primary text-[13px] font-medium tracking-wide">Kết nối</span>
        <h1 className="text-white text-[22px] md:text-[28px] font-bold mt-1 tracking-tight flex items-center gap-3">
          <Users className="w-7 h-7 text-primary" />
          Bạn bè
        </h1>
        <p className="text-white/40 text-[13px] mt-2">Danh sách bạn bè và lời mời kết bạn</p>
      </div>

      {/* Pending Friend Requests Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-4 h-4 text-primary" />
          <h2 className="text-[13px] font-semibold text-white">Lời mời kết bạn</h2>
          {pendingRequests.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </div>

        <div className="bg-bg-secondary rounded-[16px] overflow-hidden border border-white/5">
          {isLoadingPending ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-10 text-white/40">
              <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-[13px]">Không có lời mời kết bạn nào</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {pendingRequests.map((request) => (
                <div key={request.friendship_id} className="p-4 md:p-5 flex items-center gap-4 hover:bg-white/5 transition-colors">
                  {/* Avatar */}
                  <div
                    className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/5 cursor-pointer hover:ring-primary/30 transition-colors"
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
                      className="font-semibold text-white text-[14px] truncate cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleViewProfile(request.requester.id)}
                    >
                      {request.requester.username}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-white/40 mt-1">
                      {request.requester.rank && (
                        <span className="flex items-center gap-1.5 text-primary/70">
                          <Crown className="w-3 h-3" />
                          {RANK_DISPLAY[request.requester.rank] || request.requester.rank}
                        </span>
                      )}
                      {request.requester.level && (
                        <span className="bg-white/5 px-2 py-0.5 rounded-full text-[10px]">Lv.{request.requester.level}</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {respondingTo === request.friendship_id ? (
                      <Loader className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                      <>
                        <button
                          onClick={() => handleRespondToRequest(request.friendship_id, true)}
                          className="w-9 h-9 bg-primary/20 text-primary rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                          title="Chấp nhận"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRespondToRequest(request.friendship_id, false)}
                          className="w-9 h-9 bg-white/5 text-white/40 rounded-full flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all"
                          title="Từ chối"
                        >
                          <X className="w-4 h-4" />
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
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-primary" />
          <h2 className="text-[13px] font-semibold text-white">Danh sách bạn bè</h2>
          <span className="bg-white/5 text-white/40 text-[10px] font-medium px-2 py-0.5 rounded-full">
            {friends.length}
          </span>
        </div>

        <div className="bg-bg-secondary rounded-[16px] overflow-hidden border border-white/5">
          {isLoadingFriends ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-[14px] mb-1">Chưa có bạn bè nào</p>
              <p className="text-[12px] text-white/30">Tìm kiếm và kết bạn ngay!</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="p-4 md:p-5 flex items-center gap-4 hover:bg-white/5 transition-colors group"
                >
                  {/* Avatar */}
                  <div
                    className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/5 group-hover:ring-primary/30 transition-colors flex-shrink-0 cursor-pointer"
                    onClick={() => handleViewProfile(friend.id)}
                  >
                    <img
                      src={friend.avatar_url || '/assets/images/home.svg'}
                      alt={friend.username}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleViewProfile(friend.id)}
                  >
                    <div className="font-semibold text-white text-[14px] truncate group-hover:text-primary transition-colors">
                      {friend.username}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-white/40 mt-1">
                      {friend.rank && (
                        <span className="flex items-center gap-1.5 text-primary/70">
                          <Crown className="w-3 h-3" />
                          {RANK_DISPLAY[friend.rank] || friend.rank}
                        </span>
                      )}
                      {friend.level && (
                        <span className="bg-white/5 px-2 py-0.5 rounded-full text-[10px]">Lv.{friend.level}</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMessageFriend(friend);
                      }}
                      className="w-9 h-9 rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center"
                      title="Nhắn tin"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFriendToRemove(friend);
                      }}
                      className="w-9 h-9 rounded-full bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-400 transition-all flex items-center justify-center"
                      title="Xóa bạn"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Remove Friend Confirmation Modal */}
      {friendToRemove && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setFriendToRemove(null)}
          />

          {/* Modal */}
          <div className="relative bg-bg-secondary border border-white/10 w-full max-w-md shadow-2xl rounded-[20px] p-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center">
              {/* Icon */}
              <div className="w-14 h-14 rounded-full bg-red-500/20 mx-auto mb-4 flex items-center justify-center">
                <Trash2 className="w-7 h-7 text-red-400" />
              </div>

              {/* Title */}
              <h3 className="text-[18px] font-semibold text-white mb-2">
                Xóa bạn bè?
              </h3>

              {/* Description */}
              <p className="text-white/40 text-[13px] mb-6">
                Bạn có chắc chắn muốn xóa <span className="text-white font-semibold">{friendToRemove.username}</span> khỏi danh sách bạn bè?
              </p>

              {/* Friend Info */}
              <div className="bg-black/30 rounded-[12px] p-4 mb-6 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-white/5">
                  <img
                    src={friendToRemove.avatar_url || '/assets/images/home.svg'}
                    alt={friendToRemove.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-white text-[14px]">
                    {friendToRemove.username}
                  </div>
                  <div className="text-[11px] text-white/40 flex items-center gap-2 mt-0.5">
                    {friendToRemove.rank && (
                      <span className="flex items-center gap-1 text-primary/70">
                        <Crown className="w-3 h-3" />
                        {RANK_DISPLAY[friendToRemove.rank]}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setFriendToRemove(null)}
                  disabled={removingFriend === friendToRemove.id}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 font-medium py-3 rounded-full border border-white/10 transition-colors disabled:opacity-50 text-[13px]"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleRemoveFriend(friendToRemove.id)}
                  disabled={removingFriend === friendToRemove.id}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold py-3 rounded-full transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 text-[13px]"
                >
                  {removingFriend === friendToRemove.id ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    'Xóa bạn'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Trash2, Send, ChevronDown } from 'lucide-react';
import { HashtagText } from './HashtagText';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface CommentAuthor {
    id: string;
    username: string;
    avatar_url: string | null;
}

interface ReelComment {
    id: string;
    reel_id: string;
    author_id: string;
    author: CommentAuthor;
    content: string;
    parent_id: string | null;
    reply_to_user_id: string | null;
    reply_to_username: string | null;
    like_count: number;
    reply_count: number;
    is_liked: boolean;
    created_at: string;
}

interface ReelCommentsPanelProps {
    reelId: string;
    isOpen: boolean;
    onClose: () => void;
    onCommentCountUpdate?: (count: number) => void;
}

const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin}p`;
    if (diffHour < 24) return `${diffHour}h`;
    if (diffDay < 7) return `${diffDay}d`;
    return date.toLocaleDateString('vi-VN');
};

export const ReelCommentsPanel: React.FC<ReelCommentsPanelProps> = ({
    reelId,
    isOpen,
    onClose,
    onCommentCountUpdate,
}) => {
    const [comments, setComments] = useState<ReelComment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
    const [expandedReplies, setExpandedReplies] = useState<Record<string, ReelComment[]>>({});
    const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});
    const [currentUserId, setCurrentUserId] = useState<string>('');

    const inputRef = useRef<HTMLInputElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const token = localStorage.getItem('auth_token');

    useEffect(() => {
        // Get current user ID from token
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentUserId(payload.sub);
            } catch (e) {
                console.error('Failed to parse token');
            }
        }
    }, [token]);

    useEffect(() => {
        if (isOpen && reelId) {
            loadComments();
        }
    }, [isOpen, reelId]);

    useEffect(() => {
        if (replyingTo && inputRef.current) {
            setCommentText(`@${replyingTo.username} `);
            inputRef.current.focus();
        }
    }, [replyingTo]);

    const loadComments = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/reels/${reelId}/comments`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const result = await response.json();
                setComments(result.data || []);
            }
        } catch (err) {
            console.error('Failed to load comments:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadReplies = async (commentId: string) => {
        if (!token || loadingReplies[commentId]) return;

        setLoadingReplies(prev => ({ ...prev, [commentId]: true }));
        try {
            const response = await fetch(`${API_URL}/reels/comments/${commentId}/replies`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const result = await response.json();
                setExpandedReplies(prev => ({ ...prev, [commentId]: result.data || [] }));
            }
        } catch (err) {
            console.error('Failed to load replies:', err);
        } finally {
            setLoadingReplies(prev => ({ ...prev, [commentId]: false }));
        }
    };

    const handleSubmit = async () => {
        if (!commentText.trim() || !token || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const body: any = { content: commentText };
            if (replyingTo) {
                body.parent_id = replyingTo.id;
            }

            const response = await fetch(`${API_URL}/reels/${reelId}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                const newComment = await response.json();

                if (replyingTo) {
                    setExpandedReplies(prev => ({
                        ...prev,
                        [replyingTo.id]: [newComment, ...(prev[replyingTo.id] || [])],
                    }));
                    setComments(prev => prev.map(c =>
                        c.id === replyingTo.id ? { ...c, reply_count: c.reply_count + 1 } : c
                    ));
                } else {
                    setComments(prev => [newComment, ...prev]);
                }

                if (onCommentCountUpdate) {
                    onCommentCountUpdate(comments.length + 1);
                }

                setCommentText('');
                setReplyingTo(null);
            }
        } catch (err) {
            console.error('Failed to submit comment:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLike = async (commentId: string, isReply: boolean = false, parentId?: string) => {
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/reels/comments/${commentId}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const result = await response.json();

                if (isReply && parentId) {
                    setExpandedReplies(prev => ({
                        ...prev,
                        [parentId]: prev[parentId]?.map(c =>
                            c.id === commentId ? { ...c, is_liked: result.is_liked, like_count: result.like_count } : c
                        ) || [],
                    }));
                } else {
                    setComments(prev => prev.map(c =>
                        c.id === commentId ? { ...c, is_liked: result.is_liked, like_count: result.like_count } : c
                    ));
                }
            }
        } catch (err) {
            console.error('Failed to like comment:', err);
        }
    };

    const handleDelete = async (commentId: string, isReply: boolean = false, parentId?: string) => {
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/reels/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                if (isReply && parentId) {
                    setExpandedReplies(prev => ({
                        ...prev,
                        [parentId]: prev[parentId]?.filter(c => c.id !== commentId) || [],
                    }));
                    setComments(prev => prev.map(c =>
                        c.id === parentId ? { ...c, reply_count: Math.max(0, c.reply_count - 1) } : c
                    ));
                } else {
                    const deleted = comments.find(c => c.id === commentId);
                    setComments(prev => prev.filter(c => c.id !== commentId));
                    if (onCommentCountUpdate && deleted) {
                        onCommentCountUpdate(Math.max(0, comments.length - 1 - deleted.reply_count));
                    }
                }
            }
        } catch (err) {
            console.error('Failed to delete comment:', err);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
        if (e.key === 'Escape') {
            if (replyingTo) {
                setReplyingTo(null);
                setCommentText('');
            } else {
                onClose();
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Panel */}
            <div
                ref={panelRef}
                className="relative bg-bg-secondary rounded-t-[24px] w-full max-w-lg max-h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-300"
            >
                {/* Handle */}
                <div className="flex justify-center py-3">
                    <div className="w-10 h-1 bg-white/20 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 pb-3 border-b border-white/10">
                    <h3 className="font-montserrat font-bold text-white text-[15px]">
                        Bình luận
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5 text-white/60" />
                    </button>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        </div>
                    ) : comments.length === 0 ? (
                        <p className="text-center text-[#7f7f7f] text-[13px] py-8">
                            Chưa có bình luận nào
                        </p>
                    ) : (
                        comments.map(comment => (
                            <div key={comment.id}>
                                {/* Root Comment */}
                                <div className="flex gap-3">
                                    <a href={`#profile/${comment.author.id}`}>
                                        {comment.author.avatar_url ? (
                                            <img
                                                src={comment.author.avatar_url}
                                                alt={comment.author.username}
                                                className="w-9 h-9 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                                                <span className="text-white font-bold text-sm">
                                                    {comment.author.username.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                    </a>
                                    <div className="flex-1 min-w-0">
                                        <div className="bg-white/5 rounded-[14px] px-4 py-2.5 inline-block max-w-full">
                                            <a
                                                href={`#profile/${comment.author.id}`}
                                                className="font-semibold text-white text-[12px] hover:text-primary transition-colors"
                                            >
                                                {comment.author.username}
                                            </a>
                                            <p className="text-white/80 text-[13px] mt-0.5 break-words">
                                                <HashtagText content={comment.content} />
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1.5 ml-1 text-[11px]">
                                            <span className="text-[#7f7f7f]">{formatTime(comment.created_at)}</span>
                                            <button
                                                onClick={() => handleLike(comment.id)}
                                                className={`font-semibold transition-colors ${comment.is_liked ? 'text-primary' : 'text-[#7f7f7f] hover:text-white'
                                                    }`}
                                            >
                                                Thích {comment.like_count > 0 && `(${comment.like_count})`}
                                            </button>
                                            <button
                                                onClick={() => setReplyingTo({ id: comment.id, username: comment.author.username })}
                                                className="font-semibold text-[#7f7f7f] hover:text-white transition-colors"
                                            >
                                                Trả lời
                                            </button>
                                            {comment.author_id === currentUserId && (
                                                <button
                                                    onClick={() => handleDelete(comment.id)}
                                                    className="text-[#7f7f7f] hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Replies Section */}
                                        {comment.reply_count > 0 && (
                                            <div className="mt-2">
                                                {!expandedReplies[comment.id] ? (
                                                    <button
                                                        onClick={() => loadReplies(comment.id)}
                                                        className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                                                        disabled={loadingReplies[comment.id]}
                                                    >
                                                        {loadingReplies[comment.id] ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <ChevronDown className="w-3 h-3" />
                                                                Xem {comment.reply_count} phản hồi
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <div className="space-y-3 mt-2 pl-3 border-l-2 border-white/10">
                                                        {expandedReplies[comment.id]?.map(reply => (
                                                            <div key={reply.id} className="flex gap-2">
                                                                <a href={`#profile/${reply.author.id}`}>
                                                                    {reply.author.avatar_url ? (
                                                                        <img
                                                                            src={reply.author.avatar_url}
                                                                            alt={reply.author.username}
                                                                            className="w-7 h-7 rounded-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                                                                            <span className="text-white font-bold text-xs">
                                                                                {reply.author.username.charAt(0).toUpperCase()}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </a>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="bg-white/5 rounded-[12px] px-3 py-2 inline-block max-w-full">
                                                                        <a
                                                                            href={`#profile/${reply.author.id}`}
                                                                            className="font-semibold text-white text-[11px] hover:text-primary transition-colors"
                                                                        >
                                                                            {reply.author.username}
                                                                        </a>
                                                                        <p className="text-white/80 text-[12px] mt-0.5 break-words">
                                                                            <HashtagText content={reply.content} />
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 mt-1 ml-1 text-[10px]">
                                                                        <span className="text-[#7f7f7f]">{formatTime(reply.created_at)}</span>
                                                                        <button
                                                                            onClick={() => handleLike(reply.id, true, comment.id)}
                                                                            className={`font-semibold transition-colors ${reply.is_liked ? 'text-primary' : 'text-[#7f7f7f] hover:text-white'
                                                                                }`}
                                                                        >
                                                                            Thích {reply.like_count > 0 && `(${reply.like_count})`}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setReplyingTo({ id: comment.id, username: reply.author.username })}
                                                                            className="font-semibold text-[#7f7f7f] hover:text-white transition-colors"
                                                                        >
                                                                            Trả lời
                                                                        </button>
                                                                        {reply.author_id === currentUserId && (
                                                                            <button
                                                                                onClick={() => handleDelete(reply.id, true, comment.id)}
                                                                                className="text-[#7f7f7f] hover:text-red-400 transition-colors"
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/10">
                    {replyingTo && (
                        <div className="flex items-center gap-2 mb-2 text-[11px] text-[#7f7f7f]">
                            <span>Đang trả lời <span className="text-primary font-semibold">@{replyingTo.username}</span></span>
                            <button
                                onClick={() => {
                                    setReplyingTo(null);
                                    setCommentText('');
                                }}
                                className="text-[#7f7f7f] hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Thêm bình luận..."
                            className="flex-1 bg-white/5 rounded-full px-4 py-2.5 text-white text-[13px] placeholder-[#7f7f7f] focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={!commentText.trim() || isSubmitting}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 text-white animate-spin" />
                            ) : (
                                <Send className="w-4 h-4 text-white" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReelCommentsPanel;

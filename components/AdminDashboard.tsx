import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, FolderOpen, Users, AlertTriangle, Plus, Search,
  Shield, UserX, UserCheck, ChevronLeft, ChevronRight, ChevronDown, MessageSquare,
  FileText, TrendingUp, Eye, EyeOff, Trash2, AlertCircle, Check, X,
  Bell, BellOff, Loader2
} from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { useAuth } from '../contexts/authContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import {
  UserRole,
  ReportStatus,
  ReportTargetType,
  AdminUserPublic,
  AdminUsersResponse,
  AdminReport,
  AdminReportsResponse
} from '../types';

interface AdminStats {
  totalUsers: number;
  usersByRole: Record<string, number>;
  totalCategories: number;
  totalThreads: number;
  totalForumComments: number;
  pendingReports: number;
  newUsersToday: number;
  newThreadsToday: number;
  newCommentsToday: number;
}

interface ForumCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  threadCount: number;
  displayOrder: number;
  isActive?: boolean;
}

type AdminTab = 'dashboard' | 'categories' | 'users' | 'reports';

export const AdminDashboard: React.FC = () => {
  const { token, user } = useAuth();
  const { showSuccess, showError, showWarning } = useSnackbar();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New category form
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Users tab state
  const [users, setUsers] = useState<AdminUserPublic[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [usersPage, setUsersPage] = useState(0);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRoleFilter, setUsersRoleFilter] = useState<UserRole | ''>('');
  const [showRoleModal, setShowRoleModal] = useState<AdminUserPublic | null>(null);
  const [showBanModal, setShowBanModal] = useState<AdminUserPublic | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState<number | null>(24);

  // Reports tab state
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [reportsCount, setReportsCount] = useState(0);
  const [reportsPendingCount, setReportsPendingCount] = useState(0);
  const [reportsPage, setReportsPage] = useState(0);
  const [reportsStatusFilter, setReportsStatusFilter] = useState<ReportStatus | ''>('');
  const [showResolveModal, setShowResolveModal] = useState<AdminReport | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('IGNORE');

  const ITEMS_PER_PAGE = 20;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  useEffect(() => {
    if (activeTab === 'dashboard') fetchStats();
    if (activeTab === 'categories') fetchCategories();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'reports') fetchReports();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'users') {
      const timer = setTimeout(() => fetchUsers(), 300);
      return () => clearTimeout(timer);
    }
  }, [usersSearch, usersRoleFilter, usersPage]);

  useEffect(() => {
    if (activeTab === 'reports') fetchReports();
  }, [reportsStatusFilter, reportsPage]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/stats`, { headers });
      if (!response.ok) throw new Error('Không có quyền truy cập');
      const data = await response.json();
      setStats({
        totalUsers: data.total_users,
        usersByRole: data.users_by_role,
        totalCategories: data.total_categories,
        totalThreads: data.total_threads,
        totalForumComments: data.total_forum_comments,
        pendingReports: data.pending_reports,
        newUsersToday: data.new_users_today,
        newThreadsToday: data.new_threads_today,
        newCommentsToday: data.new_comments_today,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/forum/categories`, { headers });
      if (!response.ok) throw new Error('Không thể tải danh mục');
      const data = await response.json();
      setCategories(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        skip: String(usersPage * ITEMS_PER_PAGE),
        limit: String(ITEMS_PER_PAGE),
      });
      if (usersSearch) params.append('search', usersSearch);
      if (usersRoleFilter) params.append('role', usersRoleFilter);

      const response = await fetch(`${API_BASE_URL}/admin/users?${params}`, { headers });
      if (!response.ok) throw new Error('Không thể tải danh sách người dùng');
      const data: AdminUsersResponse = await response.json();
      setUsers(data.data);
      setUsersCount(data.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        skip: String(reportsPage * ITEMS_PER_PAGE),
        limit: String(ITEMS_PER_PAGE),
      });
      if (reportsStatusFilter) params.append('status', reportsStatusFilter);

      const response = await fetch(`${API_BASE_URL}/admin/reports?${params}`, { headers });
      if (!response.ok) throw new Error('Không thể tải danh sách báo cáo');
      const data: AdminReportsResponse = await response.json();
      setReports(data.data);
      setReportsCount(data.count);
      setReportsPendingCount(data.pending_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/admin/categories`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newCatName,
          description: newCatDesc || null,
          icon: newCatIcon || null,
          display_order: categories.length,
        }),
      });

      if (!response.ok) throw new Error('Không thể tạo danh mục');

      const newCat = await response.json();
      setCategories([...categories, newCat]);
      setShowNewCategory(false);
      setNewCatName('');
      setNewCatDesc('');
      setNewCatIcon('');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Không thể tạo danh mục');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Bạn có chắc muốn xóa danh mục này?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/categories/${categoryId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) throw new Error('Không thể xóa danh mục');
      setCategories(categories.filter(c => c.id !== categoryId));
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Không thể xóa danh mục');
    }
  };

  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role?role=${newRole}`, {
        method: 'PUT',
        headers,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Không thể thay đổi role');
      }
      setShowRoleModal(null);
      fetchUsers();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Không thể thay đổi role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBanUser = async (userId: string) => {
    if (banReason.length < 10) {
      showWarning('Lý do cần ít nhất 10 ký tự');
      return;
    }
    try {
      setSubmitting(true);
      const params = new URLSearchParams({ reason: banReason });
      if (banDuration) params.append('duration_hours', String(banDuration));

      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/ban?${params}`, {
        method: 'POST',
        headers,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Không thể cấm người dùng');
      }
      setShowBanModal(null);
      setBanReason('');
      setBanDuration(24);
      fetchUsers();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Không thể cấm người dùng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    if (!confirm('Bạn có chắc muốn bỏ cấm người dùng này?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/unban`, {
        method: 'POST',
        headers,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Không thể bỏ cấm người dùng');
      }
      fetchUsers();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Không thể bỏ cấm người dùng');
    }
  };

  const handleResolveReport = async (reportId: string, status: ReportStatus) => {
    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/admin/reports/${reportId}/resolve`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          status,
          action: selectedAction,
          moderator_note: resolveNote || null,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Không thể xử lý báo cáo');
      }
      const result = await response.json();
      showSuccess(result.message || 'Đã xử lý báo cáo thành công');
      setShowResolveModal(null);
      setResolveNote('');
      setSelectedAction('IGNORE');
      fetchReports();
      fetchStats(); // Refresh pending count
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Không thể xử lý báo cáo');
    } finally {
      setSubmitting(false);
    }
  };

  // Check admin access
  const userRole = (user as any)?.role;
  const isAdmin = userRole === 'ADMIN' ||
    userRole === 'admin' ||
    userRole === 'MODERATOR' ||
    userRole === 'moderator' ||
    userRole === UserRole.ADMIN ||
    (user as any)?.is_superuser === true;

  if (!isAdmin) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">🚫</div>
          <h1 className="text-xl font-bold text-red-400 mb-2">Không có quyền truy cập</h1>
          <p className="text-slate-400">Bạn cần quyền Admin để truy cập trang này.</p>
          <button
            onClick={() => window.location.hash = 'feed'}
            className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            Quay về Trang chủ
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={18} /> },
    { id: 'categories', label: 'Danh mục', icon: <FolderOpen size={18} /> },
    { id: 'users', label: 'Người dùng', icon: <Users size={18} /> },
    { id: 'reports', label: 'Báo cáo', icon: <AlertTriangle size={18} /> },
  ];

  const getRoleBadge = (role: UserRole) => {
    const styles: Record<string, string> = {
      ADMIN: 'bg-red-500/20 text-red-400 border-red-500/30',
      MODERATOR: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      USER: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      GUEST: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };
    return styles[role] || styles.USER;
  };

  const getStatusBadge = (status: ReportStatus) => {
    const styles: Record<string, { bg: string; label: string }> = {
      PENDING: { bg: 'bg-yellow-500/20 text-yellow-400', label: 'Đang chờ' },
      RESOLVED: { bg: 'bg-green-500/20 text-green-400', label: 'Đã xử lý' },
      DISMISSED: { bg: 'bg-slate-500/20 text-slate-400', label: 'Đã bỏ qua' },
    };
    return styles[status] || styles.PENDING;
  };

  const getTargetTypeLabel = (type: ReportTargetType) => {
    const labels: Record<string, string> = {
      THREAD: 'Bài viết',
      COMMENT: 'Bình luận',
      USER: 'Người dùng',
    };
    return labels[type] || type;
  };

  const totalUsersPages = Math.ceil(usersCount / ITEMS_PER_PAGE);
  const totalReportsPages = Math.ceil(reportsCount / ITEMS_PER_PAGE);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-primary">
          Quản trị hệ thống
        </h1>
        <p className="text-white/50 mt-1">Xin chào, Admin {(user as any)?.username}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-700/50 pb-3 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-[12px] text-sm font-medium 
                        transition-all whitespace-nowrap
                       ${activeTab === tab.id
                ? 'bg-primary/20 text-primary ring-1 ring-primary/30'
                : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {tab.id === 'reports' && (stats?.pendingReports || reportsPendingCount) ? (
              <span className="px-1.5 py-0.5 bg-primary text-white text-[10px] rounded-full">
                {stats?.pendingReports || reportsPendingCount}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-[16px] p-4 mb-6 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-bg-secondary border border-white/5 rounded-[16px] p-4 animate-pulse">
                  <div className="h-8 bg-white/5 rounded-[8px] mb-2"></div>
                  <div className="h-4 bg-white/5 rounded-[8px] w-2/3"></div>
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Main stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<Users size={20} />} label="Người dùng" value={stats.totalUsers} color="blue" />
                <StatCard icon={<FolderOpen size={20} />} label="Danh mục" value={stats.totalCategories} color="purple" />
                <StatCard icon={<FileText size={20} />} label="Chủ đề" value={stats.totalThreads} color="green" />
                <StatCard icon={<MessageSquare size={20} />} label="Bình luận" value={stats.totalForumComments} color="yellow" />
              </div>

              {/* Today's activity */}
              <div className="bg-bg-secondary border border-white/5 rounded-[16px] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={18} className="text-primary" />
                  <h3 className="font-semibold text-white">Hoạt động hôm nay</h3>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white/5 rounded-[12px] p-4">
                    <div className="text-2xl font-bold text-green-400">{stats.newUsersToday}</div>
                    <div className="text-[12px] text-white/50 mt-1">Người dùng mới</div>
                  </div>
                  <div className="bg-white/5 rounded-[12px] p-4">
                    <div className="text-2xl font-bold text-blue-400">{stats.newThreadsToday}</div>
                    <div className="text-[12px] text-white/50 mt-1">Chủ đề mới</div>
                  </div>
                  <div className="bg-white/5 rounded-[12px] p-4">
                    <div className="text-2xl font-bold text-purple-400">{stats.newCommentsToday}</div>
                    <div className="text-[12px] text-white/50 mt-1">Bình luận mới</div>
                  </div>
                </div>
              </div>

              {/* Pending reports */}
              {stats.pendingReports > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-[16px] p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-500/20 rounded-[10px]">
                        <Bell size={20} className="text-red-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-red-400">
                          {stats.pendingReports} báo cáo đang chờ xử lý
                        </h3>
                        <p className="text-[13px] text-white/50 mt-1">
                          Hãy kiểm tra và xử lý các báo cáo vi phạm
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('reports')}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 
                                 text-red-400 rounded-[10px] transition-colors text-[13px] font-medium"
                    >
                      <Eye size={16} />
                      Xem báo cáo
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white">Quản lý danh mục</h2>
            <button
              onClick={() => setShowNewCategory(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:brightness-110 
                         text-white font-semibold rounded-[12px] transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={18} />
              Tạo danh mục
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-bg-secondary border border-white/5 rounded-[16px] p-4 animate-pulse">
                  <div className="h-5 bg-white/5 rounded-[8px] w-1/3"></div>
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="bg-bg-secondary border border-white/5 rounded-[16px] p-8 text-center text-white/30">
              <div className="text-4xl mb-3">📭</div>
              <p>Chưa có danh mục nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-bg-secondary border border-white/5 rounded-[16px] p-4 
                             flex items-center justify-between group hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[12px] bg-white/5 flex items-center justify-center text-2xl">
                      {cat.icon || '📁'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{cat.name}</h3>
                      {cat.description && (
                        <p className="text-xs text-white/50">{cat.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[13px] text-white/30">{cat.threadCount} chủ đề</span>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-[10px] transition-colors"
                      title="Xóa"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New Category Modal */}
          {showNewCategory && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-bg-secondary border border-white/10 rounded-[24px] w-full max-w-md shadow-2xl animate-in zoom-in-95 fade-in duration-200">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Tạo danh mục mới</h2>
                  <button
                    onClick={() => setShowNewCategory(false)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/50"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateCategory} className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">
                      Tên danh mục *
                    </label>
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="VD: Thảo luận chung"
                      className="w-full px-4 py-3 bg-bg-main/50 border border-white/10 rounded-[12px]
                                 focus:outline-none focus:border-primary/50 text-white placeholder:text-white/20 transition-all"
                      maxLength={100}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">
                      Mô tả
                    </label>
                    <input
                      type="text"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      placeholder="Mô tả ngắn về danh mục..."
                      className="w-full px-4 py-3 bg-bg-main/50 border border-white/10 rounded-[12px]
                                  focus:outline-none focus:border-primary/50 text-white placeholder:text-white/20 transition-all"
                      maxLength={500}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">
                      Icon (emoji)
                    </label>
                    <input
                      type="text"
                      value={newCatIcon}
                      onChange={(e) => setNewCatIcon(e.target.value)}
                      placeholder="VD: 💬"
                      className="w-full px-4 py-3 bg-bg-main/50 border border-white/10 rounded-[12px]
                                  focus:outline-none focus:border-primary/50 text-white placeholder:text-white/20 transition-all"
                      maxLength={10}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNewCategory(false)}
                      className="px-4 py-2 text-white/40 hover:text-white transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !newCatName.trim()}
                      className="px-6 py-2.5 bg-primary hover:brightness-110 
                                  text-white font-semibold rounded-[12px] transition-all 
                                  disabled:opacity-50 shadow-lg shadow-primary/20"
                    >
                      {submitting ? 'Đang tạo...' : 'Tạo danh mục'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary transition-colors">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm theo username hoặc email..."
                value={usersSearch}
                onChange={(e) => { setUsersSearch(e.target.value); setUsersPage(0); }}
                className="w-full pl-11 pr-4 py-3 bg-bg-secondary border border-white/5 rounded-[12px]
                           focus:outline-none focus:border-primary/50 text-white placeholder:text-white/20 transition-all"
              />
            </div>
            <div className="relative">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <select
                value={usersRoleFilter}
                onChange={(e) => { setUsersRoleFilter(e.target.value as UserRole | ''); setUsersPage(0); }}
                className="pl-11 pr-10 py-3 bg-bg-secondary border border-white/5 rounded-[12px]
                           focus:outline-none focus:border-primary/50 text-white appearance-none cursor-pointer overflow-hidden transition-all"
              >
                <option value="">Tất cả vai trò</option>
                <option value="USER">Người dùng</option>
                <option value="MODERATOR">Điều hành viên</option>
                <option value="ADMIN">Quản trị viên</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" size={16} />
            </div>
          </div>

          {/* Users count */}
          <p className="text-[13px] text-white/40 mb-4 px-1">
            Hiển thị <span className="text-white/80 font-semibold">{users.length}</span> / <span className="text-white/80 font-semibold">{usersCount}</span> người dùng
          </p>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-bg-secondary border border-white/5 rounded-[16px] p-4 animate-pulse">
                  <div className="h-5 bg-white/5 rounded-[8px] w-1/2"></div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="bg-bg-secondary border border-white/5 rounded-[16px] p-8 text-center text-white/30">
              <div className="text-4xl mb-3">👥</div>
              <p>Không tìm thấy người dùng nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className={`bg-bg-secondary border rounded-[16px] p-4 transition-all hover:border-white/10
                             ${u.is_active ? 'border-white/5' : 'border-red-500/30 bg-red-500/5'}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="w-12 h-12 rounded-[12px] object-cover ring-1 ring-white/10" />
                      ) : (
                        <div className="w-12 h-12 rounded-[12px] bg-white/5 flex items-center justify-center text-white/40 font-bold border border-white/5">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{u.username}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getRoleBadge(u.role)}`}>
                            {u.role}
                          </span>
                          {!u.is_active && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                              Đã cấm
                            </span>
                          )}
                          {u.is_superuser && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary/20 text-primary border border-primary/30">
                              Superuser
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] text-white/40">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-auto">
                      <button
                        onClick={() => setShowRoleModal(u)}
                        className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium bg-white/5 hover:bg-white/10 
                                   rounded-[10px] transition-all text-white/80"
                        disabled={u.is_superuser || u.id === (user as any)?.id}
                      >
                        <UserCheck size={16} />
                        Đổi role
                      </button>
                      {u.is_active ? (
                        <button
                          onClick={() => setShowBanModal(u)}
                          className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium bg-red-500/10 hover:bg-red-500/20 
                                     rounded-[10px] transition-all text-red-400 border border-red-500/20"
                          disabled={u.is_superuser || u.id === (user as any)?.id}
                        >
                          <UserX size={16} />
                          Cấm
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnbanUser(u.id)}
                          className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium bg-green-500/10 hover:bg-green-500/20 
                                     rounded-[10px] transition-all text-green-400 border border-green-500/20"
                        >
                          <Shield size={16} />
                          Bỏ cấm
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalUsersPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setUsersPage(p => Math.max(0, p - 1))}
                disabled={usersPage === 0}
                className="p-2 bg-bg-secondary border border-white/5 hover:border-white/10 hover:bg-white/5 rounded-[12px] 
                           disabled:opacity-20 disabled:cursor-not-allowed transition-all text-white/60"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-[13px] text-white/40 font-medium bg-bg-secondary px-4 py-2 rounded-[12px] border border-white/5">
                Trang <span className="text-white/80">{usersPage + 1}</span> / {totalUsersPages}
              </span>
              <button
                onClick={() => setUsersPage(p => Math.min(totalUsersPages - 1, p + 1))}
                disabled={usersPage >= totalUsersPages - 1}
                className="p-2 bg-bg-secondary border border-white/5 hover:border-white/10 hover:bg-white/5 rounded-[12px] 
                           disabled:opacity-20 disabled:cursor-not-allowed transition-all text-white/60"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          {/* Role Modal */}
          {showRoleModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-bg-secondary border border-white/10 rounded-[24px] w-full max-w-sm shadow-2xl animate-in zoom-in-95 fade-in duration-200">
                <div className="p-6 border-b border-white/5">
                  <h2 className="text-lg font-bold text-white">Thay đổi vai trò</h2>
                  <p className="text-[13px] text-white/50 mt-1">
                    Người dùng: <span className="text-primary font-semibold">@{showRoleModal.username}</span>
                  </p>
                </div>
                <div className="p-6 space-y-3">
                  {[UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN].map((role) => (
                    <button
                      key={role}
                      onClick={() => handleChangeRole(showRoleModal.id, role)}
                      disabled={submitting || showRoleModal.role === role}
                      className={`w-full px-5 py-4 rounded-[16px] text-left flex items-center justify-between transition-all
                                  ${showRoleModal.role === role
                          ? 'bg-primary/20 border border-primary/30 text-primary'
                          : 'bg-bg-main/50 border border-white/5 hover:border-white/10 text-white/60 hover:text-white'}
                                  disabled:opacity-50`}
                    >
                      <span className="font-medium text-[15px]">{role === UserRole.USER ? '👤 Người dùng' : role === UserRole.MODERATOR ? '🛡️ Điều hành viên' : '⚡ Quản trị viên'}</span>
                      {showRoleModal.role === role && <Check size={18} />}
                    </button>
                  ))}
                </div>
                <div className="p-6 pt-0">
                  <button
                    onClick={() => setShowRoleModal(null)}
                    className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 rounded-[12px] text-white/60 hover:text-white transition-all font-medium text-[14px]"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ban Modal */}
          {showBanModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-bg-secondary border border-white/10 rounded-[24px] w-full max-w-md shadow-2xl animate-in zoom-in-95 fade-in duration-200">
                <div className="p-6 border-b border-white/5">
                  <h2 className="text-lg font-bold text-red-400">Cấm người dùng</h2>
                  <p className="text-[13px] text-white/50 mt-1">
                    Người dùng: <span className="text-red-400 font-semibold">@{showBanModal.username}</span>
                  </p>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">
                      Lý do (ít nhất 10 ký tự) *
                    </label>
                    <textarea
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      placeholder="Nhập lý do cấm..."
                      rows={3}
                      className="w-full px-4 py-3 bg-bg-main/50 border border-white/10 rounded-[12px]
                                  focus:outline-none focus:border-red-500/50 text-white placeholder:text-white/20 transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">
                      Thời gian (giờ)
                    </label>
                    <div className="relative">
                      <select
                        value={banDuration ?? ''}
                        onChange={(e) => setBanDuration(e.target.value ? Number(e.target.value) : null)}
                        className="w-full pl-4 pr-10 py-3 bg-bg-main/50 border border-white/10 rounded-[12px]
                                    focus:outline-none focus:border-red-500/50 text-white appearance-none cursor-pointer overflow-hidden transition-all"
                      >
                        <option value="1">1 giờ</option>
                        <option value="6">6 giờ</option>
                        <option value="24">24 giờ (1 ngày)</option>
                        <option value="72">72 giờ (3 ngày)</option>
                        <option value="168">168 giờ (1 tuần)</option>
                        <option value="720">720 giờ (30 ngày)</option>
                        <option value="">Vĩnh viễn</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>
                <div className="p-6 pt-0 flex gap-3">
                  <button
                    onClick={() => { setShowBanModal(null); setBanReason(''); }}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-[12px] text-white/60 hover:text-white transition-all font-medium text-[14px]"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => handleBanUser(showBanModal.id)}
                    disabled={submitting || banReason.length < 10}
                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white 
                                font-bold rounded-[12px] disabled:opacity-50 shadow-lg shadow-red-500/20 transition-all"
                  >
                    {submitting ? 'Đang xử lý...' : 'Xác nhận cấm'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div>
          {/* Filter tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
            {[
              { value: '', label: 'Tất cả', icon: '📋' },
              { value: 'PENDING', label: 'Đang chờ', icon: '⏳' },
              { value: 'RESOLVED', label: 'Đã xử lý', icon: '✅' },
              { value: 'DISMISSED', label: 'Đã bỏ qua', icon: '❌' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => { setReportsStatusFilter(filter.value as ReportStatus | ''); setReportsPage(0); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-[12px] text-[13px] font-medium whitespace-nowrap
                            transition-all
                           ${reportsStatusFilter === filter.value
                    ? 'bg-primary/20 text-primary ring-1 ring-primary/30'
                    : 'bg-bg-secondary border border-white/5 text-white/40 hover:text-white/80 hover:bg-white/5'}`}
              >
                <span>{filter.icon}</span>
                {filter.label}
                {filter.value === 'PENDING' && reportsPendingCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-primary text-white text-[10px] rounded-full">
                    {reportsPendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Reports count */}
          <p className="text-[13px] text-white/40 mb-4 px-1">
            Hiển thị <span className="text-white/80 font-semibold">{reports.length}</span> / <span className="text-white/80 font-semibold">{reportsCount}</span> báo cáo
          </p>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-bg-secondary border border-white/5 rounded-[16px] p-4 animate-pulse">
                  <div className="h-5 bg-white/5 rounded-[8px] w-1/2 mb-2"></div>
                  <div className="h-4 bg-white/5 rounded-[8px] w-3/4"></div>
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-bg-secondary border border-white/5 rounded-[16px] p-8 text-center text-white/30">
              <div className="text-4xl mb-3">🎉</div>
              <p>Không có báo cáo nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => {
                const statusBadge = getStatusBadge(report.status);
                return (
                  <div
                    key={report.id}
                    className={`bg-bg-secondary border rounded-[16px] p-5 transition-all hover:border-white/10
                               ${report.status === 'PENDING' ? 'border-primary/20' : 'border-white/5'}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${statusBadge.bg} border border-white/5`}>
                            {statusBadge.label}
                          </span>
                          <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-white/5 text-white/60 border border-white/5">
                            {getTargetTypeLabel(report.target_type)}
                          </span>
                          <span className="text-[11px] text-white/20">
                            {new Date(report.created_at).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-white/90 text-[14px] leading-relaxed mb-3">{report.reason}</p>
                        {report.target_preview && (
                          <div className="bg-bg-main/50 rounded-[12px] p-3 text-[13px] text-white/50 mb-3 border border-white/5 italic">
                            <span className="text-white/30 not-italic">Nội dung: </span>
                            "{report.target_preview}"
                          </div>
                        )}
                        {/* View content link */}
                        <button
                          onClick={() => {
                            let url = '';
                            if (report.target_type === 'THREAD') {
                              url = `#forum/thread/${report.target_id}`;
                            } else if (report.target_type === 'POST') {
                              url = `#feed`; // Posts in feed
                            } else if (report.target_type === 'USER') {
                              url = `#profile/${report.target_id}`;
                            }
                            if (url) window.location.hash = url.replace('#', '');
                          }}
                          className="flex items-center gap-1.5 text-[12px] text-primary hover:text-primary/80 font-medium transition-colors mb-4 group"
                        >
                          Xem nội dung gốc <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                        <div className="flex items-center gap-4 text-[11px] text-white/30">
                          <p>
                            Báo cáo bởi: <span className="text-white/60 font-semibold">@{report.reporter_username || 'Unknown'}</span>
                          </p>
                          {report.moderator_note && (
                            <p className="flex items-center gap-1.5">
                              <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                              Ghi chú: <span className="text-white/60">{report.moderator_note}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      {report.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowResolveModal(report)}
                            className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium bg-green-500/10 hover:bg-green-500/20 
                                       rounded-[10px] transition-all text-green-400 border border-green-500/20"
                          >
                            <Check size={16} />
                            Xử lý
                          </button>
                          <button
                            onClick={() => handleResolveReport(report.id, ReportStatus.DISMISSED)}
                            className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium bg-white/5 hover:bg-white/10 
                                       rounded-[10px] transition-all text-white/40 border border-white/5"
                          >
                            <X size={16} />
                            Bỏ qua
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalReportsPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setReportsPage(p => Math.max(0, p - 1))}
                disabled={reportsPage === 0}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg 
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ←
              </button>
              <span className="text-slate-400">
                Trang {reportsPage + 1} / {totalReportsPages}
              </span>
              <button
                onClick={() => setReportsPage(p => Math.min(totalReportsPages - 1, p + 1))}
                disabled={reportsPage >= totalReportsPages - 1}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg 
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                →
              </button>
            </div>
          )}

          {/* Resolve Modal */}
          {showResolveModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-bg-secondary border border-white/10 rounded-[24px] w-full max-w-md shadow-2xl animate-in zoom-in-95 fade-in duration-200">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">Xử lý báo cáo</h2>
                  <button
                    onClick={() => setShowResolveModal(null)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/50"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  <div className="bg-bg-main/50 rounded-[16px] p-4 border border-white/5">
                    <p className="text-[11px] text-white/30 uppercase font-bold tracking-wider mb-2">Lý do báo cáo</p>
                    <p className="text-white/80 text-[14px] leading-relaxed">{showResolveModal.reason}</p>
                  </div>

                  {/* Action Selection */}
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-3">
                      Hành động xử lý
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setSelectedAction('IGNORE')}
                        className={`p-4 rounded-[16px] border text-sm font-medium transition-all flex flex-col items-center gap-2 ${selectedAction === 'IGNORE'
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10 hover:text-white/60'
                          }`}
                      >
                        <span className="text-xl">🔕</span> Bỏ qua
                      </button>
                      <button
                        onClick={() => setSelectedAction('HIDE_CONTENT')}
                        className={`p-4 rounded-[16px] border text-sm font-medium transition-all flex flex-col items-center gap-2 ${selectedAction === 'HIDE_CONTENT'
                          ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                          : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10 hover:text-white/60'
                          }`}
                      >
                        <span className="text-xl">👁️</span> Ẩn nội dung
                      </button>
                      <button
                        onClick={() => setSelectedAction('DELETE_CONTENT')}
                        className={`p-4 rounded-[16px] border text-sm font-medium transition-all flex flex-col items-center gap-2 ${selectedAction === 'DELETE_CONTENT'
                          ? 'bg-red-500/10 border-red-500/30 text-red-400'
                          : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10 hover:text-white/60'
                          }`}
                      >
                        <span className="text-xl">🗑️</span> Xóa nội dung
                      </button>
                      <button
                        onClick={() => setSelectedAction('WARN_USER')}
                        className={`p-4 rounded-[16px] border text-sm font-medium transition-all flex flex-col items-center gap-2 ${selectedAction === 'WARN_USER'
                          ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                          : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10 hover:text-white/60'
                          }`}
                      >
                        <span className="text-xl">⚠️</span> Cảnh cáo
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">
                      Ghi chú của moderator
                    </label>
                    <textarea
                      value={resolveNote}
                      onChange={(e) => setResolveNote(e.target.value)}
                      placeholder="Ghi chú về cách xử lý..."
                      rows={3}
                      className="w-full px-4 py-3 bg-bg-main/50 border border-white/10 rounded-[12px]
                                 focus:outline-none focus:border-primary/50 text-white placeholder:text-white/20 transition-all resize-none"
                    />
                  </div>
                </div>
                <div className="p-6 pt-0 flex gap-3">
                  <button
                    onClick={() => { setShowResolveModal(null); setResolveNote(''); setSelectedAction('IGNORE'); }}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-[12px] text-white/60 hover:text-white transition-all font-medium text-[14px]"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => handleResolveReport(showResolveModal.id, ReportStatus.RESOLVED)}
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-primary hover:brightness-110 text-white 
                               font-bold rounded-[12px] disabled:opacity-50 shadow-lg shadow-primary/20 transition-all"
                  >
                    {submitting ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Xác nhận xử lý'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Stat card component with modern styling
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  trend?: number;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color = 'blue' }) => {
  const colorStyles = {
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/10',
    green: 'from-green-500/20 to-green-600/5 border-green-500/10',
    yellow: 'from-gold/20 to-gold/5 border-gold/10',
    red: 'from-red-500/20 to-red-600/5 border-red-500/10',
    purple: 'from-primary/20 to-primary/5 border-primary/10',
  };

  const iconColors = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-gold',
    red: 'text-red-400',
    purple: 'text-primary',
  };

  return (
    <div className={`bg-gradient-to-br ${colorStyles[color]} border rounded-[16px] p-4 md:p-5 transition-all hover:scale-[1.02]`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-[10px] bg-white/5 ${iconColors[color]}`}>
          {icon}
        </div>
        <span className="text-white/60 text-[13px] font-medium">{label}</span>
      </div>
      <div className="text-[28px] md:text-[32px] font-bold text-white">
        {value.toLocaleString()}
      </div>
    </div>
  );
};

export default AdminDashboard;

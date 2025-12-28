import React, { useState } from 'react';
import { LogOut, ChevronRight, X, AlertTriangle, KeyRound, Lock, Eye, EyeOff, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/authContext';

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordValidationErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export const Settings: React.FC = () => {
  const { logout, user, token } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<PasswordValidationErrors>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string>('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

  const handleOpenChangePassword = () => {
    setShowChangePasswordModal(true);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordErrors({});
    setApiError('');
    setChangePasswordSuccess(false);
  };

  const handleCloseChangePassword = () => {
    setShowChangePasswordModal(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordErrors({});
    setApiError('');
    setChangePasswordSuccess(false);
  };

  // Validation functions
  const validateCurrentPassword = (password: string): string | undefined => {
    if (!password) return 'Vui lòng nhập mật khẩu hiện tại';
    return undefined;
  };

  const validateNewPassword = (password: string): string | undefined => {
    if (!password) return 'Vui lòng nhập mật khẩu mới';
    if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
    if (!/[A-Z]/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ hoa';
    if (!/[0-9]/.test(password)) return 'Mật khẩu phải có ít nhất 1 số';
    return undefined;
  };

  const validateConfirmPassword = (newPassword: string, confirmPassword: string): string | undefined => {
    if (!confirmPassword) return 'Vui lòng xác nhận mật khẩu mới';
    if (newPassword !== confirmPassword) return 'Mật khẩu xác nhận không khớp';
    return undefined;
  };

  // Handle input changes
  const handlePasswordInputChange = (field: keyof PasswordFormData, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate form
  const validatePasswordForm = (): boolean => {
    const newErrors: PasswordValidationErrors = {
      currentPassword: validateCurrentPassword(passwordForm.currentPassword),
      newPassword: validateNewPassword(passwordForm.newPassword),
      confirmPassword: validateConfirmPassword(passwordForm.newPassword, passwordForm.confirmPassword),
    };

    // Check if new password is same as current password
    if (passwordForm.currentPassword && passwordForm.newPassword && 
        passwordForm.currentPassword === passwordForm.newPassword) {
      newErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
    }

    setPasswordErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== undefined);
  };

  // Handle change password submission
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (!validatePasswordForm()) return;

    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

      const response = await fetch(`${API_URL}/auth/me/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || result.message || result.detail || 'Có lỗi xảy ra. Vui lòng thử lại.';
        setApiError(errorMessage);
        setIsLoading(false);
        return;
      }

      // Success
      setChangePasswordSuccess(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Change password error:', error);
      setApiError('Có lỗi xảy ra. Vui lòng kiểm tra kết nối và thử lại.');
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="p-4 md:p-8 pb-24 md:pb-8 min-h-screen">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
              CÀI ĐẶT
            </h1>
            <p className="text-slate-400 text-sm">
              Quản lý tài khoản và tùy chỉnh ứng dụng
            </p>
          </div>

          {/* User Info Card */}
          {user && (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 mb-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-500 to-amber-600 flex items-center justify-center">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-lg">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">{user.username}</p>
                <p className="text-slate-400 text-sm">{user.email}</p>
              </div>
            </div>
          )}

          {/* Settings List */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="divide-y divide-slate-700/50">
              {/* Change Password Button */}
              <button
                onClick={handleOpenChangePassword}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-700/30 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">Đổi mật khẩu</p>
                  <p className="text-slate-500 text-sm">Thay đổi mật khẩu tài khoản của bạn</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-slate-400 transition-colors" />
              </button>

              {/* Logout Button */}
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-700/30 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-red-400 font-medium">Đăng xuất</p>
                  <p className="text-slate-500 text-sm">Thoát khỏi tài khoản hiện tại</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-slate-400 transition-colors" />
              </button>
            </div>
          </div>

          {/* Version Info */}
          <div className="mt-8 text-center">
            <p className="text-slate-600 text-xs">
              ArenaHub v1.0.0
            </p>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLogoutModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Close button */}
            <button
              onClick={() => setShowLogoutModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Đăng xuất?
              </h3>
              <p className="text-slate-400 text-sm mb-6">
                Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={!isLoading ? handleCloseChangePassword : undefined}
          />

          {/* Modal */}
          <div className="relative bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Close button */}
            {!isLoading && (
              <button
                onClick={handleCloseChangePassword}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Success State */}
            {changePasswordSuccess ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Đổi mật khẩu thành công!
                </h3>
                <p className="text-slate-400 text-sm mb-6">
                  Mật khẩu của bạn đã được cập nhật
                </p>
                <button
                  onClick={handleCloseChangePassword}
                  className="w-full px-4 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium transition-colors"
                >
                  Đóng
                </button>
              </div>
            ) : (
              /* Form State */
              <form onSubmit={handleChangePasswordSubmit} className="p-6">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <KeyRound className="w-5 h-5 text-amber-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      Đổi mật khẩu
                    </h3>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Nhập mật khẩu hiện tại và mật khẩu mới của bạn
                  </p>
                </div>

                {/* API Error Message */}
                {apiError && (
                  <div className="mb-4 bg-red-900/20 border border-red-500/50 p-3 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">{apiError}</p>
                  </div>
                )}

                {/* Current Password */}
                <div className="mb-4">
                  <label className="block text-slate-400 text-xs font-medium mb-2">
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                      className={`w-full bg-slate-900/50 text-white pl-10 pr-10 py-3 rounded-lg border ${
                        passwordErrors.currentPassword ? 'border-red-500' : 'border-slate-700'
                      } focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all text-sm`}
                      placeholder="Nhập mật khẩu hiện tại"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      disabled={isLoading}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {passwordErrors.currentPassword}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div className="mb-4">
                  <label className="block text-slate-400 text-xs font-medium mb-2">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                      className={`w-full bg-slate-900/50 text-white pl-10 pr-10 py-3 rounded-lg border ${
                        passwordErrors.newPassword ? 'border-red-500' : 'border-slate-700'
                      } focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all text-sm`}
                      placeholder="Nhập mật khẩu mới"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      disabled={isLoading}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {passwordErrors.newPassword}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="mb-4">
                  <label className="block text-slate-400 text-xs font-medium mb-2">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                      className={`w-full bg-slate-900/50 text-white pl-10 pr-10 py-3 rounded-lg border ${
                        passwordErrors.confirmPassword ? 'border-red-500' : 'border-slate-700'
                      } focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all text-sm`}
                      placeholder="Nhập lại mật khẩu mới"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {passwordErrors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Password Requirements */}
                <div className="bg-slate-900/50 border border-slate-700 p-3 rounded-lg mb-6">
                  <p className="text-slate-400 text-xs font-medium mb-2">
                    Yêu cầu mật khẩu:
                  </p>
                  <ul className="text-slate-500 text-xs space-y-1">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-primary rounded-full"></div>
                      Ít nhất 8 ký tự
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-primary rounded-full"></div>
                      Có ít nhất 1 chữ hoa
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-primary rounded-full"></div>
                      Có ít nhất 1 số
                    </li>
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseChangePassword}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      'Đổi mật khẩu'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

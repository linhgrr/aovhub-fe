import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, Loader, CheckCircle } from 'lucide-react';

interface FormData {
  password: string;
  confirmPassword: string;
}

interface ValidationErrors {
  password?: string;
  confirmPassword?: string;
}

export const ResetPassword: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string>('');

  // Extract token from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setApiError('Token không hợp lệ. Vui lòng yêu cầu đặt lại mật khẩu lại.');
    }
  }, []);

  // Validation functions
  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Vui lòng nhập mật khẩu mới';
    if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
    if (!/[A-Z]/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ hoa';
    if (!/[0-9]/.test(password)) return 'Mật khẩu phải có ít nhất 1 số';
    return undefined;
  };

  const validateConfirmPassword = (password: string, confirmPassword: string): string | undefined => {
    if (!confirmPassword) return 'Vui lòng xác nhận mật khẩu';
    if (password !== confirmPassword) return 'Mật khẩu xác nhận không khớp';
    return undefined;
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(formData.password, formData.confirmPassword),
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== undefined);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (!token) {
      setApiError('Token không hợp lệ. Vui lòng yêu cầu đặt lại mật khẩu lại.');
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          new_password: formData.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.message || result.error || result.detail || 'Có lỗi xảy ra. Vui lòng thử lại.';
        setApiError(errorMessage);
        setIsLoading(false);
        return;
      }

      // Success
      setSuccess(true);
    } catch (error) {
      console.error('Reset password error:', error);
      setApiError('Có lỗi xảy ra. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img
                src="https://i.ibb.co/Y7zWPJVZ/liqi88-2026.png"
                alt="Arena Hub Logo"
                className="h-28 w-auto object-contain"
              />
            </div>
          </div>

          {/* Success Card */}
          <div className="bg-bg-secondary/80 backdrop-blur border border-white/5 p-8 rounded-[20px] shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full border-2 border-green-500 mb-4">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-montserrat font-bold text-white mb-2">ĐẶT LẠI THÀNH CÔNG</h2>
              <p className="text-[#7f7f7f] text-sm font-montserrat">
                Mật khẩu của bạn đã được đặt lại thành công
              </p>
            </div>

            <div className="bg-bg-main/50 border border-white/5 p-4 rounded-lg mb-6">
              <p className="text-[#7f7f7f] text-xs text-center">
                Bạn có thể đăng nhập với mật khẩu mới ngay bây giờ
              </p>
            </div>

            {/* Login Button */}
            <button
              onClick={() => window.location.hash = 'login'}
              className="w-full bg-primary hover:bg-primary/90 text-white font-montserrat font-bold py-4 px-6 rounded-[12px] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              ĐĂNG NHẬP NGAY
            </button>
          </div>

          {/* Footer note */}
          <p className="text-center text-slate-600 text-xs mt-6">
            Hãy giữ mật khẩu của bạn an toàn
          </p>
        </div>
      </div>
    );
  }

  // Form screen
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img
              src="https://i.ibb.co/Y7zWPJVZ/liqi88-2026.png"
              alt="Arena Hub Logo"
              className="h-28 w-auto object-contain"
            />
          </div>
          <h2 className="text-2xl font-montserrat font-bold text-white mb-2">ĐẶT LẠI MẬT KHẨU</h2>
          <p className="text-[#7f7f7f] text-sm font-montserrat">
            Nhập mật khẩu mới cho tài khoản của bạn
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-bg-secondary/80 backdrop-blur border border-white/5 p-8 rounded-[20px] shadow-2xl">
            {/* API Error Message */}
            {apiError && (
              <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{apiError}</p>
              </div>
            )}

            {/* New Password */}
            <div className="mb-6">
              <label className="block text-[#7f7f7f] text-[10px] font-bold mb-2 uppercase tracking-widest">
                Mật khẩu mới
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7f7f7f]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full bg-bg-main/50 text-white pl-12 pr-12 py-3.5 rounded-[12px] border ${errors.password ? 'border-red-500' : 'border-white/5'
                    } focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all text-sm`}
                  placeholder="Nhập mật khẩu mới"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7f7f7f] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="mb-8">
              <label className="block text-[#7f7f7f] text-[10px] font-bold mb-2 uppercase tracking-widest">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7f7f7f]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full bg-bg-main/50 text-white pl-12 pr-12 py-3.5 rounded-[12px] border ${errors.confirmPassword ? 'border-red-500' : 'border-white/5'
                    } focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all text-sm`}
                  placeholder="Nhập lại mật khẩu mới"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7f7f7f] hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-bg-main/50 border border-white/5 p-4 rounded-lg mb-6">
              <p className="text-[#7f7f7f] text-[10px] font-bold mb-2 uppercase tracking-widest">
                Yêu cầu mật khẩu:
              </p>
              <ul className="text-[#7f7f7f] text-xs space-y-1">
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !token}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-montserrat font-bold py-4 px-6 rounded-[12px] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mb-6"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  ĐANG XỬ LÝ...
                </>
              ) : (
                'ĐẶT LẠI MẬT KHẨU'
              )}
            </button>

            {/* Links */}
            <div className="text-center space-y-3">
              <p className="text-[#7f7f7f] text-xs">
                Nhớ mật khẩu?{' '}
                <a href="#login" className="text-primary hover:underline font-bold transition-colors">
                  Đăng nhập
                </a>
              </p>
            </div>
          </div>
        </form>

        {/* Footer note */}
        <p className="text-center text-slate-600 text-xs mt-6">
          Bảo mật tài khoản với mã hóa end-to-end
        </p>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../contexts/authContext';

interface LoginFormData {
  email: string;
  password: string;
}

interface ValidationErrors {
  email?: string;
  password?: string;
}

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string>('');

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Vui lòng nhập email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email không hợp lệ';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Vui lòng nhập mật khẩu';
    return undefined;
  };

  // Handle input changes
  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== undefined);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        setApiError(result.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.');
        setIsLoading(false);
        return;
      }

      if (result.token && result.user) {
        login(result.token, result.user);
      }

      window.location.hash = 'feed';
    } catch (error) {
      console.error('Login error:', error);
      setApiError('Có lỗi xảy ra. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img
              src="https://i.ibb.co/84t6d1dq/image-removebg-preview-1-1.png"
              alt="Arena Hub Logo"
              className="h-20 w-auto object-contain"
            />
          </div>
          <h2 className="text-2xl font-montserrat font-bold text-white mb-2">ĐĂNG NHẬP</h2>
          <p className="text-[#7f7f7f] text-sm font-montserrat">Chào mừng trở lại, chiến binh!</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-bg-secondary/80 backdrop-blur border border-white/5 p-8 rounded-[20px] shadow-2xl">
            {/* API Error Message */}
            {apiError && (
              <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-bold text-xs mb-1 uppercase tracking-wider">LỖI ĐĂNG NHẬP</p>
                  <p className="text-red-300 text-xs">{apiError}</p>
                </div>
              </div>
            )}

            {/* Email */}
            <div className="mb-6">
              <label className="block text-[#7f7f7f] text-[10px] font-bold mb-2 uppercase tracking-widest">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7f7f7f]" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full bg-bg-main/50 text-white pl-12 pr-4 py-3.5 rounded-[12px] border ${errors.email ? 'border-red-500' : 'border-white/5'
                    } focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all text-sm`}
                  placeholder="email@example.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="mb-8">
              <label className="block text-[#7f7f7f] text-[10px] font-bold mb-2 uppercase tracking-widest">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7f7f7f]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full bg-bg-main/50 text-white pl-12 pr-12 py-3.5 rounded-[12px] border ${errors.password ? 'border-red-500' : 'border-white/5'
                    } focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all text-sm`}
                  placeholder="Nhập mật khẩu"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-montserrat font-bold py-4 px-6 rounded-[12px] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mb-6"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  ĐANG XỬ LÝ...
                </>
              ) : (
                'ĐĂNG NHẬP'
              )}
            </button>

            {/* Links */}
            <div className="text-center space-y-3">
              <p className="text-[#7f7f7f] text-xs">
                Chưa có tài khoản?{' '}
                <a href="#register" className="text-primary hover:underline font-bold transition-colors">
                  Đăng ký ngay
                </a>
              </p>
              <a href="#forgot-password" className="text-[#7f7f7f] hover:text-white text-[10px] transition-colors block uppercase tracking-widest">
                Quên mật khẩu?
              </a>
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

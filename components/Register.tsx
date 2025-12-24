import React, { useState } from 'react';
import { Upload, Eye, EyeOff, Shield, User as UserIcon, Mail, Lock, Sword, Trophy, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { Rank, Role } from '../types';

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  mainRole: string;
  profileScreenshot: File | null;
}

interface ValidationErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  mainRole?: string;
  profileScreenshot?: string;
}

interface VerifiedData {
  level: number;
  rank: string;
  total_matches: number;
  win_rate: number;
  credibility_score: number;
  verified_at: string;
  screenshot_url: string;
}

export const Register: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    mainRole: '',
    profileScreenshot: null,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [verifiedData, setVerifiedData] = useState<VerifiedData | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [apiError, setApiError] = useState<string>('');

  // Validation functions
  const validateUsername = (username: string): string | undefined => {
    if (!username) return 'Vui lòng nhập tên người dùng';
    if (username.length < 3) return 'Tên người dùng phải có ít nhất 3 ký tự';
    if (username.length > 20) return 'Tên người dùng không được quá 20 ký tự';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Tên người dùng chỉ được chứa chữ, số và dấu gạch dưới';
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Vui lòng nhập email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email không hợp lệ';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Vui lòng nhập mật khẩu';
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

  const validateFile = (file: File | null): string | undefined => {
    if (!file) return 'Vui lòng tải lên ảnh hồ sơ game';

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) return 'Chỉ chấp nhận file JPG hoặc PNG';

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) return 'Kích thước file không được vượt quá 5MB';

    return undefined;
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file) {
      const error = validateFile(file);
      if (error) {
        setErrors(prev => ({ ...prev, profileScreenshot: error }));
        return;
      }

      setFormData(prev => ({ ...prev, profileScreenshot: file }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Clear error
      setErrors(prev => ({ ...prev, profileScreenshot: undefined }));
    }
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {
      username: validateUsername(formData.username),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(formData.password, formData.confirmPassword),
      profileScreenshot: validateFile(formData.profileScreenshot),
    };

    if (!formData.mainRole) newErrors.mainRole = 'Vui lòng chọn vị trí chính';

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
      // Step 1: Verify profile screenshot
      const formDataToSend = new FormData();
      formDataToSend.append('profile_screenshot', formData.profileScreenshot!);

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

      const verifyResponse = await fetch(`${API_URL}/auth/verify-profile`, {
        method: 'POST',
        body: formDataToSend,
      });

      const verifyResult = await verifyResponse.json();

      if (!verifyResponse.ok || !verifyResult.success) {
        setApiError(verifyResult.error || 'Không thể xác thực ảnh hồ sơ. Vui lòng thử lại.');
        setIsLoading(false);
        return;
      }

      setVerifiedData(verifyResult.data);

      // Step 2: Register user with verified data
      const registerData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        rank: verifyResult.data.rank,
        main_role: formData.mainRole,
        level: verifyResult.data.level,
        win_rate: verifyResult.data.win_rate,
        total_matches: verifyResult.data.total_matches,
        credibility_score: verifyResult.data.credibility_score,
        profile_screenshot_url: verifyResult.data.screenshot_url,
      };

      const registerResponse = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const registerResult = await registerResponse.json();

      if (!registerResponse.ok) {
        setApiError(registerResult.error || 'Đăng ký thất bại. Vui lòng thử lại.');
        setIsLoading(false);
        return;
      }

      // Success
      setRegistrationSuccess(true);
    } catch (error) {
      console.error('Registration error:', error);
      setApiError('Có lỗi xảy ra. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render roles dropdown options
  const renderRoleOptions = () => {
    return Object.entries(Role).map(([key, value]) => (
      <option key={key} value={key}>
        {value}
      </option>
    ));
  };

  // Success screen
  if (registrationSuccess && verifiedData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="max-w-2xl w-full">
          <div className="bg-slate-900/80 backdrop-blur border border-green-500/50 p-1 rounded-none clip-angled shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <div className="bg-slate-800/50 p-8 clip-angled border-l-2 border-green-500">
              {/* Decorative corners */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500"></div>

              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full border-2 border-green-500 mb-4">
                  <CheckCircle className="w-12 h-12 text-green-400" />
                </div>
                <h2 className="text-3xl font-display font-bold text-white mb-2">
                  ĐĂNG KÝ THÀNH CÔNG!
                </h2>
                <p className="text-slate-400">Chào mừng bạn đến với ArenaHub</p>
              </div>

              {/* Verified Profile Info */}
              <div className="bg-slate-950/50 border border-slate-700 p-6 mb-6">
                <h3 className="text-gold-400 font-display font-bold text-lg mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  THÔNG TIN ĐÃ XÁC THỰC
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 uppercase text-xs mb-1">Rank</p>
                    <p className="text-white font-bold">{verifiedData.rank}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 uppercase text-xs mb-1">Cấp độ</p>
                    <p className="text-white font-bold">Level {verifiedData.level}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 uppercase text-xs mb-1">Tổng số trận</p>
                    <p className="text-white font-bold">{verifiedData.total_matches.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 uppercase text-xs mb-1">Tỷ lệ thắng</p>
                    <p className="text-white font-bold">{verifiedData.win_rate}%</p>
                  </div>
                  <div>
                    <p className="text-slate-500 uppercase text-xs mb-1">Uy tín</p>
                    <p className="text-white font-bold">{verifiedData.credibility_score}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 uppercase text-xs mb-1">Rank</p>
                    <p className="text-white font-bold">{verifiedData.rank}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => window.location.hash = 'login'}
                className="w-full bg-gold-500 hover:bg-gold-400 text-slate-950 font-display font-bold py-3 px-6 clip-hex-button transition-all hover:translate-y-[-2px] hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]"
              >
                ĐĂNG NHẬP NGAY
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img
              src="https://i.ibb.co/F4Qfph6n/liqi88-christmas.png"
              alt="Arena Hub Logo"
              className="h-28 w-auto object-contain"
            />
          </div>
          <h2 className="text-2xl font-montserrat font-bold text-white mb-2 uppercase">ĐĂNG KÝ TÀI KHOẢN</h2>
          <p className="text-[#7f7f7f] text-sm font-montserrat">Tham gia cộng đồng game thủ Liên Quân Mobile</p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-bg-secondary/80 backdrop-blur border border-white/5 p-8 rounded-[20px] shadow-2xl">
            {/* API Error Message */}
            {apiError && (
              <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-bold text-xs mb-1 uppercase tracking-wider">LỖI ĐĂNG KÝ</p>
                  <p className="text-red-300 text-xs">{apiError}</p>
                </div>
              </div>
            )}

            {/* Basic Info Section */}
            <div className="mb-10">
              <h3 className="text-primary font-montserrat font-bold text-[12px] mb-6 flex items-center gap-2 uppercase tracking-widest">
                <UserIcon className="w-4 h-4" />
                THÔNG TIN CƠ BẢN
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Username */}
                <div>
                  <label className="block text-[#7f7f7f] text-[10px] font-bold mb-2 uppercase tracking-widest">
                    Tên người dùng *
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7f7f7f]" />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className={`w-full bg-bg-main/50 text-white pl-12 pr-4 py-3.5 rounded-[12px] border ${errors.username ? 'border-red-500' : 'border-white/5'
                        } focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all text-sm`}
                      placeholder="vd: ProGamerVN"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[#7f7f7f] text-[10px] font-bold mb-2 uppercase tracking-widest">
                    Email *
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
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[#7f7f7f] text-[10px] font-bold mb-2 uppercase tracking-widest">
                    Mật khẩu *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7f7f7f]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full bg-bg-main/50 text-white pl-12 pr-12 py-3.5 rounded-[12px] border ${errors.password ? 'border-red-500' : 'border-white/5'
                        } focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all text-sm`}
                      placeholder="Tối thiểu 8 ký tự"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[#7f7f7f] text-[10px] font-bold mb-2 uppercase tracking-widest">
                    Xác nhận mật khẩu *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7f7f7f]" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`w-full bg-bg-main/50 text-white pl-12 pr-12 py-3.5 rounded-[12px] border ${errors.confirmPassword ? 'border-red-500' : 'border-white/5'
                        } focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all text-sm`}
                      placeholder="Nhập lại mật khẩu"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Game Profile Section */}
            <div className="mb-10">
              <h3 className="text-primary font-montserrat font-bold text-[12px] mb-6 flex items-center gap-2 uppercase tracking-widest">
                <Trophy className="w-4 h-4" />
                HỒ SƠ GAME
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Main Role */}
                <div>
                  <label className="block text-[#7f7f7f] text-[10px] font-bold mb-2 uppercase tracking-widest">
                    Vị trí chính *
                  </label>
                  <div className="relative">
                    <Sword className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7f7f7f] z-10" />
                    <select
                      value={formData.mainRole}
                      onChange={(e) => handleInputChange('mainRole', e.target.value)}
                      className={`w-full bg-bg-main/50 text-white pl-12 pr-4 py-3.5 rounded-[12px] border ${errors.mainRole ? 'border-red-500' : 'border-white/5'
                        } focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer text-sm`}
                    >
                      <option value="">-- Chọn vị trí --</option>
                      {renderRoleOptions()}
                    </select>
                  </div>
                </div>

                {/* Profile Screenshot Upload */}
                <div>
                  <label className="block text-[#7f7f7f] text-[10px] font-bold mb-2 uppercase tracking-widest">
                    Ảnh hồ sơ game *
                  </label>

                  <div className={`border-2 border-dashed ${errors.profileScreenshot ? 'border-red-500' : 'border-white/5'
                    } bg-bg-main/30 p-6 rounded-[12px] transition-all hover:border-primary/50 cursor-pointer relative`}>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />

                    {previewUrl ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-h-40 object-contain mb-3 rounded-lg border border-white/5"
                        />
                        <p className="text-white/40 text-[10px]">Click để thay đổi ảnh</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center">
                        <Upload className="w-8 h-8 text-[#7f7f7f] mb-2" />
                        <p className="text-white font-bold text-xs mb-1">Tải lên ảnh hồ sơ</p>
                        <p className="text-[#7f7f7f] text-[10px]">JPG, PNG • Tối đa 5MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col gap-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-montserrat font-bold py-4 px-6 rounded-[12px] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    ĐANG XỬ LÝ...
                  </>
                ) : (
                  'ĐĂNG KÝ'
                )}
              </button>

              <p className="text-center text-[#7f7f7f] text-xs">
                Đã có tài khoản?{' '}
                <a href="#login" className="text-primary hover:underline font-bold transition-colors">
                  Đăng nhập ngay
                </a>
              </p>
            </div>
          </div>
        </form>

        {/* Footer note */}
        <p className="text-center text-slate-600 text-xs mt-6">
          Bằng việc đăng ký, bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật của ArenaHub
        </p>
      </div>
    </div>
  );
};

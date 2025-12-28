import React, { useState } from 'react';
import { Mail, AlertCircle, Loader, CheckCircle, ArrowLeft } from 'lucide-react';

interface FormData {
  email: string;
}

interface ValidationErrors {
  email?: string;
}

export const ForgotPassword: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Vui lòng nhập email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email không hợp lệ';
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
      email: validateEmail(formData.email),
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

      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
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
      console.error('Forgot password error:', error);
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
              <h2 className="text-2xl font-montserrat font-bold text-white mb-2">EMAIL ĐÃ GỬI</h2>
              <p className="text-[#7f7f7f] text-sm font-montserrat">
                Chúng tôi đã gửi email hướng dẫn đặt lại mật khẩu đến
              </p>
              <p className="text-primary font-bold text-sm mt-1">{formData.email}</p>
            </div>

            <div className="bg-bg-main/50 border border-white/5 p-4 rounded-lg mb-6">
              <p className="text-[#7f7f7f] text-xs text-center">
                Vui lòng kiểm tra hộp thư của bạn và làm theo hướng dẫn trong email.
                Nếu không thấy email, hãy kiểm tra thư mục spam.
              </p>
            </div>

            {/* Back to Login */}
            <button
              onClick={() => window.location.hash = 'login'}
              className="w-full bg-primary hover:bg-primary/90 text-white font-montserrat font-bold py-4 px-6 rounded-[12px] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              QUAY LẠI ĐĂNG NHẬP
            </button>
          </div>

          {/* Footer note */}
          <p className="text-center text-slate-600 text-xs mt-6">
            Email có hiệu lực trong 48 giờ
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
          <h2 className="text-2xl font-montserrat font-bold text-white mb-2">QUÊN MẬT KHẨU</h2>
          <p className="text-[#7f7f7f] text-sm font-montserrat">
            Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu
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
                'GỬI EMAIL ĐẶT LẠI MẬT KHẨU'
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
          Email sẽ chứa link đặt lại mật khẩu có hiệu lực trong 48 giờ
        </p>
      </div>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { X, Loader2, User, MapPin, Check, Upload, Shield, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Role options with Vietnamese display names
const ROLE_OPTIONS = [
    { value: 'TOP', label: 'Đường Caesar' },
    { value: 'JUNGLE', label: 'Rừng' },
    { value: 'MID', label: 'Đường Giữa' },
    { value: 'AD', label: 'Xạ Thủ' },
    { value: 'SUPPORT', label: 'Trợ Thủ' },
];

interface VerifiedData {
    level: number;
    rank: string;
    total_matches: number;
    win_rate: number;
    credibility_score: number;
    verified_at: string;
    screenshot_url: string;
}

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUsername: string;
    currentMainRole: string | null;
    token: string | null;
    onSuccess: (updatedData: { username: string; main_role: string | null }) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
    isOpen,
    onClose,
    currentUsername,
    currentMainRole,
    token,
    onSuccess,
}) => {
    const [username, setUsername] = useState(currentUsername);
    const [mainRole, setMainRole] = useState(currentMainRole || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Profile screenshot states
    const [profileScreenshot, setProfileScreenshot] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifiedData, setVerifiedData] = useState<VerifiedData | null>(null);
    const [verifyError, setVerifyError] = useState<string | null>(null);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setUsername(currentUsername);
            setMainRole(currentMainRole || '');
            setError(null);
            setProfileScreenshot(null);
            setPreviewUrl('');
            setVerifiedData(null);
            setVerifyError(null);
        }
    }, [isOpen, currentUsername, currentMainRole]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Validate file
    const validateFile = (file: File): string | null => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            return 'Chỉ chấp nhận file JPG hoặc PNG';
        }
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return 'Kích thước file không được vượt quá 5MB';
        }
        return null;
    };

    // Handle file upload
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;

        if (file) {
            const validationError = validateFile(file);
            if (validationError) {
                setVerifyError(validationError);
                return;
            }

            setProfileScreenshot(file);
            setVerifyError(null);
            setVerifiedData(null);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Auto-verify the screenshot
            await verifyScreenshot(file);
        }
    };

    // Verify screenshot with API
    const verifyScreenshot = async (file: File) => {
        setIsVerifying(true);
        setVerifyError(null);

        try {
            const formData = new FormData();
            formData.append('profile_screenshot', file);

            const response = await fetch(`${API_URL}/auth/verify-profile`, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                setVerifyError(result.detail || result.error || 'Không thể xác thực ảnh hồ sơ. Vui lòng thử lại.');
                setVerifiedData(null);
                return;
            }

            setVerifiedData(result.data);
        } catch (err) {
            console.error('Verification error:', err);
            setVerifyError('Có lỗi xảy ra khi xác thực ảnh. Vui lòng thử lại.');
        } finally {
            setIsVerifying(false);
        }
    };

    // Clear screenshot
    const clearScreenshot = () => {
        setProfileScreenshot(null);
        setPreviewUrl('');
        setVerifiedData(null);
        setVerifyError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!username.trim()) {
            setError('Tên người dùng không được để trống');
            return;
        }
        if (username.length < 3) {
            setError('Tên người dùng phải có ít nhất 3 ký tự');
            return;
        }
        if (username.length > 50) {
            setError('Tên người dùng không được quá 50 ký tự');
            return;
        }

        setIsLoading(true);

        try {
            // Build update payload
            const updatePayload: Record<string, unknown> = {
                username: username.trim(),
                main_role: mainRole || null,
            };

            // Include verified game stats if available
            if (verifiedData) {
                updatePayload.level = verifiedData.level;
                updatePayload.rank = verifiedData.rank;
                updatePayload.win_rate = verifiedData.win_rate;
                updatePayload.total_matches = verifiedData.total_matches;
                updatePayload.credibility_score = verifiedData.credibility_score;
                updatePayload.profile_screenshot_url = verifiedData.screenshot_url;
            }

            const response = await fetch(`${API_URL}/auth/me/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(updatePayload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Cập nhật thất bại');
            }

            onSuccess({
                username: data.user.username,
                main_role: data.user.main_role,
            });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 sticky top-0 bg-bg-secondary z-10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Chỉnh sửa hồ sơ
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Error message */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Username field */}
                    <div className="space-y-2">
                        <label htmlFor="username" className="block text-sm font-medium text-slate-300">
                            Tên người dùng
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Nhập tên người dùng"
                                className="w-full bg-bg-main border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                                maxLength={50}
                            />
                        </div>
                        <p className="text-xs text-slate-500">{username.length}/50 ký tự</p>
                    </div>

                    {/* Main Role field */}
                    <div className="space-y-2">
                        <label htmlFor="mainRole" className="block text-sm font-medium text-slate-300">
                            Vị trí ưa thích
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <select
                                id="mainRole"
                                value={mainRole}
                                onChange={(e) => setMainRole(e.target.value)}
                                className="w-full bg-bg-main border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none cursor-pointer"
                            >
                                <option value="">Chưa chọn</option>
                                {ROLE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {/* Custom dropdown arrow */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Profile Screenshot Upload Section */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">
                            Cập nhật thông tin game
                        </label>
                        <p className="text-xs text-slate-500 mb-3">
                            Tải lên ảnh chụp màn hình hồ sơ game để tự động cập nhật rank, level, tỷ lệ thắng...
                        </p>

                        <div className={`border-2 border-dashed ${verifyError ? 'border-red-500' : 'border-white/10'} bg-bg-main/30 p-4 rounded-xl transition-all hover:border-primary/50 cursor-pointer relative`}>
                            <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                disabled={isVerifying}
                            />

                            {isVerifying ? (
                                <div className="flex flex-col items-center py-4">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                                    <p className="text-white text-sm">Đang xác thực ảnh...</p>
                                </div>
                            ) : previewUrl ? (
                                <div className="flex flex-col items-center">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="max-h-32 object-contain mb-3 rounded-lg border border-white/10"
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            clearScreenshot();
                                        }}
                                        className="text-red-400 text-xs hover:text-red-300 transition-colors"
                                    >
                                        Xóa ảnh
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-center py-4">
                                    <Upload className="w-8 h-8 text-slate-500 mb-2" />
                                    <p className="text-white font-medium text-sm mb-1">Tải lên ảnh hồ sơ game</p>
                                    <p className="text-slate-500 text-xs">JPG, PNG • Tối đa 5MB</p>
                                </div>
                            )}
                        </div>

                        {/* Verify Error */}
                        {verifyError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                {verifyError}
                            </div>
                        )}

                        {/* Verified Data Display */}
                        {verifiedData && (
                            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl">
                                <h4 className="text-green-400 font-medium text-sm mb-3 flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    Thông tin đã xác thực
                                </h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-slate-500 text-xs uppercase mb-1">Rank</p>
                                        <p className="text-white font-medium">{verifiedData.rank}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs uppercase mb-1">Cấp độ</p>
                                        <p className="text-white font-medium">Level {verifiedData.level}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs uppercase mb-1">Tổng số trận</p>
                                        <p className="text-white font-medium">{verifiedData.total_matches.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs uppercase mb-1">Tỷ lệ thắng</p>
                                        <p className="text-white font-medium">{verifiedData.win_rate}%</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-slate-500 text-xs uppercase mb-1">Uy tín</p>
                                        <p className="text-white font-medium">{verifiedData.credibility_score}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || isVerifying}
                            className="flex-1 py-3 px-4 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    Lưu thay đổi
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

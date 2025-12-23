import React, { useState, useEffect } from 'react';
import { X, Loader2, User, MapPin, Check } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Role options with Vietnamese display names
const ROLE_OPTIONS = [
    { value: 'TOP', label: 'Đường Caesar' },
    { value: 'JUNGLE', label: 'Rừng' },
    { value: 'MID', label: 'Đường Giữa' },
    { value: 'AD', label: 'Xạ Thủ' },
    { value: 'SUPPORT', label: 'Trợ Thủ' },
];

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

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setUsername(currentUsername);
            setMainRole(currentMainRole || '');
            setError(null);
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
            const response = await fetch(`${API_URL}/auth/me/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    username: username.trim(),
                    main_role: mainRole || null,
                }),
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
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
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
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
                            disabled={isLoading}
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

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    variant?: 'danger' | 'warning' | 'default';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    isLoading = false,
    variant = 'danger',
}) => {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: 'bg-red-500/20 text-red-400',
            button: 'bg-red-500 hover:bg-red-600 text-white',
        },
        warning: {
            icon: 'bg-yellow-500/20 text-yellow-400',
            button: 'bg-yellow-500 hover:bg-yellow-600 text-black',
        },
        default: {
            icon: 'bg-primary/20 text-primary',
            button: 'bg-primary hover:bg-primary/80 text-white',
        },
    };

    const styles = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative bg-bg-secondary border border-white/10 rounded-[20px] w-full max-w-[400px] shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                    <X className="w-4 h-4 text-white/60" />
                </button>

                {/* Content */}
                <div className="p-6 text-center">
                    {/* Icon */}
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${styles.icon}`}>
                        <AlertTriangle className="w-8 h-8" />
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-montserrat font-bold text-white mb-2">
                        {title}
                    </h3>

                    {/* Message */}
                    <p className="text-white/70 text-sm mb-6 leading-relaxed">
                        {message}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 py-3 px-4 rounded-[12px] bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-colors disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`flex-1 py-3 px-4 rounded-[12px] font-medium text-sm transition-colors disabled:opacity-50 ${styles.button}`}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Đang xử lý...
                                </span>
                            ) : (
                                confirmText
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

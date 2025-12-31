import React from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

export type ConfirmType = 'danger' | 'warning' | 'info';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: ConfirmType;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    type = 'info',
}) => {
    if (!isOpen) return null;

    const getTypeStyles = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
                    confirmBtn: 'bg-red-600 hover:bg-red-500 text-white',
                    iconBg: 'bg-red-500/10',
                };
            case 'warning':
                return {
                    icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
                    confirmBtn: 'bg-amber-600 hover:bg-amber-500 text-white',
                    iconBg: 'bg-amber-500/10',
                };
            default:
                return {
                    icon: <Info className="w-6 h-6 text-blue-500" />,
                    confirmBtn: 'bg-blue-600 hover:bg-blue-500 text-white',
                    iconBg: 'bg-blue-500/10',
                };
        }
    };

    const styles = getTypeStyles();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="relative bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${styles.iconBg}`}>
                            {styles.icon}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                            <p className="text-slate-400 leading-relaxed text-sm">
                                {message}
                            </p>
                        </div>
                        <button
                            onClick={onCancel}
                            className="text-slate-500 hover:text-slate-400 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-8">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all shadow-lg ${styles.confirmBtn}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

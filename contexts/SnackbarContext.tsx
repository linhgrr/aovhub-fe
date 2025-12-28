import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type SnackbarType = 'success' | 'error' | 'warning' | 'info';

interface SnackbarItem {
    id: string;
    message: string;
    type: SnackbarType;
    duration?: number;
}

interface SnackbarContextType {
    showSnackbar: (message: string, type?: SnackbarType, duration?: number) => void;
    showSuccess: (message: string, duration?: number) => void;
    showError: (message: string, duration?: number) => void;
    showWarning: (message: string, duration?: number) => void;
    showInfo: (message: string, duration?: number) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const useSnackbar = () => {
    const context = useContext(SnackbarContext);
    if (!context) {
        throw new Error('useSnackbar must be used within a SnackbarProvider');
    }
    return context;
};

interface SnackbarProviderProps {
    children: ReactNode;
}

export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({ children }) => {
    const [snackbars, setSnackbars] = useState<SnackbarItem[]>([]);

    const removeSnackbar = useCallback((id: string) => {
        setSnackbars((prev) => prev.filter((snackbar) => snackbar.id !== id));
    }, []);

    const showSnackbar = useCallback(
        (message: string, type: SnackbarType = 'info', duration: number = 4000) => {
            const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newSnackbar: SnackbarItem = { id, message, type, duration };

            setSnackbars((prev) => [...prev, newSnackbar]);

            // Auto remove after duration
            if (duration > 0) {
                setTimeout(() => {
                    removeSnackbar(id);
                }, duration);
            }
        },
        [removeSnackbar]
    );

    const showSuccess = useCallback(
        (message: string, duration?: number) => showSnackbar(message, 'success', duration),
        [showSnackbar]
    );

    const showError = useCallback(
        (message: string, duration?: number) => showSnackbar(message, 'error', duration),
        [showSnackbar]
    );

    const showWarning = useCallback(
        (message: string, duration?: number) => showSnackbar(message, 'warning', duration),
        [showSnackbar]
    );

    const showInfo = useCallback(
        (message: string, duration?: number) => showSnackbar(message, 'info', duration),
        [showSnackbar]
    );

    return (
        <SnackbarContext.Provider
            value={{ showSnackbar, showSuccess, showError, showWarning, showInfo }}
        >
            {children}
            <SnackbarContainer snackbars={snackbars} onRemove={removeSnackbar} />
        </SnackbarContext.Provider>
    );
};

// Snackbar Container Component
interface SnackbarContainerProps {
    snackbars: SnackbarItem[];
    onRemove: (id: string) => void;
}

const SnackbarContainer: React.FC<SnackbarContainerProps> = ({ snackbars, onRemove }) => {
    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
            {snackbars.map((snackbar) => (
                <SnackbarNotification
                    key={snackbar.id}
                    snackbar={snackbar}
                    onClose={() => onRemove(snackbar.id)}
                />
            ))}
        </div>
    );
};

// Individual Snackbar Notification
interface SnackbarNotificationProps {
    snackbar: SnackbarItem;
    onClose: () => void;
}

const SnackbarNotification: React.FC<SnackbarNotificationProps> = ({ snackbar, onClose }) => {
    const typeConfig = {
        success: {
            bg: 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10',
            border: 'border-emerald-500/30',
            icon: (
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            ),
            iconBg: 'bg-emerald-500/20',
            progressBar: 'bg-emerald-400',
        },
        error: {
            bg: 'bg-gradient-to-r from-red-500/20 to-red-600/10',
            border: 'border-red-500/30',
            icon: (
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            ),
            iconBg: 'bg-red-500/20',
            progressBar: 'bg-red-400',
        },
        warning: {
            bg: 'bg-gradient-to-r from-amber-500/20 to-amber-600/10',
            border: 'border-amber-500/30',
            icon: (
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
            iconBg: 'bg-amber-500/20',
            progressBar: 'bg-amber-400',
        },
        info: {
            bg: 'bg-gradient-to-r from-blue-500/20 to-blue-600/10',
            border: 'border-blue-500/30',
            icon: (
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            iconBg: 'bg-blue-500/20',
            progressBar: 'bg-blue-400',
        },
    };

    const config = typeConfig[snackbar.type];

    return (
        <div
            className={`pointer-events-auto animate-in slide-in-from-right-full fade-in duration-300 ease-out
        ${config.bg} ${config.border} border backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden`}
        >
            <div className="flex items-start gap-3 p-4">
                {/* Icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${config.iconBg} flex items-center justify-center`}>
                    {config.icon}
                </div>

                {/* Message */}
                <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-white/90 text-sm font-medium leading-relaxed">{snackbar.message}</p>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-all"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Progress Bar */}
            {snackbar.duration && snackbar.duration > 0 && (
                <div className="h-0.5 bg-white/5">
                    <div
                        className={`h-full ${config.progressBar} animate-progress-shrink`}
                        style={{
                            animationDuration: `${snackbar.duration}ms`,
                            animationTimingFunction: 'linear',
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default SnackbarProvider;

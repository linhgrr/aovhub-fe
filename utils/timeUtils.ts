/**
 * Time formatting utilities for Vietnam timezone (GMT+7)
 * All functions use Asia/Ho_Chi_Minh timezone
 * 
 * IMPORTANT: Backend returns naive datetime strings (without timezone suffix)
 * which are stored in UTC. We need to treat them as UTC before converting to GMT+7.
 */

const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Parse a datetime string as UTC.
 * Backend returns naive datetimes like "2025-12-26T03:50:00.000000" (no Z suffix)
 * which JavaScript would interpret as local time. This function ensures they're
 * treated as UTC.
 */
const parseAsUTC = (dateString: string): Date => {
    // If the string already has timezone info (Z or +/-), parse directly
    if (dateString.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateString)) {
        return new Date(dateString);
    }
    // Otherwise, append Z to treat as UTC
    return new Date(dateString + 'Z');
};

/**
 * Format relative time (e.g., "5 phút trước", "2 giờ trước")
 */
export const formatTimeAgo = (dateString: string | null): string => {
    if (!dateString) return '';

    const date = parseAsUTC(dateString);

    // Check for invalid date
    if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return '';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
        return 'Vừa xong';
    } else if (diffMinutes < 60) {
        return `${diffMinutes} phút trước`;
    } else if (diffHours < 24) {
        return `${diffHours} giờ trước`;
    } else if (diffDays < 7) {
        return `${diffDays} ngày trước`;
    } else {
        return formatFullDate(dateString);
    }
};

/**
 * Format full date with time (e.g., "26/12/2024, 03:35")
 */
export const formatFullDate = (dateString: string): string => {
    const date = parseAsUTC(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString('vi-VN', {
        timeZone: VIETNAM_TIMEZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Format date only (e.g., "26/12/2024")
 */
export const formatDate = (dateString: string): string => {
    const date = parseAsUTC(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('vi-VN', {
        timeZone: VIETNAM_TIMEZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

/**
 * Format short date without year (e.g., "26/12")
 */
export const formatShortDate = (dateString: string): string => {
    const date = parseAsUTC(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('vi-VN', {
        timeZone: VIETNAM_TIMEZONE,
        day: '2-digit',
        month: '2-digit',
    });
};

/**
 * Format time only (e.g., "03:35")
 */
export const formatTime = (dateString: string): string => {
    const date = parseAsUTC(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('vi-VN', {
        timeZone: VIETNAM_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Format for chat messages - shows time for today, date for older
 */
export const formatChatTime = (dateString: string): string => {
    const date = parseAsUTC(dateString);
    if (isNaN(date.getTime())) return '';

    const now = new Date();

    // Get dates in Vietnam timezone for comparison
    const dateInVN = new Date(date.toLocaleString('en-US', { timeZone: VIETNAM_TIMEZONE }));
    const nowInVN = new Date(now.toLocaleString('en-US', { timeZone: VIETNAM_TIMEZONE }));

    const isToday = dateInVN.toDateString() === nowInVN.toDateString();

    const yesterday = new Date(nowInVN);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = dateInVN.toDateString() === yesterday.toDateString();

    if (isToday) {
        return formatTime(dateString);
    } else if (isYesterday) {
        return `Hôm qua ${formatTime(dateString)}`;
    } else {
        return formatFullDate(dateString);
    }
};

/**
 * Format for date separators in chat
 */
export const formatDateSeparator = (dateString: string): string => {
    const date = parseAsUTC(dateString);
    if (isNaN(date.getTime())) return '';

    const now = new Date();

    const dateInVN = new Date(date.toLocaleString('en-US', { timeZone: VIETNAM_TIMEZONE }));
    const nowInVN = new Date(now.toLocaleString('en-US', { timeZone: VIETNAM_TIMEZONE }));

    const isToday = dateInVN.toDateString() === nowInVN.toDateString();

    const yesterday = new Date(nowInVN);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = dateInVN.toDateString() === yesterday.toDateString();

    if (isToday) {
        return 'Hôm nay';
    } else if (isYesterday) {
        return 'Hôm qua';
    } else {
        return formatDate(dateString);
    }
};

/**
 * Check if two dates are on the same day (in Vietnam timezone)
 */
export const isSameDay = (dateString1: string, dateString2: string): boolean => {
    const date1 = parseAsUTC(dateString1);
    const date2 = parseAsUTC(dateString2);

    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return false;

    const date1InVN = new Date(date1.toLocaleString('en-US', { timeZone: VIETNAM_TIMEZONE }));
    const date2InVN = new Date(date2.toLocaleString('en-US', { timeZone: VIETNAM_TIMEZONE }));

    return date1InVN.toDateString() === date2InVN.toDateString();
};

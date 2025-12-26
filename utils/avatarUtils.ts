/**
 * Avatar utility functions for consistent avatar rendering across the application.
 */

/**
 * Get avatar URL with fallback to letter-based avatar
 * @param avatarUrl - User's custom avatar URL (can be null/undefined)
 * @param username - User's username (can be null/undefined)
 * @returns A valid avatar URL (either custom or generated)
 */
export function getAvatarUrl(
    avatarUrl: string | null | undefined,
    username: string | null | undefined
): string {
    // If custom avatar exists, use it
    if (avatarUrl && avatarUrl.trim() !== '') {
        return avatarUrl;
    }

    // Generate fallback avatar with first letter of username
    const firstLetter = (username && username.trim() !== '')
        ? username.charAt(0).toUpperCase()
        : '?';

    // Use ui-avatars.com with app's primary color (#8c67f6)
    // Parameters:
    // - name: The letter to display
    // - background: Purple color without # (8c67f6)
    // - color: White text (fff)
    // - size: 200px for good quality
    // - bold: true for better visibility
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstLetter)}&background=8c67f6&color=fff&size=200&bold=true`;
}

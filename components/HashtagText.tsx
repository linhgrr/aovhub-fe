import React from 'react';

// Special hashtags that should be highlighted in yellow with firework trigger
const SPECIAL_HASHTAGS = ['happynewyear2026', 'nguyensontung'];

/**
 * Check if content contains any special hashtags
 */
export const hasSpecialHashtag = (content: string): boolean => {
    if (!content) return false;
    const lowerContent = content.toLowerCase();
    return SPECIAL_HASHTAGS.some(tag => lowerContent.includes(`#${tag}`));
};

/**
 * Check if content contains #nguyensontung hashtag
 */
export const hasNguyenSonTungHashtag = (content: string): boolean => {
    if (!content) return false;
    return content.toLowerCase().includes('#nguyensontung');
};

/**
 * Check if content contains #happynewyear2026 hashtag
 */
export const hasHappyNewYearHashtag = (content: string): boolean => {
    if (!content) return false;
    return content.toLowerCase().includes('#happynewyear2026');
};

/**
 * Parse content and render hashtags with appropriate styling
 * Special hashtags (#happynewyear2026, #nguyensontung) are highlighted in yellow
 * Other hashtags are rendered in primary color
 */
export const renderHashtagContent = (content: string): React.ReactNode => {
    if (!content) return null;

    // Split content by hashtag pattern while keeping the hashtags
    const parts = content.split(/(#\w+)/g);

    return parts.map((part, index) => {
        if (part.startsWith('#')) {
            const tag = part.slice(1).toLowerCase();
            const isSpecial = SPECIAL_HASHTAGS.includes(tag);

            if (isSpecial) {
                return (
                    <span
                        key={index}
                        className="text-yellow-400 font-semibold hover:text-yellow-300"
                        style={{
                            textShadow: '0 0 10px rgba(250, 204, 21, 0.5)',
                        }}
                    >
                        {part}
                    </span>
                );
            }

            // Regular hashtag
            return (
                <span
                    key={index}
                    className="text-primary hover:underline cursor-pointer"
                >
                    {part}
                </span>
            );
        }

        // Regular text
        return part;
    });
};

interface HashtagTextProps {
    content: string;
    className?: string;
}

/**
 * Component to render text with hashtag highlighting
 */
export const HashtagText: React.FC<HashtagTextProps> = ({ content, className = '' }) => {
    if (!content) return null;

    return (
        <span className={className}>
            {renderHashtagContent(content)}
        </span>
    );
};

export default HashtagText;

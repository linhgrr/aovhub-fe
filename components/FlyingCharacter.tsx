import React, { useEffect, useState } from 'react';

interface Cloud {
    id: number;
    x: number;
    y: number;
    size: number;
    opacity: number;
    speed: number;
    layer: number;
}

interface FlyingCharacterProps {
    isActive: boolean;
    onComplete?: () => void;
    duration?: number;
}

/**
 * Chinese classical style flying character animation with peaceful cloud background
 * Triggered by #nguyensontung hashtag
 */
export const FlyingCharacter: React.FC<FlyingCharacterProps> = ({
    isActive,
    onComplete,
    duration = 5000,
}) => {
    const [clouds, setClouds] = useState<Cloud[]>([]);
    const [characterX, setCharacterX] = useState(-20);
    const [showCharacter, setShowCharacter] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);

    // Initialize clouds and animation
    useEffect(() => {
        if (!isActive) {
            setClouds([]);
            setCharacterX(-20);
            setShowCharacter(false);
            setFadeOut(false);
            return;
        }

        // Create layered cloud positions for depth effect
        const initialClouds: Cloud[] = [];

        // Far background clouds (slower, smaller, more transparent)
        for (let i = 0; i < 6; i++) {
            initialClouds.push({
                id: i,
                x: Math.random() * 120 - 10,
                y: 15 + Math.random() * 30,
                size: 60 + Math.random() * 40,
                opacity: 0.2 + Math.random() * 0.15,
                speed: 0.02 + Math.random() * 0.02,
                layer: 1,
            });
        }

        // Mid-layer clouds
        for (let i = 6; i < 14; i++) {
            initialClouds.push({
                id: i,
                x: Math.random() * 120 - 10,
                y: 20 + Math.random() * 40,
                size: 90 + Math.random() * 60,
                opacity: 0.35 + Math.random() * 0.2,
                speed: 0.04 + Math.random() * 0.03,
                layer: 2,
            });
        }

        // Foreground clouds (faster, larger, more visible)
        for (let i = 14; i < 20; i++) {
            initialClouds.push({
                id: i,
                x: Math.random() * 120 - 10,
                y: 25 + Math.random() * 50,
                size: 120 + Math.random() * 80,
                opacity: 0.5 + Math.random() * 0.25,
                speed: 0.06 + Math.random() * 0.04,
                layer: 3,
            });
        }

        // Bottom decorative clouds (mist effect)
        for (let i = 20; i < 26; i++) {
            initialClouds.push({
                id: i,
                x: Math.random() * 120 - 10,
                y: 70 + Math.random() * 25,
                size: 150 + Math.random() * 100,
                opacity: 0.3 + Math.random() * 0.2,
                speed: 0.03 + Math.random() * 0.02,
                layer: 2,
            });
        }

        setClouds(initialClouds);
        setShowCharacter(true);

        // Start fade out before completion
        const fadeTimer = setTimeout(() => {
            setFadeOut(true);
        }, duration - 800);

        // Cleanup
        const timer = setTimeout(() => {
            setClouds([]);
            setShowCharacter(false);
            setCharacterX(-20);
            setFadeOut(false);
            onComplete?.();
        }, duration);

        return () => {
            clearTimeout(timer);
            clearTimeout(fadeTimer);
        };
    }, [isActive, duration, onComplete]);

    // Animate clouds drifting
    useEffect(() => {
        if (clouds.length === 0) return;

        const interval = setInterval(() => {
            setClouds(prev =>
                prev.map(cloud => ({
                    ...cloud,
                    x: cloud.x > 120 ? -20 - cloud.size / 10 : cloud.x + cloud.speed,
                }))
            );
        }, 16);

        return () => clearInterval(interval);
    }, [clouds.length > 0]);

    // Animate character flying from left to right
    useEffect(() => {
        if (!showCharacter) return;

        const interval = setInterval(() => {
            setCharacterX(prev => {
                if (prev >= 120) return 120;
                return prev + 0.35;
            });
        }, 16);

        return () => clearInterval(interval);
    }, [showCharacter]);

    if (!isActive && clouds.length === 0) return null;

    return (
        <div
            className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
            style={{
                opacity: fadeOut ? 0 : 1,
                transition: 'opacity 0.8s ease-out',
            }}
        >
            {/* Sky gradient background - Chinese classical dawn/dusk colors */}
            <div
                className="absolute inset-0"
                style={{
                    background: `linear-gradient(
                        180deg,
                        #1a1a2e 0%,
                        #16213e 15%,
                        #1f4068 30%,
                        #3d5a80 45%,
                        #5d7a9c 55%,
                        #98c1d9 70%,
                        #b8d4e3 80%,
                        #d4e4ec 90%,
                        #f0f4f7 100%
                    )`,
                }}
            />

            {/* Subtle gradient overlay for warmth (sunrise feel) */}
            <div
                className="absolute inset-0"
                style={{
                    background: `radial-gradient(
                        ellipse 150% 80% at 50% 80%,
                        rgba(255, 200, 150, 0.15) 0%,
                        transparent 60%
                    )`,
                }}
            />

            {/* Atmospheric mist layer */}
            <div
                className="absolute inset-0"
                style={{
                    background: `linear-gradient(
                        0deg,
                        rgba(255, 255, 255, 0.4) 0%,
                        rgba(255, 255, 255, 0.15) 20%,
                        transparent 50%
                    )`,
                }}
            />

            {/* Clouds - layered for depth */}
            {clouds.sort((a, b) => a.layer - b.layer).map(cloud => (
                <div
                    key={cloud.id}
                    className="absolute"
                    style={{
                        left: `${cloud.x}%`,
                        top: `${cloud.y}%`,
                        width: `${cloud.size}px`,
                        height: `${cloud.size * 0.5}px`,
                        transform: 'translate(-50%, -50%)',
                        filter: cloud.layer === 1 ? 'blur(8px)' : cloud.layer === 2 ? 'blur(4px)' : 'blur(2px)',
                    }}
                >
                    {/* Cloud shape using multiple overlapping circles */}
                    <div
                        className="absolute rounded-full"
                        style={{
                            width: '100%',
                            height: '100%',
                            background: `radial-gradient(ellipse, 
                                rgba(255, 255, 255, ${cloud.opacity}) 0%, 
                                rgba(255, 255, 255, ${cloud.opacity * 0.6}) 40%,
                                rgba(255, 255, 255, 0) 70%)`,
                        }}
                    />
                    <div
                        className="absolute rounded-full"
                        style={{
                            width: '70%',
                            height: '80%',
                            left: '-20%',
                            top: '10%',
                            background: `radial-gradient(ellipse, 
                                rgba(255, 255, 255, ${cloud.opacity * 0.9}) 0%, 
                                rgba(255, 255, 255, 0) 70%)`,
                        }}
                    />
                    <div
                        className="absolute rounded-full"
                        style={{
                            width: '60%',
                            height: '70%',
                            right: '-15%',
                            top: '15%',
                            background: `radial-gradient(ellipse, 
                                rgba(255, 255, 255, ${cloud.opacity * 0.85}) 0%, 
                                rgba(255, 255, 255, 0) 70%)`,
                        }}
                    />
                    <div
                        className="absolute rounded-full"
                        style={{
                            width: '50%',
                            height: '60%',
                            left: '25%',
                            top: '-15%',
                            background: `radial-gradient(ellipse, 
                                rgba(255, 255, 255, ${cloud.opacity * 0.8}) 0%, 
                                rgba(255, 255, 255, 0) 70%)`,
                        }}
                    />
                </div>
            ))}

            {/* Flying character */}
            {showCharacter && (
                <div
                    className="absolute"
                    style={{
                        left: `${characterX}%`,
                        top: '40%',
                        transform: 'translate(-50%, -50%)',
                        transition: 'top 0.3s ease-in-out',
                        animation: 'floatCharacter 2s ease-in-out infinite',
                    }}
                >
                    {/* Character glow effect */}
                    <div
                        className="absolute inset-0"
                        style={{
                            filter: 'blur(20px)',
                            background: 'radial-gradient(circle, rgba(255, 215, 180, 0.4) 0%, transparent 70%)',
                            width: '300px',
                            height: '300px',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                        }}
                    />

                    {/* Trail effect */}
                    <div
                        className="absolute"
                        style={{
                            width: '150px',
                            height: '80px',
                            right: '100%',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'linear-gradient(to left, rgba(255, 255, 255, 0.25), transparent)',
                            filter: 'blur(8px)',
                            borderRadius: '50%',
                        }}
                    />

                    {/* Character image */}
                    <img
                        src="https://i.ibb.co/JjY1kYvt/image-removebg-preview-2-1.png"
                        alt="Flying Character"
                        style={{
                            width: '800px',
                            height: 'auto',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3))',
                        }}
                    />
                </div>
            )}

            {/* Decorative particles/petals floating */}
            {showCharacter && Array.from({ length: 8 }).map((_, i) => (
                <div
                    key={`petal-${i}`}
                    className="absolute rounded-full"
                    style={{
                        width: '6px',
                        height: '6px',
                        left: `${characterX - 10 - i * 5}%`,
                        top: `${38 + Math.sin(Date.now() / 500 + i) * 5}%`,
                        background: 'rgba(255, 220, 200, 0.6)',
                        filter: 'blur(1px)',
                        opacity: 0.6 - i * 0.07,
                        animation: `floatPetal${i % 3} ${1.5 + i * 0.2}s ease-in-out infinite`,
                    }}
                />
            ))}

            <style>{`
                @keyframes floatCharacter {
                    0%, 100% {
                        transform: translate(-50%, -50%) translateY(0);
                    }
                    50% {
                        transform: translate(-50%, -50%) translateY(-15px);
                    }
                }
                
                @keyframes floatPetal0 {
                    0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.5; }
                    50% { transform: translateY(-10px) rotate(180deg); opacity: 0.8; }
                }
                
                @keyframes floatPetal1 {
                    0%, 100% { transform: translateY(-5px) rotate(45deg); opacity: 0.6; }
                    50% { transform: translateY(5px) rotate(225deg); opacity: 0.4; }
                }
                
                @keyframes floatPetal2 {
                    0%, 100% { transform: translateY(3px) rotate(-30deg); opacity: 0.4; }
                    50% { transform: translateY(-12px) rotate(150deg); opacity: 0.7; }
                }
            `}</style>
        </div>
    );
};

export default FlyingCharacter;

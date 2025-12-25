import React, { useEffect, useState, useCallback } from 'react';

interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    speedX: number;
    speedY: number;
    decay: number;
    opacity: number;
    trail: { x: number; y: number }[];
}

interface Spark {
    id: number;
    x: number;
    y: number;
    targetY: number;
    speed: number;
    color: string;
    exploded: boolean;
}

interface FireworkProps {
    isActive: boolean;
    onComplete?: () => void;
    duration?: number;
}

// Golden/Yellow color palette for a cohesive, premium look
const GOLD_COLORS = [
    '#FFD700', // Gold
    '#FFC107', // Amber
    '#FFEB3B', // Yellow
    '#FFE082', // Light Amber
    '#FFF176', // Light Yellow
    '#F9A825', // Dark Yellow
    '#FF8F00', // Orange Yellow
    '#FFB300', // Vivid Amber
];

/**
 * Professional firework animation component with golden theme
 */
export const Firework: React.FC<FireworkProps> = ({
    isActive,
    onComplete,
    duration = 4000,
}) => {
    const [particles, setParticles] = useState<Particle[]>([]);
    const [sparks, setSparks] = useState<Spark[]>([]);
    const [showText, setShowText] = useState(false);

    const createExplosion = useCallback((x: number, y: number, particleCount: number = 60) => {
        const newParticles: Particle[] = [];

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = 3 + Math.random() * 5;
            const color = GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)];

            newParticles.push({
                id: Date.now() + i + Math.random(),
                x,
                y,
                color,
                size: 3 + Math.random() * 4,
                speedX: Math.cos(angle) * velocity * (0.8 + Math.random() * 0.4),
                speedY: Math.sin(angle) * velocity * (0.8 + Math.random() * 0.4),
                decay: 0.96 + Math.random() * 0.02,
                opacity: 1,
                trail: [],
            });
        }

        // Add inner ring for depth
        for (let i = 0; i < particleCount / 2; i++) {
            const angle = (Math.PI * 2 * i) / (particleCount / 2) + Math.random() * 0.3;
            const velocity = 1.5 + Math.random() * 2.5;
            const color = GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)];

            newParticles.push({
                id: Date.now() + particleCount + i + Math.random(),
                x,
                y,
                color,
                size: 2 + Math.random() * 3,
                speedX: Math.cos(angle) * velocity,
                speedY: Math.sin(angle) * velocity,
                decay: 0.94 + Math.random() * 0.03,
                opacity: 1,
                trail: [],
            });
        }

        setParticles(prev => [...prev, ...newParticles]);
    }, []);

    useEffect(() => {
        if (!isActive) {
            setParticles([]);
            setSparks([]);
            setShowText(false);
            return;
        }

        // Launch sequence - sparks that rise and explode
        const launchPoints = [
            { x: 20, delay: 0 },
            { x: 50, delay: 200 },
            { x: 80, delay: 400 },
            { x: 35, delay: 700 },
            { x: 65, delay: 900 },
        ];

        launchPoints.forEach(({ x, delay }) => {
            setTimeout(() => {
                const spark: Spark = {
                    id: Date.now() + Math.random(),
                    x,
                    y: 100,
                    targetY: 25 + Math.random() * 20,
                    speed: 1.5 + Math.random() * 0.5,
                    color: GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)],
                    exploded: false,
                };
                setSparks(prev => [...prev, spark]);
            }, delay);
        });

        // Show celebration text
        setTimeout(() => setShowText(true), 800);

        // Cleanup
        const timer = setTimeout(() => {
            setParticles([]);
            setSparks([]);
            setShowText(false);
            onComplete?.();
        }, duration);

        return () => clearTimeout(timer);
    }, [isActive, duration, onComplete, createExplosion]);

    // Animate sparks rising and exploding
    useEffect(() => {
        if (sparks.length === 0) return;

        const interval = setInterval(() => {
            setSparks(prev => {
                const updated: Spark[] = [];

                prev.forEach(spark => {
                    if (spark.exploded) return;

                    const newY = spark.y - spark.speed;

                    if (newY <= spark.targetY) {
                        // Explode!
                        createExplosion(spark.x, spark.targetY);
                    } else {
                        updated.push({ ...spark, y: newY });
                    }
                });

                return updated;
            });
        }, 16);

        return () => clearInterval(interval);
    }, [sparks.length, createExplosion]);

    // Animate particles with trails
    useEffect(() => {
        if (particles.length === 0) return;

        const interval = setInterval(() => {
            setParticles(prev => {
                return prev
                    .map(p => {
                        const newTrail = [...p.trail, { x: p.x, y: p.y }].slice(-5);

                        return {
                            ...p,
                            trail: newTrail,
                            x: p.x + p.speedX * 0.4,
                            y: p.y + p.speedY * 0.4 + 0.08, // Gravity
                            speedX: p.speedX * p.decay,
                            speedY: p.speedY * p.decay,
                            size: p.size * 0.985,
                            opacity: p.opacity * 0.98,
                        };
                    })
                    .filter(p => p.opacity > 0.1 && p.size > 0.3);
            });
        }, 16);

        return () => clearInterval(interval);
    }, [particles.length > 0]);

    if (!isActive && particles.length === 0 && sparks.length === 0) return null;

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
            {/* Dark overlay for better contrast */}
            <div
                className="absolute inset-0 bg-black/30 transition-opacity duration-500"
                style={{ opacity: isActive ? 1 : 0 }}
            />

            {/* Rising sparks */}
            {sparks.map(spark => (
                <div key={spark.id} className="absolute">
                    {/* Spark trail */}
                    <div
                        className="absolute w-1 rounded-full"
                        style={{
                            left: `${spark.x}%`,
                            top: `${spark.y}%`,
                            height: '30px',
                            background: `linear-gradient(to bottom, ${spark.color}, transparent)`,
                            transform: 'translateX(-50%)',
                            filter: `blur(1px)`,
                        }}
                    />
                    {/* Spark head */}
                    <div
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                            left: `${spark.x}%`,
                            top: `${spark.y}%`,
                            backgroundColor: spark.color,
                            boxShadow: `0 0 10px ${spark.color}, 0 0 20px ${spark.color}`,
                            transform: 'translate(-50%, -50%)',
                        }}
                    />
                </div>
            ))}

            {/* Particle trails */}
            {particles.map(particle => (
                <React.Fragment key={particle.id}>
                    {/* Trail effect */}
                    {particle.trail.map((point, i) => (
                        <div
                            key={`${particle.id}-trail-${i}`}
                            className="absolute rounded-full"
                            style={{
                                left: `${point.x}%`,
                                top: `${point.y}%`,
                                width: `${particle.size * 0.4 * (i / particle.trail.length)}px`,
                                height: `${particle.size * 0.4 * (i / particle.trail.length)}px`,
                                backgroundColor: particle.color,
                                opacity: particle.opacity * 0.3 * (i / particle.trail.length),
                                transform: 'translate(-50%, -50%)',
                            }}
                        />
                    ))}
                    {/* Main particle */}
                    <div
                        className="absolute rounded-full"
                        style={{
                            left: `${particle.x}%`,
                            top: `${particle.y}%`,
                            width: `${particle.size}px`,
                            height: `${particle.size}px`,
                            backgroundColor: particle.color,
                            opacity: particle.opacity,
                            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
                            transform: 'translate(-50%, -50%)',
                        }}
                    />
                </React.Fragment>
            ))}

            {/* Celebration text */}
            {showText && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div
                        className="text-center animate-in zoom-in-50 fade-in duration-700"
                        style={{
                            animation: 'float 2s ease-in-out infinite',
                        }}
                    >
                        <div
                            className="text-5xl md:text-7xl font-bold mb-2"
                            style={{
                                background: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                color: 'transparent',
                                textShadow: '0 0 40px rgba(255, 215, 0, 0.6)',
                                filter: 'drop-shadow(0 4px 8px rgba(255, 165, 0, 0.4))',
                            }}
                        >
                            🎆 Happy New Year! 🎆
                        </div>
                        <div
                            className="text-xl md:text-2xl font-semibold"
                            style={{
                                color: '#FFD700',
                                textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
                            }}
                        >
                            2026
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
        </div>
    );
};

export default Firework;

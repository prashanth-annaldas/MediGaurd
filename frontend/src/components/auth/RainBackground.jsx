import React, { useMemo } from 'react';

const RainBackground = () => {
    // Generate an array of random rain drops
    const drops = useMemo(() => {
        return Array.from({ length: 80 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${0.6 + Math.random() * 0.4}s`,
            opacity: 0.1 + Math.random() * 0.4
        }));
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <style>
                {`
                    @keyframes rain-fall {
                        0% { transform: translateY(-10vh); }
                        100% { transform: translateY(110vh); }
                    }
                    .rain-drop {
                        animation-name: rain-fall;
                        animation-timing-function: linear;
                        animation-iteration-count: infinite;
                    }
                `}
            </style>
            {drops.map(drop => (
                <div
                    key={drop.id}
                    className="absolute top-0 w-[2px] h-[40px] bg-gradient-to-b from-transparent to-teal-400 rain-drop"
                    style={{
                        left: drop.left,
                        animationDelay: drop.animationDelay,
                        animationDuration: drop.animationDuration,
                        opacity: drop.opacity
                    }}
                />
            ))}
        </div>
    );
};

export default RainBackground;

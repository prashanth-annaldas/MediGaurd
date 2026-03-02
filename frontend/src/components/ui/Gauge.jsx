import React, { useEffect, useRef } from 'react'

function getColor(value, inverted = false, critThreshold, warnThreshold) {
    if (inverted) {
        if (value <= critThreshold) return '#ef4444'
        if (value <= warnThreshold) return '#f59e0b'
        return '#10b981'
    } else {
        if (value >= critThreshold) return '#ef4444'
        if (value >= warnThreshold) return '#f59e0b'
        return '#10b981'
    }
}

/**
 * SVG Arc Gauge with animated fill
 */
export default function Gauge({ value = 0, size = 120, inverted = false, critThreshold = 85, warnThreshold = 72, label, unit }) {
    const color = getColor(value, inverted, critThreshold, warnThreshold)
    const r = 45
    const cx = size / 2
    const cy = size / 2
    const strokeWidth = 8
    const circumference = Math.PI * r // half circle
    const percent = Math.min(100, Math.max(0, value))
    const dashoffset = circumference * (1 - percent / 100)

    return (
        <div className="flex flex-col items-center">
            <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
                <defs>
                    <linearGradient id={`gauge-grad-${Math.round(value)}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.6" />
                        <stop offset="100%" stopColor={color} stopOpacity="1" />
                    </linearGradient>
                    <filter id="gauge-glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>

                {/* Track */}
                <path
                    d={`M ${cx - r},${cx} A ${r},${r} 0 0,1 ${cx + r},${cx}`}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />

                {/* Fill */}
                <path
                    d={`M ${cx - r},${cx} A ${r},${r} 0 0,1 ${cx + r},${cx}`}
                    fill="none"
                    stroke={`url(#gauge-grad-${Math.round(value)})`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashoffset}
                    filter="url(#gauge-glow)"
                    style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                />

                {/* Value text */}
                <text
                    x={cx}
                    y={cx * 0.85}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={color}
                    fontSize={size * 0.18}
                    fontWeight="700"
                    fontFamily="JetBrains Mono, monospace"
                    style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
                >
                    {value}%
                </text>
            </svg>
        </div>
    )
}

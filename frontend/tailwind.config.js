/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                navy: {
                    950: '#050d1a',
                    900: '#070f20',
                    800: '#0a1628',
                    700: '#0d1e36',
                    600: '#112644',
                },
                teal: {
                    400: '#2dd4bf',
                    500: '#14b8a6',
                    600: '#0d9488',
                },
                alert: {
                    critical: '#ef4444',
                    warning: '#f59e0b',
                    info: '#3b82f6',
                    success: '#10b981',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-in': 'slideIn 0.3s ease-out',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideIn: {
                    '0%': { opacity: '0', transform: 'translateX(-12px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(20, 184, 166, 0.2)' },
                    '100%': { boxShadow: '0 0 20px rgba(20, 184, 166, 0.6)' },
                }
            },
            backdropBlur: {
                xs: '2px',
            }
        },
    },
    plugins: [],
}

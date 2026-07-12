/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand - Activotrack Blue theme
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2f6cf6', // Logo Blue
          600: '#1c52e4',
          700: '#1743be',
          800: '#11318d',
          900: '#0f276e',
          950: '#08143a',
        },
        glass: {
          DEFAULT: 'rgba(255,255,255,0.03)',
          strong: 'rgba(255,255,255,0.06)',
          border: 'rgba(255,255,255,0.08)',
          blue: 'rgba(47, 108, 246, 0.12)',
          mint: 'rgba(34, 211, 166, 0.08)',
        },
        // Accent brand - Activotrack Green theme
        accent: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#22d3a6', // Logo Green/Mint
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        // Dark background system
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#172033',
          900: '#0f172a',
          950: '#080e1a',
        },
        // Status colours
        status: {
          available:    '#22c55e',
          allocated:    '#3b82f6',
          reserved:     '#a855f7',
          maintenance:  '#f59e0b',
          lost:         '#ef4444',
          retired:      '#6b7280',
          disposed:     '#374151',
        },
        // Priority
        priority: {
          low:      '#22c55e',
          medium:   '#f59e0b',
          high:     '#f97316',
          critical: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl':  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'glass': '0 24px 70px rgba(47, 108, 246, 0.08), 0 10px 32px rgba(8, 14, 26, 0.24)',
        'card':  '0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px -1px rgba(0,0,0,0.4)',
        'glow':  '0 0 0 1px rgba(255, 255, 255, 0.08), 0 0 24px rgba(47, 108, 246, 0.2), 0 10px 28px rgba(34, 211, 166, 0.1)',
        'orange-glow': '0 0 0 1px rgba(255, 255, 255, 0.12), 0 0 32px rgba(47, 108, 246, 0.3), 0 14px 34px rgba(34, 211, 166, 0.15)',
      },
      backgroundImage: {
        'orange-glass': 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(47, 108, 246, 0.05))',
        'app-glow': 'radial-gradient(circle at top left, rgba(47, 108, 246, 0.12), transparent 40%), radial-gradient(circle at bottom right, rgba(34, 211, 166, 0.08), transparent 40%), linear-gradient(135deg, #080e1a 0%, #0f172a 100%)',
      },
      backdropBlur: {
        glass: '18px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },                  to: { opacity: '1' } },
        slideIn:   { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand - orange glow theme
        primary: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        glass: {
          DEFAULT: 'rgba(255,255,255,0.62)',
          strong: 'rgba(255,255,255,0.78)',
          border: 'rgba(255,237,213,0.72)',
          orange: 'rgba(249,115,22,0.28)',
          soft: 'rgba(249,115,22,0.16)',
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
        'glass': '0 24px 70px rgba(249,115,22,0.16), 0 10px 32px rgba(23,32,51,0.08)',
        'card':  '0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px -1px rgba(0,0,0,0.4)',
        'glow':  '0 0 0 1px rgba(255,237,213,0.62), 0 0 24px rgba(249,115,22,0.34), 0 10px 28px rgba(234,88,12,0.18)',
        'orange-glow': '0 0 0 1px rgba(255,237,213,0.8), 0 0 32px rgba(249,115,22,0.48), 0 14px 34px rgba(234,88,12,0.24)',
      },
      backgroundImage: {
        'orange-glass': 'linear-gradient(135deg, rgba(255,255,255,0.42), rgba(249,115,22,0.24))',
        'app-glow': 'radial-gradient(circle at top left, rgba(249,115,22,0.34), transparent 30%), radial-gradient(circle at bottom right, rgba(251,146,60,0.22), transparent 34%), linear-gradient(135deg, #fff7ed 0%, #f8fafc 46%, #ffedd5 100%)',
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

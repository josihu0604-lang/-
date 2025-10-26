import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { 
          DEFAULT: 'var(--bg)', 
          elev: 'var(--bg-elev)', 
          muted: 'var(--bg-muted)' 
        },
        fg: { 
          DEFAULT: 'var(--fg)', 
          muted: 'var(--fg-muted)', 
          inverted: 'var(--fg-inverted)' 
        },
        brand: { 
          primary: 'var(--brand-primary)',
          'primary-hover': 'var(--brand-primary-hover)',
          secondary: 'var(--brand-secondary)',
          accent: 'var(--brand-accent)' 
        },
        sev: { 
          crit: 'var(--sev-crit)', 
          warn: 'var(--sev-warn)', 
          info: 'var(--sev-info)',
          success: 'var(--sev-success)'
        },
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Noto Sans KR',
          'sans-serif',
        ],
      },
      borderRadius: { 
        sm: 'var(--radius-sm)', 
        md: 'var(--radius-md)', 
        lg: 'var(--radius-lg)' 
      },
      boxShadow: { 
        sm: 'var(--shadow-sm)', 
        md: 'var(--shadow-md)', 
        lg: 'var(--shadow-lg)' 
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    }
  },
  plugins: []
}

export default config

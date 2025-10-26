import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          'primary-hover': 'var(--brand-primary-hover)',
          secondary: 'var(--brand-secondary)',
          accent: 'var(--brand-accent)',
        },
        bg: {
          DEFAULT: 'var(--bg)',
          elev: 'var(--bg-elev)',
          muted: 'var(--bg-muted)',
        },
        fg: {
          DEFAULT: 'var(--fg)',
          muted: 'var(--fg-muted)',
        },
        sev: {
          crit: 'var(--sev-crit)',
          warn: 'var(--sev-warn)',
          info: 'var(--sev-info)',
          success: 'var(--sev-success)',
        },
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Noto Sans KR', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'spin': 'spin 1s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config

import type { Config } from 'tailwindcss'
const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: 'var(--bg)', elev: 'var(--bg-elev)', muted: 'var(--bg-muted)' },
        fg: { DEFAULT: 'var(--fg)', muted: 'var(--fg-muted)', inverted: 'var(--fg-inverted)' },
        brand: { primary: 'var(--brand-primary)', accent: 'var(--brand-accent)' },
        sev: { crit: 'var(--sev-crit)', warn: 'var(--sev-warn)', info: 'var(--sev-info)' },
      },
      borderRadius: { sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)' },
      boxShadow: { sm: 'var(--shadow-sm)', md: 'var(--shadow-md)', lg: 'var(--shadow-lg)' }
    }
  },
  plugins: []
}
export default config

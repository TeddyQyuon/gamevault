/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        page: 'var(--color-page)',
        surface: 'var(--color-surface)',
        elevated: 'var(--color-elevated)',
        line: 'var(--color-border)',
        primary: 'var(--color-primary)',
        'primary-soft': 'var(--color-primary-soft)',
        ink: 'var(--color-text)',
        muted: 'var(--color-muted)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        navy: 'var(--color-navy)',
      },
      fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'] },
      maxWidth: { shell: '1440px' },
      borderRadius: { sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)', pill: 'var(--radius-pill)', card: 'var(--radius-card)' },
      boxShadow: { sm: 'var(--shadow-sm)', md: 'var(--shadow-md)', lg: 'var(--shadow-lg)' },
      spacing: { 1: 'var(--space-1)', 2: 'var(--space-2)', 3: 'var(--space-3)', 4: 'var(--space-4)', 5: 'var(--space-5)', 6: 'var(--space-6)', 8: 'var(--space-8)', 10: 'var(--space-10)', 12: 'var(--space-12)' },
      transitionDuration: { fast: '150ms', DEFAULT: '250ms' },
      transitionTimingFunction: { out: 'var(--ease-out)' },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Design tokens mirrored as Tailwind colors (see src/styles/tokens.css)
        page: 'var(--color-page)',
        surface: 'var(--color-surface)',
        elevated: 'var(--color-elevated)',
        line: 'var(--color-border)',
        primary: 'var(--color-primary)',
        cyanx: 'var(--color-cyan)',
        purplex: 'var(--color-purple)',
        ink: 'var(--color-text)',
        muted: 'var(--color-muted)',
        success: 'var(--color-success)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      },
      maxWidth: {
        shell: '1440px',
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
}

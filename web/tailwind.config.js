/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './app.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['P22 Mackinac W01 Book', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      spacing: {
        26: '6.5rem',
      },
      colors: {
        ink: '#191919',
        panel: '#F4F3F3',
      },
    },
  },
  plugins: [],
}

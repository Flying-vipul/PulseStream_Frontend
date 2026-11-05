/** @type {import('tailwindcss').Config} */
export default {
  // 🛡️ THIS is what the warning is complaining about! 
  // It tells Tailwind to scan your index.html and every single React file inside your src folder.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'pulse-dark': '#0B0B0C', // primary background (near-black)
        'pulse-surface': '#121214', // secondary surface
        'pulse-elevated': '#18181A', // elevated surface
        'pulse-card': '#1C1C1E', // card surface
        'pulse-accent': '#E50914', // Brand red (used sparingly)
        'pulse-text': '#FFFFFF', // primary text
        'pulse-text-secondary': '#A1A1AA', // secondary text
        'pulse-text-muted': '#71717A', // muted text
      },
      spacing: {
        'section': '4rem',
        'card-gap': '1rem',
        'nav': '2rem',
        'page': '2rem',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        'subtle': '0 4px 20px rgba(0, 0, 0, 0.3)',
        'glow': '0 0 20px rgba(229, 9, 20, 0.4)',
      },
      screens: {
        'xs': '375px',
        'sm': '412px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1440px',
        '3xl': '1920px',
      },
    },
  },
  plugins: [],
}
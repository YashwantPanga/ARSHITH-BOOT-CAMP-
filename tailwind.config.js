/** @type {import('tailwindcss').Config} */
// Palette: Forest Green #013A2B · Evergreen #0C2D26 · Warm Ivory #FBF8F1
//          Soft Cream #F8F5EE · Sage #426557 · Charcoal Brown #302B25
// The old token names (brand / peach / mint) are kept so every screen picks up the new palette.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EFF4F1',
          100: '#DDE8E2',
          200: '#BCD1C6',
          300: '#90B1A2',
          400: '#5F8574',
          500: '#426557', // Sage
          600: '#1E5141',
          700: '#0F4636',
          800: '#063F2F',
          900: '#013A2B', // Forest Green
          950: '#0C2D26', // Evergreen
          dark: '#0C2D26',
        },
        // Accent scale (formerly orange) – sage tones
        peach: {
          50: '#F2F6F3',
          100: '#E3ECE7',
          200: '#C6D7CE',
          300: '#9DB8AB',
          400: '#7A9C8D',
          500: '#426557',
          600: '#34544A',
          700: '#283F38',
        },
        // Success scale – deep greens
        mint: {
          50: '#EDF5F0',
          100: '#D6EADF',
          200: '#AFD3BF',
          300: '#7DB59A',
          400: '#2F7A5C',
          500: '#1D6049',
        },
        // Warm neutrals built from Charcoal Brown, replacing Tailwind's cool slate everywhere
        slate: {
          50: '#FAF8F4',
          100: '#F2EFE8',
          200: '#E4E0D7',
          300: '#CDC7BB',
          400: '#A39D91',
          500: '#7A746A',
          600: '#5D574E',
          700: '#47423B',
          800: '#38332D',
          900: '#302B25',
          950: '#1F1B17',
        },
        ivory: '#FBF8F1',
        cream: '#F8F5EE',
        sage: '#426557',
        forest: '#013A2B',
        evergreen: '#0C2D26',
        charcoal: '#302B25',
        accent: {
          yellow: '#E0B54A',
          purple: '#426557',
          blue: '#1E5141',
          cyan: '#5F8574',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Jost', 'DM Sans', 'system-ui', 'sans-serif'],
        serif: ['DM Serif Display', 'Georgia', 'Times New Roman', 'serif'],
        // Home page type (Coursera-style humanist sans)
        landing: ['"Source Sans 3"', 'Source Sans Pro', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      // Central type scale: display sizes are fluid, body sizes fixed for readability.
      fontSize: {
        'display-xl': ['clamp(2.4rem, 1.5rem + 3.6vw, 3.9rem)', { lineHeight: '1.06' }],
        'display-lg': ['clamp(1.9rem, 1.4rem + 2vw, 2.75rem)', { lineHeight: '1.12' }],
        'display-md': ['clamp(1.55rem, 1.3rem + 1vw, 2.1rem)', { lineHeight: '1.18' }],
        'heading': ['1.375rem', { lineHeight: '1.3' }],
        'body-lg': ['1.0625rem', { lineHeight: '1.75' }],
      },
      maxWidth: { reading: '46rem' },
      boxShadow: {
        'card': '0 8px 30px rgba(1, 58, 43, 0.06)',
        'card-hover': '0 24px 48px -18px rgba(1, 58, 43, 0.28)',
        'soft': '0 2px 12px rgba(1, 58, 43, 0.06)',
        'floating': '0 14px 30px -8px rgba(12, 45, 38, 0.18), 0 6px 10px -6px rgba(12, 45, 38, 0.08)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(14px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'scale-in': { '0%': { opacity: 0, transform: 'scale(.96)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
        'slide-in-left': { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(0)' } },
        drift: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        'fade-up': 'fade-up .5s cubic-bezier(.2,.7,.2,1) both',
        'fade-in': 'fade-in .35s ease-out both',
        'scale-in': 'scale-in .25s cubic-bezier(.2,.7,.2,1) both',
        'slide-in-left': 'slide-in-left .28s cubic-bezier(.2,.7,.2,1) both',
        drift: 'drift 7s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}

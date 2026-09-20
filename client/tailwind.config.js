/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#FBF7EA',
          50: '#FEFDFA',
          100: '#FCF9F2',
          200: '#F9F4CD',
          300: '#F3E9B8',
          400: '#E3E0CF',
        },
        // Deep maroon / wine — the primary brand color.
        brand: {
          50: '#F7E7E8',
          100: '#EDC9CC',
          200: '#D99298',
          300: '#BC5F68',
          400: '#8F323C',
          500: '#6B1019',
          600: '#560D15',
          700: '#3D0A11',
          800: '#2E070D',
        },
        // Warm caramel / wheat gold — secondary accent within the same warm family.
        accent: {
          400: '#C89355',
          500: '#B07A3A',
          600: '#8F6128',
        },
        ink: {
          900: '#1A1A1A',
          800: '#262626',
          600: '#4D4D4D',
          400: '#7A7A7A',
        },
        // Light-theme surfaces (page bg -> raised cards), plus one deep
        // maroon band reserved for hero/footer/CTA contrast sections.
        surface: {
          DEFAULT: '#FCF8F5',
          50: '#FFFFFF',
          100: '#F7EFEA',
          200: '#F3E3DF',
          300: '#E8D5CD',
          950: '#3D0A11',
        },
        // Light-theme foreground text, high emphasis (50) to muted (600).
        paper: {
          50: '#1C1114',
          200: '#3D2A2C',
          300: '#5C4649',
          400: '#726063',
          600: '#A08F92',
        },
      },
      fontFamily: {
        // A warm, soft-serif display face (used for h1-h3, product names,
        // prices) — pairs with the maroon/cream/gold palette and gives the
        // "homemade, crafted" feel some visual distinction from the clean
        // sans everywhere else, instead of one typeface doing both jobs.
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};

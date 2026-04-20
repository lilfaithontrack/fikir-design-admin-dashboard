import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#078930',
          foreground: '#FFFFFF',
          50: '#E6F7EC',
          100: '#CCEED9',
          200: '#99DDB3',
          300: '#66CC8D',
          400: '#33BB67',
          500: '#078930',
          600: '#066E26',
          700: '#04521D',
          800: '#033713',
          900: '#011B0A',
        },
        secondary: {
          DEFAULT: '#FCDD09',
          foreground: '#1F2937',
          50: '#FFFEF5',
          100: '#FFFCEB',
          200: '#FFF9D6',
          300: '#FFF5C2',
          400: '#FFF2AD',
          500: '#FCDD09',
          600: '#CAB107',
          700: '#978505',
          800: '#655804',
          900: '#322C02',
        },
        accent: {
          DEFAULT: '#DA121A',
          foreground: '#FFFFFF',
          50: '#FEE7E8',
          100: '#FDCFD1',
          200: '#FB9FA3',
          300: '#F96F75',
          400: '#F73F47',
          500: '#DA121A',
          600: '#AE0E15',
          700: '#830B10',
          800: '#57070B',
          900: '#2C0405',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: '#DA121A',
          foreground: '#FFFFFF',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Ethiopic', 'system-ui', 'sans-serif'],
        amharic: ['Noto Sans Ethiopic', 'sans-serif'],
        english: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
}

export default config

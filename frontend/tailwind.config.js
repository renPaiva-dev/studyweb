import plugin from 'tailwindcss/plugin'
import animate from 'tailwindcss-animate'

/*
 * Sistema de design Sinapse - fonte unica dos tokens visuais (cor, tipo,
 * espaco, raio, sombra, z-index, movimento). Os valores semanticos de
 * superficie (background/foreground/primary/...) vivem como variaveis CSS em
 * src/index.css, para o padrao shadcn continuar funcionando; as escalas
 * completas (ink, brand e as 4 semanticas) ficam aqui em hex, porque o
 * Recharts tambem as consome (ver src/utils/coresDesempenho.ts).
 *
 * Todos os pares texto/fundo usados foram validados em WCAG AA (ver
 * comentarios por escala).
 */

// Neutros frios, levemente indigo - a "tinta" da marca.
// 600 sobre branco = 6.6:1 (texto secundario), 400 = 3.4:1 (borda de input).
const ink = {
  50: '#F6F7FB',
  100: '#EEF0F6',
  200: '#E1E4EE',
  300: '#C9CDDC',
  400: '#868BA4',
  500: '#6E7390',
  600: '#575C75',
  700: '#42465D',
  800: '#2C2F45',
  900: '#1A1C30',
  950: '#0F1020',
}

// Ambar "spark" - o disco ambar do logo. 400 e o fundo do CTA (texto ink-950
// = 10.2:1); 700/800 sao as versoes legiveis para texto/link/foco (4.8 e
// 6.9:1 sobre branco) - o ambar claro nunca e usado como cor de texto.
const brand = {
  50: '#FFF9EC',
  100: '#FFF0CC',
  200: '#FFDF94',
  300: '#FCC85A',
  400: '#F7B23A',
  500: '#EE9A1A',
  600: '#D27B0C',
  700: '#AE5C0B',
  800: '#8D4810',
  900: '#743C11',
  950: '#431E05',
}

// Vermelho-correcao (erro). 800 sobre 50 = 9.0:1; branco sobre 600 = 5.7:1.
const danger = {
  50: '#FDF3F1',
  100: '#FBE3DE',
  200: '#F5C3B9',
  300: '#EC9A8A',
  500: '#D4533B',
  600: '#B3402C',
  700: '#943323',
  800: '#78291D',
}

// Verde-lousa (sucesso/progresso real). 800 sobre 50 = 8.9:1.
const success = {
  50: '#EDF9F5',
  100: '#D3F0E6',
  200: '#A6E0CD',
  300: '#6FC9AD',
  500: '#22997F',
  600: '#1D7A66',
  700: '#186252',
  800: '#144E42',
}

// Aviso. 800 sobre 50 = 7.3:1. Tom mais terroso que o brand, para um alerta
// de aviso nunca ser confundido com um botao de acao.
const warning = {
  50: '#FFF8E6',
  100: '#FEEDBF',
  200: '#FCD983',
  300: '#F5BF4F',
  500: '#E09A0B',
  600: '#B87A06',
  700: '#925F08',
  800: '#74490C',
}

// Informacao. 800 sobre 50 = 8.0:1.
const info = {
  50: '#EFF6FF',
  100: '#DBEAFE',
  200: '#BFDBFE',
  300: '#93C5FD',
  500: '#3B82F6',
  600: '#2563EB',
  700: '#1D4ED8',
  800: '#1E40AF',
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' },
      screens: { '2xl': '1280px' },
    },
    extend: {
      fontFamily: {
        // Fraunces (serifada editorial, com personalidade) so em titulos e
        // numeros de destaque; Hanken Grotesk (grotesca humanista, otima
        // legibilidade em 14-16px) em todo o resto; Plex Mono para dado
        // tabular e atalhos de teclado.
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        heading: ['Fraunces', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Escala tipografica do sistema: 12 / 14 / 16 / 20 / 24 / 32 / 48.
        // xs/sm/base seguem o Tailwind; os niveis de titulo tem nome proprio.
        caption: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
        h3: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em', fontWeight: '600' }],
        h2: ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.015em', fontWeight: '600' }],
        h1: ['2rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em', fontWeight: '600' }],
        display: ['3rem', { lineHeight: '1.05', letterSpacing: '-0.025em', fontWeight: '600' }],
        eyebrow: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.08em', fontWeight: '600' }],
      },
      colors: {
        ink,
        brand,
        danger,
        success,
        warning,
        info,

        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        // Escala de raio: 6 / 8 / 12 / 16 / 20. Controles usam md, cards xl,
        // dialogos 2xl.
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        // Sombras em camadas (contato + ambiente), sempre tingidas de ink.
        xs: '0 1px 2px 0 rgb(15 16 32 / 0.05)',
        sm: '0 1px 2px 0 rgb(15 16 32 / 0.06), 0 1px 3px 0 rgb(15 16 32 / 0.08)',
        md: '0 2px 4px -1px rgb(15 16 32 / 0.06), 0 6px 14px -3px rgb(15 16 32 / 0.10)',
        lg: '0 4px 8px -2px rgb(15 16 32 / 0.06), 0 14px 28px -6px rgb(15 16 32 / 0.14)',
        xl: '0 8px 16px -4px rgb(15 16 32 / 0.08), 0 28px 56px -12px rgb(15 16 32 / 0.25)',
        'inner-sm': 'inset 0 1px 2px 0 rgb(15 16 32 / 0.06)',
      },
      zIndex: {
        // Camadas nomeadas - nunca um z-index solto no codigo.
        sticky: '20',
        header: '30',
        nav: '35',
        overlay: '50',
        modal: '50',
        popover: '60',
        toast: '100',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '250ms',
      },
      transitionTimingFunction: {
        // Easing "out" suave para entradas e hovers.
        suave: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      keyframes: {
        shimmer: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(100%)' },
        },
        entrada: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'alerta-entrada': {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        tremor: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-4px)' },
          '40%, 80%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s ease-in-out infinite',
        entrada: 'entrada 250ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'entrada-atrasada': 'entrada 250ms cubic-bezier(0.2, 0.8, 0.2, 1) 120ms both',
        'alerta-entrada': 'alerta-entrada 200ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        tremor: 'tremor 300ms ease-in-out',
      },
    },
  },
  plugins: [
    animate,
    // `coarse:` = dispositivo de toque - garante alvo de toque >= 44px sem
    // inflar controles no desktop.
    plugin(({ addVariant }) => {
      addVariant('coarse', '@media (pointer: coarse)')
    }),
  ],
}

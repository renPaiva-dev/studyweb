/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      fontFamily: {
        // IBM Plex Sans e Fraunces (Google Fonts, ver index.css) - identidade
        // "caderno ativamente corrigido": corpo/UI em Plex Sans, titulos de
        // modulo/boas-vindas/conquista em Fraunces (serifada, editorial).
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        heading: ['Fraunces', 'Georgia', 'serif'],
      },
      fontSize: {
        // Escala de titulo de modulo/pagina (font-heading) - hierarquia por
        // peso/tamanho tipografico, nunca por CAIXA ALTA.
        display: ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-lg': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.01em', fontWeight: '600' }],
        // Rotulo pequeno de secao - peso/tracking discreto, NUNCA uppercase.
        eyebrow: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.02em', fontWeight: '600' }],
      },
      colors: {
        // Paleta fixa da identidade "caderno ativamente corrigido" (ver
        // Docs/ - spec de identidade visual). Uso literal reservado a pontos
        // que nao podem consumir tokens HSL (ex.: cores de series do
        // Recharts em src/utils/coresDesempenho.ts) - o resto do app usa os
        // tokens semanticos abaixo (background/foreground/primary/...),
        // remapeados para esta mesma paleta em index.css.
        tinta: '#1E2A44',
        papel: '#EFEBE1',
        'verde-lousa': '#3C6B52',
        'vermelho-correcao': '#B3402C',
        grafite: '#6B6459',
        manilha: '#C9AD82',

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
        positivo: {
          DEFAULT: 'hsl(var(--positivo))',
          foreground: 'hsl(var(--positivo-foreground))',
        },
        'papel-margem': 'hsl(var(--papel-margem))',
      },
      borderRadius: {
        // Um valor so, usado com moderacao em controles interativos
        // (botao/input/badge/dialogo). Superficies de conteudo (Card, a
        // margem) ficam com cantos retos - ver componentes correspondentes.
        lg: 'var(--radius)',
        md: 'var(--radius)',
        sm: 'var(--radius)',
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
        shimmer: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(100%)' },
        },
        // Sequencia de entrada orquestrada (conceito "caderno corrigido"):
        // conteudo aparece primeiro, a margem "escreve" logo em seguida via
        // animation-delay na classe que a usa. Ver Layout.tsx/EstudarTab.tsx.
        'caderno-entrada': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 1.8s ease-in-out infinite',
        'caderno-entrada': 'caderno-entrada 0.4s ease-out both',
        'caderno-entrada-margem': 'caderno-entrada 0.4s ease-out .25s both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

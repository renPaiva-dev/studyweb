// Cores de series dos graficos (Recharts nao le token Tailwind/variavel CSS
// diretamente, entao os hex vivem aqui - os mesmos valores das escalas de
// tailwind.config.js). Todas com contraste >= 3:1 sobre o card branco
// (WCAG 1.4.11, elemento grafico).
export const CORES_DESEMPENHO = {
  dominado: '#1D7A66', // success-600 - 5.2:1
  emRisco: '#B3402C', // danger-600 - 5.7:1
} as const

export const CORES_GRAFICO = {
  principal: '#2C2F45', // ink-800 - linha de qualidade, 13:1
  destaque: '#D27B0C', // brand-600 - pontos/destaques, 3.2:1
  barra: '#F7B23A', // brand-400 - barras (com rotulo/tooltip numerico)
  barraSuave: '#C9CDDC', // ink-300 - volume secundario
  grade: '#E1E4EE', // ink-200
  eixo: '#575C75', // ink-600 - texto dos eixos, 6.6:1
} as const

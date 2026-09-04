// Cores de desempenho compartilhadas (paleta "caderno ativamente
// corrigido" - Docs/ tem a spec completa). Centraliza os hex literais que
// bibliotecas como Recharts precisam receber diretamente (nao leem
// variavel CSS/token Tailwind), evitando duplicar a mesma cor em varios
// arquivos de grafico.
export const CORES_DESEMPENHO = {
  dominado: '#3C6B52', // Verde-lousa - confirmacao/progresso real
  emRisco: '#B3402C', // Vermelho-correcao - erro/atencao real
} as const

function hexParaRgb(hex: string): [number, number, number] {
  const valor = hex.replace('#', '')
  return [parseInt(valor.slice(0, 2), 16), parseInt(valor.slice(2, 4), 16), parseInt(valor.slice(4, 6), 16)]
}

function rgbParaHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((canal) => Math.round(canal).toString(16).padStart(2, '0')).join('')}`
}

// Escala de avaliacao SM-2 (0-5, ver AvaliacaoRevisaoBotoes/UC08): 6 tons
// interpolados entre Vermelho-correcao (0, "não lembrei") e Verde-lousa (5,
// "fácil"), em vez de introduzir laranja/amarelo/lima fora da paleta
// aprovada.
export const ESCALA_AVALIACAO: readonly string[] = Array.from({ length: 6 }, (_, indice) => {
  const t = indice / 5
  const inicio = hexParaRgb(CORES_DESEMPENHO.emRisco)
  const fim = hexParaRgb(CORES_DESEMPENHO.dominado)

  return rgbParaHex([
    inicio[0] + (fim[0] - inicio[0]) * t,
    inicio[1] + (fim[1] - inicio[1]) * t,
    inicio[2] + (fim[2] - inicio[2]) * t,
  ])
})

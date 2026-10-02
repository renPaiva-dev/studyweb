import type { AnotacaoAutoexplicacao } from '@/api/elaboracaoApi'

export interface SegmentoTexto {
  texto: string
  /** Índice da anotação em `anotacoes` quando este segmento é um trecho anotado. */
  anotacaoIndice?: number
}

// UC34/RN43 - quebra o texto do estudante em segmentos para sublinhar os
// trechos anotados. O backend (SanitizadorFeedbackAutoexplicacao) já garante
// que todo `trecho` não nulo é uma cópia literal do texto e que os trechos
// não se sobrepõem - aqui basta a busca literal. Por segurança, um trecho que
// não for encontrado, ou que cair sobre outro já posicionado, é ignorado em
// vez de gerar um sublinhado errado.
export function segmentarTextoCorrigido(texto: string, anotacoes: AnotacaoAutoexplicacao[]): SegmentoTexto[] {
  const intervalos: { inicio: number; fim: number; anotacaoIndice: number }[] = []

  anotacoes.forEach((anotacao, anotacaoIndice) => {
    if (!anotacao.trecho) {
      return
    }

    let inicio = texto.indexOf(anotacao.trecho)
    while (inicio >= 0) {
      const fim = inicio + anotacao.trecho.length
      const sobrepoe = intervalos.some((outro) => inicio < outro.fim && outro.inicio < fim)

      if (!sobrepoe) {
        intervalos.push({ inicio, fim, anotacaoIndice })
        return
      }
      inicio = texto.indexOf(anotacao.trecho, inicio + 1)
    }
  })

  intervalos.sort((a, b) => a.inicio - b.inicio)

  const segmentos: SegmentoTexto[] = []
  let cursor = 0

  for (const intervalo of intervalos) {
    if (intervalo.inicio > cursor) {
      segmentos.push({ texto: texto.slice(cursor, intervalo.inicio) })
    }
    segmentos.push({ texto: texto.slice(intervalo.inicio, intervalo.fim), anotacaoIndice: intervalo.anotacaoIndice })
    cursor = intervalo.fim
  }

  if (cursor < texto.length) {
    segmentos.push({ texto: texto.slice(cursor) })
  }

  return segmentos
}

/**
 * Número exibido para cada anotação sublinhada no texto (1, 2, 3...), na
 * ordem da lista. Notas gerais - sem trecho, ou com um trecho que não foi
 * posicionado - ficam sem número. Derivado da própria segmentação, para o
 * número do sublinhado e o da nota na margem nunca divergirem.
 */
export function numerarAnotacoes(texto: string, anotacoes: AnotacaoAutoexplicacao[]): (number | null)[] {
  const posicionadas = new Set(
    segmentarTextoCorrigido(texto, anotacoes)
      .map((segmento) => segmento.anotacaoIndice)
      .filter((indice) => indice !== undefined),
  )

  let proximo = 1
  return anotacoes.map((_, indice) => (posicionadas.has(indice) ? proximo++ : null))
}

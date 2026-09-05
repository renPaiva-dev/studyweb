import { apiClient } from './client'

// UC07/UC08/UC09 - Estudo com repeticao espacada (docs/contrato-api.md,
// secao "Estudo com Repeticao Espacada").

export interface ItemFilaEstudo {
  flashcardId: number
  pergunta: string
  resposta: string
  mnemonico: string | null
}

export interface ResultadoRevisao {
  fatorFacilidade: number
  intervaloDias: number
  repeticoes: number
  proximaRevisao: string
}

/**
 * GET /api/decks/{id}/fila-estudo?incluirTodos -> 200, so flashcards com
 * proxima_revisao <= hoje (RN10), a menos que incluirTodos=true, que ignora
 * RN10 e traz o deck inteiro para "Revisar mesmo assim".
 */
export async function buscarFilaEstudo(deckId: number, incluirTodos = false): Promise<ItemFilaEstudo[]> {
  const { data } = await apiClient.get<ItemFilaEstudo[]>(`/api/decks/${deckId}/fila-estudo`, {
    params: { incluirTodos },
  })
  return data
}

/** POST /api/flashcards/{id}/revisoes -> 201, recalculo SM-2 (RN09/RN11/RN12) */
export async function avaliarRevisao(flashcardId: number, qualidadeResposta: number): Promise<ResultadoRevisao> {
  const { data } = await apiClient.post<ResultadoRevisao>(`/api/flashcards/${flashcardId}/revisoes`, {
    qualidadeResposta,
  })
  return data
}

import { apiClient } from './client'

// UC13 - Recomendação de foco de estudo, gerada sob demanda a partir dos
// tópicos com mais flashcards "em risco" (RN18, docs/contrato-api.md,
// seção "Recomendação de Foco de Estudo"). Reaproveita o GeminiClient já
// usado pela explicação de flashcard (UC14) - sem infraestrutura nova.

export interface RecomendacaoEstudo {
  recomendacao: string
  topicoFoco: string
  /** false = mensagem padrão sem chamada à IA, por falta de dados suficientes (RN18). */
  baseadoEmDados: boolean
}

/** POST /api/decks/{id}/recomendacao-estudo -> 200 (401, 404 RN01, 429, 502 falha na IA) */
export async function gerarRecomendacaoEstudo(deckId: number): Promise<RecomendacaoEstudo> {
  const { data } = await apiClient.post<RecomendacaoEstudo>(`/api/decks/${deckId}/recomendacao-estudo`)
  return data
}

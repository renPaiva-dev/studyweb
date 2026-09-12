import { apiClient } from './client'

// UC31 - Prontidao para Prova (RN40, docs/contrato-api.md, secao
// "Prontidao para Prova (UC31)"). Sem chamada a IA - inteiramente
// algoritmica a partir do estado do SM-2 ja persistido.

export interface DataAlvoProva {
  dataAlvo: string | null
}

/** GET /api/decks/{id}/prova-alvo -> 200 (dataAlvo null se nunca definida) */
export async function buscarDataAlvoProva(deckId: number): Promise<DataAlvoProva> {
  const { data } = await apiClient.get<DataAlvoProva>(`/api/decks/${deckId}/prova-alvo`)
  return data
}

/** PUT /api/decks/{id}/prova-alvo -> 200 (400 se a data for no passado) */
export async function definirDataAlvoProva(deckId: number, dataAlvo: string): Promise<DataAlvoProva> {
  const { data } = await apiClient.put<DataAlvoProva>(`/api/decks/${deckId}/prova-alvo`, { dataAlvo })
  return data
}

/** DELETE /api/decks/{id}/prova-alvo -> 204 */
export async function removerDataAlvoProva(deckId: number): Promise<void> {
  await apiClient.delete(`/api/decks/${deckId}/prova-alvo`)
}

export interface TopicoProntidao {
  topico: string
  totalFlashcards: number
  retencaoMediaEstimada: number
  flashcardsPrecisandoRevisao: number
}

export interface ProntidaoProva {
  dataAlvoProva: string
  diasRestantes: number
  totalFlashcards: number
  prontidaoGeral: number
  topicos: TopicoProntidao[]
  mensagem: string
}

/**
 * GET /api/decks/{id}/prontidao-prova -> 200 (RN40; topicos ordenado por
 * retencaoMediaEstimada ascendente - mais urgente primeiro). 400 se a
 * data-alvo ainda nao foi definida - tratado pelo chamador, nao um erro
 * inesperado.
 */
export async function buscarProntidaoProva(deckId: number): Promise<ProntidaoProva> {
  const { data } = await apiClient.get<ProntidaoProva>(`/api/decks/${deckId}/prontidao-prova`)
  return data
}

import { apiClient } from './client'
import type { Flashcard } from './flashcardApi'

// UC29 - Compartilhar deck via link publico somente leitura (docs/contrato-api.md, secao Compartilhamento).

export interface CompartilhamentoDeck {
  ativo: boolean
  token: string | null
  criadoEm: string | null
}

export interface DeckCompartilhado {
  titulo: string
  descricao: string
  flashcards: Flashcard[]
}

/** GET /api/decks/{id}/compartilhamento -> 200 (403 RN01, 404) */
export async function buscarStatusCompartilhamento(deckId: number): Promise<CompartilhamentoDeck> {
  const { data } = await apiClient.get<CompartilhamentoDeck>(`/api/decks/${deckId}/compartilhamento`)
  return data
}

/** POST /api/decks/{id}/compartilhamento -> 200, gera/regenera o token (403 RN01, 404) */
export async function ativarCompartilhamento(deckId: number): Promise<CompartilhamentoDeck> {
  const { data } = await apiClient.post<CompartilhamentoDeck>(`/api/decks/${deckId}/compartilhamento`)
  return data
}

/** DELETE /api/decks/{id}/compartilhamento -> 204 (403 RN01, 404) */
export async function revogarCompartilhamento(deckId: number): Promise<void> {
  await apiClient.delete(`/api/decks/${deckId}/compartilhamento`)
}

/** GET /api/compartilhamentos/{token} -> 200, publico e sem autenticacao (404 se invalido/revogado) */
export async function buscarDeckCompartilhado(token: string): Promise<DeckCompartilhado> {
  const { data } = await apiClient.get<DeckCompartilhado>(`/api/compartilhamentos/${token}`)
  return data
}

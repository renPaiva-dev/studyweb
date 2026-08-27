import { apiClient } from './client'
import type { SugestaoFlashcard } from './materialApi'

// UC05/UC06 - Criar/editar flashcard e mnemonico (docs/contrato-api.md,
// secao Flashcards).

export type OrigemFlashcard = 'MANUAL' | 'IA'

export interface Flashcard {
  id: number
  pergunta: string
  resposta: string
  mnemonico: string | null
  origem: OrigemFlashcard
}

export interface FlashcardInput {
  pergunta: string
  resposta: string
  mnemonico?: string
}

export interface SugestaoParaConfirmar extends SugestaoFlashcard {
  aceitar: true
}

/** GET /api/decks/{id}/flashcards -> 200 */
export async function listarFlashcards(deckId: number): Promise<Flashcard[]> {
  const { data } = await apiClient.get<Flashcard[]>(`/api/decks/${deckId}/flashcards`)
  return data
}

/** POST /api/decks/{id}/flashcards -> 201, origem "MANUAL" (400 campos obrigatorios) */
export async function criarFlashcard(deckId: number, dados: FlashcardInput): Promise<Flashcard> {
  const { data } = await apiClient.post<Flashcard>(`/api/decks/${deckId}/flashcards`, dados)
  return data
}

/** PUT /api/flashcards/{id} -> 200 (400, 401, 403 RN01, 404) */
export async function atualizarFlashcard(id: number, dados: FlashcardInput): Promise<Flashcard> {
  const { data } = await apiClient.put<Flashcard>(`/api/flashcards/${id}`, dados)
  return data
}

/** DELETE /api/flashcards/{id} -> 204 (revisoes associadas removidas em cascata) */
export async function excluirFlashcard(id: number): Promise<void> {
  await apiClient.delete(`/api/flashcards/${id}`)
}

/** POST /api/decks/{id}/flashcards/confirmar-sugestoes -> 201, origem "IA" */
export async function confirmarSugestoes(deckId: number, sugestoes: SugestaoParaConfirmar[]): Promise<void> {
  await apiClient.post(`/api/decks/${deckId}/flashcards/confirmar-sugestoes`, { sugestoes })
}

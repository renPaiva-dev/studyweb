import { apiClient } from './client'
import type { SugestaoFlashcard } from './materialApi'

// UC05 - Criar/editar flashcard (docs/contrato-api.md, secao Flashcards).

export interface SugestaoParaConfirmar extends SugestaoFlashcard {
  aceitar: true
}

/** POST /api/decks/{id}/flashcards/confirmar-sugestoes -> 201, origem "IA" */
export async function confirmarSugestoes(deckId: number, sugestoes: SugestaoParaConfirmar[]): Promise<void> {
  await apiClient.post(`/api/decks/${deckId}/flashcards/confirmar-sugestoes`, { sugestoes })
}

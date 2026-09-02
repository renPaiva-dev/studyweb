import { apiClient } from './client'

// UC14 - Solicitar explicação de um flashcard, ancorada no material de
// origem quando disponível (docs/contrato-api.md, seção "Explicação de
// Flashcard"; RN19).

export interface Explicacao {
  explicacao: string
  ancoradaNoMaterial: boolean
}

/** POST /api/flashcards/{id}/explicacao -> 200 (401, 403 RN01, 404, 502 falha na IA) */
export async function gerarExplicacao(flashcardId: number): Promise<Explicacao> {
  const { data } = await apiClient.post<Explicacao>(`/api/flashcards/${flashcardId}/explicacao`)
  return data
}

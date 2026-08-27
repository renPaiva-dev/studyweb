import { apiClient } from './client'

// UC11 - Dashboard de Progresso (docs/contrato-api.md).

export interface Dashboard {
  totalFlashcards: number
  percentualDominado: number
  percentualEmRisco: number
}

/** GET /api/decks/{id}/dashboard -> 200 (RN14: % dominado / % em risco) */
export async function buscarDashboard(deckId: number): Promise<Dashboard> {
  const { data } = await apiClient.get<Dashboard>(`/api/decks/${deckId}/dashboard`)
  return data
}

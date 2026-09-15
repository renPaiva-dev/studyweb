import { apiClient } from './client'

// UC32 - Perguntar sobre o material do deck (RN41, docs/contrato-api.md,
// secao "Pergunta sobre o Material do Deck"). Mesmo RAG-lite de UC14
// (explicacaoApi.ts), mas escopado ao deck inteiro: reune o texto extraido
// de todos os materiais processados do deck, nao so o mais recente.

export interface RespostaMaterial {
  resposta: string
  materiaisConsultados: number
}

/** POST /api/decks/{id}/perguntas -> 200 (400 sem material processado, 401, 404 RN01, 429, 502 falha na IA) */
export async function perguntarSobreMaterial(deckId: number, pergunta: string): Promise<RespostaMaterial> {
  const { data } = await apiClient.post<RespostaMaterial>(`/api/decks/${deckId}/perguntas`, { pergunta })
  return data
}

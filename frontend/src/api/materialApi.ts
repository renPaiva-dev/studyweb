import { apiClient } from './client'

// UC03 - Enviar PDF de estudo (docs/contrato-api.md, secao Upload de
// Material). UC04 - Gerar flashcards via IA (secao Geracao via IA).

export type StatusProcessamento = 'PENDENTE' | 'PROCESSADO' | 'ERRO'

export interface Material {
  id: number
  nomeArquivo: string
  statusProcessamento: StatusProcessamento
  criadoEm: string
}

export interface SugestaoFlashcard {
  pergunta: string
  resposta: string
}

/** GET /api/decks/{id}/materiais -> 200 */
export async function listarMateriais(deckId: number): Promise<Material[]> {
  const { data } = await apiClient.get<Material[]>(`/api/decks/${deckId}/materiais`)
  return data
}

/** POST /api/decks/{id}/materiais -> 201 (400 RN06, 401, 403, 404) */
export async function enviarMaterial(deckId: number, arquivo: File): Promise<Material> {
  const formData = new FormData()
  formData.append('arquivo', arquivo)

  const { data } = await apiClient.post<Material>(`/api/decks/${deckId}/materiais`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

/** GET /api/materiais/{id} -> 200 */
export async function buscarMaterial(id: number): Promise<Material> {
  const { data } = await apiClient.get<Material>(`/api/materiais/${id}`)
  return data
}

/** POST /api/materiais/{id}/gerar-flashcards -> 200 (400 RN07, 502 falha na IA) */
export async function gerarFlashcards(materialId: number): Promise<SugestaoFlashcard[]> {
  const { data } = await apiClient.post<{ sugestoes: SugestaoFlashcard[] }>(
    `/api/materiais/${materialId}/gerar-flashcards`,
  )
  return data.sugestoes
}

/** UC22 - DELETE /api/materiais/{id} -> 204 (RN29: remove registro e arquivo físico, sem afetar flashcards já confirmados) */
export async function excluirMaterial(id: number): Promise<void> {
  await apiClient.delete(`/api/materiais/${id}`)
}

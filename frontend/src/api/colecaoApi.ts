import { apiClient } from './client'

// UC33 - Organizar decks em coleções (docs/contrato-api.md, seção Coleções de Decks).

export interface Colecao {
  id: number
  nome: string
  descricao: string
  criadoEm: string
  totalDecks: number
}

export interface DeckResumo {
  id: number
  titulo: string
  totalFlashcards: number
}

export interface ColecaoDetalhe {
  id: number
  nome: string
  descricao: string
  criadoEm: string
  atualizadoEm: string
  decks: DeckResumo[]
}

export interface ColecaoRequest {
  nome: string
  descricao: string
}

/** GET /api/colecoes -> 200 */
export async function listarColecoes(): Promise<Colecao[]> {
  const { data } = await apiClient.get<Colecao[]>('/api/colecoes')
  return data
}

/** GET /api/colecoes/{id} -> 200 (404 RN01) */
export async function buscarColecao(id: number): Promise<ColecaoDetalhe> {
  const { data } = await apiClient.get<ColecaoDetalhe>(`/api/colecoes/${id}`)
  return data
}

/** POST /api/colecoes -> 201 (400 se nome vazio) */
export async function criarColecao(dados: ColecaoRequest): Promise<Colecao> {
  const { data } = await apiClient.post<Colecao>('/api/colecoes', dados)
  return data
}

/** PUT /api/colecoes/{id} -> 200 (404 RN01) */
export async function atualizarColecao(id: number, dados: ColecaoRequest): Promise<Colecao> {
  const { data } = await apiClient.put<Colecao>(`/api/colecoes/${id}`, dados)
  return data
}

/** DELETE /api/colecoes/{id} -> 204, desvincula os decks sem excluí-los (RN42) */
export async function excluirColecao(id: number): Promise<void> {
  await apiClient.delete(`/api/colecoes/${id}`)
}

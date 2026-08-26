import { apiClient } from './client'

// UC02 - Criar/gerenciar deck (docs/contrato-api.md, secao Decks).

export interface Deck {
  id: number
  titulo: string
  descricao: string
  criadoEm: string
  totalFlashcards: number
}

export interface DeckDetalhe {
  id: number
  titulo: string
  descricao: string
  criadoEm: string
  atualizadoEm: string
}

export interface DeckRequest {
  titulo: string
  descricao: string
}

/** GET /api/decks -> 200 */
export async function listarDecks(): Promise<Deck[]> {
  const { data } = await apiClient.get<Deck[]>('/api/decks')
  return data
}

/** GET /api/decks/{id} -> 200 (403 RN01, 404) */
export async function buscarDeck(id: number): Promise<DeckDetalhe> {
  const { data } = await apiClient.get<DeckDetalhe>(`/api/decks/${id}`)
  return data
}

/** POST /api/decks -> 201 (400 se titulo vazio) */
export async function criarDeck(dados: DeckRequest): Promise<Deck> {
  const { data } = await apiClient.post<Deck>('/api/decks', dados)
  return data
}

/** PUT /api/decks/{id} -> 200 (403 RN01, 404) */
export async function atualizarDeck(id: number, dados: DeckRequest): Promise<Deck> {
  const { data } = await apiClient.put<Deck>(`/api/decks/${id}`, dados)
  return data
}

/** DELETE /api/decks/{id} -> 204, exclusao em cascata (RN13) */
export async function excluirDeck(id: number): Promise<void> {
  await apiClient.delete(`/api/decks/${id}`)
}

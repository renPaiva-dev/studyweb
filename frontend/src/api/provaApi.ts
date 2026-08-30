import { apiClient } from './client'
import type { Quiz, QuestaoRevisada } from './quizApi'

// UC27/UC28 - Provas personalizadas via IA e historico
// (docs/contrato-api.md, secao "Provas Personalizadas por Selecao de Flashcards").

export type EstiloProva = 'ENEM' | 'VESTIBULAR' | 'GERAL'

export const ESTILOS_PROVA: { valor: EstiloProva; rotulo: string; descricao: string }[] = [
  { valor: 'ENEM', rotulo: 'ENEM', descricao: 'Questões contextualizadas, com situação ou texto de apoio' },
  { valor: 'VESTIBULAR', rotulo: 'Vestibular', descricao: 'Questões diretas, técnicas e objetivas' },
  { valor: 'GERAL', rotulo: 'Conhecimentos Gerais', descricao: 'Perguntas diretas, sem contexto elaborado' },
]

export interface GerarProvaRequest {
  flashcardIds: number[]
  estilo: EstiloProva
}

export interface HistoricoProvaResumo {
  tentativaId: number
  quizId: number
  titulo: string
  origem: 'DETERMINISTICO' | 'IA_PERSONALIZADA'
  estilo: EstiloProva | null
  dataTentativa: string
  pontuacao: number
  acertos: number
  total: number
}

export interface HistoricoProvaDetalhe {
  tentativaId: number
  quizId: number
  titulo: string
  origem: 'DETERMINISTICO' | 'IA_PERSONALIZADA'
  estilo: EstiloProva | null
  dataTentativa: string
  pontuacao: number
  questoes: QuestaoRevisada[]
}

/** POST /api/decks/{id}/provas -> 201 (400 sem flashcards ou flashcard invalido; 502 falha na IA) */
export async function gerarProva(deckId: number, dados: GerarProvaRequest): Promise<Quiz> {
  const { data } = await apiClient.post<Quiz>(`/api/decks/${deckId}/provas`, dados)
  return data
}

/** GET /api/usuario/provas -> 200, mais recentes primeiro (RN36) */
export async function listarHistoricoProvas(): Promise<HistoricoProvaResumo[]> {
  const { data } = await apiClient.get<HistoricoProvaResumo[]>('/api/usuario/provas')
  return data
}

/** GET /api/usuario/provas/{id} -> 200 (401, 403 RN01, 404) */
export async function buscarDetalheProva(tentativaId: number): Promise<HistoricoProvaDetalhe> {
  const { data } = await apiClient.get<HistoricoProvaDetalhe>(`/api/usuario/provas/${tentativaId}`)
  return data
}

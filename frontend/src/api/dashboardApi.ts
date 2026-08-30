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

// UC15 - Dashboard Avancado, extensao de UC11 (RN20/RN17 - docs/contrato-api.md,
// secao "Dashboard Avancado (UC15)").

export type PeriodoEvolucao = 7 | 30 | 90

export interface PontoEvolucao {
  data: string
  mediaQualidade: number
  totalRevisoes: number
}

export interface Evolucao {
  pontos: PontoEvolucao[]
}

/** GET /api/decks/{id}/dashboard/evolucao?dias={7|30|90} -> 200 (RN20) */
export async function buscarEvolucao(deckId: number, dias: PeriodoEvolucao): Promise<Evolucao> {
  const { data } = await apiClient.get<Evolucao>(`/api/decks/${deckId}/dashboard/evolucao`, {
    params: { dias },
  })
  return data
}

export interface TopicoDashboard {
  topico: string
  totalFlashcards: number
  percentualDominado: number
  percentualEmRisco: number
}

export interface Topicos {
  topicos: TopicoDashboard[]
}

/** GET /api/decks/{id}/dashboard/topicos -> 200 (RN20/RN17 - "Sem categoria" quando sem topico) */
export async function buscarTopicos(deckId: number): Promise<Topicos> {
  const { data } = await apiClient.get<Topicos>(`/api/decks/${deckId}/dashboard/topicos`)
  return data
}

export interface FlashcardMaisRevisado {
  flashcardId: number
  pergunta: string
  totalRevisoes: number
}

export type DiaSemana = 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO' | 'DOMINGO'

export interface RevisaoPorDiaSemana {
  diaSemana: DiaSemana
  totalRevisoes: number
}

export interface Atividade {
  flashcardsMaisRevisados: FlashcardMaisRevisado[]
  revisoesPorDiaSemana: RevisaoPorDiaSemana[]
}

/** GET /api/decks/{id}/dashboard/atividade -> 200 (RN20 - top 5 + revisoes por dia da semana) */
export async function buscarAtividade(deckId: number): Promise<Atividade> {
  const { data } = await apiClient.get<Atividade>(`/api/decks/${deckId}/dashboard/atividade`)
  return data
}

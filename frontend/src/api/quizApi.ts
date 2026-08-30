import { apiClient } from './client'

// UC10 (extensao de escopo) - Quiz gerado a partir do deck (docs/contrato-api.md).

export interface Questao {
  id: number
  enunciado: string
  alternativas: string[]
}

export interface Quiz {
  id: number
  titulo: string
  questoes: Questao[]
}

export interface RespostaEnvio {
  questaoId: number
  alternativaEscolhida: string
}

// UC27/RN36 - revisao de uma questao ja respondida (resposta correta,
// alternativa escolhida, se acertou e a explicacao), nunca exposta antes de
// a questao ser respondida.
export interface QuestaoRevisada {
  questaoId: number
  enunciado: string
  alternativas: string[]
  respostaCorreta: string
  alternativaEscolhida: string
  correta: boolean
  explicacao: string | null
}

export interface ResultadoTentativa {
  pontuacao: number
  acertos: number
  total: number
  questoes: QuestaoRevisada[]
}

/** POST /api/decks/{id}/quizzes -> 201 (400 flashcards insuficientes) */
export async function gerarQuiz(deckId: number): Promise<Quiz> {
  const { data } = await apiClient.post<Quiz>(`/api/decks/${deckId}/quizzes`)
  return data
}

/** GET /api/quizzes/{id} -> 200, sem expor resposta_correta */
export async function buscarQuiz(quizId: number): Promise<Quiz> {
  const { data } = await apiClient.get<Quiz>(`/api/quizzes/${quizId}`)
  return data
}

/** POST /api/quizzes/{id}/tentativas -> 201 (400 RN15: respostas incompletas) */
export async function responderTentativa(quizId: number, respostas: RespostaEnvio[]): Promise<ResultadoTentativa> {
  const { data } = await apiClient.post<ResultadoTentativa>(`/api/quizzes/${quizId}/tentativas`, { respostas })
  return data
}

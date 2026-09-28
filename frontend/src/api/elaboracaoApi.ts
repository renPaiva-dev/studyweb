import { apiClient } from './client'

// UC34 - Elaborar um flashcard com a IA (docs/contrato-api.md, seção
// "Elaboração de Flashcard"; RN43/RN44). Nada é persistido no backend.

export type VereditoAutoexplicacao = 'CONSISTENTE' | 'PARCIAL' | 'EQUIVOCADA'

export type TipoAnotacao = 'ACERTO' | 'IMPRECISAO' | 'ERRO'

export interface AnotacaoAutoexplicacao {
  /** Cópia literal do texto enviado pelo estudante, ou null quando é uma nota geral. */
  trecho: string | null
  tipo: TipoAnotacao
  comentario: string
}

export interface FeedbackAutoexplicacao {
  veredito: VereditoAutoexplicacao
  comentarioGeral: string
  anotacoes: AnotacaoAutoexplicacao[]
  faltou: string | null
  ancoradaNoMaterial: boolean
}

export interface Analogia {
  tipo: 'ANALOGIA' | 'EXEMPLO'
  texto: string
  ancoradaNoMaterial: boolean
}

/** POST /api/flashcards/{id}/autoexplicacao -> 200 (400, 401, 403 RN01, 404, 429, 502) */
export async function pedirFeedbackAutoexplicacao(
  flashcardId: number,
  texto: string,
  signal?: AbortSignal,
): Promise<FeedbackAutoexplicacao> {
  const { data } = await apiClient.post<FeedbackAutoexplicacao>(
    `/api/flashcards/${flashcardId}/autoexplicacao`,
    { texto },
    { signal },
  )
  return data
}

/** POST /api/flashcards/{id}/analogia -> 200 (400, 401, 403 RN01, 404, 429, 502) */
export async function gerarAnalogia(flashcardId: number, evitar?: string, signal?: AbortSignal): Promise<Analogia> {
  const { data } = await apiClient.post<Analogia>(
    `/api/flashcards/${flashcardId}/analogia`,
    evitar ? { evitar } : {},
    { signal },
  )
  return data
}

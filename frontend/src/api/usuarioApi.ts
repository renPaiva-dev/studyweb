import { apiClient } from './client'

// UC17/UC19 - Conta e Perfil; UC20 - Dashboard Geral Consolidado
// (docs/contrato-api.md, secoes "Conta e Perfil" e "Dashboard Geral Consolidado").

export interface Perfil {
  id: number
  nome: string
  nomeUsuario: string
  email: string
  papel: string
  criadoEm: string
}

export interface AtualizarPerfilRequest {
  nome: string
  nomeUsuario: string
}

/** GET /api/usuario/perfil -> 200 */
export async function buscarPerfil(): Promise<Perfil> {
  const { data } = await apiClient.get<Perfil>('/api/usuario/perfil')
  return data
}

/** PUT /api/usuario/perfil -> 200 (400, 401, 409 RN22: nomeUsuario em uso) */
export async function atualizarPerfil(dados: AtualizarPerfilRequest): Promise<Perfil> {
  const { data } = await apiClient.put<Perfil>('/api/usuario/perfil', dados)
  return data
}

// UC26/RN33 - Trocar senha autenticado; UC24/RN31 - Exportar dados (LGPD);
// UC25/RN32 - Excluir conta (LGPD). docs/contrato-api.md, secoes "Trocar
// Senha", "Exportacao de Dados - LGPD" e "Exclusao de Conta - LGPD".

export interface MensagemResposta {
  mensagem: string
}

/** PUT /api/usuario/senha -> 200 (400: senha atual incorreta ou nova fora da politica RN27) */
export async function trocarSenha(senhaAtual: string, novaSenha: string): Promise<MensagemResposta> {
  const { data } = await apiClient.put<MensagemResposta>('/api/usuario/senha', { senhaAtual, novaSenha })
  return data
}

/** GET /api/usuario/exportar-dados -> 200, estrutura completa (RN31) - usada so para gerar o download, sem tipagem forte. */
export async function exportarDados(): Promise<unknown> {
  const { data } = await apiClient.get<unknown>('/api/usuario/exportar-dados')
  return data
}

/**
 * DELETE /api/usuario/conta -> 204 (401: senha incorreta - NAO e token
 * expirado, por isso skipAuthRedirect: sem essa flag o interceptor global
 * (ver client.ts) deslogaria o usuario so por ele ter digitado a senha
 * errada no dialogo de confirmacao).
 */
export async function excluirConta(senha: string): Promise<void> {
  await apiClient.delete('/api/usuario/conta', { data: { senha }, skipAuthRedirect: true })
}

export interface RankingDeck {
  deckId: number
  titulo: string
  percentualDominado: number
  percentualEmRisco: number
}

export interface DashboardGeral {
  totalDecks: number
  totalFlashcards: number
  percentualDominadoGeral: number
  percentualEmRiscoGeral: number
  totalTentativasQuiz: number
  pontuacaoMediaQuiz: number
  streakDias: number
  decks: RankingDeck[]
}

/** GET /api/usuario/dashboard-geral -> 200 (RN25) */
export async function buscarDashboardGeral(): Promise<DashboardGeral> {
  const { data } = await apiClient.get<DashboardGeral>('/api/usuario/dashboard-geral')
  return data
}

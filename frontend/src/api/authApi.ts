import { apiClient } from './client'

// UC01 - Cadastrar-se / Fazer login (docs/contrato-api.md, secao Autenticacao).

export interface CadastroRequest {
  nome: string
  nomeUsuario: string
  email: string
  senha: string
  termosAceitos: boolean
}

export interface CadastroResponse {
  id: number
  nome: string
  nomeUsuario: string
  email: string
  papel: string
  criadoEm: string
}

export interface LoginRequest {
  email: string
  senha: string
}

export interface LoginResponse {
  token: string
  tipo: string
  expiraEm: string
}

/** POST /api/auth/cadastro -> 201 (RN02: 409 se e-mail ja cadastrado) */
export async function cadastrar(dados: CadastroRequest): Promise<CadastroResponse> {
  const { data } = await apiClient.post<CadastroResponse>('/api/auth/cadastro', dados)
  return data
}

/** POST /api/auth/login -> 200 (401 se credenciais invalidas) */
export async function login(dados: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/api/auth/login', dados)
  return data
}

// UC18 - Esqueci/Redefinir senha (RN24: resposta sempre generica).

export interface MensagemResponse {
  mensagem: string
}

/** POST /api/auth/esqueci-senha -> 200, sempre a mesma mensagem (RN24) */
export async function esqueciSenha(email: string): Promise<MensagemResponse> {
  const { data } = await apiClient.post<MensagemResponse>('/api/auth/esqueci-senha', { email })
  return data
}

/** POST /api/auth/redefinir-senha -> 200 (400 token invalido/expirado/usado) */
export async function redefinirSenha(token: string, novaSenha: string): Promise<MensagemResponse> {
  const { data } = await apiClient.post<MensagemResponse>('/api/auth/redefinir-senha', { token, novaSenha })
  return data
}

// UC21 - Verificar e-mail de cadastro (RN26: login bloqueado ate confirmar).

/** POST /api/auth/verificar-email -> 200 (400 token invalido/expirado/usado) */
export async function verificarEmail(token: string): Promise<MensagemResponse> {
  const { data } = await apiClient.post<MensagemResponse>('/api/auth/verificar-email', { token })
  return data
}

/** POST /api/auth/reenviar-verificacao -> 200, sempre a mesma mensagem generica */
export async function reenviarVerificacao(email: string): Promise<MensagemResponse> {
  const { data } = await apiClient.post<MensagemResponse>('/api/auth/reenviar-verificacao', { email })
  return data
}

import { apiClient } from './client'

// UC01 - Cadastrar-se / Fazer login (docs/contrato-api.md, secao Autenticacao).

export interface CadastroRequest {
  nome: string
  email: string
  senha: string
}

export interface CadastroResponse {
  id: number
  nome: string
  email: string
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

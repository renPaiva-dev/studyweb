// Persistencia local do token JWT (UC01/RNF03) e dos dados minimos do
// usuario logado. Nunca guarda senha (docs/boas-praticas-frontend.md,
// secao 6) - so o que a UI precisa para exibir "quem esta logado" depois
// de um refresh, ja que o contrato de API nao tem um endpoint de perfil.

const TOKEN_KEY = 'plataforma-estudos:token'
const USUARIO_KEY = 'plataforma-estudos:usuario'

export interface UsuarioArmazenado {
  email: string
  nome?: string
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function getStoredUsuario(): UsuarioArmazenado | null {
  const bruto = localStorage.getItem(USUARIO_KEY)
  if (!bruto) {
    return null
  }

  try {
    return JSON.parse(bruto) as UsuarioArmazenado
  } catch {
    return null
  }
}

export function setStoredUsuario(usuario: UsuarioArmazenado): void {
  localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario))
}

export function clearStoredUsuario(): void {
  localStorage.removeItem(USUARIO_KEY)
}

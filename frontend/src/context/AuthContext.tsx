import { createContext, useContext, useState, type ReactNode } from 'react'

import * as authApi from '@/api/authApi'
import {
  clearStoredUsuario,
  clearToken,
  getStoredUsuario,
  getToken,
  setStoredUsuario,
  setToken,
  type UsuarioArmazenado,
} from '@/utils/authStorage'

interface AuthContextValue {
  usuario: UsuarioArmazenado | null
  token: string | null
  login: (email: string, senha: string) => Promise<void>
  cadastro: (nome: string, email: string, senha: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken())
  const [usuario, setUsuarioState] = useState<UsuarioArmazenado | null>(() => getStoredUsuario())

  async function login(email: string, senha: string) {
    const resposta = await authApi.login({ email, senha })

    setToken(resposta.token)
    setTokenState(resposta.token)

    const usuarioLogado: UsuarioArmazenado = { email }
    setStoredUsuario(usuarioLogado)
    setUsuarioState(usuarioLogado)
  }

  async function cadastro(nome: string, email: string, senha: string) {
    await authApi.cadastrar({ nome, email, senha })

    // UC01: o cadastro (POST /api/auth/cadastro) nao devolve token - so
    // o login (POST /api/auth/login) devolve. Para cumprir o fluxo
    // principal do UC01 ("cria o usuario ou autentica" -> "retorna token
    // JWT" -> "redirecionado a lista de decks") sem inventar nenhum
    // endpoint novo, o cadastro autentica com as mesmas credenciais
    // imediatamente depois de criar a conta.
    await login(email, senha)
  }

  function logout() {
    clearToken()
    clearStoredUsuario()
    setTokenState(null)
    setUsuarioState(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, token, login, cadastro, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth precisa ser usado dentro de um <AuthProvider>')
  }

  return context
}

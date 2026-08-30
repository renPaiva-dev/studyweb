import { createContext, useContext, useState, type ReactNode } from 'react'

import * as authApi from '@/api/authApi'
import { buscarPerfil, type Perfil } from '@/api/usuarioApi'
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
  cadastro: (nome: string, nomeUsuario: string, email: string, senha: string, termosAceitos: boolean) => Promise<void>
  logout: () => void
  atualizarUsuarioLocal: (perfil: Perfil) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function paraUsuarioArmazenado(perfil: Perfil): UsuarioArmazenado {
  return { email: perfil.email, nome: perfil.nome, nomeUsuario: perfil.nomeUsuario, papel: perfil.papel }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken())
  const [usuario, setUsuarioState] = useState<UsuarioArmazenado | null>(() => getStoredUsuario())

  async function login(email: string, senha: string) {
    const resposta = await authApi.login({ email, senha })

    setToken(resposta.token)
    setTokenState(resposta.token)

    // UC19 - GET /api/usuario/perfil traz os dados completos (nome,
    // nomeUsuario, papel) para exibicao na UI - o login (RF02) so devolve o
    // token.
    const perfil = await buscarPerfil()
    const usuarioLogado = paraUsuarioArmazenado(perfil)
    setStoredUsuario(usuarioLogado)
    setUsuarioState(usuarioLogado)
  }

  async function cadastro(nome: string, nomeUsuario: string, email: string, senha: string, termosAceitos: boolean) {
    await authApi.cadastrar({ nome, nomeUsuario, email, senha, termosAceitos })

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

  // UC19 - apos editar o perfil (PUT /api/usuario/perfil), atualiza o cache
  // local sem precisar de um novo login.
  function atualizarUsuarioLocal(perfil: Perfil) {
    const usuarioAtualizado = paraUsuarioArmazenado(perfil)
    setStoredUsuario(usuarioAtualizado)
    setUsuarioState(usuarioAtualizado)
  }

  return (
    <AuthContext.Provider value={{ usuario, token, login, cadastro, logout, atualizarUsuarioLocal }}>
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

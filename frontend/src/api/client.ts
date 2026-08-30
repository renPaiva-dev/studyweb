import axios from 'axios'

import { clearStoredUsuario, clearToken, getToken } from '@/utils/authStorage'

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** Ver comentario no interceptor de resposta abaixo (excecao do DELETE /api/usuario/conta). */
    skipAuthRedirect?: boolean
  }
}

// Cliente HTTP centralizado (docs/boas-praticas-frontend.md, secao 2):
// toda chamada ao backend passa por aqui, nunca por axios/fetch soltos
// pelos componentes. baseURL vem de VITE_API_URL (secao 9 - nunca
// hardcoded).
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Injeta "Authorization: Bearer {token}" automaticamente em toda
// requisicao, lendo de onde o AuthContext guarda o token (RNF03: toda
// rota exceto cadastro/login exige JWT).
apiClient.interceptors.request.use((config) => {
  const token = getToken()

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }

  return config
})

// docs/boas-praticas-frontend.md, secao 3: 401 (token ausente/expirado)
// sempre redireciona para o login. Feito aqui, fora do React Router, para
// valer em qualquer chamada da camada de API, nao so nas iniciadas por um
// componente montado.
//
// Excecao: DELETE /api/usuario/conta (UC25) tambem usa 401 para "senha
// incorreta" (docs/contrato-api.md), nao para token invalido/expirado - sem
// essa excecao, digitar a senha errada ao tentar excluir a conta desloga o
// usuario em vez de mostrar o erro inline no dialogo de confirmacao.
apiClient.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    if (erro.response?.status === 401 && erro.config?.skipAuthRedirect !== true) {
      clearToken()
      clearStoredUsuario()

      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }

    return Promise.reject(erro)
  },
)

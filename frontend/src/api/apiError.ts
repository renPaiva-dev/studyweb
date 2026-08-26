import { isAxiosError } from 'axios'

// docs/boas-praticas-frontend.md, secao 3: toda chamada a API deve tratar
// o erro no formato padrao ({ timestamp, status, error, message, path })
// e exibir "message" de forma amigavel - nunca stack trace ou JSON cru.
interface ErroApi {
  message?: string
}

export function extrairMensagemErro(erro: unknown, mensagemPadrao: string): string {
  if (isAxiosError<ErroApi>(erro) && erro.response?.data?.message) {
    return erro.response.data.message
  }

  return mensagemPadrao
}

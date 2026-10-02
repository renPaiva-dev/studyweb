import { isAxiosError } from 'axios'

// docs/boas-praticas-frontend.md, secao 3: toda chamada a API deve tratar
// o erro no formato padrao ({ timestamp, status, error, message, path })
// e exibir "message" de forma amigavel - nunca stack trace ou JSON cru.
interface ErroApi {
  message?: string
}

export const MENSAGEM_SEM_CONEXAO =
  'Não conseguimos falar com o servidor. Verifique sua conexão com a internet e tente novamente.'

export function extrairMensagemErro(erro: unknown, mensagemPadrao: string): string {
  if (isAxiosError<ErroApi>(erro)) {
    if (erro.response?.data?.message) {
      return erro.response.data.message
    }

    // Sem resposta nenhuma = rede caiu / servidor fora do ar. Dizer isso e
    // mais util do que a mensagem generica da acao.
    if (!erro.response && erro.code !== 'ERR_CANCELED') {
      return MENSAGEM_SEM_CONEXAO
    }
  }

  return mensagemPadrao
}

export function statusDoErro(erro: unknown): number | undefined {
  return isAxiosError(erro) ? erro.response?.status : undefined
}

// Tipos de resposta compartilhados entre múltiplos módulos de `api/*.ts`,
// evitando redefinir o mesmo formato com nomes diferentes em cada arquivo.

/**
 * Formato padrão de resposta { message } usado por vários endpoints
 * (docs/contrato-api.md). N10 (achado da auditoria): o campo se chama
 * "message", não "mensagem", para ficar consistente com o formato de erro
 * padrão (ver apiError.ts) - antes sucesso e erro usavam nomes diferentes
 * para o mesmo tipo de conteúdo.
 */
export interface MensagemResposta {
  message: string
}

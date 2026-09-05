// Tipos de resposta compartilhados entre múltiplos módulos de `api/*.ts`,
// evitando redefinir o mesmo formato com nomes diferentes em cada arquivo.

/** Formato padrão de resposta { mensagem } usado por vários endpoints (docs/contrato-api.md). */
export interface MensagemResposta {
  mensagem: string
}

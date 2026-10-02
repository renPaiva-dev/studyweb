// RN27 - senha entre 8 e 64 caracteres, com ao menos uma maiuscula, uma
// minuscula, um digito e um caractere especial. Mesma regra do backend
// (SenhaForteValidator) - reaproveitada nas 3 telas que pedem senha nova
// (cadastro, redefinir senha, trocar senha) em vez de duplicar o regex.
const PADRAO_SENHA_FORTE = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,64}$/

export const MENSAGEM_SENHA_FORTE =
  'A senha deve ter entre 8 e 64 caracteres, com ao menos uma letra maiúscula, uma minúscula, um dígito e um caractere especial.'

export function senhaEhForte(senha: string): boolean {
  return PADRAO_SENHA_FORTE.test(senha)
}

// Mesmos criterios de PADRAO_SENHA_FORTE, quebrados em itens - alimenta o
// checklist ao vivo (RequisitosSenha.tsx) para o usuario ver o que falta
// enquanto digita, em vez de descobrir so depois de enviar.
export function requisitosSenha(senha: string): { rotulo: string; atendido: boolean }[] {
  return [
    { rotulo: 'Entre 8 e 64 caracteres', atendido: senha.length >= 8 && senha.length <= 64 },
    { rotulo: 'Uma letra maiúscula', atendido: /[A-Z]/.test(senha) },
    { rotulo: 'Uma letra minúscula', atendido: /[a-z]/.test(senha) },
    { rotulo: 'Um número', atendido: /\d/.test(senha) },
    { rotulo: 'Um caractere especial (!@#…)', atendido: /[^A-Za-z0-9]/.test(senha) },
  ]
}

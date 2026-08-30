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

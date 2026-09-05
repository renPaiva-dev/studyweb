import type { ReactNode } from 'react'

import estudandoFoto from '@/assets/estudando.jpg'

interface AuthSplitLayoutProps {
  children: ReactNode
}

// Layout compartilhado por toda tela de autenticacao (login, cadastro,
// esqueci/redefinir senha, verificar e-mail): metade esquerda como vitrine
// da marca (foto + nome + slogan, so em telas largas), metade direita com o
// formulario da propria pagina. Em mobile a vitrine some e sobra so o
// formulario, centralizado - nao ha espaco pra dividir a tela em duas
// colunas com o card ainda legivel.
export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src={estudandoFoto}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-tinta/85 via-tinta/30 to-tinta/10" />

        <div className="relative flex h-full flex-col items-center justify-end p-12 pb-20 text-center text-papel">
          <p className="font-heading text-5xl font-semibold drop-shadow-sm">StudyWeb</p>
          <p className="mt-3 text-lg text-papel/85 drop-shadow-sm">Sua melhor plataforma de estudos</p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-background px-4 py-12">
        {children}
      </div>
    </div>
  )
}

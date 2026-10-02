import type { LucideIcon } from 'lucide-react'
import { Brain, Repeat, Target } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import estudandoFoto from '@/assets/estudando.jpg'
import { Logo } from '@/components/Logo'

interface AuthSplitLayoutProps {
  icone?: LucideIcon
  titulo: string
  descricao?: ReactNode
  children: ReactNode
  /** Linha abaixo do formulario (ex.: "Ainda nao tem conta? Cadastre-se"). */
  rodape?: ReactNode
}

const DESTAQUES = [
  { icone: Brain, texto: 'Flashcards gerados por IA a partir do seu PDF' },
  { icone: Repeat, texto: 'Revisões no momento certo, com repetição espaçada' },
  { icone: Target, texto: 'Previsão de prontidão para a sua prova' },
]

// Layout compartilhado por toda tela de autenticacao (login, cadastro,
// esqueci/redefinir senha, verificar e-mail): metade esquerda como vitrine
// da marca (foto + nome + destaques, so em telas largas), metade direita com
// o formulario. Em mobile a vitrine some, mas a marca continua no topo.
export function AuthSplitLayout({ icone: Icone, titulo, descricao, children, rodape }: AuthSplitLayoutProps) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <div className="relative hidden overflow-hidden bg-ink-950 lg:block">
        <img src={estudandoFoto} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/55 to-ink-950/10" />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Link to="/" className="flex w-fit items-center gap-2.5 rounded-md font-heading text-2xl font-semibold text-white">
            <Logo tone="light" className="h-9 w-9" />
            Sinapse
          </Link>

          <div className="max-w-md space-y-8">
            <p className="font-heading text-[2.75rem] font-semibold leading-[1.08] tracking-tight text-white">
              Transforme material em <span className="text-brand-300">memória</span>.
            </p>
            <ul className="space-y-3">
              {DESTAQUES.map(({ icone: IconeDestaque, texto }) => (
                <li key={texto} className="flex items-center gap-3 text-base text-white/90">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15 backdrop-blur">
                    <IconeDestaque className="h-[18px] w-[18px] text-brand-300" />
                  </span>
                  {texto}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen flex-col">
        <div className="flex h-16 items-center px-4 sm:px-8 lg:hidden">
          <Link to="/" className="flex items-center gap-2 rounded-md font-heading text-xl font-semibold text-foreground">
            <Logo className="h-7 w-7" />
            Sinapse
          </Link>
        </div>

        <main className="flex flex-1 items-center justify-center px-4 pb-10 pt-4 sm:px-8 lg:py-12">
          <div className="w-full max-w-[400px] animate-entrada">
            <div className="mb-8 space-y-2">
              {Icone && (
                <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-ink-900 text-white shadow-md ring-4 ring-brand-100">
                  <Icone className="h-6 w-6" strokeWidth={1.75} />
                </span>
              )}
              <h1 className="font-heading text-h1 text-foreground">{titulo}</h1>
              {descricao && <p className="text-base leading-relaxed text-muted-foreground">{descricao}</p>}
            </div>

            {children}

            {rodape && <div className="mt-8 border-t border-ink-200 pt-6 text-center text-sm text-muted-foreground">{rodape}</div>}
          </div>
        </main>

        <footer className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 pb-6 text-sm text-ink-600">
          <Link to="/termos-de-uso" className="rounded-sm hover:text-foreground hover:underline">
            Termos de Uso
          </Link>
          <Link to="/politica-de-privacidade" className="rounded-sm hover:text-foreground hover:underline">
            Privacidade
          </Link>
        </footer>
      </div>
    </div>
  )
}

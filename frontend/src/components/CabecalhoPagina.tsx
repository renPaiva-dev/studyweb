import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'

interface CabecalhoPaginaProps {
  titulo: ReactNode
  descricao?: ReactNode
  /** Rotulo pequeno acima do titulo (contexto: "Deck", "Prova"...). */
  sobretitulo?: ReactNode
  voltar?: { para: string; rotulo: string }
  acoes?: ReactNode
  className?: string
}

// Cabecalho padrao de toda pagina logada - mesma hierarquia em todo lugar:
// (voltar) > sobretitulo > titulo serifado > descricao, e as acoes a direita
// no desktop / empilhadas em largura total no mobile.
export function CabecalhoPagina({ titulo, descricao, sobretitulo, voltar, acoes, className }: CabecalhoPaginaProps) {
  return (
    <header className={cn('space-y-4', className)}>
      {voltar && (
        <Link
          to={voltar.para}
          className="group -ml-1 inline-flex h-9 items-center gap-1.5 rounded-md px-1 text-sm font-semibold text-ink-600 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-fast group-hover:-translate-x-0.5" />
          {voltar.rotulo}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          {sobretitulo && <p className="text-eyebrow uppercase text-brand-800">{sobretitulo}</p>}
          <h1 className="break-words font-heading text-h2 text-foreground sm:text-h1">{titulo}</h1>
          {descricao && <p className="max-w-2xl text-base text-muted-foreground">{descricao}</p>}
        </div>
        {acoes && (
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center [&>*]:w-full sm:[&>*]:w-auto">{acoes}</div>
        )}
      </div>
    </header>
  )
}

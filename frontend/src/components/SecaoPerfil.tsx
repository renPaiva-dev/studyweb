import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface SecaoPerfilProps {
  icone: LucideIcon
  titulo: string
  descricao: ReactNode
  children: ReactNode
  perigo?: boolean
}

// Secao de configuracoes (padrao "settings" de Linear/Vercel): titulo e
// explicacao a esquerda, controles a direita no desktop; empilhado no mobile.
export function SecaoPerfil({ icone: Icone, titulo, descricao, children, perigo }: SecaoPerfilProps) {
  return (
    <section
      className={cn(
        'grid gap-5 rounded-xl border bg-card p-5 shadow-sm sm:p-6 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-8',
        perigo ? 'border-danger-200' : 'border-ink-200/80',
      )}
    >
      <div className="space-y-2">
        <span
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg',
            perigo ? 'bg-danger-100 text-danger-600' : 'bg-ink-100 text-ink-700',
          )}
        >
          <Icone className="h-[18px] w-[18px]" />
        </span>
        <h2 className={cn('font-semibold', perigo ? 'text-danger-700' : 'text-foreground')}>{titulo}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{descricao}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

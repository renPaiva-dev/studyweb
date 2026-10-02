import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface CartaoMetricaProps {
  icone: LucideIcon
  titulo: string
  valor: ReactNode
  detalhe?: ReactNode
  destaque?: boolean
}

// Card de numero unico (stat card) - mesmo desenho de IndicadorPercentual,
// sem a barra. `destaque` = versao escura (tinta) para a metrica-chave.
export function CartaoMetrica({ icone: Icone, titulo, valor, detalhe, destaque }: CartaoMetricaProps) {
  return (
    <Card className={cn('p-5', destaque && 'border-ink-900 bg-ink-900 text-white')}>
      <div className="flex items-center justify-between gap-2">
        <p className={cn('text-sm font-semibold', destaque ? 'text-white/75' : 'text-ink-600')}>{titulo}</p>
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', destaque ? 'bg-brand-400 text-ink-950' : 'bg-ink-100 text-ink-700')}>
          <Icone className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className={cn('mt-2 font-heading text-h1 tabular-nums', destaque ? 'text-white' : 'text-foreground')}>{valor}</p>
      {detalhe && <p className={cn('mt-1 text-sm', destaque ? 'text-white/75' : 'text-muted-foreground')}>{detalhe}</p>}
    </Card>
  )
}

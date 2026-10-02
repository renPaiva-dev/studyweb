import type { TrendingUp } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface IndicadorPercentualProps {
  icone: typeof TrendingUp
  titulo: string
  percentual: number
  corBarra: string
  corTrilha: string
  corIcone: string
  descricao?: string
}

// Card compartilhado por UC11 (dashboard por deck) e UC20 (dashboard geral
// consolidado): valor percentual + barra de progresso, com cor/icone
// parametrizados pelo chamador (dominado = verde, em risco = vermelho).
export function IndicadorPercentual({ icone: Icone, titulo, percentual, corBarra, corTrilha, corIcone, descricao }: IndicadorPercentualProps) {
  const percentualClampado = Math.min(100, Math.max(0, percentual))

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink-600">{titulo}</p>
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', corTrilha)}>
          <Icone className={cn('h-4 w-4', corIcone)} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 font-heading text-h1 tabular-nums text-foreground">
        {percentual}
        <span className="text-h3 text-ink-500">%</span>
      </p>
      <div
        role="progressbar"
        aria-label={titulo}
        aria-valuenow={percentualClampado}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink-100"
      >
        <div className={cn('h-full rounded-full transition-[width] duration-700 ease-suave', corBarra)} style={{ width: `${percentualClampado}%` }} />
      </div>
      {descricao && <p className="mt-2 text-sm text-muted-foreground">{descricao}</p>}
    </Card>
  )
}

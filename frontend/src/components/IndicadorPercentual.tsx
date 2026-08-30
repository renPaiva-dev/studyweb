import type { TrendingUp } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface IndicadorPercentualProps {
  icone: typeof TrendingUp
  titulo: string
  percentual: number
  corBarra: string
  corTrilha: string
  corIcone: string
}

// Card compartilhado por UC11 (dashboard por deck) e UC20 (dashboard geral
// consolidado): valor percentual + barra de progresso, com cor/icone
// parametrizados pelo chamador (dominado = verde, em risco = vermelho).
export function IndicadorPercentual({ icone: Icone, titulo, percentual, corBarra, corTrilha, corIcone }: IndicadorPercentualProps) {
  const percentualClampado = Math.min(100, Math.max(0, percentual))

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
        <Icone className={cn('h-4 w-4', corIcone)} />
        <CardTitle className="text-sm font-medium text-muted-foreground">{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-3xl font-bold">{percentual}%</p>
        <div className={cn('h-2 w-full overflow-hidden rounded-full', corTrilha)}>
          <div
            className={cn('h-full rounded-full transition-all', corBarra)}
            style={{ width: `${percentualClampado}%` }}
          />
        </div>
      </CardContent>
    </Card>
  )
}

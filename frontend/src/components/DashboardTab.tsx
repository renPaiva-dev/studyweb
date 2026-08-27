import { AlertTriangle, Layers, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { buscarDashboard, type Dashboard } from '@/api/dashboardApi'
import { extrairMensagemErro } from '@/api/apiError'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface DashboardTabProps {
  deckId: number
}

// UC11 - dashboard de progresso do deck. GET /api/decks/{id}/dashboard
// (docs/contrato-api.md). RN14: % dominado (repeticoes >= 3 e ultima
// qualidade >= 4) e % em risco (ultima qualidade < 3 ou proxima_revisao
// vencida ha mais de 7 dias) - calculo e responsabilidade do backend.
export function DashboardTab({ deckId }: DashboardTabProps) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)

  const carregarDashboard = useCallback(async () => {
    setErroCarregamento(null)

    try {
      setDashboard(await buscarDashboard(deckId))
    } catch (erro) {
      setErroCarregamento(extrairMensagemErro(erro, 'Não foi possível carregar o dashboard deste deck.'))
    }
  }, [deckId])

  useEffect(() => {
    void carregarDashboard()
  }, [carregarDashboard])

  if (dashboard === null && erroCarregamento === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    )
  }

  if (erroCarregamento !== null) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border py-16 text-center">
        <p className="text-muted-foreground">{erroCarregamento}</p>
        <Button variant="outline" onClick={() => void carregarDashboard()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (dashboard === null) {
    return null
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium text-muted-foreground">Total de flashcards</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{dashboard.totalFlashcards}</p>
        </CardContent>
      </Card>

      <IndicadorPercentual
        icone={TrendingUp}
        titulo="Dominado"
        percentual={dashboard.percentualDominado}
        corBarra="bg-emerald-500"
        corTrilha="bg-emerald-100 dark:bg-emerald-950"
        corIcone="text-emerald-600 dark:text-emerald-400"
      />

      <IndicadorPercentual
        icone={AlertTriangle}
        titulo="Em risco"
        percentual={dashboard.percentualEmRisco}
        corBarra="bg-red-500"
        corTrilha="bg-red-100 dark:bg-red-950"
        corIcone="text-red-600 dark:text-red-400"
      />
    </div>
  )
}

interface IndicadorPercentualProps {
  icone: typeof TrendingUp
  titulo: string
  percentual: number
  corBarra: string
  corTrilha: string
  corIcone: string
}

function IndicadorPercentual({ icone: Icone, titulo, percentual, corBarra, corTrilha, corIcone }: IndicadorPercentualProps) {
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

import { AlertTriangle, Layers, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { buscarDashboard, type Dashboard } from '@/api/dashboardApi'
import { extrairMensagemErro } from '@/api/apiError'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardAtividade } from '@/components/DashboardAtividade'
import { DashboardEvolucao } from '@/components/DashboardEvolucao'
import { DashboardTopicos } from '@/components/DashboardTopicos'
import { IndicadorPercentual } from '@/components/IndicadorPercentual'
import { useDefinirMargem } from '@/context/MargemContext'

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

  useDefinirMargem(
    dashboard ? (
      <div className="space-y-4 text-sm">
        <div>
          <p className="font-heading text-2xl font-semibold text-verde-lousa">{dashboard.percentualDominado}%</p>
          <p className="text-muted-foreground">dominado</p>
        </div>
        <div>
          <p className="font-heading text-2xl font-semibold text-vermelho-correcao">{dashboard.percentualEmRisco}%</p>
          <p className="text-muted-foreground">em risco</p>
        </div>
      </div>
    ) : null,
    null,
    [dashboard?.percentualDominado, dashboard?.percentualEmRisco],
  )

  if (dashboard === null && erroCarregamento === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-32 w-full rounded-none" />
        <Skeleton className="h-32 w-full rounded-none" />
        <Skeleton className="h-32 w-full rounded-none" />
      </div>
    )
  }

  if (erroCarregamento !== null) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-none border py-16 text-center">
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
    <div className="space-y-6">
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
          corBarra="bg-verde-lousa"
          corTrilha="bg-verde-lousa/10"
          corIcone="text-verde-lousa"
        />

        <IndicadorPercentual
          icone={AlertTriangle}
          titulo="Em risco"
          percentual={dashboard.percentualEmRisco}
          corBarra="bg-vermelho-correcao"
          corTrilha="bg-vermelho-correcao/10"
          corIcone="text-vermelho-correcao"
        />
      </div>

      <DashboardEvolucao deckId={deckId} />
      <DashboardTopicos deckId={deckId} />
      <DashboardAtividade deckId={deckId} />
    </div>
  )
}

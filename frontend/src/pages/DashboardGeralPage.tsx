import { AlertTriangle, Flame, Layers, ListChecks, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { extrairMensagemErro } from '@/api/apiError'
import { buscarDashboardGeral, type DashboardGeral } from '@/api/usuarioApi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { IndicadorPercentual } from '@/components/IndicadorPercentual'
import { RankingDecksChart } from '@/components/RankingDecksChart'

// UC20 - Visualizar dashboard geral consolidado. GET
// /api/usuario/dashboard-geral (docs/contrato-api.md). RN25: visao agregada
// de todos os decks do usuario - reaproveita os mesmos criterios de
// dominado/em risco de RN14, so que somados entre decks.
export function DashboardGeralPage() {
  const [dashboard, setDashboard] = useState<DashboardGeral | null>(null)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setErroCarregamento(null)

    try {
      setDashboard(await buscarDashboardGeral())
    } catch (erro) {
      setErroCarregamento(extrairMensagemErro(erro, 'Não foi possível carregar o dashboard geral.'))
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  if (erroCarregamento !== null) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border py-16 text-center">
        <p className="text-muted-foreground">{erroCarregamento}</p>
        <Button variant="outline" onClick={() => void carregar()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (dashboard === null) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Visão geral</h1>
        <p className="text-muted-foreground">Seu progresso consolidado em todos os decks</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Decks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{dashboard.totalDecks}</p>
            <p className="text-xs text-muted-foreground">{dashboard.totalFlashcards} flashcards no total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
            <Flame className="h-4 w-4 text-coral-500" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Sequência de estudo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {dashboard.streakDias} dia{dashboard.streakDias === 1 ? '' : 's'}
            </p>
            <p className="text-xs text-muted-foreground">consecutivos com revisão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
            <ListChecks className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Quizzes/provas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{dashboard.totalTentativasQuiz}</p>
            <p className="text-xs text-muted-foreground">
              {dashboard.totalTentativasQuiz > 0
                ? `pontuação média de ${dashboard.pontuacaoMediaQuiz}%`
                : 'nenhuma tentativa ainda'}
            </p>
          </CardContent>
        </Card>

        <IndicadorPercentual
          icone={TrendingUp}
          titulo="Dominado (geral)"
          percentual={dashboard.percentualDominadoGeral}
          corBarra="bg-emerald-500"
          corTrilha="bg-emerald-100 dark:bg-emerald-950"
          corIcone="text-emerald-600 dark:text-emerald-400"
        />

        <IndicadorPercentual
          icone={AlertTriangle}
          titulo="Em risco (geral)"
          percentual={dashboard.percentualEmRiscoGeral}
          corBarra="bg-red-500"
          corTrilha="bg-red-100 dark:bg-red-950"
          corIcone="text-red-600 dark:text-red-400"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Ranking de decks por desempenho</CardTitle>
        </CardHeader>
        <CardContent>
          <RankingDecksChart decks={dashboard.decks} />
        </CardContent>
      </Card>
    </div>
  )
}

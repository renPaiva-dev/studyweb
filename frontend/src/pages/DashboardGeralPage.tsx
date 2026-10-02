import { AlertTriangle, Flame, Layers, ListChecks, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { extrairMensagemErro } from '@/api/apiError'
import { buscarDashboardGeral, type DashboardGeral } from '@/api/usuarioApi'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { CartaoMetrica } from '@/components/CartaoMetrica'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EstadoErro } from '@/components/ui/estados'
import { Carregando, Skeleton } from '@/components/ui/skeleton'
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
    return <EstadoErro mensagem={erroCarregamento} onTentarNovamente={() => void carregar()} />
  }

  if (dashboard === null) {
    return (
      <Carregando rotulo="Carregando visão geral..." className="space-y-8">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, indice) => (
            <Skeleton key={indice} className="h-[140px] w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </Carregando>
    )
  }

  return (
    <div className="space-y-8">
      <CabecalhoPagina titulo="Visão geral" descricao="Seu progresso consolidado em todos os decks." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5 [&>*:first-child]:col-span-2 lg:[&>*:first-child]:col-span-1">
        <CartaoMetrica
          destaque
          icone={Flame}
          titulo="Sequência"
          valor={
            <>
              {dashboard.streakDias}
              <span className="ml-1 text-h3 text-white/75">dia{dashboard.streakDias === 1 ? '' : 's'}</span>
            </>
          }
          detalhe="consecutivos com revisão"
        />
        <CartaoMetrica
          icone={Layers}
          titulo="Decks"
          valor={dashboard.totalDecks}
          detalhe={`${dashboard.totalFlashcards} flashcard${dashboard.totalFlashcards === 1 ? '' : 's'} no total`}
        />
        <CartaoMetrica
          icone={ListChecks}
          titulo="Quizzes e provas"
          valor={dashboard.totalTentativasQuiz}
          detalhe={dashboard.totalTentativasQuiz > 0 ? `média de ${dashboard.pontuacaoMediaQuiz}% de acerto` : 'nenhuma tentativa ainda'}
        />
        <IndicadorPercentual
          icone={TrendingUp}
          titulo="Dominado"
          percentual={dashboard.percentualDominadoGeral}
          corBarra="bg-success-600"
          corTrilha="bg-success-50"
          corIcone="text-success-700"
        />
        <IndicadorPercentual
          icone={AlertTriangle}
          titulo="Em risco"
          percentual={dashboard.percentualEmRiscoGeral}
          corBarra="bg-danger-600"
          corTrilha="bg-danger-50"
          corIcone="text-danger-700"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ranking de decks por desempenho</CardTitle>
          <CardDescription>Ordenados pelo percentual dominado. Passe o mouse para ver os números.</CardDescription>
        </CardHeader>
        <CardContent>
          <RankingDecksChart decks={dashboard.decks} />
        </CardContent>
      </Card>
    </div>
  )
}

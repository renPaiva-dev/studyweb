import { AlertTriangle, Layers, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { buscarDashboard, type Dashboard } from '@/api/dashboardApi'
import { extrairMensagemErro } from '@/api/apiError'
import { CartaoMetrica } from '@/components/CartaoMetrica'
import { NotaMargem } from '@/components/NotaMargem'
import { EstadoErro } from '@/components/ui/estados'
import { Carregando, Skeleton } from '@/components/ui/skeleton'
import { DashboardAtividade } from '@/components/DashboardAtividade'
import { DashboardEvolucao } from '@/components/DashboardEvolucao'
import { DashboardTopicos } from '@/components/DashboardTopicos'
import { IndicadorPercentual } from '@/components/IndicadorPercentual'
import { ProntidaoProvaCard } from '@/components/ProntidaoProvaCard'
import { RecomendacaoEstudoCard } from '@/components/RecomendacaoEstudoCard'
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
      <NotaMargem
        valor={`${dashboard.percentualDominado}%`}
        tom="positivo"
        rotulo="do deck já dominado"
        detalhes={[
          { rotulo: 'Em risco', valor: `${dashboard.percentualEmRisco}%`, tom: 'atencao' },
          { rotulo: 'Flashcards', valor: dashboard.totalFlashcards },
        ]}
      />
    ) : null,
    null,
    [dashboard?.percentualDominado, dashboard?.percentualEmRisco],
  )

  if (dashboard === null && erroCarregamento === null) {
    return (
      <Carregando rotulo="Carregando dashboard..." className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-[140px] w-full rounded-xl" />
          <Skeleton className="h-[140px] w-full rounded-xl" />
          <Skeleton className="h-[140px] w-full rounded-xl" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </Carregando>
    )
  }

  if (erroCarregamento !== null) {
    return <EstadoErro mensagem={erroCarregamento} onTentarNovamente={() => void carregarDashboard()} />
  }

  if (dashboard === null) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <CartaoMetrica icone={Layers} titulo="Total de flashcards" valor={dashboard.totalFlashcards} detalhe="neste deck" destaque />

        <IndicadorPercentual
          icone={TrendingUp}
          titulo="Dominado"
          percentual={dashboard.percentualDominado}
          corBarra="bg-success-600"
          corTrilha="bg-success-50"
          corIcone="text-success-700"
          descricao="Revisados 3+ vezes com nota alta"
        />

        <IndicadorPercentual
          icone={AlertTriangle}
          titulo="Em risco"
          percentual={dashboard.percentualEmRisco}
          corBarra="bg-danger-600"
          corTrilha="bg-danger-50"
          corIcone="text-danger-700"
          descricao="Nota baixa ou revisão atrasada"
        />
      </div>

      <ProntidaoProvaCard deckId={deckId} />
      <RecomendacaoEstudoCard deckId={deckId} />
      <DashboardEvolucao deckId={deckId} />
      <DashboardTopicos deckId={deckId} />
      <DashboardAtividade deckId={deckId} />
    </div>
  )
}

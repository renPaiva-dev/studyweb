import { useCallback, useEffect, useRef, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { buscarTopicos, type TopicoDashboard } from '@/api/dashboardApi'
import { extrairMensagemErro } from '@/api/apiError'
import { EstadoErro } from '@/components/ui/estados'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartTooltipContent } from '@/components/ChartTooltipContent'
import { useTelaEstreita } from '@/hooks/useTelaEstreita'
import { CORES_DESEMPENHO, CORES_GRAFICO } from '@/utils/coresDesempenho'

interface DashboardTopicosProps {
  deckId: number
}

const { dominado: COR_DOMINADO, emRisco: COR_EM_RISCO } = CORES_DESEMPENHO
const ALTURA_POR_TOPICO = 40

// UC15/RN20/RN17 - detalhamento de % dominado/em risco por topico (extensao
// do dashboard de UC11/RN14). GET /api/decks/{id}/dashboard/topicos
// (docs/contrato-api.md). Mesmo criterio de dominado/em risco do dashboard
// geral, so que agrupado por Flashcard.topico ("Sem categoria" quando nulo).
export function DashboardTopicos({ deckId }: DashboardTopicosProps) {
  const estreito = useTelaEstreita()
  const [topicos, setTopicos] = useState<TopicoDashboard[] | null>(null)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)

  // Guarda a requisicao mais recente para ignorar respostas antigas que
  // cheguem fora de ordem (ex.: clicar "Tentar novamente" mais de uma vez
  // rapido dispara buscas concorrentes).
  const requisicaoAtualRef = useRef(0)

  const carregar = useCallback(async () => {
    const idRequisicao = ++requisicaoAtualRef.current
    setErroCarregamento(null)

    try {
      const resposta = await buscarTopicos(deckId)
      if (requisicaoAtualRef.current !== idRequisicao) {
        return
      }
      setTopicos(resposta.topicos)
    } catch (erro) {
      if (requisicaoAtualRef.current !== idRequisicao) {
        return
      }
      setErroCarregamento(extrairMensagemErro(erro, 'Não foi possível carregar os tópicos deste deck.'))
    }
  }, [deckId])

  useEffect(() => {
    void carregar()
  }, [carregar])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Desempenho por tópico</CardTitle>
      </CardHeader>
      <CardContent>
        {erroCarregamento !== null ? (
          <EstadoErro compacto mensagem={erroCarregamento} onTentarNovamente={() => void carregar()} />
        ) : topicos === null ? (
          <Skeleton className="h-48 w-full rounded-lg" />
        ) : topicos.length === 0 ? (
          <p className="rounded-lg border border-dashed border-ink-300 py-10 text-center text-sm text-ink-600">Nenhum flashcard neste deck ainda.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm font-medium text-ink-700">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COR_DOMINADO }} />
                Dominado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COR_EM_RISCO }} />
                Em risco
              </span>
            </div>

            <div style={{ height: topicos.length * ALTURA_POR_TOPICO + 24 }}>
              <ResponsiveContainer>
                <BarChart
                  data={topicos.map((topico) => ({ ...topico, rotulo: `${topico.topico} (${topico.totalFlashcards})` }))}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid horizontal={false} stroke={CORES_GRAFICO.grade} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: CORES_GRAFICO.eixo }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="rotulo"
                    width={estreito ? 100 : 150}
                    tick={{ fontSize: 12, fill: '#1A1C30' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#EEF0F6' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const topico = payload[0].payload as TopicoDashboard
                      return (
                        <ChartTooltipContent
                          titulo={`${topico.topico} (${topico.totalFlashcards} flashcards)`}
                          linhas={[
                            { rotulo: 'Dominado', valor: `${topico.percentualDominado}%`, cor: COR_DOMINADO },
                            { rotulo: 'Em risco', valor: `${topico.percentualEmRisco}%`, cor: COR_EM_RISCO },
                          ]}
                        />
                      )
                    }}
                  />
                  <Bar dataKey="percentualDominado" fill={COR_DOMINADO} radius={[0, 4, 4, 0]} maxBarSize={16} />
                  <Bar dataKey="percentualEmRisco" fill={COR_EM_RISCO} radius={[0, 4, 4, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

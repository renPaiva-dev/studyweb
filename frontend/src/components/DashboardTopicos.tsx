import { useCallback, useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { buscarTopicos, type TopicoDashboard } from '@/api/dashboardApi'
import { extrairMensagemErro } from '@/api/apiError'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartTooltipContent } from '@/components/ChartTooltipContent'
import { CORES_DESEMPENHO } from '@/utils/coresDesempenho'

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
  const [topicos, setTopicos] = useState<TopicoDashboard[] | null>(null)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setErroCarregamento(null)

    try {
      const resposta = await buscarTopicos(deckId)
      setTopicos(resposta.topicos)
    } catch (erro) {
      setErroCarregamento(extrairMensagemErro(erro, 'Não foi possível carregar os tópicos deste deck.'))
    }
  }, [deckId])

  useEffect(() => {
    void carregar()
  }, [carregar])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Desempenho por tópico</CardTitle>
      </CardHeader>
      <CardContent>
        {erroCarregamento !== null ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">{erroCarregamento}</p>
            <Button variant="outline" size="sm" onClick={() => void carregar()}>
              Tentar novamente
            </Button>
          </div>
        ) : topicos === null ? (
          <Skeleton className="h-48 w-full" />
        ) : topicos.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhum flashcard neste deck ainda.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COR_DOMINADO }} />
                Dominado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COR_EM_RISCO }} />
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
                  <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="rotulo"
                    width={150}
                    tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
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

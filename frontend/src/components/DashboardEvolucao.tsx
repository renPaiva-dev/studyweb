import { useCallback, useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { buscarEvolucao, type PeriodoEvolucao, type PontoEvolucao } from '@/api/dashboardApi'
import { extrairMensagemErro } from '@/api/apiError'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartTooltipContent } from '@/components/ChartTooltipContent'
import { cn } from '@/lib/utils'

interface DashboardEvolucaoProps {
  deckId: number
}

const PERIODOS: { valor: PeriodoEvolucao; rotulo: string }[] = [
  { valor: 7, rotulo: '7 dias' },
  { valor: 30, rotulo: '30 dias' },
  { valor: 90, rotulo: '90 dias' },
]

const COR_QUALIDADE = 'hsl(var(--primary))'
const COR_REVISOES = 'hsl(var(--primary) / 0.35)'

function dataResumida(dataIso: string): string {
  const [, mes, dia] = dataIso.split('-')
  return `${dia}/${mes}`
}

// UC15/RN20 - evolucao temporal do desempenho (extensao do dashboard de
// UC11/RN14). GET /api/decks/{id}/dashboard/evolucao?dias=7|30|90
// (docs/contrato-api.md). Dias sem revisao nao aparecem na resposta - os
// graficos simplesmente nao tem ponto nesses dias.
export function DashboardEvolucao({ deckId }: DashboardEvolucaoProps) {
  const [periodo, setPeriodo] = useState<PeriodoEvolucao>(30)
  const [pontos, setPontos] = useState<PontoEvolucao[] | null>(null)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setErroCarregamento(null)

    try {
      const resposta = await buscarEvolucao(deckId, periodo)
      setPontos(resposta.pontos)
    } catch (erro) {
      setErroCarregamento(extrairMensagemErro(erro, 'Não foi possível carregar a evolução deste deck.'))
    }
  }, [deckId, periodo])

  useEffect(() => {
    setPontos(null)
    void carregar()
  }, [carregar])

  const dados = (pontos ?? []).map((ponto) => ({ ...ponto, dataResumida: dataResumida(ponto.data) }))
  const totalRevisoesNoPeriodo = dados.reduce((soma, ponto) => soma + ponto.totalRevisoes, 0)
  const mediaGeral = dados.length > 0
    ? dados.reduce((soma, ponto) => soma + ponto.mediaQualidade, 0) / dados.length
    : null

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold">Evolução do desempenho</CardTitle>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {PERIODOS.map((opcao) => (
            <Button
              key={opcao.valor}
              type="button"
              size="sm"
              variant="ghost"
              className={cn('h-7 px-2 text-xs', periodo === opcao.valor && 'bg-background shadow-sm')}
              onClick={() => setPeriodo(opcao.valor)}
            >
              {opcao.rotulo}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {erroCarregamento !== null ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">{erroCarregamento}</p>
            <Button variant="outline" size="sm" onClick={() => void carregar()}>
              Tentar novamente
            </Button>
          </div>
        ) : pontos === null ? (
          <Skeleton className="h-56 w-full rounded-lg" />
        ) : dados.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma revisão registrada neste período.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Média de qualidade: <span className="font-semibold text-foreground">{mediaGeral?.toFixed(2)}</span>
              {' · '}
              Total de revisões: <span className="font-semibold text-foreground">{totalRevisoesNoPeriodo}</span>
            </p>

            <div className="h-40 w-full">
              <ResponsiveContainer>
                <LineChart data={dados} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="dataResumida" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip
                    cursor={{ stroke: 'hsl(var(--border))' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const ponto = payload[0].payload as PontoEvolucao & { dataResumida: string }
                      return (
                        <ChartTooltipContent
                          titulo={ponto.dataResumida}
                          linhas={[{ rotulo: 'Média de qualidade', valor: ponto.mediaQualidade.toFixed(2), cor: COR_QUALIDADE }]}
                        />
                      )
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="mediaQualidade"
                    stroke={COR_QUALIDADE}
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 2, stroke: 'hsl(var(--background))', fill: COR_QUALIDADE }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="h-24 w-full">
              <ResponsiveContainer>
                <BarChart data={dados} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="20%">
                  <XAxis dataKey="dataResumida" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const ponto = payload[0].payload as PontoEvolucao & { dataResumida: string }
                      return (
                        <ChartTooltipContent
                          titulo={ponto.dataResumida}
                          linhas={[{ rotulo: 'Revisões', valor: String(ponto.totalRevisoes), cor: COR_REVISOES }]}
                        />
                      )
                    }}
                  />
                  <Bar dataKey="totalRevisoes" fill={COR_REVISOES} radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

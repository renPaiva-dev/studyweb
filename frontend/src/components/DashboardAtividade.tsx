import { useCallback, useEffect, useRef, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { buscarAtividade, type DiaSemana, type FlashcardMaisRevisado, type RevisaoPorDiaSemana } from '@/api/dashboardApi'
import { extrairMensagemErro } from '@/api/apiError'
import { EstadoErro } from '@/components/ui/estados'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartTooltipContent } from '@/components/ChartTooltipContent'
import { CORES_GRAFICO } from '@/utils/coresDesempenho'

interface DashboardAtividadeProps {
  deckId: number
}

const COR_REVISOES = CORES_GRAFICO.barra

const ORDEM_DIAS: DiaSemana[] = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO']

const ROTULOS_DIAS: Record<DiaSemana, string> = {
  SEGUNDA: 'Seg',
  TERCA: 'Ter',
  QUARTA: 'Qua',
  QUINTA: 'Qui',
  SEXTA: 'Sex',
  SABADO: 'Sáb',
  DOMINGO: 'Dom',
}

// UC15/RN20 - atividade: top flashcards mais revisados e distribuicao de
// revisoes por dia da semana (extensao do dashboard de UC11/RN14). GET
// /api/decks/{id}/dashboard/atividade (docs/contrato-api.md).
export function DashboardAtividade({ deckId }: DashboardAtividadeProps) {
  const [flashcardsMaisRevisados, setFlashcardsMaisRevisados] = useState<FlashcardMaisRevisado[] | null>(null)
  const [revisoesPorDiaSemana, setRevisoesPorDiaSemana] = useState<RevisaoPorDiaSemana[]>([])
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)

  // Guarda a requisicao mais recente para ignorar respostas antigas que
  // cheguem fora de ordem (ex.: clicar "Tentar novamente" mais de uma vez
  // rapido dispara buscas concorrentes).
  const requisicaoAtualRef = useRef(0)

  const carregar = useCallback(async () => {
    const idRequisicao = ++requisicaoAtualRef.current
    setErroCarregamento(null)

    try {
      const resposta = await buscarAtividade(deckId)
      if (requisicaoAtualRef.current !== idRequisicao) {
        return
      }
      setFlashcardsMaisRevisados(resposta.flashcardsMaisRevisados)
      setRevisoesPorDiaSemana(resposta.revisoesPorDiaSemana)
    } catch (erro) {
      if (requisicaoAtualRef.current !== idRequisicao) {
        return
      }
      setErroCarregamento(extrairMensagemErro(erro, 'Não foi possível carregar a atividade deste deck.'))
    }
  }, [deckId])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const dadosPorDia = ORDEM_DIAS.map((dia) => ({
    diaSemana: dia,
    rotulo: ROTULOS_DIAS[dia],
    totalRevisoes: revisoesPorDiaSemana.find((item) => item.diaSemana === dia)?.totalRevisoes ?? 0,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade</CardTitle>
      </CardHeader>
      <CardContent>
        {erroCarregamento !== null ? (
          <EstadoErro compacto mensagem={erroCarregamento} onTentarNovamente={() => void carregar()} />
        ) : flashcardsMaisRevisados === null ? (
          <Skeleton className="h-48 w-full rounded-lg" />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-ink-700">Mais revisados</h3>
              {flashcardsMaisRevisados.length === 0 ? (
                <p className="text-sm text-ink-600">Nenhuma revisão registrada ainda.</p>
              ) : (
                <ol className="space-y-2">
                  {flashcardsMaisRevisados.map((flashcard, indice) => (
                    <li key={flashcard.flashcardId} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-white">
                        {indice + 1}
                      </span>
                      <span className="line-clamp-2 flex-1">{flashcard.pergunta}</span>
                      <span className="shrink-0 whitespace-nowrap rounded-full bg-ink-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-ink-700">
                        {flashcard.totalRevisoes}x
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-ink-700">Revisões por dia da semana</h3>
              <div className="h-40 w-full">
                <ResponsiveContainer>
                  <BarChart data={dadosPorDia} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <XAxis dataKey="rotulo" tick={{ fontSize: 12, fill: CORES_GRAFICO.eixo }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: CORES_GRAFICO.eixo }} axisLine={false} tickLine={false} width={24} />
                    <Tooltip
                      cursor={{ fill: '#EEF0F6' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const dia = payload[0].payload as (typeof dadosPorDia)[number]
                        return (
                          <ChartTooltipContent
                            titulo={dia.rotulo}
                            linhas={[{ rotulo: 'Revisões', valor: String(dia.totalRevisoes), cor: COR_REVISOES }]}
                          />
                        )
                      }}
                    />
                    <Bar dataKey="totalRevisoes" fill={COR_REVISOES} radius={[4, 4, 0, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

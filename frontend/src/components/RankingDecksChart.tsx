import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { RankingDeck } from '@/api/usuarioApi'
import { ChartTooltipContent } from '@/components/ChartTooltipContent'
import { useTelaEstreita } from '@/hooks/useTelaEstreita'
import { CORES_DESEMPENHO, CORES_GRAFICO } from '@/utils/coresDesempenho'

interface RankingDecksChartProps {
  decks: RankingDeck[]
}

const { dominado: COR_DOMINADO, emRisco: COR_EM_RISCO } = CORES_DESEMPENHO
const ALTURA_POR_DECK = 40

// UC20/RN25 - ranking de decks por desempenho (% dominado/em risco),
// ordenados pelo backend por percentualDominado desc. Mesmo padrao visual
// de DashboardTopicos.tsx (UC15/RN20) - barras horizontais, mesmas cores de
// status reservadas para dominado/em risco.
export function RankingDecksChart({ decks }: RankingDecksChartProps) {
  const estreito = useTelaEstreita()

  if (decks.length === 0) {
    return <p className="rounded-lg border border-dashed border-ink-300 py-10 text-center text-sm text-ink-600">Você ainda não tem nenhum deck.</p>
  }

  const limite = estreito ? 14 : 22
  const dados = decks.map((deck) => ({ ...deck, rotulo: deck.titulo.length > limite ? `${deck.titulo.slice(0, limite - 1)}…` : deck.titulo }))

  return (
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

      <div style={{ height: decks.length * ALTURA_POR_DECK + 24 }}>
        <ResponsiveContainer>
          <BarChart data={dados} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid horizontal={false} stroke={CORES_GRAFICO.grade} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: CORES_GRAFICO.eixo }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="rotulo"
              width={estreito ? 104 : 170}
              tick={{ fontSize: 12, fill: '#1A1C30' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: '#EEF0F6' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const deck = payload[0].payload as RankingDeck
                return (
                  <ChartTooltipContent
                    titulo={deck.titulo}
                    linhas={[
                      { rotulo: 'Dominado', valor: `${deck.percentualDominado}%`, cor: COR_DOMINADO },
                      { rotulo: 'Em risco', valor: `${deck.percentualEmRisco}%`, cor: COR_EM_RISCO },
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
  )
}

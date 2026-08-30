import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { RankingDeck } from '@/api/usuarioApi'
import { ChartTooltipContent } from '@/components/ChartTooltipContent'

interface RankingDecksChartProps {
  decks: RankingDeck[]
}

const COR_DOMINADO = '#10b981'
const COR_EM_RISCO = '#ef4444'
const ALTURA_POR_DECK = 40

// UC20/RN25 - ranking de decks por desempenho (% dominado/em risco),
// ordenados pelo backend por percentualDominado desc. Mesmo padrao visual
// de DashboardTopicos.tsx (UC15/RN20) - barras horizontais, mesmas cores de
// status reservadas para dominado/em risco.
export function RankingDecksChart({ decks }: RankingDecksChartProps) {
  if (decks.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Você ainda não tem nenhum deck.</p>
  }

  const dados = decks.map((deck) => ({ ...deck, rotulo: deck.titulo }))

  return (
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

      <div style={{ height: decks.length * ALTURA_POR_DECK + 24 }}>
        <ResponsiveContainer>
          <BarChart data={dados} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="rotulo"
              width={130}
              tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
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

interface ChartTooltipRow {
  rotulo: string
  valor: string
  cor: string
}

interface ChartTooltipContentProps {
  titulo: string
  linhas: ChartTooltipRow[]
}

/**
 * Conteudo de tooltip compartilhado pelos graficos do dashboard (UC15):
 * valor em destaque, rotulo secundario, chave de serie via ponto colorido.
 */
export function ChartTooltipContent({ titulo, linhas }: ChartTooltipContentProps) {
  return (
    <div className="min-w-40 rounded-lg border border-ink-200 bg-card px-3 py-2.5 text-sm text-foreground shadow-lg">
      <p className="mb-1.5 font-semibold">{titulo}</p>
      <div className="space-y-1">
        {linhas.map((linha) => (
          <div key={linha.rotulo} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: linha.cor }} />
            <span className="text-ink-600">{linha.rotulo}</span>
            <span className="ml-auto pl-3 font-semibold tabular-nums">{linha.valor}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

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
 * valor em destaque, rotulo secundario, chave de serie via traco colorido
 * (nunca caixa cheia) - ver skill de dataviz, secao de interacao.
 */
export function ChartTooltipContent({ titulo, linhas }: ChartTooltipContentProps) {
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
      <p className="mb-1 font-medium">{titulo}</p>
      <div className="space-y-0.5">
        {linhas.map((linha) => (
          <div key={linha.rotulo} className="flex items-center gap-2">
            <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ backgroundColor: linha.cor }} />
            <span className="text-muted-foreground">{linha.rotulo}</span>
            <span className="ml-auto font-semibold tabular-nums">{linha.valor}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

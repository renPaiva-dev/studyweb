import { cn } from '@/lib/utils'

interface AvaliacaoRevisaoBotoesProps {
  onAvaliar: (qualidade: number) => void
  desabilitado: boolean
}

// UC08 - avaliacao da propria resposta em escala 0-5, que alimenta o
// recalculo SM-2 (UC09/RN09). Cores graduais (vermelho -> verde) do
// indicio visual imediato de "errei" a "acertei com facilidade".
const OPCOES = [
  { valor: 0, rotulo: 'Não lembrei', classes: 'bg-red-600 text-white hover:bg-red-700' },
  { valor: 1, rotulo: 'Errei', classes: 'bg-orange-500 text-white hover:bg-orange-600' },
  { valor: 2, rotulo: 'Quase', classes: 'bg-amber-400 text-amber-950 hover:bg-amber-500' },
  { valor: 3, rotulo: 'Com esforço', classes: 'bg-yellow-400 text-yellow-950 hover:bg-yellow-500' },
  { valor: 4, rotulo: 'Bom', classes: 'bg-lime-500 text-lime-950 hover:bg-lime-600' },
  { valor: 5, rotulo: 'Fácil', classes: 'bg-green-600 text-white hover:bg-green-700' },
] as const

export function AvaliacaoRevisaoBotoes({ onAvaliar, desabilitado }: AvaliacaoRevisaoBotoesProps) {
  return (
    <div className="space-y-2">
      <p className="text-center text-sm text-muted-foreground">Quão bem você lembrou da resposta?</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {OPCOES.map((opcao) => (
          <button
            key={opcao.valor}
            type="button"
            disabled={desabilitado}
            onClick={() => onAvaliar(opcao.valor)}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-lg px-2 py-3 transition-colors disabled:pointer-events-none disabled:opacity-50',
              opcao.classes,
            )}
          >
            <span className="text-lg font-bold leading-none">{opcao.valor}</span>
            <span className="text-[11px] leading-tight">{opcao.rotulo}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

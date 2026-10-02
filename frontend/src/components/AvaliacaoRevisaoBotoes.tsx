import { cn } from '@/lib/utils'

interface AvaliacaoRevisaoBotoesProps {
  onAvaliar: (qualidade: number) => void
  desabilitado: boolean
}

// UC08 - avaliacao da propria resposta em escala 0-5, que alimenta o
// recalculo SM-2 (UC09/RN09). Tres faixas semanticas claras (errei /
// com esforco / lembrei) em vez de um degrade de tons parecidos; o numero
// grande e o atalho de teclado (0-5) - ver EstudarTab.
const OPCOES = [
  { valor: 0, rotulo: 'Não lembrei', tom: 'erro' },
  { valor: 1, rotulo: 'Errei', tom: 'erro' },
  { valor: 2, rotulo: 'Quase', tom: 'erro' },
  { valor: 3, rotulo: 'Com esforço', tom: 'aviso' },
  { valor: 4, rotulo: 'Bom', tom: 'ok' },
  { valor: 5, rotulo: 'Fácil', tom: 'ok' },
] as const

const TONS = {
  erro: 'border-danger-200 bg-danger-50 text-danger-800 hover:border-danger-500 hover:bg-danger-100 [&_[data-num]]:text-danger-700',
  aviso: 'border-warning-200 bg-warning-50 text-warning-800 hover:border-warning-500 hover:bg-warning-100 [&_[data-num]]:text-warning-800',
  ok: 'border-success-200 bg-success-50 text-success-800 hover:border-success-500 hover:bg-success-100 [&_[data-num]]:text-success-700',
}

export function AvaliacaoRevisaoBotoes({ onAvaliar, desabilitado }: AvaliacaoRevisaoBotoesProps) {
  return (
    <div className="space-y-3 animate-entrada" role="group" aria-labelledby="titulo-avaliacao">
      <p id="titulo-avaliacao" className="text-center text-sm font-semibold text-ink-700">
        Quão bem você lembrou da resposta?
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {OPCOES.map((opcao) => (
          <button
            key={opcao.valor}
            type="button"
            disabled={desabilitado}
            onClick={() => onAvaliar(opcao.valor)}
            className={cn(
              'flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2.5 shadow-xs transition-[background-color,border-color,transform] duration-fast ease-suave hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
              TONS[opcao.tom],
            )}
          >
            <span data-num className="font-heading text-h3 font-semibold leading-none">
              {opcao.valor}
            </span>
            <span className="text-xs font-semibold leading-tight">{opcao.rotulo}</span>
          </button>
        ))}
      </div>
      <div className="flex justify-between px-1 text-xs font-medium text-ink-600" aria-hidden="true">
        <span>← Errei</span>
        <span className="hidden sm:inline">Atalho: teclas 0 a 5</span>
        <span>Lembrei fácil →</span>
      </div>
    </div>
  )
}

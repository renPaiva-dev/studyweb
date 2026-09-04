import { ESCALA_AVALIACAO } from '@/utils/coresDesempenho'

interface AvaliacaoRevisaoBotoesProps {
  onAvaliar: (qualidade: number) => void
  desabilitado: boolean
}

// UC08 - avaliacao da propria resposta em escala 0-5, que alimenta o
// recalculo SM-2 (UC09/RN09). A escala de cor (Vermelho-correção ->
// Verde-lousa, ver ESCALA_AVALIACAO) da o indicio visual imediato de
// "errei" a "acertei com facilidade", sem introduzir matizes fora da
// paleta aprovada.
const OPCOES = [
  { valor: 0, rotulo: 'Não lembrei' },
  { valor: 1, rotulo: 'Errei' },
  { valor: 2, rotulo: 'Quase' },
  { valor: 3, rotulo: 'Com esforço' },
  { valor: 4, rotulo: 'Bom' },
  { valor: 5, rotulo: 'Fácil' },
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
            style={{ backgroundColor: ESCALA_AVALIACAO[opcao.valor] }}
            className="flex flex-col items-center gap-0.5 px-2 py-3 text-papel transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
          >
            <span className="text-lg font-bold leading-none">{opcao.valor}</span>
            <span className="text-[11px] leading-tight">{opcao.rotulo}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

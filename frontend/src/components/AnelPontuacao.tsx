import { cn } from '@/lib/utils'
import { classificarPontuacao } from '@/utils/classificarPontuacao'

interface AnelPontuacaoProps {
  pontuacao: number
  tamanho?: number
  /** Espessura do arco, em px. */
  espessura?: number
  /** Classe stroke-* para forcar uma cor (default: faixa de classificarPontuacao). */
  traco?: string
  rotulo?: string
  className?: string
}

// Indicador circular 0-100 (pontuacao de prova, prontidao). O numero no
// centro e o dado; o arco so reforca - por isso o SVG e aria-hidden e o
// valor vai num texto acessivel.
export function AnelPontuacao({ pontuacao, tamanho = 64, espessura, traco, rotulo, className }: AnelPontuacaoProps) {
  const valor = Math.min(100, Math.max(0, pontuacao))
  const largura = espessura ?? Math.max(4, Math.round(tamanho / 11))
  const raio = (tamanho - largura) / 2
  const circunferencia = 2 * Math.PI * raio
  const corTraco = traco ?? classificarPontuacao(valor).cores.traco
  const grande = tamanho >= 96

  return (
    <div className={cn('relative shrink-0', className)} style={{ width: tamanho, height: tamanho }}>
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} className="-rotate-90" aria-hidden="true">
        <circle cx={tamanho / 2} cy={tamanho / 2} r={raio} fill="none" strokeWidth={largura} className="stroke-ink-100" />
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          fill="none"
          strokeWidth={largura}
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia * (1 - valor / 100)}
          className={cn('transition-[stroke-dashoffset] duration-700 ease-suave', corTraco)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-heading font-semibold tabular-nums leading-none text-foreground', grande ? 'text-h1' : tamanho >= 56 ? 'text-base' : 'text-sm')}>
          {Math.round(pontuacao)}
          <span className={cn(grande ? 'text-h3' : 'text-[0.7em]')}>%</span>
        </span>
        {rotulo && grande && <span className="mt-1 text-xs font-medium text-muted-foreground">{rotulo}</span>}
      </div>
    </div>
  )
}

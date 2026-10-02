import type { KeyboardEvent } from 'react'

import type { Questao } from '@/api/quizApi'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface QuestaoQuizItemProps {
  questao: Questao
  numero: number
  respostaSelecionada: string | undefined
  onSelecionar: (alternativa: string) => void
  desabilitado: boolean
}

const LETRAS = 'ABCDEFGH'

// UC10 - uma questao do quiz de multipla escolha. Alternativas vem so com
// o texto (docs/contrato-api.md: "sem expor resposta_correta"); a
// selecionada e enviada por texto em RespostaDTO.alternativaEscolhida.
// Semantica de radiogroup: setas navegam entre alternativas, como um
// grupo de radio nativo.
export function QuestaoQuizItem({ questao, numero, respostaSelecionada, onSelecionar, desabilitado }: QuestaoQuizItemProps) {
  const idTitulo = `questao-${questao.id}-titulo`
  const indiceSelecionado = questao.alternativas.findIndex((alternativa) => alternativa === respostaSelecionada)

  function aoTeclar(evento: KeyboardEvent<HTMLButtonElement>, indice: number) {
    const total = questao.alternativas.length
    let proximo: number | null = null
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowRight') proximo = (indice + 1) % total
    if (evento.key === 'ArrowUp' || evento.key === 'ArrowLeft') proximo = (indice - 1 + total) % total
    if (proximo === null) return

    evento.preventDefault()
    onSelecionar(questao.alternativas[proximo])
    const grupo = evento.currentTarget.parentElement
    ;(grupo?.children[proximo] as HTMLElement | undefined)?.focus()
  }

  return (
    <Card className={cn('p-5 transition-colors duration-base sm:p-6', respostaSelecionada !== undefined && 'border-ink-300')}>
      <p id={idTitulo} className="flex gap-3 font-semibold leading-snug text-foreground">
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums transition-colors',
            respostaSelecionada !== undefined ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-700',
          )}
        >
          {numero}
        </span>
        <span className="pt-0.5">{questao.enunciado}</span>
      </p>
      <div role="radiogroup" aria-labelledby={idTitulo} className="mt-4 space-y-2">
        {questao.alternativas.map((alternativa, indice) => {
          const selecionada = alternativa === respostaSelecionada

          return (
            <button
              key={indice}
              type="button"
              role="radio"
              aria-checked={selecionada}
              tabIndex={selecionada || (indiceSelecionado === -1 && indice === 0) ? 0 : -1}
              disabled={desabilitado}
              onClick={() => onSelecionar(alternativa)}
              onKeyDown={(evento) => aoTeclar(evento, indice)}
              className={cn(
                'flex min-h-12 w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-[background-color,border-color,box-shadow] duration-fast ease-suave focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 sm:text-base',
                selecionada
                  ? 'border-ink-900 bg-ink-900/[0.03] font-medium text-foreground shadow-[inset_0_0_0_1px_hsl(var(--foreground))]'
                  : 'border-ink-200 text-ink-800 hover:border-ink-400 hover:bg-ink-50',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-bold transition-colors',
                  selecionada ? 'border-brand-400 bg-brand-400 text-ink-950' : 'border-ink-300 bg-card text-ink-600',
                )}
              >
                {LETRAS[indice]}
              </span>
              {alternativa}
            </button>
          )
        })}
      </div>
    </Card>
  )
}

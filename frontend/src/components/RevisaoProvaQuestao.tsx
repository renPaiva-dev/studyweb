import { Check, Info, X } from 'lucide-react'

import type { QuestaoRevisada } from '@/api/quizApi'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface RevisaoProvaQuestaoProps {
  questao: QuestaoRevisada
  numero: number
}

const LETRAS = 'ABCDEFGH'

// UC27/UC28/RN36 - revisao de uma questao ja respondida: mostra a
// alternativa correta, a escolhida (quando errada) e a explicacao. Usado
// tanto na tela de resultado (logo apos responder) quanto no detalhe do
// historico de provas. Verde-lousa/Vermelho-correção aqui sao a propria
// metafora de "correção" da identidade visual, não decorativos.
export function RevisaoProvaQuestao({ questao, numero }: RevisaoProvaQuestaoProps) {
  return (
    <Card className={cn('overflow-hidden border-l-4 p-5 sm:p-6', questao.correta ? 'border-l-success-500' : 'border-l-danger-500')}>
      <div className="flex items-start justify-between gap-3">
        <p className="flex gap-3 font-semibold leading-snug text-foreground">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-100 text-sm font-bold tabular-nums text-ink-700">
            {numero}
          </span>
          <span className="pt-0.5">{questao.enunciado}</span>
        </p>
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
            questao.correta ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800',
          )}
        >
          {questao.correta ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          {questao.correta ? 'Acertou' : 'Errou'}
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {questao.alternativas.map((alternativa, indice) => {
          const ehCorreta = alternativa === questao.respostaCorreta
          const ehEscolhida = alternativa === questao.alternativaEscolhida

          return (
            <li
              key={indice}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2 text-sm sm:text-base',
                ehCorreta && 'border-success-300 bg-success-50 font-medium text-success-800',
                !ehCorreta && ehEscolhida && 'border-danger-300 bg-danger-50 text-danger-800',
                !ehCorreta && !ehEscolhida && 'border-ink-200 text-ink-700',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-bold',
                  ehCorreta
                    ? 'border-success-600 bg-success-600 text-white'
                    : ehEscolhida
                      ? 'border-danger-600 bg-danger-600 text-white'
                      : 'border-ink-300 text-ink-600',
                )}
              >
                {ehCorreta ? <Check className="h-4 w-4" /> : ehEscolhida ? <X className="h-4 w-4" /> : LETRAS[indice]}
              </span>
              <span className="flex-1">
                {alternativa}
                {ehCorreta && <span className="sr-only"> (resposta correta)</span>}
              </span>
              {ehEscolhida && (
                <span className="shrink-0 text-xs font-semibold uppercase tracking-wide opacity-80">Sua resposta</span>
              )}
            </li>
          )
        })}
      </ul>

      {questao.explicacao && (
        <div className="mt-4 flex gap-2.5 rounded-lg bg-info-50 px-3.5 py-3 text-sm leading-relaxed text-info-800 ring-1 ring-inset ring-info-100">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-info-600" aria-hidden="true" />
          <p>
            <span className="font-semibold">Por quê: </span>
            {questao.explicacao}
          </p>
        </div>
      )}
    </Card>
  )
}

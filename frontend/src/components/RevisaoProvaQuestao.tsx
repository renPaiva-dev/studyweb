import { Check, Info, X } from 'lucide-react'

import type { QuestaoRevisada } from '@/api/quizApi'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface RevisaoProvaQuestaoProps {
  questao: QuestaoRevisada
  numero: number
}

// UC27/UC28/RN36 - revisao de uma questao ja respondida: mostra a
// alternativa correta, a escolhida (quando errada) e a explicacao. Usado
// tanto na tela de resultado (logo apos responder) quanto no detalhe do
// historico de provas. Verde-lousa/Vermelho-correção aqui sao a propria
// metafora de "correção" da identidade visual, não decorativos.
export function RevisaoProvaQuestao({ questao, numero }: RevisaoProvaQuestaoProps) {
  return (
    <Card className={cn(questao.correta ? 'border-verde-lousa/30' : 'border-vermelho-correcao/30')}>
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
        <p className="font-medium">
          <span className="text-muted-foreground">{numero}. </span>
          {questao.enunciado}
        </p>
        <span
          className={cn(
            'flex shrink-0 items-center gap-1 px-2 py-0.5 text-xs font-medium',
            questao.correta ? 'bg-verde-lousa/10 text-verde-lousa' : 'bg-vermelho-correcao/10 text-vermelho-correcao',
          )}
        >
          {questao.correta ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          {questao.correta ? 'Acertou' : 'Errou'}
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {questao.alternativas.map((alternativa, indice) => {
            const ehCorreta = alternativa === questao.respostaCorreta
            const ehEscolhida = alternativa === questao.alternativaEscolhida

            return (
              <div
                key={indice}
                className={cn(
                  'flex items-center gap-2 border px-3 py-2 text-sm',
                  ehCorreta && 'border-verde-lousa bg-verde-lousa/5 text-foreground',
                  !ehCorreta && ehEscolhida && 'border-vermelho-correcao bg-vermelho-correcao/5 text-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                    ehCorreta
                      ? 'border-verde-lousa bg-verde-lousa text-papel'
                      : ehEscolhida
                        ? 'border-vermelho-correcao bg-vermelho-correcao text-papel'
                        : 'border-input',
                  )}
                >
                  {ehCorreta && <Check className="h-3 w-3" />}
                  {!ehCorreta && ehEscolhida && <X className="h-3 w-3" />}
                </span>
                {alternativa}
                {ehEscolhida && !ehCorreta && <span className="ml-auto text-xs text-muted-foreground">Sua resposta</span>}
              </div>
            )
          })}
        </div>

        {questao.explicacao && (
          <div className="flex gap-2 bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>{questao.explicacao}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

import { Check } from 'lucide-react'

import type { Questao } from '@/api/quizApi'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface QuestaoQuizItemProps {
  questao: Questao
  numero: number
  respostaSelecionada: string | undefined
  onSelecionar: (alternativa: string) => void
  desabilitado: boolean
}

// UC10 - uma questao do quiz de multipla escolha. Alternativas vem so com
// o texto (docs/contrato-api.md: "sem expor resposta_correta"); a
// selecionada e enviada por texto em RespostaDTO.alternativaEscolhida.
export function QuestaoQuizItem({ questao, numero, respostaSelecionada, onSelecionar, desabilitado }: QuestaoQuizItemProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <p className="font-medium">
          <span className="text-muted-foreground">{numero}. </span>
          {questao.enunciado}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {questao.alternativas.map((alternativa, indice) => {
          const selecionada = alternativa === respostaSelecionada

          return (
            <button
              key={indice}
              type="button"
              disabled={desabilitado}
              onClick={() => onSelecionar(alternativa)}
              className={cn(
                'flex w-full items-center gap-2 border px-3 py-2 text-left text-sm transition-colors disabled:pointer-events-none disabled:opacity-50',
                selecionada ? 'border-foreground bg-accent text-foreground' : 'hover:bg-accent',
              )}
            >
              <span
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                  selecionada ? 'border-foreground bg-foreground text-background' : 'border-input',
                )}
              >
                {selecionada && <Check className="h-3 w-3" />}
              </span>
              {alternativa}
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}

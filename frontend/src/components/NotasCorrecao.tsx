import { Sparkles } from 'lucide-react'

import type { FeedbackAutoexplicacao } from '@/api/elaboracaoApi'
import { cn } from '@/lib/utils'
import { CLASSE_VEREDITO, ESTILO_ANOTACAO, textoVeredito } from '@/utils/estiloElaboracao'

interface NotasCorrecaoProps {
  feedback: FeedbackAutoexplicacao
  numeros: (number | null)[]
  idBaseNotas: string
}

// Cada nota entra um instante depois da anterior: a margem "sendo escrita"
// logo após o texto, mesma orquestração do resto do app (Layout/EstudarTab).
function atraso(ordem: number) {
  return { animationDelay: `${0.25 + ordem * 0.08}s` }
}

// UC34/RN43 - as anotações do "professor" na margem, ligadas aos sublinhados
// de TextoCorrigido pelo número e por aria-describedby (id de cada <li>).
export function NotasCorrecao({ feedback, numeros, idBaseNotas }: NotasCorrecaoProps) {
  return (
    <div className="space-y-3" aria-live="polite">
      <p className="text-eyebrow text-muted-foreground">Correção</p>

      <p
        className={cn(
          'animate-entrada-atrasada border-l-2 pl-3 font-heading text-lg font-semibold leading-snug',
          CLASSE_VEREDITO[feedback.veredito],
        )}
        style={atraso(0)}
      >
        {textoVeredito(feedback.veredito, feedback.ancoradaNoMaterial)}
      </p>

      <p className="animate-entrada-atrasada" style={atraso(1)}>
        {feedback.comentarioGeral}
      </p>

      {feedback.anotacoes.length > 0 && (
        <ol className="space-y-2">
          {feedback.anotacoes.map((anotacao, indice) => {
            const estilo = ESTILO_ANOTACAO[anotacao.tipo]
            const numero = numeros[indice]

            return (
              <li
                key={indice}
                id={`${idBaseNotas}-${indice}`}
                className="animate-entrada-atrasada flex gap-2"
                style={atraso(indice + 2)}
              >
                <span aria-hidden className={cn('w-3 shrink-0 font-mono text-xs font-semibold leading-5', estilo.texto)}>
                  {numero ?? '•'}
                </span>
                <p>
                  <span className={cn('font-medium', estilo.texto)}>{estilo.rotulo}</span>{' '}
                  <span>{anotacao.comentario}</span>
                </p>
              </li>
            )
          })}
        </ol>
      )}

      {feedback.faltou && (
        <p className="animate-entrada-atrasada" style={atraso(feedback.anotacoes.length + 2)}>
          <span className="font-medium">Faltou:</span> {feedback.faltou}
        </p>
      )}

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 shrink-0" />
        {feedback.ancoradaNoMaterial ? 'Comparado com o seu material' : 'Sem material de referência neste deck'}
      </p>
    </div>
  )
}

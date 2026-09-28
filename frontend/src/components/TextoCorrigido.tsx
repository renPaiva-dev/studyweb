import { Fragment } from 'react'

import type { FeedbackAutoexplicacao } from '@/api/elaboracaoApi'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CLASSE_VEREDITO, ESTILO_ANOTACAO, ESTILO_PAUTA, textoVeredito } from '@/utils/estiloElaboracao'
import { segmentarTextoCorrigido } from '@/utils/segmentarTextoCorrigido'

interface TextoCorrigidoProps {
  texto: string
  feedback: FeedbackAutoexplicacao
  numeros: (number | null)[]
  idBaseNotas: string
  onReescrever: () => void
  onFechar: () => void
}

// UC34/RN43 - a explicação do estudante "corrigida": cada trecho anotado
// ganha o sublinhado do tipo (ondulado vermelho, pontilhado grafite, sólido
// verde) e o número da nota correspondente na margem (NotasCorrecao).
export function TextoCorrigido({ texto, feedback, numeros, idBaseNotas, onReescrever, onFechar }: TextoCorrigidoProps) {
  const segmentos = segmentarTextoCorrigido(texto, feedback.anotacoes)

  return (
    <div className="animate-caderno-entrada space-y-2">
      <p className="text-eyebrow text-muted-foreground">Sua explicação, corrigida</p>

      {/* Em telas sem a coluna de margem ao lado, o veredito aparece também
          aqui, para ninguém precisar rolar até as notas para saber o resultado. */}
      <p
        className={cn(
          'border-l-2 pl-3 font-heading text-base font-semibold lg:hidden',
          CLASSE_VEREDITO[feedback.veredito],
        )}
      >
        {textoVeredito(feedback.veredito, feedback.ancoradaNoMaterial)}
      </p>

      <div className="relative border-y border-manilha bg-card">
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-8 w-px bg-tinta/20" />
        <p
          style={ESTILO_PAUTA}
          className="whitespace-pre-wrap break-words py-[0.875rem] pl-12 pr-4 text-base text-foreground"
        >
          {segmentos.map((segmento, indice) => {
            if (segmento.anotacaoIndice === undefined) {
              return <Fragment key={indice}>{segmento.texto}</Fragment>
            }

            const anotacao = feedback.anotacoes[segmento.anotacaoIndice]
            const estilo = ESTILO_ANOTACAO[anotacao.tipo]
            const numero = numeros[segmento.anotacaoIndice]

            return (
              <Fragment key={indice}>
                <span
                  className={cn('underline decoration-2 underline-offset-4', estilo.sublinhado)}
                  aria-describedby={`${idBaseNotas}-${segmento.anotacaoIndice}`}
                >
                  {segmento.texto}
                </span>
                {numero !== null && (
                  <sup aria-hidden className={cn('ml-0.5 font-mono text-[10px] font-semibold', estilo.texto)}>
                    {numero}
                  </sup>
                )}
              </Fragment>
            )
          })}
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onFechar}>
          Fechar
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onReescrever}>
          Reescrever
        </Button>
      </div>
    </div>
  )
}

import { Loader2, PenLine } from 'lucide-react'
import { useId, type KeyboardEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { ESTILO_PAUTA } from '@/utils/estiloElaboracao'

export const TAMANHO_MINIMO_AUTOEXPLICACAO = 20
export const TAMANHO_MAXIMO_AUTOEXPLICACAO = 1000

interface FolhaAutoexplicacaoProps {
  texto: string
  onTextoChange: (texto: string) => void
  corrigindo: boolean
  onPedirCorrecao: () => void
  onCancelar: () => void
}

// UC34/RN43 - folha pautada onde o estudante explica o card com as próprias
// palavras. Os atalhos de teclado são locais ao textarea: nada aqui pode
// disparar a avaliação 0-5 do card (RN44).
export function FolhaAutoexplicacao({ texto, onTextoChange, corrigindo, onPedirCorrecao, onCancelar }: FolhaAutoexplicacaoProps) {
  const idCampo = useId()
  const tamanho = texto.trim().length
  const valido = tamanho >= TAMANHO_MINIMO_AUTOEXPLICACAO && tamanho <= TAMANHO_MAXIMO_AUTOEXPLICACAO

  function aoTeclar(evento: KeyboardEvent<HTMLTextAreaElement>) {
    if (evento.key === 'Enter' && (evento.ctrlKey || evento.metaKey)) {
      evento.preventDefault()
      if (valido && !corrigindo) {
        onPedirCorrecao()
      }
    } else if (evento.key === 'Escape' && !texto.trim()) {
      evento.preventDefault()
      onCancelar()
    }
  }

  return (
    <div className="animate-caderno-entrada space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        {/* <label> nativo, não o Label do shadcn: o text-sm/font-medium dele
            sobrescreve o text-eyebrow e desalinha com "Sua explicação, corrigida". */}
        <label htmlFor={idCampo} className="text-eyebrow text-muted-foreground">
          Sua explicação
        </label>
        <span className="font-mono text-xs text-muted-foreground" aria-live="polite">
          {tamanho}/{TAMANHO_MAXIMO_AUTOEXPLICACAO}
          {tamanho < TAMANHO_MINIMO_AUTOEXPLICACAO && ` · mínimo ${TAMANHO_MINIMO_AUTOEXPLICACAO}`}
        </span>
      </div>

      <div className="relative overflow-hidden border-y border-manilha bg-card transition-colors focus-within:border-tinta/40">
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-8 w-px bg-tinta/20" />
        <Textarea
          id={idCampo}
          autoFocus
          value={texto}
          onChange={(evento) => onTextoChange(evento.target.value)}
          onKeyDown={aoTeclar}
          readOnly={corrigindo}
          maxLength={TAMANHO_MAXIMO_AUTOEXPLICACAO}
          rows={5}
          placeholder="Explique a resposta como se estivesse ensinando alguém…"
          style={ESTILO_PAUTA}
          className="min-h-[9.5rem] resize-y rounded-none border-0 bg-transparent py-[0.875rem] pl-12 pr-4 text-base shadow-none focus-visible:ring-0 md:text-base"
        />

        {corrigindo && (
          // A "caneta" percorrendo a folha enquanto a IA lê - desativado por
          // prefers-reduced-motion (regra de .animate-shimmer em index.css).
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-spark/15 to-transparent" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', !corrigindo && 'hidden sm:flex')}>
          {corrigindo ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Lendo sua explicação…
            </>
          ) : (
            'Ctrl + Enter pede a correção'
          )}
        </p>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button type="button" size="sm" onClick={onPedirCorrecao} disabled={!valido || corrigindo}>
            <PenLine />
            Pedir correção
          </Button>
        </div>
      </div>
    </div>
  )
}

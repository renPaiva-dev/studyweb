import { EyeOff, Loader2, PenLine, Shapes } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface ElaboracaoAtalhosProps {
  escrevendo: boolean
  gerandoAnalogia: boolean
  onExplicar: () => void
  onAnalogia: () => void
  onOcultar: () => void
}

// UC34/RN44 - convite discreto, nunca uma etapa: botões ghost (o âmbar
// fica reservado ao CTA) e nada abre sozinho.
export function ElaboracaoAtalhos({ escrevendo, gerandoAnalogia, onExplicar, onAnalogia, onOcultar }: ElaboracaoAtalhosProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-t border-manilha pt-3">
      <span className="mr-1 text-eyebrow text-muted-foreground">Aprofundar (opcional)</span>
      <Button type="button" variant="ghost" size="sm" onClick={onExplicar} disabled={escrevendo}>
        <PenLine />
        Explicar com minhas palavras
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onAnalogia} disabled={gerandoAnalogia}>
        {gerandoAnalogia ? <Loader2 className="animate-spin" /> : <Shapes />}
        {gerandoAnalogia ? 'Pensando numa analogia…' : 'Me dá uma analogia'}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="ml-auto h-8 w-8 text-muted-foreground"
        onClick={onOcultar}
        aria-label="Ocultar opções de aprofundamento"
        title="Ocultar opções de aprofundamento"
      >
        <EyeOff />
      </Button>
    </div>
  )
}

import { Loader2, RefreshCw, Shapes } from 'lucide-react'

import type { Analogia } from '@/api/elaboracaoApi'
import { Button } from '@/components/ui/button'

interface NotaAnalogiaProps {
  analogia: Analogia
  gerando: boolean
  onOutra: () => void
}

// UC34/RN43 (versão leve) - analogia ou exemplo concreto do card, anotado na
// margem. "Outra analogia" envia a atual como `evitar`.
export function NotaAnalogia({ analogia, gerando, onOutra }: NotaAnalogiaProps) {
  return (
    <div className="animate-caderno-entrada-margem space-y-2" aria-live="polite">
      <p className="flex items-center gap-1.5 text-eyebrow text-muted-foreground">
        <Shapes className="h-3.5 w-3.5" />
        {analogia.tipo === 'EXEMPLO' ? 'Exemplo concreto' : 'Analogia'}
      </p>
      <p className="font-heading text-base leading-relaxed">{analogia.texto}</p>
      <p className="text-xs text-muted-foreground">
        {analogia.ancoradaNoMaterial ? 'Fiel ao seu material' : 'Sem material de referência neste deck'}
      </p>
      <Button type="button" variant="ghost" size="sm" className="-ml-3" onClick={onOutra} disabled={gerando}>
        {gerando ? <Loader2 className="animate-spin" /> : <RefreshCw />}
        {gerando ? 'Pensando em outra…' : 'Outra analogia'}
      </Button>
    </div>
  )
}

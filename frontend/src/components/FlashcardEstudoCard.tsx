import { Lightbulb } from 'lucide-react'

import type { ItemFilaEstudo } from '@/api/estudoApi'
import { Badge } from '@/components/ui/badge'

interface FlashcardEstudoCardProps {
  item: ItemFilaEstudo
  virado: boolean
}

// UC07/UC08 - cartao de estudo com efeito flip (rotateY em CSS puro, sem
// dependencia extra). A face da frente mostra a pergunta; virar revela a
// resposta e o mnemonico (UC06), quando houver.
export function FlashcardEstudoCard({ item, virado }: FlashcardEstudoCardProps) {
  return (
    <div className="mx-auto w-full max-w-xl" style={{ perspective: '1600px' }}>
      <div
        className="relative h-80 w-full transition-transform duration-500 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: virado ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl border bg-card p-8 text-center shadow-lg"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <Badge variant="outline">Pergunta</Badge>
          <p className="text-xl font-semibold">{item.pergunta}</p>
        </div>

        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-y-auto rounded-2xl border bg-card p-8 text-center shadow-lg"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <Badge className="bg-brand-600 hover:bg-brand-600">Resposta</Badge>
          <p className="text-xl font-semibold">{item.resposta}</p>
          {item.mnemonico && (
            <div className="flex items-start gap-1.5 rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{item.mnemonico}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

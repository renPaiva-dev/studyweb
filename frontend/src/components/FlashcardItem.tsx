import { Lightbulb, MoreHorizontal, Pencil, Sparkles, Trash2, User } from 'lucide-react'

import type { Flashcard } from '@/api/flashcardApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface FlashcardItemProps {
  flashcard: Flashcard
  onEditar: () => void
  onExcluir: () => void
}

// UC05/UC06 - um flashcard salvo na lista da aba "Flashcards". Badge
// indica a origem (RN04: MANUAL ou IA); mnemonico so aparece quando
// preenchido. O topico (RN17), quando existe, aparece ao lado da origem.
export function FlashcardItem({ flashcard, onEditar, onExcluir }: FlashcardItemProps) {
  const ehIA = flashcard.origem === 'IA'

  return (
    <Card className="group flex flex-col p-5 transition-shadow duration-base hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <Badge variant={ehIA ? 'default' : 'secondary'}>
            {ehIA ? <Sparkles /> : <User />}
            {ehIA ? 'Gerado pela IA' : 'Manual'}
          </Badge>
          {flashcard.topico && (
            <Badge variant="outline" className="max-w-[12rem] truncate" title={flashcard.topico}>
              {flashcard.topico}
            </Badge>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="-mr-2 -mt-1.5 shrink-0 text-ink-500" aria-label="Opções do flashcard">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEditar}>
              <Pencil />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onExcluir} className="text-danger-700 focus:bg-danger-50 focus:text-danger-800 [&>svg]:text-danger-600">
              <Trash2 />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="mt-3 font-semibold leading-snug text-foreground">{flashcard.pergunta}</p>
      <p className="mt-2 border-l-2 border-ink-200 pl-3 text-sm leading-relaxed text-ink-700">{flashcard.resposta}</p>
      {flashcard.mnemonico && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-900 ring-1 ring-inset ring-brand-100">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
          <span>
            <span className="sr-only">Mnemônico: </span>
            {flashcard.mnemonico}
          </span>
        </div>
      )}
    </Card>
  )
}

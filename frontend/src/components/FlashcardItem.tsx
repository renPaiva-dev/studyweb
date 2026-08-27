import { Lightbulb, MoreVertical, Pencil, Sparkles, Trash2, User } from 'lucide-react'

import type { Flashcard } from '@/api/flashcardApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface FlashcardItemProps {
  flashcard: Flashcard
  onEditar: () => void
  onExcluir: () => void
}

// UC05/UC06 - um flashcard salvo na lista da aba "Flashcards". Badge
// indica a origem (RN04: MANUAL ou IA); mnemonico so aparece quando
// preenchido.
export function FlashcardItem({ flashcard, onEditar, onExcluir }: FlashcardItemProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
        <Badge variant={flashcard.origem === 'IA' ? 'secondary' : 'outline'} className="gap-1">
          {flashcard.origem === 'IA' ? <Sparkles className="h-3 w-3" /> : <User className="h-3 w-3" />}
          {flashcard.origem === 'IA' ? 'IA' : 'Manual'}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="-mr-2 -mt-1 shrink-0" aria-label="Opções do flashcard">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEditar}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExcluir} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="font-medium">{flashcard.pergunta}</p>
        <p className="text-sm text-muted-foreground">{flashcard.resposta}</p>
        {flashcard.mnemonico && (
          <div className="flex items-start gap-1.5 rounded-md bg-muted/50 px-2.5 py-1.5 text-sm text-muted-foreground">
            <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{flashcard.mnemonico}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

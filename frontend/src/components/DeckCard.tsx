import { Layers, MoreVertical, Pencil, Trash2 } from 'lucide-react'

import type { Deck } from '@/api/deckApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DeckCardProps {
  deck: Deck
  onAbrir: () => void
  onEditar: () => void
  onExcluir: () => void
}

// UC02 - card de um deck na grid de /decks. Clicar no card navega para
// /decks/:id; o menu de opcoes (editar/excluir) fica num DropdownMenu
// que nao deve propagar o clique para o card.
export function DeckCard({ deck, onAbrir, onEditar, onExcluir }: DeckCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onAbrir}
      onKeyDown={(evento) => {
        if (evento.key === 'Enter' || evento.key === ' ') {
          onAbrir()
        }
      }}
      className="cursor-pointer transition-shadow hover:shadow-md"
    >
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="min-w-0">
          <CardTitle className="truncate">{deck.titulo}</CardTitle>
          {deck.descricao && <CardDescription className="mt-1 line-clamp-2">{deck.descricao}</CardDescription>}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="-mr-2 -mt-1 shrink-0"
              onClick={(evento) => evento.stopPropagation()}
              aria-label="Opções do deck"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(evento) => evento.stopPropagation()}>
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
      <CardContent>
        <Badge variant="secondary" className="gap-1">
          <Layers className="h-3 w-3" />
          {deck.totalFlashcards} flashcard{deck.totalFlashcards === 1 ? '' : 's'}
        </Badge>
      </CardContent>
    </Card>
  )
}

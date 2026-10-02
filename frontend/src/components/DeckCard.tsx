import { Layers, Library, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import type { Deck } from '@/api/deckApi'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { aoAtivarComTeclado, Monograma } from '@/components/Monograma'

interface DeckCardProps {
  deck: Deck
  onAbrir: () => void
  onEditar: () => void
  onExcluir: () => void
}

// UC02 - card de um deck na grid de /decks. Clicar no card (ou Enter/Espaco
// com foco nele) navega para /decks/:id; o menu de opcoes (editar/excluir)
// fica num DropdownMenu que nao propaga o clique para o card.
export function DeckCard({ deck, onAbrir, onEditar, onExcluir }: DeckCardProps) {
  return (
    <Card
      interactive
      role="link"
      tabIndex={0}
      aria-label={`Abrir deck ${deck.titulo}`}
      onClick={onAbrir}
      onKeyDown={aoAtivarComTeclado(onAbrir)}
      className="group flex flex-col p-5"
    >
      <div className="flex items-start gap-3.5">
        <Monograma texto={deck.titulo} />
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="line-clamp-2 font-semibold leading-snug text-foreground">{deck.titulo}</h3>
          {deck.descricao ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{deck.descricao}</p>
          ) : (
            <p className="mt-1 text-sm italic text-ink-500">Sem descrição</p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="-mr-2 -mt-1 shrink-0 text-ink-500"
              onClick={(evento) => evento.stopPropagation()}
              aria-label={`Opções do deck ${deck.titulo}`}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(evento) => evento.stopPropagation()}>
            <DropdownMenuItem onClick={onEditar}>
              <Pencil />
              Editar deck
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onExcluir} className="text-danger-700 focus:bg-danger-50 focus:text-danger-800 [&>svg]:text-danger-600">
              <Trash2 />
              Excluir deck
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-ink-100 pt-4 text-sm text-ink-600">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Layers className="h-4 w-4 text-ink-500" />
          <span className="font-semibold tabular-nums text-foreground">{deck.totalFlashcards}</span>
          flashcard{deck.totalFlashcards === 1 ? '' : 's'}
        </span>
        {deck.colecaoNome && (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Library className="h-4 w-4 shrink-0 text-ink-500" />
            <span className="truncate">{deck.colecaoNome}</span>
          </span>
        )}
      </div>
    </Card>
  )
}

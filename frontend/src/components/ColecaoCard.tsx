import { Layers, MoreVertical, Pencil, Trash2 } from 'lucide-react'

import type { Colecao } from '@/api/colecaoApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ColecaoCardProps {
  colecao: Colecao
  onAbrir: () => void
  onEditar: () => void
  onExcluir: () => void
}

// UC33 - card de uma coleção na grid de /colecoes. Mesmo padrão de DeckCard:
// clicar no card navega para o detalhe, o menu de opções fica num
// DropdownMenu que não propaga o clique para o card.
export function ColecaoCard({ colecao, onAbrir, onEditar, onExcluir }: ColecaoCardProps) {
  return (
    <Card
      interactive
      role="button"
      tabIndex={0}
      onClick={onAbrir}
      onKeyDown={(evento) => {
        if (evento.key === 'Enter' || evento.key === ' ') {
          onAbrir()
        }
      }}
    >
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="min-w-0">
          <CardTitle className="truncate">{colecao.nome}</CardTitle>
          {colecao.descricao && <CardDescription className="mt-1 line-clamp-2">{colecao.descricao}</CardDescription>}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="-mr-2 -mt-1 shrink-0"
              onClick={(evento) => evento.stopPropagation()}
              aria-label="Opções da coleção"
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
          {colecao.totalDecks} deck{colecao.totalDecks === 1 ? '' : 's'}
        </Badge>
      </CardContent>
    </Card>
  )
}

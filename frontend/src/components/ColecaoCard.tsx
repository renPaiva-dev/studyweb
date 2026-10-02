import { Layers, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import type { Colecao } from '@/api/colecaoApi'
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

interface ColecaoCardProps {
  colecao: Colecao
  onAbrir: () => void
  onEditar: () => void
  onExcluir: () => void
}

// UC33 - card de uma coleção na grid de /colecoes. Mesmo padrão de DeckCard:
// clicar no card navega para o detalhe, o menu de opções fica num
// DropdownMenu que não propaga o clique para o card. O "empilhado" atras do
// card lembra uma pilha de cadernos - uma coleção agrupa decks.
export function ColecaoCard({ colecao, onAbrir, onEditar, onExcluir }: ColecaoCardProps) {
  return (
    <div className="relative pt-2">
      <div className="absolute inset-x-4 top-0 h-4 rounded-t-xl border border-b-0 border-ink-200 bg-ink-100" aria-hidden="true" />
      <Card
        interactive
        role="link"
        tabIndex={0}
        aria-label={`Abrir coleção ${colecao.nome}`}
        onClick={onAbrir}
        onKeyDown={aoAtivarComTeclado(onAbrir)}
        className="relative flex flex-col p-5"
      >
        <div className="flex items-start gap-3.5">
          <Monograma texto={colecao.nome} />
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="line-clamp-2 font-semibold leading-snug text-foreground">{colecao.nome}</h3>
            {colecao.descricao ? (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{colecao.descricao}</p>
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
                aria-label={`Opções da coleção ${colecao.nome}`}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(evento) => evento.stopPropagation()}>
              <DropdownMenuItem onClick={onEditar}>
                <Pencil />
                Editar coleção
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onExcluir} className="text-danger-700 focus:bg-danger-50 focus:text-danger-800 [&>svg]:text-danger-600">
                <Trash2 />
                Excluir coleção
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-5 flex items-center gap-1.5 border-t border-ink-100 pt-4 text-sm font-medium text-ink-600">
          <Layers className="h-4 w-4 text-ink-500" />
          <span className="font-semibold tabular-nums text-foreground">{colecao.totalDecks}</span>
          deck{colecao.totalDecks === 1 ? '' : 's'}
        </div>
      </Card>
    </div>
  )
}

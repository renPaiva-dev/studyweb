import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { atualizarDeck, criarDeck, type Deck } from '@/api/deckApi'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DeckFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deckParaEditar: Deck | null
  onSalvo: () => void
}

// UC02 - formulario de criar/editar deck (Dialog do shadcn). POST/PUT
// /api/decks (docs/contrato-api.md). E1: titulo vazio bloqueia envio.
export function DeckFormDialog({ open, onOpenChange, deckParaEditar, onSalvo }: DeckFormDialogProps) {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [erroTitulo, setErroTitulo] = useState<string | undefined>()
  const [enviando, setEnviando] = useState(false)

  const editando = deckParaEditar !== null

  // Reseta o formulario quando o dialog transiciona de fechado para
  // aberto (idioma React: ajustar estado durante a renderizacao ao
  // detectar mudanca de prop, em vez de um useEffect so para isso).
  const [estavaAberto, setEstavaAberto] = useState(open)
  if (open !== estavaAberto) {
    setEstavaAberto(open)

    if (open) {
      setTitulo(deckParaEditar?.titulo ?? '')
      setDescricao(deckParaEditar?.descricao ?? '')
      setErroTitulo(undefined)
    }
  }

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()

    if (!titulo.trim()) {
      setErroTitulo('O título é obrigatório.')
      return
    }

    setEnviando(true)

    try {
      const dados = { titulo: titulo.trim(), descricao: descricao.trim() }

      if (editando) {
        await atualizarDeck(deckParaEditar.id, dados)
        toast.success('Deck atualizado.')
      } else {
        await criarDeck(dados)
        toast.success('Deck criado.')
      }

      onOpenChange(false)
      onSalvo()
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível salvar o deck. Tente novamente.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar deck' : 'Novo deck'}</DialogTitle>
          <DialogDescription>
            {editando ? 'Atualize o título e a descrição do deck.' : 'Organize seus estudos criando um novo deck.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={aoSubmeter} noValidate>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                placeholder="Ex.: Anatomia — Sistema Nervoso"
                value={titulo}
                onChange={(evento) => setTitulo(evento.target.value)}
                aria-invalid={Boolean(erroTitulo)}
                autoFocus
              />
              {erroTitulo && <p className="text-sm text-destructive">{erroTitulo}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                placeholder="Opcional"
                value={descricao}
                onChange={(evento) => setDescricao(evento.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="submit" disabled={enviando}>
              {enviando ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

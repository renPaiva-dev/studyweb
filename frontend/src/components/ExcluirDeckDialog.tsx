import { useState } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { excluirDeck, type Deck } from '@/api/deckApi'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ExcluirDeckDialogProps {
  deck: Deck | null
  onOpenChange: (open: boolean) => void
  onExcluido: () => void
}

// UC02 (A2) / RN13 - exclusao de deck exige confirmacao e remove em
// cascata flashcards, materiais e historico. DELETE /api/decks/{id}.
export function ExcluirDeckDialog({ deck, onOpenChange, onExcluido }: ExcluirDeckDialogProps) {
  const [excluindo, setExcluindo] = useState(false)

  // Mantem o ultimo deck exibido durante a animacao de fechamento do
  // AlertDialog: o pai zera `deck` assim que a exclusao e confirmada, mas
  // o conteudo ainda fica montado por alguns ms enquanto o Radix anima o
  // fade-out - sem isso, o titulo pisca vazio nesse intervalo. Ajuste de
  // estado durante a renderizacao (idioma React), em vez de useEffect.
  const [deckExibido, setDeckExibido] = useState<Deck | null>(deck)
  if (deck && deck !== deckExibido) {
    setDeckExibido(deck)
  }

  async function confirmar() {
    if (!deck) {
      return
    }

    setExcluindo(true)

    try {
      await excluirDeck(deck.id)
      toast.success(`Deck "${deck.titulo}" excluído.`)
      onOpenChange(false)
      onExcluido()
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível excluir o deck. Tente novamente.'))
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <AlertDialog open={deck !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir "{deckExibido?.titulo}"?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. Todos os flashcards, materiais enviados e o histórico de revisões deste
            deck serão excluídos permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(evento) => {
              evento.preventDefault()
              void confirmar()
            }}
            disabled={excluindo}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {excluindo ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

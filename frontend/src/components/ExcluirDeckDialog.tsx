import { useState } from 'react'
import { toast } from 'sonner'

import { excluirDeck, type Deck } from '@/api/deckApi'
import { ConfirmacaoDestrutivaDialog } from '@/components/ConfirmacaoDestrutivaDialog'

interface ExcluirDeckDialogProps {
  deck: Deck | null
  onOpenChange: (open: boolean) => void
  onExcluido: () => void
}

// UC02 (A2) / RN13 - exclusao de deck exige confirmacao e remove em
// cascata flashcards, materiais e historico. DELETE /api/decks/{id}.
export function ExcluirDeckDialog({ deck, onOpenChange, onExcluido }: ExcluirDeckDialogProps) {
  // Mantem o ultimo deck exibido durante a animacao de fechamento do
  // AlertDialog: o pai zera `deck` assim que a exclusao e confirmada, mas
  // o conteudo ainda fica montado por alguns ms enquanto o Radix anima o
  // fade-out - sem isso, o titulo pisca vazio nesse intervalo. Ajuste de
  // estado durante a renderizacao (idioma React), em vez de useEffect.
  const [deckExibido, setDeckExibido] = useState<Deck | null>(deck)
  if (deck && deck !== deckExibido) {
    setDeckExibido(deck)
  }

  return (
    <ConfirmacaoDestrutivaDialog
      aberto={deck !== null}
      onOpenChange={onOpenChange}
      titulo={`Excluir "${deckExibido?.titulo}"?`}
      descricao={
        <>
          Essa ação não pode ser desfeita. <strong className="font-semibold text-foreground">Todos os flashcards</strong>,
          materiais enviados e o histórico de revisões deste deck serão excluídos permanentemente.
        </>
      }
      rotuloConfirmar="Excluir deck"
      mensagemErroPadrao="Não foi possível excluir o deck. Tente novamente."
      onConfirmar={async () => {
        if (!deck) return
        await excluirDeck(deck.id)
        toast.success(`Deck "${deck.titulo}" excluído.`)
        onOpenChange(false)
        onExcluido()
      }}
    />
  )
}

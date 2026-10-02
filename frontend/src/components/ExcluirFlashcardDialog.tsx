import { useState } from 'react'
import { toast } from 'sonner'

import { excluirFlashcard, type Flashcard } from '@/api/flashcardApi'
import { ConfirmacaoDestrutivaDialog } from '@/components/ConfirmacaoDestrutivaDialog'

interface ExcluirFlashcardDialogProps {
  flashcard: Flashcard | null
  onOpenChange: (open: boolean) => void
  onExcluido: () => void
}

// UC05 (A2) - exclusao de flashcard exige confirmacao (boas praticas de
// frontend, secao 4). DELETE /api/flashcards/{id} -> 204, revisoes
// associadas removidas em cascata (docs/contrato-api.md).
export function ExcluirFlashcardDialog({ flashcard, onOpenChange, onExcluido }: ExcluirFlashcardDialogProps) {
  // Mantem o ultimo flashcard exibido durante a animacao de fechamento do
  // AlertDialog: o pai zera `flashcard` assim que a exclusao e confirmada,
  // mas o conteudo ainda fica montado por alguns ms enquanto o Radix anima
  // o fade-out - sem isso, o titulo pisca vazio nesse intervalo.
  const [flashcardExibido, setFlashcardExibido] = useState<Flashcard | null>(flashcard)
  if (flashcard && flashcard !== flashcardExibido) {
    setFlashcardExibido(flashcard)
  }

  return (
    <ConfirmacaoDestrutivaDialog
      aberto={flashcard !== null}
      onOpenChange={onOpenChange}
      titulo="Excluir flashcard?"
      descricao={
        <>
          Essa ação não pode ser desfeita. <span className="font-medium text-foreground">“{flashcardExibido?.pergunta}”</span> e
          todo o histórico de revisões associado a ele serão excluídos permanentemente.
        </>
      }
      rotuloConfirmar="Excluir flashcard"
      mensagemErroPadrao="Não foi possível excluir o flashcard. Tente novamente."
      onConfirmar={async () => {
        if (!flashcard) return
        await excluirFlashcard(flashcard.id)
        toast.success('Flashcard excluído.')
        onOpenChange(false)
        onExcluido()
      }}
    />
  )
}

import { useState } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { excluirFlashcard, type Flashcard } from '@/api/flashcardApi'
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

interface ExcluirFlashcardDialogProps {
  flashcard: Flashcard | null
  onOpenChange: (open: boolean) => void
  onExcluido: () => void
}

// UC05 (A2) - exclusao de flashcard exige confirmacao (boas praticas de
// frontend, secao 4). DELETE /api/flashcards/{id} -> 204, revisoes
// associadas removidas em cascata (docs/contrato-api.md).
export function ExcluirFlashcardDialog({ flashcard, onOpenChange, onExcluido }: ExcluirFlashcardDialogProps) {
  const [excluindo, setExcluindo] = useState(false)

  // Mantem o ultimo flashcard exibido durante a animacao de fechamento do
  // AlertDialog: o pai zera `flashcard` assim que a exclusao e confirmada,
  // mas o conteudo ainda fica montado por alguns ms enquanto o Radix anima
  // o fade-out - sem isso, o titulo pisca vazio nesse intervalo. Ajuste de
  // estado durante a renderizacao (idioma React), em vez de useEffect.
  const [flashcardExibido, setFlashcardExibido] = useState<Flashcard | null>(flashcard)
  if (flashcard && flashcard !== flashcardExibido) {
    setFlashcardExibido(flashcard)
  }

  async function confirmar() {
    if (!flashcard) {
      return
    }

    setExcluindo(true)

    try {
      await excluirFlashcard(flashcard.id)
      toast.success('Flashcard excluído.')
      onOpenChange(false)
      onExcluido()
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível excluir o flashcard. Tente novamente.'))
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <AlertDialog open={flashcard !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir flashcard?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. "{flashcardExibido?.pergunta}" e todo o histórico de revisões associado
            a ele serão excluídos permanentemente.
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

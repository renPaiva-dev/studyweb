import { useState } from 'react'
import { toast } from 'sonner'

import { excluirColecao, type Colecao } from '@/api/colecaoApi'
import { extrairMensagemErro } from '@/api/apiError'
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

interface ExcluirColecaoDialogProps {
  colecao: Colecao | null
  onOpenChange: (open: boolean) => void
  onExcluida: () => void
}

// UC33 (A2) / RN42 - excluir uma coleção não exclui os decks nela contidos,
// apenas remove o vínculo. DELETE /api/colecoes/{id}.
export function ExcluirColecaoDialog({ colecao, onOpenChange, onExcluida }: ExcluirColecaoDialogProps) {
  const [excluindo, setExcluindo] = useState(false)

  // Mesmo truque de ExcluirDeckDialog: mantem o ultimo item exibido durante
  // a animacao de fechamento do AlertDialog.
  const [colecaoExibida, setColecaoExibida] = useState<Colecao | null>(colecao)
  if (colecao && colecao !== colecaoExibida) {
    setColecaoExibida(colecao)
  }

  async function confirmar() {
    if (!colecao) {
      return
    }

    setExcluindo(true)

    try {
      await excluirColecao(colecao.id)
      toast.success(`Coleção "${colecao.nome}" excluída.`)
      onOpenChange(false)
      onExcluida()
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível excluir a coleção. Tente novamente.'))
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <AlertDialog open={colecao !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir "{colecaoExibida?.nome}"?</AlertDialogTitle>
          <AlertDialogDescription>
            Os decks desta coleção não serão excluídos — apenas deixarão de pertencer a ela.
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

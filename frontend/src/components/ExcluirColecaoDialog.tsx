import { useState } from 'react'
import { toast } from 'sonner'

import { excluirColecao, type Colecao } from '@/api/colecaoApi'
import { ConfirmacaoDestrutivaDialog } from '@/components/ConfirmacaoDestrutivaDialog'

interface ExcluirColecaoDialogProps {
  colecao: Colecao | null
  onOpenChange: (open: boolean) => void
  onExcluida: () => void
}

// UC33 (A2) / RN42 - excluir uma coleção não exclui os decks nela contidos,
// apenas remove o vínculo. DELETE /api/colecoes/{id}.
export function ExcluirColecaoDialog({ colecao, onOpenChange, onExcluida }: ExcluirColecaoDialogProps) {
  // Mesmo truque de ExcluirDeckDialog: mantem o ultimo item exibido durante
  // a animacao de fechamento do AlertDialog.
  const [colecaoExibida, setColecaoExibida] = useState<Colecao | null>(colecao)
  if (colecao && colecao !== colecaoExibida) {
    setColecaoExibida(colecao)
  }

  return (
    <ConfirmacaoDestrutivaDialog
      aberto={colecao !== null}
      onOpenChange={onOpenChange}
      titulo={`Excluir "${colecaoExibida?.nome}"?`}
      descricao="Os decks desta coleção não serão excluídos, apenas deixarão de pertencer a ela."
      rotuloConfirmar="Excluir coleção"
      mensagemErroPadrao="Não foi possível excluir a coleção. Tente novamente."
      onConfirmar={async () => {
        if (!colecao) return
        await excluirColecao(colecao.id)
        toast.success(`Coleção "${colecao.nome}" excluída.`)
        onOpenChange(false)
        onExcluida()
      }}
    />
  )
}

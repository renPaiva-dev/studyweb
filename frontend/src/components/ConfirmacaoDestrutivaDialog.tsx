import { Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { extrairMensagemErro } from '@/api/apiError'
import { Alerta } from '@/components/ui/alerta'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface ConfirmacaoDestrutivaDialogProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  titulo: ReactNode
  descricao: ReactNode
  rotuloConfirmar?: string
  /** Mensagem caso onConfirmar lance e o backend nao mande uma propria. */
  mensagemErroPadrao: string
  /** Deve lancar em caso de falha - o erro aparece inline, sem fechar. */
  onConfirmar: () => Promise<void>
}

// Confirmacao padrao de acao irreversivel (boas praticas de frontend, secao
// 4 / RN13): icone de alerta, consequencia explicita, botao vermelho com
// loading e erro inline - o dialogo so fecha quando a acao deu certo.
export function ConfirmacaoDestrutivaDialog({
  aberto,
  onOpenChange,
  titulo,
  descricao,
  rotuloConfirmar = 'Excluir',
  mensagemErroPadrao,
  onConfirmar,
}: ConfirmacaoDestrutivaDialogProps) {
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [estavaAberto, setEstavaAberto] = useState(aberto)
  if (aberto !== estavaAberto) {
    setEstavaAberto(aberto)
    if (aberto) setErro(null)
  }

  async function confirmar() {
    setProcessando(true)
    setErro(null)

    try {
      await onConfirmar()
    } catch (erroCapturado) {
      setErro(extrairMensagemErro(erroCapturado, mensagemErroPadrao))
    } finally {
      setProcessando(false)
    }
  }

  return (
    <AlertDialog open={aberto} onOpenChange={(proximo) => !processando && onOpenChange(proximo)}>
      <AlertDialogContent>
        <AlertDialogHeader className="sm:flex-row sm:items-start sm:gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-danger-100 text-danger-600 ring-4 ring-danger-50">
            <Trash2 className="h-5 w-5" />
          </span>
          <div className="min-w-0 space-y-1.5">
            <AlertDialogTitle className="break-words">{titulo}</AlertDialogTitle>
            <AlertDialogDescription>{descricao}</AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        {erro && <Alerta variante="erro">{erro}</Alerta>}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={processando}>Cancelar</AlertDialogCancel>
          <Button variant="destructive" loading={processando} onClick={() => void confirmar()}>
            {processando ? 'Excluindo...' : rotuloConfirmar}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

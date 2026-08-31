import { Check, Copy, Link2, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import {
  ativarCompartilhamento,
  buscarStatusCompartilhamento,
  revogarCompartilhamento,
} from '@/api/compartilhamentoApi'
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
import { Skeleton } from '@/components/ui/skeleton'

interface DeckParaCompartilhar {
  id: number
  titulo: string
}

interface CompartilharDeckDialogProps {
  deck: DeckParaCompartilhar | null
  onOpenChange: (open: boolean) => void
}

// UC29 - Compartilhar deck via link publico somente leitura. GET/POST/DELETE
// /api/decks/{id}/compartilhamento (docs/contrato-api.md).
export function CompartilharDeckDialog({ deck, onOpenChange }: CompartilharDeckDialogProps) {
  const [token, setToken] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const carregarStatus = useCallback(async () => {
    if (!deck) {
      return
    }

    setCarregando(true)

    try {
      const status = await buscarStatusCompartilhamento(deck.id)
      setToken(status.token)
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível carregar o status de compartilhamento.'))
    } finally {
      setCarregando(false)
    }
  }, [deck])

  useEffect(() => {
    setToken(null)
    setCopiado(false)
    void carregarStatus()
  }, [carregarStatus])

  async function aoAtivar() {
    if (!deck) {
      return
    }

    setProcessando(true)

    try {
      const status = await ativarCompartilhamento(deck.id)
      setToken(status.token)
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível gerar o link de compartilhamento.'))
    } finally {
      setProcessando(false)
    }
  }

  async function aoRevogar() {
    if (!deck) {
      return
    }

    setProcessando(true)

    try {
      await revogarCompartilhamento(deck.id)
      setToken(null)
      toast.success('Compartilhamento desativado.')
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível desativar o compartilhamento.'))
    } finally {
      setProcessando(false)
    }
  }

  async function aoCopiarLink() {
    if (!token) {
      return
    }

    await navigator.clipboard.writeText(linkCompleto(token))
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <Dialog open={deck !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartilhar "{deck?.titulo}"</DialogTitle>
          <DialogDescription>
            Gere um link público para que qualquer pessoa possa visualizar os flashcards deste deck, sem precisar
            criar conta. Quem acessa não pode editar nem duplicar o deck.
          </DialogDescription>
        </DialogHeader>

        {carregando && <Skeleton className="h-10 w-full" />}

        {!carregando && token !== null && (
          <div className="flex items-center gap-2">
            <Input readOnly value={linkCompleto(token)} className="font-mono text-xs" />
            <Button type="button" variant="outline" size="icon" onClick={() => void aoCopiarLink()} aria-label="Copiar link">
              {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        )}

        {!carregando && token === null && (
          <p className="text-sm text-muted-foreground">Este deck ainda não tem um link de compartilhamento ativo.</p>
        )}

        <DialogFooter>
          {token !== null ? (
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => void aoRevogar()}
              disabled={processando || carregando}
            >
              {processando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Desativar compartilhamento
            </Button>
          ) : (
            <Button type="button" onClick={() => void aoAtivar()} disabled={processando || carregando}>
              {processando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
              Gerar link de compartilhamento
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function linkCompleto(token: string) {
  return `${window.location.origin}/compartilhado/${token}`
}

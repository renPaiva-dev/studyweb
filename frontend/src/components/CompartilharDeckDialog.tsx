import { Check, Copy, Globe, Link2, Lock } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import {
  ativarCompartilhamento,
  buscarStatusCompartilhamento,
  revogarCompartilhamento,
} from '@/api/compartilhamentoApi'
import { Alerta } from '@/components/ui/alerta'
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
  const [erro, setErro] = useState<string | null>(null)

  const deckId = deck?.id

  const carregarStatus = useCallback(async () => {
    if (deckId === undefined) {
      return
    }

    setCarregando(true)

    try {
      const status = await buscarStatusCompartilhamento(deckId)
      setToken(status.token)
    } catch (erro) {
      setErro(extrairMensagemErro(erro, 'Não foi possível carregar o status de compartilhamento.'))
    } finally {
      setCarregando(false)
    }
    // deckId (primitivo) em vez de deck (objeto) - DeckDetalhePage passa um
    // objeto literal novo a cada render, o que faria este efeito refazer o
    // fetch e resetar o link exibido mesmo sem o deck ter mudado de fato.
  }, [deckId])

  useEffect(() => {
    setToken(null)
    setCopiado(false)
    setErro(null)
    void carregarStatus()
  }, [carregarStatus])

  async function aoAtivar() {
    if (!deck) {
      return
    }

    setProcessando(true)
    setErro(null)

    try {
      const status = await ativarCompartilhamento(deck.id)
      setToken(status.token)
      toast.success('Link público criado.', { description: 'Copie e envie para quem quiser estudar com você.' })
    } catch (erro) {
      setErro(extrairMensagemErro(erro, 'Não foi possível gerar o link de compartilhamento.'))
    } finally {
      setProcessando(false)
    }
  }

  async function aoRevogar() {
    if (!deck) {
      return
    }

    setProcessando(true)
    setErro(null)

    try {
      await revogarCompartilhamento(deck.id)
      setToken(null)
      toast.success('Compartilhamento desativado.')
    } catch (erro) {
      setErro(extrairMensagemErro(erro, 'Não foi possível desativar o compartilhamento.'))
    } finally {
      setProcessando(false)
    }
  }

  async function aoCopiarLink() {
    if (!token) {
      return
    }

    try {
      await navigator.clipboard.writeText(linkCompleto(token))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      setErro('Não foi possível copiar automaticamente. Selecione o link e copie manualmente.')
    }
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

        {carregando && <Skeleton className="h-[88px] w-full rounded-lg" />}

        {!carregando && token !== null && (
          <div className="space-y-2 rounded-lg border border-success-200 bg-success-50 p-3">
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-success-800">
              <Globe className="h-4 w-4" />
              Link público ativo
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="link-compartilhamento" className="sr-only">
                Link de compartilhamento
              </label>
              <Input
                id="link-compartilhamento"
                readOnly
                value={linkCompleto(token)}
                onFocus={(evento) => evento.currentTarget.select()}
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant={copiado ? 'positivo' : 'secondary'}
                onClick={() => void aoCopiarLink()}
                aria-label={copiado ? 'Link copiado' : 'Copiar link'}
                className="shrink-0"
              >
                {copiado ? <Check /> : <Copy />}
                <span className="hidden sm:inline">{copiado ? 'Copiado!' : 'Copiar'}</span>
              </Button>
            </div>
            <p className="sr-only" aria-live="polite">
              {copiado ? 'Link copiado para a área de transferência.' : ''}
            </p>
          </div>
        )}

        {!carregando && token === null && (
          <div className="flex items-start gap-3 rounded-lg border border-ink-200 bg-ink-50 p-3 text-sm text-ink-700">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" />
            Este deck é privado. Nenhum link de compartilhamento está ativo.
          </div>
        )}

        {erro && <Alerta variante="erro">{erro}</Alerta>}

        <DialogFooter>
          {token !== null ? (
            <Button
              type="button"
              variant="destructive-ghost"
              onClick={() => void aoRevogar()}
              loading={processando}
              disabled={carregando}
            >
              Desativar link
            </Button>
          ) : (
            <Button type="button" onClick={() => void aoAtivar()} loading={processando} disabled={carregando}>
              <Link2 />
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

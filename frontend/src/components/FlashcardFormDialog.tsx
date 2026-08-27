import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { atualizarFlashcard, criarFlashcard, type Flashcard } from '@/api/flashcardApi'
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
import { Textarea } from '@/components/ui/textarea'

interface FlashcardFormDialogProps {
  deckId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  flashcardParaEditar: Flashcard | null
  onSalvo: () => void
}

// UC05 - criar/editar flashcard manualmente (Dialog do shadcn). UC06 -
// mnemonico opcional. POST /api/decks/{id}/flashcards ou PUT
// /api/flashcards/{id} (docs/contrato-api.md). E1: pergunta/resposta
// vazias bloqueiam o envio.
export function FlashcardFormDialog({ deckId, open, onOpenChange, flashcardParaEditar, onSalvo }: FlashcardFormDialogProps) {
  const [pergunta, setPergunta] = useState('')
  const [resposta, setResposta] = useState('')
  const [mnemonico, setMnemonico] = useState('')
  const [erros, setErros] = useState<{ pergunta?: string; resposta?: string }>({})
  const [enviando, setEnviando] = useState(false)

  const editando = flashcardParaEditar !== null

  // Reseta o formulario quando o dialog transiciona de fechado para
  // aberto (idioma React: ajustar estado durante a renderizacao ao
  // detectar mudanca de prop, em vez de um useEffect so para isso).
  const [estavaAberto, setEstavaAberto] = useState(open)
  if (open !== estavaAberto) {
    setEstavaAberto(open)

    if (open) {
      setPergunta(flashcardParaEditar?.pergunta ?? '')
      setResposta(flashcardParaEditar?.resposta ?? '')
      setMnemonico(flashcardParaEditar?.mnemonico ?? '')
      setErros({})
    }
  }

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()

    const proximosErros: { pergunta?: string; resposta?: string } = {}
    if (!pergunta.trim()) proximosErros.pergunta = 'A pergunta é obrigatória.'
    if (!resposta.trim()) proximosErros.resposta = 'A resposta é obrigatória.'

    if (Object.keys(proximosErros).length > 0) {
      setErros(proximosErros)
      return
    }

    setEnviando(true)

    try {
      const dados = {
        pergunta: pergunta.trim(),
        resposta: resposta.trim(),
        mnemonico: mnemonico.trim() || undefined,
      }

      if (editando) {
        await atualizarFlashcard(flashcardParaEditar.id, dados)
        toast.success('Flashcard atualizado.')
      } else {
        await criarFlashcard(deckId, dados)
        toast.success('Flashcard criado.')
      }

      onOpenChange(false)
      onSalvo()
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível salvar o flashcard. Tente novamente.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar flashcard' : 'Novo flashcard'}</DialogTitle>
          <DialogDescription>
            {editando
              ? 'Atualize a pergunta, a resposta e o mnemônico deste flashcard.'
              : 'Crie um flashcard manualmente para este deck.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={aoSubmeter} noValidate>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pergunta">Pergunta</Label>
              <Textarea
                id="pergunta"
                placeholder="Ex.: Qual é a função do neurônio motor?"
                value={pergunta}
                onChange={(evento) => setPergunta(evento.target.value)}
                aria-invalid={Boolean(erros.pergunta)}
                autoFocus
              />
              {erros.pergunta && <p className="text-sm text-destructive">{erros.pergunta}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="resposta">Resposta</Label>
              <Textarea
                id="resposta"
                placeholder="Ex.: Transmitir impulsos do sistema nervoso central aos músculos."
                value={resposta}
                onChange={(evento) => setResposta(evento.target.value)}
                aria-invalid={Boolean(erros.resposta)}
              />
              {erros.resposta && <p className="text-sm text-destructive">{erros.resposta}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mnemonico">Mnemônico</Label>
              <Input
                id="mnemonico"
                placeholder="Opcional"
                value={mnemonico}
                onChange={(evento) => setMnemonico(evento.target.value)}
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

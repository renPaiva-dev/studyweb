import { Lightbulb } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { atualizarFlashcard, criarFlashcard, type Flashcard } from '@/api/flashcardApi'
import { Alerta } from '@/components/ui/alerta'
import { Button } from '@/components/ui/button'
import { Campo } from '@/components/ui/campo'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useValidacao } from '@/hooks/useValidacao'

interface FlashcardFormDialogProps {
  deckId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  flashcardParaEditar: Flashcard | null
  onSalvo: () => void
}

// UC05 - criar/editar flashcard manualmente (Dialog do shadcn). UC06 -
// mnemonico opcional. RN17 - topico opcional; reenviado na edicao para o
// PUT nao apagar o topico gerado pela IA. POST /api/decks/{id}/flashcards ou PUT
// /api/flashcards/{id} (docs/contrato-api.md). E1: pergunta/resposta
// vazias bloqueiam o envio.
export function FlashcardFormDialog({ deckId, open, onOpenChange, flashcardParaEditar, onSalvo }: FlashcardFormDialogProps) {
  const [pergunta, setPergunta] = useState('')
  const [resposta, setResposta] = useState('')
  const [mnemonico, setMnemonico] = useState('')
  const [topico, setTopico] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  const validacao = useValidacao({
    pergunta: () => (!pergunta.trim() ? 'A pergunta é obrigatória.' : undefined),
    resposta: () => (!resposta.trim() ? 'A resposta é obrigatória.' : undefined),
  })

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
      setTopico(flashcardParaEditar?.topico ?? '')
      setErroEnvio(null)
      validacao.resetar()
    }
  }

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()

    if (enviando) {
      return
    }

    setErroEnvio(null)

    if (!validacao.validarTudo()) {
      return
    }

    setEnviando(true)

    try {
      const dados = {
        pergunta: pergunta.trim(),
        resposta: resposta.trim(),
        mnemonico: mnemonico.trim() || undefined,
        topico: topico.trim() || undefined,
      }

      if (editando) {
        await atualizarFlashcard(flashcardParaEditar.id, dados)
        toast.success('Flashcard atualizado.')
      } else {
        await criarFlashcard(deckId, dados)
        toast.success('Flashcard criado.', { description: 'Ele já entra na sua próxima fila de estudo.' })
      }

      onOpenChange(false)
      onSalvo()
    } catch (erro) {
      setErroEnvio(extrairMensagemErro(erro, 'Não foi possível salvar o flashcard. Tente novamente.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(aberto) => !enviando && onOpenChange(aberto)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar flashcard' : 'Novo flashcard'}</DialogTitle>
          <DialogDescription>
            {editando
              ? 'Atualize a pergunta, a resposta, o mnemônico e o tópico deste flashcard.'
              : 'Escreva a pergunta como você gostaria de ser testado na prova.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={aoSubmeter} noValidate className="space-y-5">
          <Campo id="pergunta" rotulo="Pergunta" erro={validacao.erro('pergunta')}>
            <Textarea
              placeholder="Ex.: Qual é a função do neurônio motor?"
              value={pergunta}
              onChange={(evento) => setPergunta(evento.target.value)}
              autoFocus
              rows={2}
              {...validacao.propsCampo('pergunta')}
            />
          </Campo>
          <Campo id="resposta" rotulo="Resposta" erro={validacao.erro('resposta')}>
            <Textarea
              placeholder="Ex.: Transmitir impulsos do sistema nervoso central aos músculos."
              value={resposta}
              onChange={(evento) => setResposta(evento.target.value)}
              rows={3}
              {...validacao.propsCampo('resposta')}
            />
          </Campo>
          <Campo
            id="mnemonico"
            rotulo={
              <span className="inline-flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4 text-brand-700" aria-hidden="true" />
                Mnemônico
              </span>
            }
            opcional
            dica="Uma dica curta para lembrar. Só aparece depois que você vira o card."
          >
            <Input placeholder="Ex.: Motor = Movimento" value={mnemonico} onChange={(evento) => setMnemonico(evento.target.value)} />
          </Campo>
          <Campo
            id="topico"
            rotulo="Tópico"
            opcional
            dica="Agrupa o card no painel por tópico e na prontidão para a prova."
          >
            <Input
              placeholder="Ex.: Sistema nervoso"
              value={topico}
              maxLength={60}
              onChange={(evento) => setTopico(evento.target.value)}
            />
          </Campo>

          {erroEnvio && <Alerta variante="erro">{erroEnvio}</Alerta>}

          <DialogFooter className="pt-1">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={enviando}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" loading={enviando}>
              {enviando ? 'Salvando...' : 'Salvar flashcard'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

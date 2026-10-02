import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { listarColecoes, type Colecao } from '@/api/colecaoApi'
import { atualizarDeck, criarDeck, type Deck } from '@/api/deckApi'
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
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useValidacao } from '@/hooks/useValidacao'

const SEM_COLECAO = 'nenhuma'

interface DeckFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deckParaEditar: Deck | null
  onSalvo: () => void
}

// UC02 - formulario de criar/editar deck (Dialog do shadcn). POST/PUT
// /api/decks (docs/contrato-api.md). E1: titulo vazio bloqueia envio.
export function DeckFormDialog({ open, onOpenChange, deckParaEditar, onSalvo }: DeckFormDialogProps) {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [colecaoId, setColecaoId] = useState<number | null>(null)
  const [colecoes, setColecoes] = useState<Colecao[]>([])
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  const validacao = useValidacao({
    titulo: () => (!titulo.trim() ? 'O título é obrigatório.' : undefined),
  })

  const editando = deckParaEditar !== null

  // RN42/UC33 - lista de coleções para o seletor; carrega sempre que o
  // dialog abre (uma coleção pode ter sido criada desde a última abertura).
  useEffect(() => {
    if (!open) {
      return
    }

    listarColecoes()
      .then(setColecoes)
      .catch(() => setColecoes([]))
  }, [open])

  // Reseta o formulario quando o dialog transiciona de fechado para
  // aberto (idioma React: ajustar estado durante a renderizacao ao
  // detectar mudanca de prop, em vez de um useEffect so para isso).
  const [estavaAberto, setEstavaAberto] = useState(open)
  if (open !== estavaAberto) {
    setEstavaAberto(open)

    if (open) {
      setTitulo(deckParaEditar?.titulo ?? '')
      setDescricao(deckParaEditar?.descricao ?? '')
      setColecaoId(deckParaEditar?.colecaoId ?? null)
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
      const dados = { titulo: titulo.trim(), descricao: descricao.trim(), colecaoId }

      if (editando) {
        await atualizarDeck(deckParaEditar.id, dados)
        toast.success('Deck atualizado.')
      } else {
        await criarDeck(dados)
        toast.success(`Deck "${dados.titulo}" criado.`, { description: 'Abra o deck para adicionar flashcards ou enviar um PDF.' })
      }

      onOpenChange(false)
      onSalvo()
    } catch (erro) {
      setErroEnvio(extrairMensagemErro(erro, 'Não foi possível salvar o deck. Tente novamente.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(aberto) => !enviando && onOpenChange(aberto)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar deck' : 'Novo deck'}</DialogTitle>
          <DialogDescription>
            {editando ? 'Atualize o título, a descrição ou a coleção do deck.' : 'Um deck reúne os flashcards de um tema de estudo.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={aoSubmeter} noValidate className="space-y-5">
          <Campo id="titulo" rotulo="Título" erro={validacao.erro('titulo')}>
            <Input
              placeholder="Ex.: Anatomia — Sistema Nervoso"
              value={titulo}
              onChange={(evento) => setTitulo(evento.target.value)}
              autoFocus
              {...validacao.propsCampo('titulo')}
            />
          </Campo>
          <Campo id="descricao" rotulo="Descrição" opcional>
            <Input
              placeholder="Do que trata este deck?"
              value={descricao}
              onChange={(evento) => setDescricao(evento.target.value)}
            />
          </Campo>
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-2">
              <Label htmlFor="colecao">Coleção</Label>
              <span className="text-xs font-medium text-ink-500">Opcional</span>
            </div>
            <Select
              value={colecaoId !== null ? String(colecaoId) : SEM_COLECAO}
              onValueChange={(valor) => setColecaoId(valor === SEM_COLECAO ? null : Number(valor))}
            >
              <SelectTrigger id="colecao">
                <SelectValue placeholder="Nenhuma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_COLECAO}>Nenhuma</SelectItem>
                {colecoes.map((colecao) => (
                  <SelectItem key={colecao.id} value={String(colecao.id)}>
                    {colecao.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {erroEnvio && <Alerta variante="erro">{erroEnvio}</Alerta>}

          <DialogFooter className="pt-1">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={enviando}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" loading={enviando}>
              {enviando ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

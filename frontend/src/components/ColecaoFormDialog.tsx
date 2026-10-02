import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { atualizarColecao, criarColecao, type Colecao } from '@/api/colecaoApi'
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
import { useValidacao } from '@/hooks/useValidacao'

interface ColecaoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  colecaoParaEditar: Colecao | null
  onSalvo: () => void
}

// UC33 - formulario de criar/editar coleção (Dialog do shadcn). POST/PUT
// /api/colecoes (docs/contrato-api.md). Nome vazio bloqueia envio.
export function ColecaoFormDialog({ open, onOpenChange, colecaoParaEditar, onSalvo }: ColecaoFormDialogProps) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  const validacao = useValidacao({
    nome: () => (!nome.trim() ? 'O nome é obrigatório.' : undefined),
  })

  const editando = colecaoParaEditar !== null

  // Reseta o formulario quando o dialog transiciona de fechado para
  // aberto (mesmo idioma de DeckFormDialog).
  const [estavaAberto, setEstavaAberto] = useState(open)
  if (open !== estavaAberto) {
    setEstavaAberto(open)

    if (open) {
      setNome(colecaoParaEditar?.nome ?? '')
      setDescricao(colecaoParaEditar?.descricao ?? '')
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
      const dados = { nome: nome.trim(), descricao: descricao.trim() }

      if (editando) {
        await atualizarColecao(colecaoParaEditar.id, dados)
        toast.success('Coleção atualizada.')
      } else {
        await criarColecao(dados)
        toast.success(`Coleção "${dados.nome}" criada.`, { description: 'Edite um deck para colocá-lo nesta coleção.' })
      }

      onOpenChange(false)
      onSalvo()
    } catch (erro) {
      setErroEnvio(extrairMensagemErro(erro, 'Não foi possível salvar a coleção. Tente novamente.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(aberto) => !enviando && onOpenChange(aberto)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar coleção' : 'Nova coleção'}</DialogTitle>
          <DialogDescription>
            {editando
              ? 'Atualize o nome e a descrição da coleção.'
              : 'Agrupe decks relacionados sob um mesmo rótulo (ex.: “Medicina”).'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={aoSubmeter} noValidate className="space-y-5">
          <Campo id="nome" rotulo="Nome" erro={validacao.erro('nome')}>
            <Input
              placeholder="Ex.: Medicina"
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
              autoFocus
              {...validacao.propsCampo('nome')}
            />
          </Campo>
          <Campo id="descricao" rotulo="Descrição" opcional>
            <Input
              placeholder="O que esta coleção reúne?"
              value={descricao}
              onChange={(evento) => setDescricao(evento.target.value)}
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
              {enviando ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

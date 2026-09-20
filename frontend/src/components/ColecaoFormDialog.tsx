import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { atualizarColecao, criarColecao, type Colecao } from '@/api/colecaoApi'
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
  const [erroNome, setErroNome] = useState<string | undefined>()
  const [enviando, setEnviando] = useState(false)

  const editando = colecaoParaEditar !== null

  // Reseta o formulario quando o dialog transiciona de fechado para
  // aberto (mesmo idioma de DeckFormDialog).
  const [estavaAberto, setEstavaAberto] = useState(open)
  if (open !== estavaAberto) {
    setEstavaAberto(open)

    if (open) {
      setNome(colecaoParaEditar?.nome ?? '')
      setDescricao(colecaoParaEditar?.descricao ?? '')
      setErroNome(undefined)
    }
  }

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()

    if (!nome.trim()) {
      setErroNome('O nome é obrigatório.')
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
        toast.success('Coleção criada.')
      }

      onOpenChange(false)
      onSalvo()
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível salvar a coleção. Tente novamente.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar coleção' : 'Nova coleção'}</DialogTitle>
          <DialogDescription>
            {editando
              ? 'Atualize o nome e a descrição da coleção.'
              : 'Agrupe decks relacionados sob um mesmo rótulo (ex.: "Medicina").'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={aoSubmeter} noValidate>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                placeholder="Ex.: Medicina"
                value={nome}
                onChange={(evento) => setNome(evento.target.value)}
                aria-invalid={Boolean(erroNome)}
                autoFocus
              />
              {erroNome && <p className="text-sm text-destructive">{erroNome}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                placeholder="Opcional"
                value={descricao}
                onChange={(evento) => setDescricao(evento.target.value)}
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

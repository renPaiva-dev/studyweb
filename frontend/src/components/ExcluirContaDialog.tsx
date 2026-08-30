import { AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { excluirConta } from '@/api/usuarioApi'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'

const PALAVRA_CONFIRMACAO = 'EXCLUIR'

// UC25/RN32 (LGPD, direito ao esquecimento) - DELETE /api/usuario/conta
// (docs/contrato-api.md, secao "Exclusao de Conta - LGPD"). Irreversivel:
// exige senha atual + digitar "EXCLUIR" antes de habilitar o botao final,
// para nao ser acionavel por um clique unico acidental.
export function ExcluirContaDialog() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [aberto, setAberto] = useState(false)
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const podeExcluir = senha.length > 0 && confirmacao === PALAVRA_CONFIRMACAO && !excluindo

  function aoAbrirMudar(abrindo: boolean) {
    setAberto(abrindo)
    if (!abrindo) {
      setSenha('')
      setConfirmacao('')
      setErro(null)
    }
  }

  async function aoConfirmar() {
    setErro(null)
    setExcluindo(true)

    try {
      await excluirConta(senha)
      toast.success('Sua conta foi excluída permanentemente.')
      logout()
      navigate('/login')
    } catch (erroCapturado) {
      setErro(extrairMensagemErro(erroCapturado, 'Não foi possível excluir sua conta.'))
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <AlertDialog open={aberto} onOpenChange={aoAbrirMudar}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Excluir minha conta</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertDialogTitle>Excluir conta permanentemente</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Esta ação é irreversível. Todos os seus decks, flashcards, revisões e resultados de quizzes serão
            removidos permanentemente. Digite sua senha e a palavra <strong>{PALAVRA_CONFIRMACAO}</strong> para
            confirmar.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senhaExclusao">Senha</Label>
            <Input
              id="senhaExclusao"
              type="password"
              className="h-10"
              autoComplete="current-password"
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmacaoExclusao">
              Digite <strong>{PALAVRA_CONFIRMACAO}</strong> para confirmar
            </Label>
            <Input
              id="confirmacaoExclusao"
              className="h-10"
              value={confirmacao}
              onChange={(evento) => setConfirmacao(evento.target.value)}
            />
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
          <Button variant="destructive" disabled={!podeExcluir} onClick={aoConfirmar}>
            {excluindo ? 'Excluindo...' : 'Excluir permanentemente'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

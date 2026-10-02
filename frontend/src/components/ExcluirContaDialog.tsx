import { AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { excluirConta } from '@/api/usuarioApi'
import { Alerta } from '@/components/ui/alerta'
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
import { Campo } from '@/components/ui/campo'
import { Input, PasswordInput } from '@/components/ui/input'
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

  const palavraCorreta = confirmacao === PALAVRA_CONFIRMACAO
  const podeExcluir = senha.length > 0 && palavraCorreta && !excluindo

  function aoAbrirMudar(abrindo: boolean) {
    if (excluindo) return
    setAberto(abrindo)
    if (!abrindo) {
      setSenha('')
      setConfirmacao('')
      setErro(null)
    }
  }

  async function aoConfirmar() {
    if (!podeExcluir) return
    setErro(null)
    setExcluindo(true)

    try {
      await excluirConta(senha)
      toast.success('Sua conta foi excluída permanentemente.', { description: 'Sentiremos sua falta. Volte quando quiser.' })
      logout()
      navigate('/login')
    } catch (erroCapturado) {
      setErro(extrairMensagemErro(erroCapturado, 'Não foi possível excluir sua conta. Confira a senha e tente novamente.'))
      requestAnimationFrame(() => document.getElementById('senhaExclusao')?.focus())
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
        <AlertDialogHeader className="sm:flex-row sm:items-start sm:gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-danger-100 text-danger-600 ring-4 ring-danger-50">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="space-y-1.5">
            <AlertDialogTitle>Excluir conta permanentemente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todos os seus decks, flashcards, revisões e resultados de quizzes serão
              removidos para sempre. Digite sua senha e a palavra <strong className="text-foreground">{PALAVRA_CONFIRMACAO}</strong>{' '}
              para confirmar.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        <form
          className="space-y-4"
          onSubmit={(evento) => {
            evento.preventDefault()
            void aoConfirmar()
          }}
        >
          <Campo id="senhaExclusao" rotulo="Sua senha">
            <PasswordInput
              autoComplete="current-password"
              value={senha}
              onChange={(evento) => {
                setSenha(evento.target.value)
                setErro(null)
              }}
              {...(erro ? { 'aria-invalid': true } : {})}
            />
          </Campo>
          <Campo
            id="confirmacaoExclusao"
            rotulo={
              <>
                Digite <strong className="font-mono text-danger-700">{PALAVRA_CONFIRMACAO}</strong> para confirmar
              </>
            }
            dica={confirmacao.length > 0 && !palavraCorreta ? 'Digite exatamente EXCLUIR, em letras maiúsculas.' : undefined}
          >
            <Input
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="font-mono tracking-wider"
              value={confirmacao}
              onChange={(evento) => setConfirmacao(evento.target.value)}
            />
          </Campo>

          {erro && <Alerta variante="erro">{erro}</Alerta>}

          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={excluindo}>
              Cancelar
            </AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={!podeExcluir} loading={excluindo}>
              {excluindo ? 'Excluindo...' : 'Excluir permanentemente'}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

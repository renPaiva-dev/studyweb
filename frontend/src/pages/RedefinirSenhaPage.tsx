import { KeyRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { redefinirSenha } from '@/api/authApi'
import { extrairMensagemErro } from '@/api/apiError'
import { AuthBackgroundDecor } from '@/components/AuthBackgroundDecor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggleButton } from '@/components/ThemeToggleButton'
import { MENSAGEM_SENHA_FORTE, senhaEhForte } from '@/utils/senhaForte'

interface Erros {
  token?: string
  novaSenha?: string
}

// UC18 - Redefinir senha. POST /api/auth/redefinir-senha
// (docs/contrato-api.md). O token normalmente chega por e-mail (RN24); como
// nao ha envio real configurado por padrao (EmailService cai no log em
// desenvolvimento), o campo aceita colar o token manualmente alem de vir
// pre-preenchido via querystring (?token=...) se disponivel.
export function RedefinirSenhaPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [token, setToken] = useState(searchParams.get('token') ?? '')
  const [novaSenha, setNovaSenha] = useState('')
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)

  function validar(): boolean {
    const novosErros: Erros = {}

    if (!token.trim()) {
      novosErros.token = 'Informe o token recebido.'
    }

    if (!senhaEhForte(novaSenha)) {
      novosErros.novaSenha = MENSAGEM_SENHA_FORTE
    }

    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()

    if (!validar()) {
      return
    }

    setEnviando(true)

    try {
      await redefinirSenha(token.trim(), novaSenha)
      toast.success('Senha redefinida com sucesso. Faça login com a nova senha.')
      navigate('/login')
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível redefinir sua senha. Verifique o token e tente novamente.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FCF8EF] px-4 dark:bg-background">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggleButton />
      </div>

      <AuthBackgroundDecor />

      <Card className="relative w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 border-t-4 border-t-primary shadow-xl duration-500">
        <CardHeader className="items-center text-center">
          <span className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-coral-300/30">
            <KeyRound className="h-8 w-8" />
          </span>
          <CardTitle className="font-heading text-3xl">Redefinir senha</CardTitle>
          <CardDescription>Informe o token recebido e a nova senha</CardDescription>
        </CardHeader>
        <form onSubmit={aoSubmeter} noValidate>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Token</Label>
              <Input
                id="token"
                className="h-10"
                placeholder="Cole aqui o token recebido"
                value={token}
                onChange={(evento) => setToken(evento.target.value)}
                aria-invalid={Boolean(erros.token)}
              />
              {erros.token && <p className="text-sm text-destructive">{erros.token}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova senha</Label>
              <Input
                id="novaSenha"
                type="password"
                className="h-10"
                placeholder="••••••••"
                autoComplete="new-password"
                value={novaSenha}
                onChange={(evento) => setNovaSenha(evento.target.value)}
                aria-invalid={Boolean(erros.novaSenha)}
              />
              {erros.novaSenha && <p className="text-sm text-destructive">{erros.novaSenha}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando ? 'Redefinindo...' : 'Redefinir senha'}
            </Button>
          </CardContent>
        </form>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">
            Voltar para o login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

import { isAxiosError } from 'axios'
import { GraduationCap } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { AuthSplitLayout } from '@/components/AuthSplitLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Erros {
  email?: string
  senha?: string
}

// UC01 - Fazer login. POST /api/auth/login (docs/contrato-api.md).
export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)
  const [emailNaoVerificado, setEmailNaoVerificado] = useState(false)

  function validar(): boolean {
    const novosErros: Erros = {}

    if (!EMAIL_REGEX.test(email)) {
      novosErros.email = 'Informe um e-mail válido.'
    }

    if (senha.length < 6) {
      novosErros.senha = 'A senha deve ter no mínimo 6 caracteres.'
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
    setEmailNaoVerificado(false)

    try {
      await login(email, senha)
      navigate('/')
    } catch (erro) {
      // 401 (RN: credenciais invalidas) e demais falhas caem no mesmo
      // tratamento amigavel - nunca expor o JSON cru do erro. 403 e o caso
      // especifico de RN26 (e-mail ainda nao confirmado), que oferece um
      // atalho para reenviar a confirmacao em vez de so um toast de erro.
      if (isAxiosError(erro) && erro.response?.status === 403) {
        setEmailNaoVerificado(true)
      }

      toast.error(extrairMensagemErro(erro, 'E-mail ou senha inválidos.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthSplitLayout>
      <Card className="w-full max-w-sm border-t-4 border-t-primary">
        <CardHeader className="items-center text-center">
          <span className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-manilha/40">
            <GraduationCap className="h-8 w-8" />
          </span>
          <CardTitle className="font-heading text-3xl">Entrar</CardTitle>
          <CardDescription>Acesse sua conta para continuar estudando</CardDescription>
        </CardHeader>
        <form onSubmit={aoSubmeter} noValidate>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                className="h-10"
                placeholder="voce@email.com"
                autoComplete="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                aria-invalid={Boolean(erros.email)}
              />
              {erros.email && <p className="text-sm text-destructive">{erros.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                className="h-10"
                placeholder="••••••••"
                autoComplete="current-password"
                value={senha}
                onChange={(evento) => setSenha(evento.target.value)}
                aria-invalid={Boolean(erros.senha)}
              />
              {erros.senha && <p className="text-sm text-destructive">{erros.senha}</p>}
              <div className="text-right">
                <Link to="/esqueci-senha" className="text-sm text-muted-foreground hover:text-primary hover:underline">
                  Esqueci minha senha
                </Link>
              </div>
            </div>
            {emailNaoVerificado && (
              <p className="text-center text-sm text-muted-foreground">
                <Link
                  to={`/verificar-email?email=${encodeURIComponent(email)}`}
                  className="font-medium text-primary hover:underline"
                >
                  Reenviar e-mail de confirmação
                </Link>
              </p>
            )}
            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando ? 'Entrando...' : 'Entrar'}
            </Button>
          </CardContent>
        </form>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="ml-1 font-medium text-primary hover:underline">
            Cadastre-se
          </Link>
        </CardFooter>
      </Card>
    </AuthSplitLayout>
  )
}

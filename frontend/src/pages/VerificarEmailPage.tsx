import { MailCheck } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { extrairMensagemErro } from '@/api/apiError'
import { reenviarVerificacao, verificarEmail } from '@/api/authApi'
import { AuthBackgroundDecor } from '@/components/AuthBackgroundDecor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggleButton } from '@/components/ThemeToggleButton'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Estado = 'verificando' | 'verificado' | 'token-invalido' | 'reenviar' | 'reenviado'

// UC21 - Verificar e-mail de cadastro. POST /api/auth/verificar-email e
// POST /api/auth/reenviar-verificacao (docs/contrato-api.md). RN26: toda
// conta criada (UC01) permanece bloqueada para login ate confirmar a posse
// do e-mail - o link enviado por e-mail traz ?token=... e esta tela chama a
// API automaticamente; sem token (ex.: usuario acabou de se cadastrar ou
// perdeu o e-mail), mostra o formulario de reenvio.
export function VerificarEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [estado, setEstado] = useState<Estado>(token ? 'verificando' : 'reenviar')
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [erroEmail, setErroEmail] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!token) {
      return
    }

    verificarEmail(token)
      .then((resposta) => {
        setMensagem(resposta.mensagem)
        setEstado('verificado')
      })
      .catch((erro) => {
        setMensagem(extrairMensagemErro(erro, 'Não foi possível confirmar seu e-mail. O link pode ter expirado.'))
        setEstado('token-invalido')
      })
  }, [token])

  async function aoReenviar(evento: FormEvent) {
    evento.preventDefault()

    if (!EMAIL_REGEX.test(email)) {
      setErroEmail('Informe um e-mail válido.')
      return
    }

    setErroEmail(null)
    setEnviando(true)

    try {
      const resposta = await reenviarVerificacao(email)
      setMensagem(resposta.mensagem)
    } catch {
      // RN26 (mesmo racional anti-enumeração de RN24): nao ha mensagem de
      // erro diferenciada a mostrar aqui.
      setMensagem('Se este e-mail estiver cadastrado e ainda não confirmado, enviamos um novo link de confirmação.')
    } finally {
      setEnviando(false)
      setEstado('reenviado')
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
            <MailCheck className="h-8 w-8" />
          </span>
          <CardTitle className="font-heading text-3xl">Confirme seu e-mail</CardTitle>
          {estado === 'reenviar' && (
            <CardDescription>Enviamos um link de confirmação para o seu e-mail ao criar a conta</CardDescription>
          )}
        </CardHeader>

        {estado === 'verificando' && (
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">Confirmando seu e-mail...</p>
          </CardContent>
        )}

        {estado === 'verificado' && (
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">{mensagem}</p>
            <Button asChild className="w-full">
              <Link to="/login">Ir para o login</Link>
            </Button>
          </CardContent>
        )}

        {estado === 'token-invalido' && (
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-destructive">{mensagem}</p>
            <form onSubmit={aoReenviar} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Reenviar confirmação para</Label>
                <Input
                  id="email"
                  type="email"
                  className="h-10"
                  placeholder="voce@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value)}
                  aria-invalid={Boolean(erroEmail)}
                />
                {erroEmail && <p className="text-sm text-destructive">{erroEmail}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={enviando}>
                {enviando ? 'Enviando...' : 'Reenviar e-mail de confirmação'}
              </Button>
            </form>
          </CardContent>
        )}

        {estado === 'reenviar' && (
          <form onSubmit={aoReenviar} noValidate>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Não recebeu? Reenviar para</Label>
                <Input
                  id="email"
                  type="email"
                  className="h-10"
                  placeholder="voce@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value)}
                  aria-invalid={Boolean(erroEmail)}
                />
                {erroEmail && <p className="text-sm text-destructive">{erroEmail}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={enviando}>
                {enviando ? 'Enviando...' : 'Reenviar e-mail de confirmação'}
              </Button>
            </CardContent>
          </form>
        )}

        {estado === 'reenviado' && (
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">{mensagem}</p>
          </CardContent>
        )}

        <CardFooter className="justify-center text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">
            Voltar para o login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

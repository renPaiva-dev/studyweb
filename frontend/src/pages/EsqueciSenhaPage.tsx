import { KeyRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { esqueciSenha } from '@/api/authApi'
import { AuthBackgroundDecor } from '@/components/AuthBackgroundDecor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggleButton } from '@/components/ThemeToggleButton'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// UC18 - Esqueci minha senha. POST /api/auth/esqueci-senha
// (docs/contrato-api.md). RN24: a resposta e sempre a mesma mensagem
// generica, exista ou nao o e-mail na base - por isso a tela so mostra essa
// mensagem apos o envio, nunca um erro de "e-mail nao encontrado".
export function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [erroEmail, setErroEmail] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()

    if (!EMAIL_REGEX.test(email)) {
      setErroEmail('Informe um e-mail válido.')
      return
    }

    setErroEmail(null)
    setEnviando(true)

    try {
      const resposta = await esqueciSenha(email)
      setMensagem(resposta.mensagem)
    } catch {
      // RN24: mesmo em erro de rede/servidor, nao ha uma mensagem
      // diferenciada a mostrar aqui sem arriscar revelar se o e-mail existe -
      // a mensagem generica de sucesso e o unico estado "final" desta tela.
      setMensagem('Se o e-mail existir em nossa base, você receberá instruções de redefinição.')
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
          <CardTitle className="font-heading text-3xl">Esqueci minha senha</CardTitle>
          <CardDescription>Informe seu e-mail para receber instruções de redefinição</CardDescription>
        </CardHeader>

        {mensagem !== null ? (
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">{mensagem}</p>
          </CardContent>
        ) : (
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
                  aria-invalid={Boolean(erroEmail)}
                />
                {erroEmail && <p className="text-sm text-destructive">{erroEmail}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={enviando}>
                {enviando ? 'Enviando...' : 'Enviar instruções'}
              </Button>
            </CardContent>
          </form>
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

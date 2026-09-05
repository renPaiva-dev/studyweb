import { KeyRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { esqueciSenha } from '@/api/authApi'
import { AuthSplitLayout } from '@/components/AuthSplitLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// UC18 - Esqueci minha senha. POST /api/auth/esqueci-senha
// (docs/contrato-api.md). RN24: a resposta e sempre a mesma mensagem
// generica, exista ou nao o e-mail cadastrado - por isso a tela so mostra
// essa mensagem apos o envio, nunca um erro de "e-mail nao encontrado".
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
      setMensagem('Se este e-mail estiver cadastrado, enviamos um link para redefinir sua senha.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthSplitLayout>
      <Card className="w-full max-w-sm border-t-4 border-t-primary">
        <CardHeader className="items-center text-center">
          <span className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-manilha/40">
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
    </AuthSplitLayout>
  )
}

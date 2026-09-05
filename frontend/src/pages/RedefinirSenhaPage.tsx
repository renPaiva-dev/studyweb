import { KeyRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { redefinirSenha } from '@/api/authApi'
import { extrairMensagemErro } from '@/api/apiError'
import { AuthSplitLayout } from '@/components/AuthSplitLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MENSAGEM_SENHA_FORTE, senhaEhForte } from '@/utils/senhaForte'

interface Erros {
  token?: string
  novaSenha?: string
}

// UC18 - Redefinir senha. POST /api/auth/redefinir-senha
// (docs/contrato-api.md). O fluxo normal e o usuario clicar no link do
// e-mail (RN24) e cair aqui direto com ?token=... na URL - nesse caso o
// token nunca aparece na tela, so o formulario de nova senha (mesma
// experiencia de Google/GitHub/Dropbox: token grande e seguro, mas invisivel
// pro usuario). O campo manual so existe como fallback para quando nao ha
// token na URL - ex.: modo desenvolvimento, onde EmailService cai no log em
// vez de enviar de verdade, e o usuario cola o token lido do log.
export function RedefinirSenhaPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const tokenDaUrl = searchParams.get('token')
  const tokenVeioDoLink = Boolean(tokenDaUrl)

  const [token, setToken] = useState(tokenDaUrl ?? '')
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
    <AuthSplitLayout>
      <Card className="w-full max-w-sm border-t-4 border-t-primary">
        <CardHeader className="items-center text-center">
          <span className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-manilha/40">
            <KeyRound className="h-8 w-8" />
          </span>
          <CardTitle className="font-heading text-3xl">Redefinir senha</CardTitle>
          <CardDescription>
            {tokenVeioDoLink ? 'Escolha sua nova senha' : 'Informe o token recebido e a nova senha'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={aoSubmeter} noValidate>
          <CardContent className="space-y-4">
            {!tokenVeioDoLink && (
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
            )}
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
    </AuthSplitLayout>
  )
}

import { GraduationCap } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { AuthBackgroundDecor } from '@/components/AuthBackgroundDecor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import { MENSAGEM_SENHA_FORTE, senhaEhForte } from '@/utils/senhaForte'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NOME_USUARIO_REGEX = /^[a-zA-Z0-9]+$/

interface Erros {
  nome?: string
  nomeUsuario?: string
  email?: string
  senha?: string
  termosAceitos?: string
}

// UC01/UC17 - Cadastrar-se, com nome de usuario (docs/contrato-api.md).
// RN02: 409 se o e-mail ja estiver cadastrado. RN22: 409 se o nomeUsuario ja
// estiver cadastrado (mensagem diferenciada, vinda do backend).
export function CadastroPage() {
  const { cadastro } = useAuth()
  const navigate = useNavigate()

  const [nome, setNome] = useState('')
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [termosAceitos, setTermosAceitos] = useState(false)
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)

  function validar(): boolean {
    const novosErros: Erros = {}

    if (!nome.trim()) {
      novosErros.nome = 'Informe seu nome.'
    }

    if (nomeUsuario.length < 3 || nomeUsuario.length > 30) {
      novosErros.nomeUsuario = 'O nome de usuário deve ter entre 3 e 30 caracteres.'
    } else if (!NOME_USUARIO_REGEX.test(nomeUsuario)) {
      novosErros.nomeUsuario = 'Use apenas letras e números, sem espaços.'
    }

    if (!EMAIL_REGEX.test(email)) {
      novosErros.email = 'Informe um e-mail válido.'
    }

    if (!senhaEhForte(senha)) {
      novosErros.senha = MENSAGEM_SENHA_FORTE
    }

    if (!termosAceitos) {
      novosErros.termosAceitos = 'É necessário aceitar os termos de uso para se cadastrar.'
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
      await cadastro(nome.trim(), nomeUsuario, email, senha, termosAceitos)
      // UC01/UC21/RN26: a conta nasce com o e-mail nao verificado - o login
      // so e liberado apos a confirmacao, entao aqui ainda nao ha uma area
      // logada a redirecionar.
      toast.success('Conta criada! Enviamos um link de confirmação para o seu e-mail.')
      navigate(`/verificar-email?email=${encodeURIComponent(email)}`)
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível criar sua conta. Tente novamente.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <AuthBackgroundDecor />

      <Card className="relative w-full max-w-sm border-t-4 border-t-primary">
        <CardHeader className="items-center text-center">
          <span className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-manilha/40">
            <GraduationCap className="h-8 w-8" />
          </span>
          <CardTitle className="font-heading text-3xl">Criar conta</CardTitle>
          <CardDescription>Comece a organizar seus estudos com IA</CardDescription>
        </CardHeader>
        <form onSubmit={aoSubmeter} noValidate>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                className="h-10"
                placeholder="Seu nome"
                autoComplete="name"
                value={nome}
                onChange={(evento) => setNome(evento.target.value)}
                aria-invalid={Boolean(erros.nome)}
              />
              {erros.nome && <p className="text-sm text-destructive">{erros.nome}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomeUsuario">Nome de usuário</Label>
              <Input
                id="nomeUsuario"
                className="h-10"
                placeholder="Seu nome de usuário"
                autoComplete="username"
                value={nomeUsuario}
                onChange={(evento) => setNomeUsuario(evento.target.value)}
                aria-invalid={Boolean(erros.nomeUsuario)}
              />
              {erros.nomeUsuario && <p className="text-sm text-destructive">{erros.nomeUsuario}</p>}
            </div>
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
                autoComplete="new-password"
                value={senha}
                onChange={(evento) => setSenha(evento.target.value)}
                aria-invalid={Boolean(erros.senha)}
              />
              {erros.senha && <p className="text-sm text-destructive">{erros.senha}</p>}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="termosAceitos"
                  className="mt-0.5"
                  checked={termosAceitos}
                  onCheckedChange={(marcado) => setTermosAceitos(marcado === true)}
                  aria-invalid={Boolean(erros.termosAceitos)}
                />
                <Label htmlFor="termosAceitos" className="text-sm font-normal leading-snug text-muted-foreground">
                  Li e concordo com os{' '}
                  <Link to="/termos-de-uso" target="_blank" className="font-medium text-primary hover:underline">
                    Termos de Uso
                  </Link>{' '}
                  e a{' '}
                  <Link to="/politica-de-privacidade" target="_blank" className="font-medium text-primary hover:underline">
                    Política de Privacidade
                  </Link>
                </Label>
              </div>
              {erros.termosAceitos && <p className="text-sm text-destructive">{erros.termosAceitos}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </CardContent>
        </form>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link to="/login" className="ml-1 font-medium text-primary hover:underline">
            Entrar
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

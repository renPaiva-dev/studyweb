import { ArrowLeft, KeyRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { redefinirSenha } from '@/api/authApi'
import { extrairMensagemErro } from '@/api/apiError'
import { AuthSplitLayout } from '@/components/AuthSplitLayout'
import { RequisitosSenha } from '@/components/RequisitosSenha'
import { Alerta } from '@/components/ui/alerta'
import { Button } from '@/components/ui/button'
import { Campo } from '@/components/ui/campo'
import { Input, PasswordInput } from '@/components/ui/input'
import { useValidacao } from '@/hooks/useValidacao'
import { MENSAGEM_SENHA_FORTE, senhaEhForte } from '@/utils/senhaForte'

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
  const [enviando, setEnviando] = useState(false)
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  const validacao = useValidacao({
    token: () => (!token.trim() ? 'Cole o token recebido por e-mail.' : undefined),
    novaSenha: () => (!senhaEhForte(novaSenha) ? MENSAGEM_SENHA_FORTE : undefined),
  })

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()

    if (enviando) {
      return
    }

    setTentouEnviar(true)
    setErroEnvio(null)

    if (!validacao.validarTudo()) {
      return
    }

    setEnviando(true)

    try {
      await redefinirSenha(token.trim(), novaSenha)
      toast.success('Senha redefinida!', { description: 'Agora é só entrar com a nova senha.' })
      navigate('/login')
    } catch (erro) {
      setErroEnvio(extrairMensagemErro(erro, 'Não foi possível redefinir sua senha. O link pode ter expirado. Peça um novo e tente outra vez.'))
    } finally {
      setEnviando(false)
    }
  }

  const erroSenha = validacao.erro('novaSenha')

  return (
    <AuthSplitLayout
      icone={KeyRound}
      titulo="Criar nova senha"
      descricao={tokenVeioDoLink ? 'Escolha uma senha forte que você ainda não usou aqui.' : 'Informe o token recebido e escolha a nova senha.'}
      rodape={
        <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-ink-700 hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar para o login
        </Link>
      }
    >
      <form onSubmit={aoSubmeter} noValidate className="space-y-5">
        {!tokenVeioDoLink && (
          <Campo id="token" rotulo="Token" erro={validacao.erro('token')}>
            <Input
              placeholder="Cole aqui o token recebido"
              spellCheck={false}
              value={token}
              onChange={(evento) => setToken(evento.target.value)}
              {...validacao.propsCampo('token')}
            />
          </Campo>
        )}

        <div className="space-y-2">
          <Campo id="novaSenha" rotulo="Nova senha" erro={erroSenha && !novaSenha ? 'Crie uma nova senha.' : undefined}>
            <PasswordInput
              placeholder="Crie uma senha forte"
              autoComplete="new-password"
              autoFocus={tokenVeioDoLink}
              value={novaSenha}
              onChange={(evento) => setNovaSenha(evento.target.value)}
              aria-describedby="novaSenha-requisitos"
              {...validacao.propsCampo('novaSenha')}
              {...(erroSenha ? { 'aria-invalid': true } : {})}
            />
          </Campo>
          <RequisitosSenha id="novaSenha-requisitos" senha={novaSenha} destacarPendentes={Boolean(erroSenha) && tentouEnviar} />
        </div>

        {erroEnvio && <Alerta variante="erro">{erroEnvio}</Alerta>}

        <Button type="submit" size="lg" className="w-full" loading={enviando}>
          {enviando ? 'Redefinindo...' : 'Redefinir senha'}
        </Button>
      </form>
    </AuthSplitLayout>
  )
}

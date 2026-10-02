import { ArrowRight } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { extrairMensagemErro, statusDoErro } from '@/api/apiError'
import { AuthSplitLayout } from '@/components/AuthSplitLayout'
import { Alerta } from '@/components/ui/alerta'
import { Button } from '@/components/ui/button'
import { Campo } from '@/components/ui/campo'
import { Input, PasswordInput } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { useValidacao } from '@/hooks/useValidacao'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type ErroLogin = { tipo: 'credenciais' | 'nao-verificado' | 'outro'; mensagem: string }

// UC01 - Fazer login. POST /api/auth/login (docs/contrato-api.md).
export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erroLogin, setErroLogin] = useState<ErroLogin | null>(null)
  // Incrementa a cada falha - reanima o alerta mesmo quando a mensagem e a
  // mesma da tentativa anterior (senao o usuario acha que nada aconteceu).
  const [tentativa, setTentativa] = useState(0)
  const senhaRef = useRef<HTMLInputElement>(null)

  const validacao = useValidacao({
    email: () => (!email.trim() ? 'Informe seu e-mail.' : !EMAIL_REGEX.test(email) ? 'Informe um e-mail válido, como nome@email.com.' : undefined),
    senha: () => (!senha ? 'Informe sua senha.' : senha.length < 6 ? 'A senha deve ter no mínimo 6 caracteres.' : undefined),
  })

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()

    if (enviando) {
      return
    }

    setErroLogin(null)

    if (!validacao.validarTudo()) {
      return
    }

    setEnviando(true)

    try {
      await login(email, senha)
      navigate('/inicio')
    } catch (erro) {
      // 401 (credenciais invalidas) vira uma mensagem humana fixa - nunca o
      // texto tecnico do backend; 403 e o caso especifico de RN26 (e-mail
      // ainda nao confirmado), que oferece o atalho de reenvio.
      const status = statusDoErro(erro)

      if (status === 403) {
        setErroLogin({ tipo: 'nao-verificado', mensagem: 'Você precisa confirmar seu e-mail antes de entrar.' })
      } else if (status === 401) {
        setErroLogin({ tipo: 'credenciais', mensagem: 'E-mail ou senha incorretos. Confira os dados e tente novamente.' })
        // Foco de volta na senha, ja selecionada, para redigitar direto.
        requestAnimationFrame(() => {
          senhaRef.current?.focus()
          senhaRef.current?.select()
        })
      } else {
        setErroLogin({
          tipo: 'outro',
          mensagem: extrairMensagemErro(erro, 'Não foi possível entrar agora. Tente novamente em instantes.'),
        })
      }
      setTentativa((atual) => atual + 1)
    } finally {
      setEnviando(false)
    }
  }

  const credenciaisInvalidas = erroLogin?.tipo === 'credenciais'

  return (
    <AuthSplitLayout
      titulo="Bem-vindo de volta"
      descricao="Entre para continuar de onde parou nos seus estudos."
      rodape={
        <>
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="link">
            Criar conta grátis
          </Link>
        </>
      }
    >
      <form onSubmit={aoSubmeter} noValidate className="space-y-5">
        <Campo id="email" rotulo="E-mail" erro={validacao.erro('email')}>
          <Input
            type="email"
            inputMode="email"
            placeholder="voce@email.com"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(evento) => {
              setEmail(evento.target.value)
              setErroLogin(null)
            }}
            {...validacao.propsCampo('email')}
          />
        </Campo>

        <Campo
          id="senha"
          rotulo="Senha"
          erro={validacao.erro('senha')}
          extraRotulo={
            <Link to="/esqueci-senha" className="rounded-sm text-sm font-semibold text-brand-800 hover:text-brand-900 hover:underline">
              Esqueci minha senha
            </Link>
          }
        >
          <PasswordInput
            ref={senhaRef}
            placeholder="Sua senha"
            autoComplete="current-password"
            value={senha}
            onChange={(evento) => {
              setSenha(evento.target.value)
              setErroLogin(null)
            }}
            {...validacao.propsCampo('senha')}
            {...(credenciaisInvalidas ? { 'aria-invalid': true } : {})}
          />
        </Campo>

        {erroLogin && (
          <Alerta
            key={tentativa}
            variante={erroLogin.tipo === 'nao-verificado' ? 'aviso' : 'erro'}
            className={erroLogin.tipo === 'credenciais' ? 'animate-tremor' : undefined}
            titulo={erroLogin.tipo === 'nao-verificado' ? 'E-mail ainda não confirmado' : undefined}
            acao={
              erroLogin.tipo === 'nao-verificado' ? (
                <Link to={`/verificar-email?email=${encodeURIComponent(email)}`} className="font-semibold underline underline-offset-2">
                  Reenviar e-mail de confirmação
                </Link>
              ) : undefined
            }
          >
            {erroLogin.mensagem}
          </Alerta>
        )}

        <Button type="submit" size="lg" className="w-full" loading={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
          {!enviando && <ArrowRight />}
        </Button>
      </form>
    </AuthSplitLayout>
  )
}

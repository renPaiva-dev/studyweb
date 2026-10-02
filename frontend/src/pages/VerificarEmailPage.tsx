import { ArrowLeft, ArrowRight, Loader2, MailCheck } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { extrairMensagemErro } from '@/api/apiError'
import { reenviarVerificacao, verificarEmail } from '@/api/authApi'
import { AuthSplitLayout } from '@/components/AuthSplitLayout'
import { Alerta } from '@/components/ui/alerta'
import { Button } from '@/components/ui/button'
import { Campo } from '@/components/ui/campo'
import { Input } from '@/components/ui/input'
import { useValidacao } from '@/hooks/useValidacao'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Estado = 'verificando' | 'verificado' | 'token-invalido' | 'reenviar' | 'reenviado'

const TITULOS: Record<Estado, string> = {
  verificando: 'Confirmando seu e-mail',
  verificado: 'E-mail confirmado!',
  'token-invalido': 'Link inválido ou expirado',
  reenviar: 'Confirme seu e-mail',
  reenviado: 'Link reenviado',
}

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
  const [enviando, setEnviando] = useState(false)

  const validacao = useValidacao({
    email: () => (!email.trim() ? 'Informe seu e-mail.' : !EMAIL_REGEX.test(email) ? 'Informe um e-mail válido, como nome@email.com.' : undefined),
  })

  useEffect(() => {
    if (!token) {
      return
    }

    verificarEmail(token)
      .then((resposta) => {
        setMensagem(resposta.message)
        setEstado('verificado')
      })
      .catch((erro) => {
        setMensagem(extrairMensagemErro(erro, 'Não foi possível confirmar seu e-mail. O link pode ter expirado.'))
        setEstado('token-invalido')
      })
  }, [token])

  async function aoReenviar(evento: FormEvent) {
    evento.preventDefault()

    if (enviando || !validacao.validarTudo()) {
      return
    }

    setEnviando(true)

    try {
      const resposta = await reenviarVerificacao(email)
      setMensagem(resposta.message)
    } catch {
      // RN26 (mesmo racional anti-enumeração de RN24): nao ha mensagem de
      // erro diferenciada a mostrar aqui.
      setMensagem('Se este e-mail estiver cadastrado e ainda não confirmado, enviamos um novo link de confirmação.')
    } finally {
      setEnviando(false)
      setEstado('reenviado')
    }
  }

  const formularioReenvio = (rotulo: string) => (
    <form onSubmit={aoReenviar} noValidate className="space-y-5">
      <Campo id="email" rotulo={rotulo} erro={validacao.erro('email')}>
        <Input
          type="email"
          inputMode="email"
          placeholder="voce@email.com"
          autoComplete="email"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          {...validacao.propsCampo('email')}
        />
      </Campo>
      <Button type="submit" size="lg" className="w-full" loading={enviando}>
        {enviando ? 'Enviando...' : 'Reenviar e-mail de confirmação'}
      </Button>
    </form>
  )

  return (
    <AuthSplitLayout
      icone={MailCheck}
      titulo={TITULOS[estado]}
      descricao={
        estado === 'reenviar'
          ? 'Enviamos um link de confirmação para o seu e-mail. Confirme em até 10 minutos, senão a conta expira e será preciso se cadastrar de novo.'
          : undefined
      }
      rodape={
        <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-ink-700 hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar para o login
        </Link>
      }
    >
      {estado === 'verificando' && (
        <div role="status" className="flex items-center gap-3 rounded-lg border border-ink-200 bg-card p-4 text-sm text-ink-700 shadow-xs">
          <Loader2 className="h-5 w-5 animate-spin text-brand-700" />
          Confirmando seu e-mail, só um instante...
        </div>
      )}

      {estado === 'verificado' && (
        <div className="space-y-5">
          <Alerta variante="sucesso" titulo="Tudo certo">
            {mensagem} Agora você já pode entrar na sua conta.
          </Alerta>
          <Button asChild size="lg" className="w-full">
            <Link to="/login">
              Ir para o login
              <ArrowRight />
            </Link>
          </Button>
        </div>
      )}

      {estado === 'token-invalido' && (
        <div className="space-y-6">
          <Alerta variante="erro">{mensagem}</Alerta>
          {formularioReenvio('Reenviar confirmação para')}
        </div>
      )}

      {estado === 'reenviar' && formularioReenvio('Não recebeu? Reenviar para')}

      {estado === 'reenviado' && (
        <Alerta variante="sucesso" titulo="Confira sua caixa de entrada">
          {mensagem} Não esqueça de olhar a pasta de spam.
        </Alerta>
      )}
    </AuthSplitLayout>
  )
}

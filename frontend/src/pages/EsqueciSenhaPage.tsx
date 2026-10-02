import { ArrowLeft, KeyRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { esqueciSenha } from '@/api/authApi'
import { AuthSplitLayout } from '@/components/AuthSplitLayout'
import { Alerta } from '@/components/ui/alerta'
import { Button } from '@/components/ui/button'
import { Campo } from '@/components/ui/campo'
import { Input } from '@/components/ui/input'
import { useValidacao } from '@/hooks/useValidacao'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// UC18 - Esqueci minha senha. POST /api/auth/esqueci-senha
// (docs/contrato-api.md). RN24: a resposta e sempre a mesma mensagem
// generica, exista ou nao o e-mail cadastrado - por isso a tela so mostra
// essa mensagem apos o envio, nunca um erro de "e-mail nao encontrado".
export function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  const validacao = useValidacao({
    email: () => (!email.trim() ? 'Informe seu e-mail.' : !EMAIL_REGEX.test(email) ? 'Informe um e-mail válido, como nome@email.com.' : undefined),
  })

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()

    if (enviando || !validacao.validarTudo()) {
      return
    }

    setEnviando(true)

    try {
      const resposta = await esqueciSenha(email)
      setMensagem(resposta.message)
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
    <AuthSplitLayout
      icone={KeyRound}
      titulo="Esqueceu a senha?"
      descricao="Sem problema. Informe o e-mail da sua conta e enviaremos um link para criar uma nova."
      rodape={
        <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-ink-700 hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar para o login
        </Link>
      }
    >
      {mensagem !== null ? (
        <div className="space-y-4">
          <Alerta variante="sucesso" titulo="Verifique sua caixa de entrada">
            {mensagem} O link vale por tempo limitado. Confira também a pasta de spam.
          </Alerta>
          <Button variant="outline" className="w-full" onClick={() => setMensagem(null)}>
            Usar outro e-mail
          </Button>
        </div>
      ) : (
        <form onSubmit={aoSubmeter} noValidate className="space-y-5">
          <Campo id="email" rotulo="E-mail" erro={validacao.erro('email')}>
            <Input
              type="email"
              inputMode="email"
              placeholder="voce@email.com"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              {...validacao.propsCampo('email')}
            />
          </Campo>
          <Button type="submit" size="lg" className="w-full" loading={enviando}>
            {enviando ? 'Enviando...' : 'Enviar link de redefinição'}
          </Button>
        </form>
      )}
    </AuthSplitLayout>
  )
}

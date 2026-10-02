import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { extrairMensagemErro, statusDoErro } from '@/api/apiError'
import { AuthSplitLayout } from '@/components/AuthSplitLayout'
import { RequisitosSenha } from '@/components/RequisitosSenha'
import { Alerta } from '@/components/ui/alerta'
import { Button } from '@/components/ui/button'
import { Campo, MensagemErroCampo } from '@/components/ui/campo'
import { Checkbox } from '@/components/ui/checkbox'
import { Input, PasswordInput } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import { useValidacao } from '@/hooks/useValidacao'
import { MENSAGEM_SENHA_FORTE, senhaEhForte } from '@/utils/senhaForte'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NOME_USUARIO_REGEX = /^[a-zA-Z0-9]+$/

// UC01/UC17 - Cadastrar-se, com nome de usuario (docs/contrato-api.md).
// RN22: 409 se o nomeUsuario ja estiver cadastrado (mensagem vinda do
// backend). Se o e-mail ja estiver cadastrado, o backend NAO retorna 409 -
// responde 201 normalmente (sem persistir nada) e avisa o dono real por
// e-mail, para nao revelar a existencia da conta a quem preencheu o
// formulario (achado I1 da auditoria) - por isso o fluxo de sucesso abaixo e
// sempre o mesmo, mesmo quando o cadastro "de verdade" nao aconteceu.
export function CadastroPage() {
  const { cadastro } = useAuth()
  const navigate = useNavigate()

  const [nome, setNome] = useState('')
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [termosAceitos, setTermosAceitos] = useState(false)
  const [telefoneConfirmacao, setTelefoneConfirmacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  const validacao = useValidacao({
    nome: () => (!nome.trim() ? 'Informe seu nome.' : undefined),
    nomeUsuario: () =>
      nomeUsuario.length < 3 || nomeUsuario.length > 30
        ? 'O nome de usuário deve ter entre 3 e 30 caracteres.'
        : !NOME_USUARIO_REGEX.test(nomeUsuario)
          ? 'Use apenas letras e números, sem espaços ou acentos.'
          : undefined,
    email: () => (!email.trim() ? 'Informe seu e-mail.' : !EMAIL_REGEX.test(email) ? 'Informe um e-mail válido, como nome@email.com.' : undefined),
    senha: () => (!senhaEhForte(senha) ? MENSAGEM_SENHA_FORTE : undefined),
    termosAceitos: () => (!termosAceitos ? 'Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.' : undefined),
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
      await cadastro(nome.trim(), nomeUsuario, email, senha, termosAceitos, telefoneConfirmacao)
      // UC01/UC21/RN26: a conta nasce com o e-mail nao verificado - o login
      // so e liberado apos a confirmacao, entao aqui ainda nao ha uma area
      // logada a redirecionar.
      toast.success('Conta criada! Falta só confirmar seu e-mail.', {
        description: 'Enviamos um link de confirmação. Confirme em até 10 minutos, senão a conta expira.',
      })
      navigate(`/verificar-email?email=${encodeURIComponent(email)}`)
    } catch (erro) {
      // RN22: nome de usuario em uso vira erro do proprio campo.
      if (statusDoErro(erro) === 409) {
        validacao.definirErroServidor('nomeUsuario', extrairMensagemErro(erro, 'Este nome de usuário já está em uso. Escolha outro.'))
      } else {
        setErroEnvio(extrairMensagemErro(erro, 'Não foi possível criar sua conta agora. Tente novamente em instantes.'))
      }
    } finally {
      setEnviando(false)
    }
  }

  // A mensagem longa da regra de senha fica redundante com o checklist - so
  // aparece como erro do campo quando o usuario ainda nao digitou nada.
  const erroSenha = validacao.erro('senha')

  return (
    <AuthSplitLayout
      titulo="Crie sua conta"
      descricao="Leva menos de um minuto. Depois é só enviar seu primeiro material."
      rodape={
        <>
          Já tem conta?{' '}
          <Link to="/login" className="link">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={aoSubmeter} noValidate className="space-y-5">
        {/* Honeypot anti-bot (ver Docs/seguranca.md) - nunca visivel/preenchido
            por humanos. Off-screen via CSS (nao display:none/type=hidden, que
            bots simples ignoram) + aria-hidden (leitor de tela pula) +
            tabIndex=-1 (fora da ordem de tab) + autoComplete=off (gerenciador
            de senha nao sugere). */}
        <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <Label htmlFor="telefoneConfirmacao">Telefone</Label>
          <Input
            id="telefoneConfirmacao"
            name="telefoneConfirmacao"
            tabIndex={-1}
            autoComplete="off"
            value={telefoneConfirmacao}
            onChange={(evento) => setTelefoneConfirmacao(evento.target.value)}
          />
        </div>

        <Campo id="nome" rotulo="Nome" erro={validacao.erro('nome')}>
          <Input
            placeholder="Como você quer ser chamado"
            autoComplete="name"
            autoFocus
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            {...validacao.propsCampo('nome')}
          />
        </Campo>

        <Campo
          id="nomeUsuario"
          rotulo="Nome de usuário"
          erro={validacao.erro('nomeUsuario')}
          dica="De 3 a 30 caracteres, só letras e números."
        >
          <Input
            placeholder="ex.: renata2026"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={nomeUsuario}
            onChange={(evento) => {
              setNomeUsuario(evento.target.value)
              validacao.aoEditar('nomeUsuario')
            }}
            {...validacao.propsCampo('nomeUsuario')}
          />
        </Campo>

        <Campo id="email" rotulo="E-mail" erro={validacao.erro('email')}>
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

        <div className="space-y-2">
          <Campo id="senha" rotulo="Senha" erro={erroSenha && !senha ? 'Crie uma senha.' : undefined}>
            <PasswordInput
              placeholder="Crie uma senha forte"
              autoComplete="new-password"
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
              aria-describedby="senha-requisitos"
              {...validacao.propsCampo('senha')}
              {...(erroSenha ? { 'aria-invalid': true } : {})}
            />
          </Campo>
          <RequisitosSenha id="senha-requisitos" senha={senha} destacarPendentes={Boolean(erroSenha) && tentouEnviar} />
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <Checkbox
              id="termosAceitos"
              className="mt-0.5"
              checked={termosAceitos}
              onCheckedChange={(marcado) => {
                setTermosAceitos(marcado === true)
                validacao.marcarTocado('termosAceitos')
              }}
              aria-invalid={validacao.erro('termosAceitos') ? true : undefined}
              aria-describedby={validacao.erro('termosAceitos') ? 'termosAceitos-erro' : undefined}
            />
            <Label htmlFor="termosAceitos" className="text-sm font-normal leading-5 text-ink-700">
              Li e concordo com os{' '}
              <Link to="/termos-de-uso" target="_blank" className="link">
                Termos de Uso
              </Link>{' '}
              e a{' '}
              <Link to="/politica-de-privacidade" target="_blank" className="link">
                Política de Privacidade
              </Link>
            </Label>
          </div>
          {validacao.erro('termosAceitos') && (
            <MensagemErroCampo id="termosAceitos-erro">{validacao.erro('termosAceitos')}</MensagemErroCampo>
          )}
        </div>

        {erroEnvio && (
          <Alerta variante="erro" titulo="Não deu para criar sua conta">
            {erroEnvio}
          </Alerta>
        )}

        <Button type="submit" size="lg" className="w-full" loading={enviando}>
          {enviando ? 'Criando conta...' : 'Criar conta'}
        </Button>
      </form>
    </AuthSplitLayout>
  )
}

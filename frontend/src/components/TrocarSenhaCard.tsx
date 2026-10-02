import { KeyRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { trocarSenha } from '@/api/usuarioApi'
import { RequisitosSenha } from '@/components/RequisitosSenha'
import { SecaoPerfil } from '@/components/SecaoPerfil'
import { Alerta } from '@/components/ui/alerta'
import { Button } from '@/components/ui/button'
import { Campo } from '@/components/ui/campo'
import { PasswordInput } from '@/components/ui/input'
import { useValidacao } from '@/hooks/useValidacao'
import { MENSAGEM_SENHA_FORTE, senhaEhForte } from '@/utils/senhaForte'

// UC26/RN33 - Trocar senha autenticado. PUT /api/usuario/senha
// (docs/contrato-api.md, secao "Trocar Senha"). 400 = senha atual incorreta
// (ou nova fora de RN27) - mostrado inline, no proprio card.
export function TrocarSenhaCard() {
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  const validacao = useValidacao({
    senhaAtual: () => (!senhaAtual ? 'Informe sua senha atual.' : undefined),
    novaSenha: () => (!senhaEhForte(novaSenha) ? MENSAGEM_SENHA_FORTE : undefined),
  })

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()

    if (salvando) {
      return
    }

    setTentouEnviar(true)
    setErroEnvio(null)
    setSucesso(false)

    if (!validacao.validarTudo()) {
      return
    }

    setSalvando(true)

    try {
      await trocarSenha(senhaAtual, novaSenha)
      toast.success('Senha alterada com sucesso.')
      setSucesso(true)
      setSenhaAtual('')
      setNovaSenha('')
      setTentouEnviar(false)
      validacao.resetar()
    } catch (erro) {
      setErroEnvio(extrairMensagemErro(erro, 'Não foi possível alterar sua senha. Confira a senha atual e tente novamente.'))
    } finally {
      setSalvando(false)
    }
  }

  const erroNovaSenha = validacao.erro('novaSenha')

  return (
    <SecaoPerfil icone={KeyRound} titulo="Trocar senha" descricao="Informe sua senha atual para definir uma nova.">
      <form onSubmit={aoSubmeter} noValidate className="space-y-5">
        <Campo id="senhaAtual" rotulo="Senha atual" erro={validacao.erro('senhaAtual')}>
          <PasswordInput
            autoComplete="current-password"
            value={senhaAtual}
            onChange={(evento) => {
              setSenhaAtual(evento.target.value)
              setErroEnvio(null)
              setSucesso(false)
            }}
            {...validacao.propsCampo('senhaAtual')}
          />
        </Campo>
        <div className="space-y-2">
          <Campo id="novaSenha" rotulo="Nova senha" erro={erroNovaSenha && !novaSenha ? 'Crie uma nova senha.' : undefined}>
            <PasswordInput
              autoComplete="new-password"
              value={novaSenha}
              onChange={(evento) => {
                setNovaSenha(evento.target.value)
                setSucesso(false)
              }}
              aria-describedby="novaSenha-requisitos"
              {...validacao.propsCampo('novaSenha')}
              {...(erroNovaSenha ? { 'aria-invalid': true } : {})}
            />
          </Campo>
          {(novaSenha || tentouEnviar) && (
            <RequisitosSenha id="novaSenha-requisitos" senha={novaSenha} destacarPendentes={Boolean(erroNovaSenha) && tentouEnviar} />
          )}
        </div>

        {erroEnvio && <Alerta variante="erro">{erroEnvio}</Alerta>}
        {sucesso && (
          <Alerta variante="sucesso" onFechar={() => setSucesso(false)}>
            Senha alterada. Use a nova senha no próximo login.
          </Alerta>
        )}

        <Button type="submit" variant="secondary" loading={salvando}>
          {salvando ? 'Alterando...' : 'Alterar senha'}
        </Button>
      </form>
    </SecaoPerfil>
  )
}

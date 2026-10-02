import { Download, Mail, ShieldAlert, UserRound } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro, statusDoErro } from '@/api/apiError'
import { atualizarPerfil, buscarPerfil, enviarLembreteTeste, exportarDados, type Perfil } from '@/api/usuarioApi'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { ExcluirContaDialog } from '@/components/ExcluirContaDialog'
import { PreferenciasEstudoCard } from '@/components/PreferenciasEstudoCard'
import { SecaoPerfil } from '@/components/SecaoPerfil'
import { TrocarSenhaCard } from '@/components/TrocarSenhaCard'
import { Alerta } from '@/components/ui/alerta'
import { Button } from '@/components/ui/button'
import { Campo } from '@/components/ui/campo'
import { EstadoErro } from '@/components/ui/estados'
import { Input } from '@/components/ui/input'
import { Carregando, Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import { useValidacao } from '@/hooks/useValidacao'

const NOME_USUARIO_REGEX = /^[a-zA-Z0-9]+$/

// UC19 - Editar perfil. GET/PUT /api/usuario/perfil (docs/contrato-api.md).
// RN22: nomeUsuario e unico - 409 do backend quando ja esta em uso por
// outro usuario e mostrado como erro de validacao do campo nomeUsuario
// (ver aoSubmeter) - achado N11 da auditoria.
export function PerfilPage() {
  const { atualizarUsuarioLocal } = useAuth()

  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)

  const [nome, setNome] = useState('')
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)
  const [exportando, setExportando] = useState(false)
  const [enviandoLembrete, setEnviandoLembrete] = useState(false)

  const validacao = useValidacao({
    nome: () => (!nome.trim() ? 'Informe seu nome.' : undefined),
    nomeUsuario: () =>
      nomeUsuario.length < 3 || nomeUsuario.length > 30
        ? 'O nome de usuário deve ter entre 3 e 30 caracteres.'
        : !NOME_USUARIO_REGEX.test(nomeUsuario)
          ? 'Use apenas letras e números, sem espaços ou acentos.'
          : undefined,
  })

  const carregar = useCallback(async () => {
    setErroCarregamento(null)

    try {
      const dados = await buscarPerfil()
      setPerfil(dados)
      setNome(dados.nome)
      setNomeUsuario(dados.nomeUsuario)
    } catch (erro) {
      setErroCarregamento(extrairMensagemErro(erro, 'Não foi possível carregar seu perfil.'))
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()

    if (salvando) {
      return
    }

    setErroEnvio(null)

    if (!validacao.validarTudo()) {
      return
    }

    setSalvando(true)

    try {
      const atualizado = await atualizarPerfil({ nome: nome.trim(), nomeUsuario })
      setPerfil(atualizado)
      atualizarUsuarioLocal(atualizado)
      toast.success('Perfil atualizado com sucesso.')
    } catch (erro) {
      // RN22: nomeUsuario em uso por outro usuario vira 409 - mostrado como
      // erro do campo (nao so um toast generico, achado N11 da auditoria).
      if (statusDoErro(erro) === 409) {
        validacao.definirErroServidor('nomeUsuario', 'Este nome de usuário já está em uso. Escolha outro.')
      } else {
        setErroEnvio(extrairMensagemErro(erro, 'Não foi possível atualizar seu perfil. Tente novamente.'))
      }
    } finally {
      setSalvando(false)
    }
  }

  // UC24/RN31 (LGPD, acesso/portabilidade) - baixa o JSON completo retornado
  // por GET /api/usuario/exportar-dados como arquivo no navegador.
  async function aoExportar() {
    setExportando(true)

    try {
      const dados = await exportarDados()
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = 'meus-dados-plataforma-estudos.json'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Download iniciado.', { description: 'O arquivo meus-dados-plataforma-estudos.json tem todos os seus dados.' })
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível exportar seus dados.'))
    } finally {
      setExportando(false)
    }
  }

  // UC30/RN39 - dispara o lembrete de revisao pendente para o proprio
  // e-mail, mesmo sem pendencias (util pra conferir que o e-mail chega).
  async function aoTestarLembrete() {
    setEnviandoLembrete(true)

    try {
      await enviarLembreteTeste()
      toast.success('Lembrete enviado!', {
        description: 'Confira seu e-mail (ou o log do backend, em ambiente sem SMTP configurado).',
      })
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível enviar o lembrete de teste.'))
    } finally {
      setEnviandoLembrete(false)
    }
  }

  if (erroCarregamento !== null) {
    return <EstadoErro mensagem={erroCarregamento} onTentarNovamente={() => void carregar()} />
  }

  if (perfil === null) {
    return (
      <Carregando rotulo="Carregando seu perfil..." className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </Carregando>
    )
  }

  const alterado = nome !== perfil.nome || nomeUsuario !== perfil.nomeUsuario

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <CabecalhoPagina titulo="Meu perfil" descricao="Gerencie seus dados de conta, segurança e privacidade." />

      <div className="space-y-5">
        <SecaoPerfil icone={UserRound} titulo="Dados da conta" descricao="E-mail e papel não podem ser alterados por aqui.">
          <form onSubmit={aoSubmeter} noValidate className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Campo id="email" rotulo="E-mail">
                <Input value={perfil.email} disabled />
              </Campo>
              <Campo id="papel" rotulo="Papel">
                <Input value={perfil.papel} disabled />
              </Campo>
              <Campo id="nome" rotulo="Nome" erro={validacao.erro('nome')}>
                <Input
                  autoComplete="name"
                  value={nome}
                  onChange={(evento) => setNome(evento.target.value)}
                  {...validacao.propsCampo('nome')}
                />
              </Campo>
              <Campo id="nomeUsuario" rotulo="Nome de usuário" erro={validacao.erro('nomeUsuario')}>
                <Input
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
            </div>

            {erroEnvio && <Alerta variante="erro">{erroEnvio}</Alerta>}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" variant="secondary" loading={salvando} disabled={!alterado && !salvando}>
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </Button>
              {!alterado && <span className="text-sm text-muted-foreground">Nenhuma alteração pendente.</span>}
            </div>
          </form>
        </SecaoPerfil>

        <TrocarSenhaCard />

        <SecaoPerfil
          icone={Mail}
          titulo="Lembrete de revisão"
          descricao="Todo dia às 8h, avisamos por e-mail quem tem flashcards pendentes de revisão."
        >
          <div className="space-y-3">
            <p className="text-sm text-ink-700">Quer conferir se o e-mail está chegando? Envie um lembrete de teste agora.</p>
            <Button variant="outline" onClick={() => void aoTestarLembrete()} loading={enviandoLembrete}>
              <Mail />
              {enviandoLembrete ? 'Enviando...' : 'Testar meu lembrete agora'}
            </Button>
          </div>
        </SecaoPerfil>

        <PreferenciasEstudoCard />

        <SecaoPerfil icone={Download} titulo="Seus dados (LGPD)" descricao="Baixe uma cópia completa de todos os seus dados pessoais.">
          <div className="space-y-3">
            <p className="text-sm text-ink-700">Você recebe um arquivo JSON com perfil, decks, flashcards, revisões e provas.</p>
            <Button variant="outline" onClick={() => void aoExportar()} loading={exportando}>
              <Download />
              {exportando ? 'Exportando...' : 'Exportar meus dados'}
            </Button>
          </div>
        </SecaoPerfil>

        <SecaoPerfil
          perigo
          icone={ShieldAlert}
          titulo="Zona de risco"
          descricao="Excluir sua conta é permanente e não pode ser desfeito."
        >
          <div className="space-y-3">
            <p className="text-sm text-ink-700">
              Todos os decks, flashcards, materiais, revisões e resultados serão apagados imediatamente.
            </p>
            <ExcluirContaDialog />
          </div>
        </SecaoPerfil>
      </div>
    </div>
  )
}

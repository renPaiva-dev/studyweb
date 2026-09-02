import { Download, Mail } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { atualizarPerfil, buscarPerfil, enviarLembreteTeste, exportarDados, type Perfil } from '@/api/usuarioApi'
import { ExcluirContaDialog } from '@/components/ExcluirContaDialog'
import { TrocarSenhaCard } from '@/components/TrocarSenhaCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'

const NOME_USUARIO_REGEX = /^[a-zA-Z0-9]+$/

interface Erros {
  nome?: string
  nomeUsuario?: string
}

// UC19 - Editar perfil. GET/PUT /api/usuario/perfil (docs/contrato-api.md).
// RN22: nomeUsuario e unico - 409 do backend quando ja esta em uso por
// outro usuario e mostrado como erro de validacao do campo.
export function PerfilPage() {
  const { atualizarUsuarioLocal } = useAuth()

  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)

  const [nome, setNome] = useState('')
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [erros, setErros] = useState<Erros>({})
  const [salvando, setSalvando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [enviandoLembrete, setEnviandoLembrete] = useState(false)

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

    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()

    if (!validar()) {
      return
    }

    setSalvando(true)

    try {
      const atualizado = await atualizarPerfil({ nome: nome.trim(), nomeUsuario })
      setPerfil(atualizado)
      atualizarUsuarioLocal(atualizado)
      toast.success('Perfil atualizado com sucesso.')
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível atualizar seu perfil.'))
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
      toast.success('Lembrete enviado — confira seu e-mail (ou o log do backend, em ambiente sem SMTP configurado).')
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível enviar o lembrete de teste.'))
    } finally {
      setEnviandoLembrete(false)
    }
  }

  if (erroCarregamento !== null) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border py-16 text-center">
        <p className="text-muted-foreground">{erroCarregamento}</p>
        <Button variant="outline" onClick={() => void carregar()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (perfil === null) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meu perfil</h1>
        <p className="text-muted-foreground">Gerencie seus dados de conta</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Dados da conta</CardTitle>
          <CardDescription>E-mail e papel não podem ser alterados por aqui</CardDescription>
        </CardHeader>
        <form onSubmit={aoSubmeter} noValidate>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={perfil.email} disabled className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="papel">Papel</Label>
              <Input id="papel" value={perfil.papel} disabled className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                className="h-10"
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
                value={nomeUsuario}
                onChange={(evento) => setNomeUsuario(evento.target.value)}
                aria-invalid={Boolean(erros.nomeUsuario)}
              />
              {erros.nomeUsuario && <p className="text-sm text-destructive">{erros.nomeUsuario}</p>}
            </div>
            <Button type="submit" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </CardContent>
        </form>
      </Card>

      <TrocarSenhaCard />

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Lembrete de revisão</CardTitle>
          <CardDescription>
            Todo dia às 8h, avisamos por e-mail quem tem flashcards pendentes de revisão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => void aoTestarLembrete()} disabled={enviandoLembrete}>
            <Mail className="h-4 w-4" />
            {enviandoLembrete ? 'Enviando...' : 'Testar meu lembrete agora'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Seus dados (LGPD)</CardTitle>
          <CardDescription>Baixe uma cópia completa de todos os seus dados pessoais</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => void aoExportar()} disabled={exportando}>
            <Download className="h-4 w-4" />
            {exportando ? 'Exportando...' : 'Exportar meus dados'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-destructive">Zona de risco</CardTitle>
          <CardDescription>Excluir sua conta é permanente e não pode ser desfeito</CardDescription>
        </CardHeader>
        <CardContent>
          <ExcluirContaDialog />
        </CardContent>
      </Card>
    </div>
  )
}

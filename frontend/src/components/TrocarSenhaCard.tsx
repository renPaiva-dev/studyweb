import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { trocarSenha } from '@/api/usuarioApi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MENSAGEM_SENHA_FORTE, senhaEhForte } from '@/utils/senhaForte'

interface Erros {
  senhaAtual?: string
  novaSenha?: string
}

// UC26/RN33 - Trocar senha autenticado. PUT /api/usuario/senha
// (docs/contrato-api.md, secao "Trocar Senha").
export function TrocarSenhaCard() {
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [erros, setErros] = useState<Erros>({})
  const [salvando, setSalvando] = useState(false)

  function validar(): boolean {
    const novosErros: Erros = {}

    if (!senhaAtual) {
      novosErros.senhaAtual = 'Informe sua senha atual.'
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

    setSalvando(true)

    try {
      await trocarSenha(senhaAtual, novaSenha)
      toast.success('Senha alterada com sucesso.')
      setSenhaAtual('')
      setNovaSenha('')
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível alterar sua senha.'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Trocar senha</CardTitle>
        <CardDescription>Informe sua senha atual para definir uma nova</CardDescription>
      </CardHeader>
      <form onSubmit={aoSubmeter} noValidate>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senhaAtual">Senha atual</Label>
            <Input
              id="senhaAtual"
              type="password"
              className="h-10"
              autoComplete="current-password"
              value={senhaAtual}
              onChange={(evento) => setSenhaAtual(evento.target.value)}
              aria-invalid={Boolean(erros.senhaAtual)}
            />
            {erros.senhaAtual && <p className="text-sm text-destructive">{erros.senhaAtual}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="novaSenha">Nova senha</Label>
            <Input
              id="novaSenha"
              type="password"
              className="h-10"
              autoComplete="new-password"
              value={novaSenha}
              onChange={(evento) => setNovaSenha(evento.target.value)}
              aria-invalid={Boolean(erros.novaSenha)}
            />
            {erros.novaSenha && <p className="text-sm text-destructive">{erros.novaSenha}</p>}
          </div>
          <Button type="submit" disabled={salvando}>
            {salvando ? 'Alterando...' : 'Alterar senha'}
          </Button>
        </CardContent>
      </form>
    </Card>
  )
}

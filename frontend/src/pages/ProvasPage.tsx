import { ClipboardList, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { extrairMensagemErro } from '@/api/apiError'
import { listarHistoricoProvas, type HistoricoProvaResumo } from '@/api/provaApi'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { HistoricoProvaCard } from '@/components/HistoricoProvaCard'

// UC28/RN36 - historico de provas do usuario (deterministicas de UC10 e
// personalizadas de UC27), mais recentes primeiro. GET /api/usuario/provas
// (docs/contrato-api.md).
export function ProvasPage() {
  const navigate = useNavigate()

  const [historico, setHistorico] = useState<HistoricoProvaResumo[] | null>(null)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setErroCarregamento(null)

    try {
      setHistorico(await listarHistoricoProvas())
    } catch (erro) {
      setErroCarregamento(extrairMensagemErro(erro, 'Não foi possível carregar seu histórico de provas.'))
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Provas</h1>
          <p className="text-muted-foreground">Gere provas personalizadas com IA e acompanhe seu histórico</p>
        </div>
        <Button onClick={() => navigate('/provas/nova')}>
          <Plus className="mr-2 h-4 w-4" />
          Nova prova
        </Button>
      </div>

      {historico === null && erroCarregamento === null && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-none" />
          <Skeleton className="h-20 w-full rounded-none" />
          <Skeleton className="h-20 w-full rounded-none" />
        </div>
      )}

      {erroCarregamento !== null && (
        <div className="flex flex-col items-center gap-4 rounded-none border py-16 text-center">
          <p className="text-muted-foreground">{erroCarregamento}</p>
          <Button variant="outline" onClick={() => void carregar()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {historico !== null && historico.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-none border border-dashed py-20 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <ClipboardList className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">Você ainda não fez nenhuma prova</p>
            <p className="text-sm text-muted-foreground">
              Selecione flashcards de um deck e um estilo. A IA gera questões inéditas para você praticar.
            </p>
          </div>
          <Button onClick={() => navigate('/provas/nova')}>
            <Plus className="mr-2 h-4 w-4" />
            Fazer minha primeira prova
          </Button>
        </div>
      )}

      {historico !== null && historico.length > 0 && (
        <div className="space-y-3">
          {historico.map((tentativa) => (
            <HistoricoProvaCard
              key={tentativa.tentativaId}
              tentativa={tentativa}
              onAbrir={() => navigate(`/provas/${tentativa.tentativaId}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

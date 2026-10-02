import { ClipboardList, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { extrairMensagemErro } from '@/api/apiError'
import { listarHistoricoProvas, type HistoricoProvaResumo } from '@/api/provaApi'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { HistoricoProvaCard } from '@/components/HistoricoProvaCard'
import { LinhaSkeleton } from '@/components/SkeletonsLista'
import { Button } from '@/components/ui/button'
import { EstadoErro, EstadoVazio } from '@/components/ui/estados'
import { Carregando } from '@/components/ui/skeleton'

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

  const media =
    historico && historico.length > 0
      ? Math.round(historico.reduce((soma, tentativa) => soma + tentativa.pontuacao, 0) / historico.length)
      : null

  return (
    <div className="space-y-8">
      <CabecalhoPagina
        titulo="Provas"
        descricao={
          media !== null
            ? `${historico!.length} tentativa${historico!.length === 1 ? '' : 's'} · média de ${media}% de acerto`
            : 'Gere provas personalizadas com IA e acompanhe seu histórico.'
        }
        acoes={
          <Button onClick={() => navigate('/provas/nova')}>
            <Sparkles />
            Nova prova
          </Button>
        }
      />

      {historico === null && erroCarregamento === null && (
        <Carregando rotulo="Carregando seu histórico..." className="space-y-3">
          <LinhaSkeleton />
          <LinhaSkeleton />
          <LinhaSkeleton />
        </Carregando>
      )}

      {erroCarregamento !== null && <EstadoErro mensagem={erroCarregamento} onTentarNovamente={() => void carregar()} />}

      {historico !== null && historico.length === 0 && (
        <EstadoVazio
          icone={ClipboardList}
          titulo="Você ainda não fez nenhuma prova"
          descricao="Selecione flashcards de um deck e um estilo. A IA gera questões inéditas para você praticar."
          acao={
            <Button onClick={() => navigate('/provas/nova')}>
              <Sparkles />
              Fazer minha primeira prova
            </Button>
          }
        />
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

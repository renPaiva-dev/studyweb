import { CalendarDays, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { extrairMensagemErro } from '@/api/apiError'
import { buscarDetalheProva, ESTILOS_PROVA, type HistoricoProvaDetalhe } from '@/api/provaApi'
import { AnelPontuacao } from '@/components/AnelPontuacao'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { RevisaoProvaQuestao } from '@/components/RevisaoProvaQuestao'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { EstadoErro } from '@/components/ui/estados'
import { Carregando, Skeleton } from '@/components/ui/skeleton'
import { classificarPontuacao } from '@/utils/classificarPontuacao'

// UC28/RN36 - detalhe de uma tentativa do historico: revisao questao a
// questao, com a alternativa escolhida, se acertou e a explicacao.
// GET /api/usuario/provas/{id} (docs/contrato-api.md).
export function HistoricoProvaDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const tentativaId = Number(id)

  const [detalhe, setDetalhe] = useState<HistoricoProvaDetalhe | null>(null)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setErroCarregamento(null)

    try {
      setDetalhe(await buscarDetalheProva(tentativaId))
    } catch (erro) {
      setErroCarregamento(extrairMensagemErro(erro, 'Não foi possível carregar esta prova.'))
    }
  }, [tentativaId])

  useEffect(() => {
    void carregar()
  }, [carregar])

  if (erroCarregamento !== null) {
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <CabecalhoPagina voltar={{ para: '/provas', rotulo: 'Provas' }} titulo="Prova" />
        <EstadoErro mensagem={erroCarregamento} onTentarNovamente={() => void carregar()} />
      </div>
    )
  }

  if (detalhe === null) {
    return (
      <Carregando rotulo="Carregando prova..." className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </Carregando>
    )
  }

  const rotuloEstilo = ESTILOS_PROVA.find((estilo) => estilo.valor === detalhe.estilo)?.rotulo
  const { rotulo, cores } = classificarPontuacao(detalhe.pontuacao)
  const acertos = detalhe.questoes.filter((questao) => questao.correta).length

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <CabecalhoPagina
        voltar={{ para: '/provas', rotulo: 'Provas' }}
        sobretitulo="Revisão da prova"
        titulo={detalhe.titulo}
      />

      <Card className="flex flex-col items-center gap-5 p-5 text-center sm:flex-row sm:p-6 sm:text-left">
        <AnelPontuacao pontuacao={detalhe.pontuacao} tamanho={96} espessura={9} />
        <div className="flex-1 space-y-2">
          <p className={`font-heading text-h3 ${cores.textoSecundario}`}>{rotulo}</p>
          <p className="text-sm text-ink-700">
            <strong className="tabular-nums">{acertos}</strong> de <strong className="tabular-nums">{detalhe.questoes.length}</strong> questões
            corretas
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="inline-flex items-center gap-1.5 text-sm text-ink-600">
              <CalendarDays className="h-4 w-4" />
              {new Date(detalhe.dataTentativa).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}
            </span>
            {rotuloEstilo && (
              <Badge>
                <Sparkles />
                {rotuloEstilo}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {detalhe.questoes.map((questao, indice) => (
          <RevisaoProvaQuestao key={questao.questaoId} questao={questao} numero={indice + 1} />
        ))}
      </div>
    </div>
  )
}

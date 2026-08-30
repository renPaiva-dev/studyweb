import { ChevronLeft } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { extrairMensagemErro } from '@/api/apiError'
import { buscarDetalheProva, ESTILOS_PROVA, type HistoricoProvaDetalhe } from '@/api/provaApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RevisaoProvaQuestao } from '@/components/RevisaoProvaQuestao'
import { classificarPontuacao } from '@/utils/classificarPontuacao'
import { cn } from '@/lib/utils'

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
      <div className="flex flex-col items-center gap-3 rounded-xl border py-16 text-center">
        <p className="text-muted-foreground">{erroCarregamento}</p>
        <Button variant="outline" onClick={() => void carregar()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (detalhe === null) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    )
  }

  const rotuloEstilo = ESTILOS_PROVA.find((estilo) => estilo.valor === detalhe.estilo)?.rotulo
  const { texto: corTexto } = classificarPontuacao(detalhe.pontuacao).cores

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/provas" className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
          <ChevronLeft className="h-4 w-4" />
          Voltar para provas
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{detalhe.titulo}</h1>
          {rotuloEstilo && <Badge variant="secondary">{rotuloEstilo}</Badge>}
        </div>
        <p className="text-muted-foreground">
          {new Date(detalhe.dataTentativa).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })} ·{' '}
          <span className={cn('font-semibold', corTexto)}>{detalhe.pontuacao}%</span>
        </p>
      </div>

      <div className="space-y-3">
        {detalhe.questoes.map((questao, indice) => (
          <RevisaoProvaQuestao key={questao.questaoId} questao={questao} numero={indice + 1} />
        ))}
      </div>
    </div>
  )
}

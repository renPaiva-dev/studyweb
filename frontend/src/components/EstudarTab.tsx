import { CheckCircle2, PartyPopper, RotateCw, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { avaliarRevisao, buscarFilaEstudo, type ItemFilaEstudo } from '@/api/estudoApi'
import { AvaliacaoRevisaoBotoes } from '@/components/AvaliacaoRevisaoBotoes'
import { FlashcardEstudoCard } from '@/components/FlashcardEstudoCard'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

interface EstudarTabProps {
  deckId: number
}

// UC07 - fila diaria de estudo (GET /api/decks/{id}/fila-estudo, RN10: so
// flashcards com proxima_revisao <= hoje ou primeira revisao). Se a fila
// vier vazia, o estudante pode optar por "Revisar mesmo assim" (RN22),
// que busca o deck inteiro ignorando RN10 - as revisoes geradas continuam
// reais, pelo mesmo UC08/UC09. UC08 - avaliacao da resposta 0-5 (POST
// /api/flashcards/{id}/revisoes), que aciona o recalculo SM-2 no backend
// (UC09). Avanca automaticamente para o proximo item da fila apos cada
// avaliacao.
export function EstudarTab({ deckId }: EstudarTabProps) {
  const [fila, setFila] = useState<ItemFilaEstudo[] | null>(null)
  const [modoCompleto, setModoCompleto] = useState(false)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)

  const [indiceAtual, setIndiceAtual] = useState(0)
  const [virado, setVirado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const carregarFila = useCallback(
    async (incluirTodos: boolean) => {
      setErroCarregamento(null)
      setFila(null)
      setModoCompleto(incluirTodos)
      setIndiceAtual(0)
      setVirado(false)

      try {
        setFila(await buscarFilaEstudo(deckId, incluirTodos))
      } catch (erro) {
        setErroCarregamento(extrairMensagemErro(erro, 'Não foi possível carregar a fila de estudo deste deck.'))
      }
    },
    [deckId],
  )

  useEffect(() => {
    void carregarFila(false)
  }, [carregarFila])

  async function aoAvaliar(qualidadeResposta: number) {
    if (fila === null) {
      return
    }

    const itemAtual = fila[indiceAtual]
    setEnviando(true)

    try {
      await avaliarRevisao(itemAtual.flashcardId, qualidadeResposta)
      setIndiceAtual((atual) => atual + 1)
      setVirado(false)
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível registrar sua avaliação. Tente novamente.'))
    } finally {
      setEnviando(false)
    }
  }

  if (fila === null && erroCarregamento === null) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    )
  }

  if (erroCarregamento !== null) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border py-16 text-center">
        <p className="text-muted-foreground">{erroCarregamento}</p>
        <Button variant="outline" onClick={() => void carregarFila(modoCompleto)}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (fila !== null && fila.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 py-20 text-center dark:border-emerald-900 dark:bg-emerald-950/20">
        <div className="rounded-full bg-emerald-100 p-4 dark:bg-emerald-900/40">
          <PartyPopper className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-lg font-medium text-emerald-800 dark:text-emerald-300">
          {modoCompleto ? 'Este deck ainda não tem flashcards.' : 'Nenhuma revisão pendente hoje, volte amanhã!'}
        </p>
        {!modoCompleto && (
          <Button variant="outline" onClick={() => void carregarFila(true)}>
            Revisar mesmo assim
          </Button>
        )}
      </div>
    )
  }

  if (fila !== null && indiceAtual >= fila.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 py-20 text-center dark:border-emerald-900 dark:bg-emerald-950/20">
        <div className="rounded-full bg-emerald-100 p-4 dark:bg-emerald-900/40">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-medium text-emerald-800 dark:text-emerald-300">Sessão concluída!</p>
          <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80">
            Você revisou {fila.length} flashcard{fila.length === 1 ? '' : 's'} hoje.
          </p>
        </div>
        <Button variant="outline" onClick={() => void carregarFila(false)}>
          Verificar novamente
        </Button>
      </div>
    )
  }

  if (fila === null) {
    return null
  }

  const itemAtual = fila[indiceAtual]
  const progresso = (indiceAtual / fila.length) * 100

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Card {indiceAtual + 1} de {fila.length}
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            {modoCompleto ? 'Revisão mesmo assim' : 'Repetição espaçada'}
          </span>
        </div>
        <Progress value={progresso} />
      </div>

      <FlashcardEstudoCard key={itemAtual.flashcardId} item={itemAtual} virado={virado} />

      {!virado ? (
        <div className="flex justify-center">
          <Button size="lg" onClick={() => setVirado(true)}>
            <RotateCw className="mr-2 h-4 w-4" />
            Virar card
          </Button>
        </div>
      ) : (
        <AvaliacaoRevisaoBotoes onAvaliar={(qualidade) => void aoAvaliar(qualidade)} desabilitado={enviando} />
      )}
    </div>
  )
}

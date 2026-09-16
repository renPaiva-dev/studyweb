import { CheckCircle2, PartyPopper, RotateCw, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { avaliarRevisao, buscarFilaEstudo, type ItemFilaEstudo } from '@/api/estudoApi'
import { AvaliacaoRevisaoBotoes } from '@/components/AvaliacaoRevisaoBotoes'
import { FlashcardEstudoCard } from '@/components/FlashcardEstudoCard'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useDefinirMargem } from '@/context/MargemContext'
import { cn } from '@/lib/utils'

interface EstudarTabProps {
  deckId: number
}

interface UltimaAvaliacao {
  qualidade: number
  contador: number
}

function notaAvaliacao(qualidade: number): { texto: string; cor: string } {
  if (qualidade >= 4) {
    return { texto: 'Muito bem, você domina isso.', cor: 'border-verde-lousa text-verde-lousa' }
  }
  if (qualidade === 3) {
    return { texto: 'Você lembrou, mas vale revisar de novo em breve.', cor: 'border-manilha text-muted-foreground' }
  }
  return { texto: 'Ainda não firmou. Revê esse ponto com calma.', cor: 'border-vermelho-correcao text-vermelho-correcao' }
}

// UC07 - fila diaria de estudo (GET /api/decks/{id}/fila-estudo, RN10: so
// flashcards com proxima_revisao <= hoje ou primeira revisao). Se a fila
// vier vazia, o estudante pode optar por "Revisar mesmo assim", que busca
// o deck inteiro ignorando o filtro de RN10 - as revisoes geradas continuam
// reais, pelo mesmo UC08/UC09. UC08 - avaliacao da resposta 0-5 (POST
// /api/flashcards/{id}/revisoes), que aciona o recalculo SM-2 no backend
// (UC09). Avanca automaticamente para o proximo item da fila apos cada
// avaliacao. O progresso e o feedback de cada resposta vivem na margem
// (useDefinirMargem) - a identidade "caderno ativamente corrigido" desta
// tela em particular.
export function EstudarTab({ deckId }: EstudarTabProps) {
  const [fila, setFila] = useState<ItemFilaEstudo[] | null>(null)
  const [modoCompleto, setModoCompleto] = useState(false)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)

  const [indiceAtual, setIndiceAtual] = useState(0)
  const [virado, setVirado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [notasCard, setNotasCard] = useState<ReactNode | null>(null)
  const [ultimaAvaliacao, setUltimaAvaliacao] = useState<UltimaAvaliacao | null>(null)

  const carregarFila = useCallback(
    async (incluirTodos: boolean) => {
      setErroCarregamento(null)
      setFila(null)
      setModoCompleto(incluirTodos)
      setIndiceAtual(0)
      setVirado(false)
      setUltimaAvaliacao(null)

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
      setUltimaAvaliacao((atual) => ({ qualidade: qualidadeResposta, contador: (atual?.contador ?? 0) + 1 }))
      setIndiceAtual((atual) => atual + 1)
      setVirado(false)
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível registrar sua avaliação. Tente novamente.'))
    } finally {
      setEnviando(false)
    }
  }

  const totalNaFila = fila?.length ?? 0
  const concluidos = Math.min(indiceAtual, totalNaFila)

  useDefinirMargem(
    fila === null ? null : fila.length > 0 ? (
      <div className="space-y-6 text-sm">
        <div>
          <p className="font-heading text-2xl font-semibold">
            {concluidos}/{totalNaFila}
          </p>
          <p className="text-muted-foreground">exercícios concluídos</p>
        </div>

        {ultimaAvaliacao && (
          <p
            key={ultimaAvaliacao.contador}
            className={cn(
              'animate-caderno-entrada border-l-2 pl-3 font-medium',
              notaAvaliacao(ultimaAvaliacao.qualidade).cor,
            )}
          >
            {notaAvaliacao(ultimaAvaliacao.qualidade).texto}
          </p>
        )}

        {notasCard && <div className="space-y-3 border-t border-manilha pt-4 text-foreground">{notasCard}</div>}
      </div>
    ) : (
      <div className="text-sm">
        <p className="font-heading text-2xl font-semibold text-verde-lousa">Em dia</p>
        <p className="text-muted-foreground">Nenhuma revisão pendente hoje.</p>
      </div>
    ),
    fila === null ? null : fila.length > 0 ? (
      <p className="text-center text-sm font-medium">
        {concluidos}/{totalNaFila} concluídos
      </p>
    ) : (
      <p className="text-center text-sm font-medium text-verde-lousa">Em dia — nada pendente hoje</p>
    ),
    // `fila` precisa estar nas deps: ao passar de "carregando" (null) para
    // "vazia" ([]), concluidos/totalNaFila continuam os dois em 0 - sem
    // `fila` aqui, o efeito nao reexecuta nessa transicao e a margem fica
    // presa no conteudo (null) do primeiro render.
    [fila, concluidos, totalNaFila, ultimaAvaliacao, notasCard],
  )

  if (fila === null && erroCarregamento === null) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-80 w-full rounded-none" />
      </div>
    )
  }

  if (erroCarregamento !== null) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-none border py-16 text-center">
        <p className="text-muted-foreground">{erroCarregamento}</p>
        <Button variant="outline" onClick={() => void carregarFila(modoCompleto)}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (fila !== null && fila.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 border-t border-manilha py-16 text-center">
        <PartyPopper className="h-6 w-6 text-verde-lousa" strokeWidth={1.5} />
        <div className="space-y-1">
          <p className="font-heading text-2xl font-semibold text-verde-lousa">
            {modoCompleto ? 'Este deck ainda não tem flashcards.' : 'Nenhuma revisão pendente hoje!'}
          </p>
          {!modoCompleto && <p className="text-sm text-muted-foreground">Volte amanhã, ou continue revisando se preferir.</p>}
        </div>
        {!modoCompleto && (
          <Button variant="outline" onClick={() => void carregarFila(true)}>
            <RotateCw className="mr-2 h-4 w-4" />
            Revisar mesmo assim
          </Button>
        )}
      </div>
    )
  }

  if (fila !== null && indiceAtual >= fila.length) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 border-t border-manilha py-16 text-center">
        <CheckCircle2 className="h-6 w-6 text-verde-lousa" strokeWidth={1.5} />
        <div className="space-y-1">
          <p className="font-heading text-2xl font-semibold text-verde-lousa">Sessão concluída!</p>
          <p className="text-sm text-muted-foreground">
            Você revisou {fila.length} flashcard{fila.length === 1 ? '' : 's'} hoje.
          </p>
        </div>
        <Button variant="outline" onClick={() => void carregarFila(false)}>
          <RotateCw className="mr-2 h-4 w-4" />
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

      <FlashcardEstudoCard key={itemAtual.flashcardId} item={itemAtual} virado={virado} onNotasChange={setNotasCard} />

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

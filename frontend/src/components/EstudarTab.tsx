import { CheckCircle2, PartyPopper, RotateCw, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { avaliarRevisao, buscarFilaEstudo, type ItemFilaEstudo } from '@/api/estudoApi'
import { AvaliacaoRevisaoBotoes } from '@/components/AvaliacaoRevisaoBotoes'
import { ElaboracaoPainel } from '@/components/ElaboracaoPainel'
import { FlashcardEstudoCard } from '@/components/FlashcardEstudoCard'
import { NotaMargem } from '@/components/NotaMargem'
import { Button } from '@/components/ui/button'
import { EstadoErro } from '@/components/ui/estados'
import { Progress } from '@/components/ui/progress'
import { Carregando, Skeleton } from '@/components/ui/skeleton'
import { useDefinirMargem } from '@/context/MargemContext'
import { cn } from '@/lib/utils'
import { definirElaboracaoVisivel, elaboracaoVisivel } from '@/utils/preferenciasEstudo'

interface EstudarTabProps {
  deckId: number
}

interface UltimaAvaliacao {
  qualidade: number
  contador: number
  intervaloDias: number
}

function notaAvaliacao(qualidade: number): { texto: string; cor: string } {
  if (qualidade >= 4) {
    return { texto: 'Muito bem, você domina isso.', cor: 'border-success-500 bg-success-50 text-success-800' }
  }
  if (qualidade === 3) {
    return { texto: 'Você lembrou, mas vale revisar de novo em breve.', cor: 'border-warning-500 bg-warning-50 text-warning-800' }
  }
  return { texto: 'Ainda não firmou. Revê esse ponto com calma.', cor: 'border-danger-500 bg-danger-50 text-danger-800' }
}

// Atalhos so valem quando o foco nao esta num campo/botao (evita disparar
// em dobro com o clique nativo do Enter/Espaco num botao focado).
function ehAlvoInterativo(alvo: EventTarget | null) {
  return alvo instanceof HTMLElement && Boolean(alvo.closest('input, textarea, select, button, a, [role="menuitem"], [contenteditable="true"]'))
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
  const [notasElaboracao, setNotasElaboracao] = useState<ReactNode | null>(null)
  const [mostrarElaboracao, setMostrarElaboracao] = useState(elaboracaoVisivel)
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
      const resultado = await avaliarRevisao(itemAtual.flashcardId, qualidadeResposta)
      setUltimaAvaliacao((atual) => ({
        qualidade: qualidadeResposta,
        contador: (atual?.contador ?? 0) + 1,
        intervaloDias: resultado.intervaloDias,
      }))
      setIndiceAtual((atual) => atual + 1)
      setVirado(false)
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível registrar sua avaliação. Tente novamente.'))
    } finally {
      setEnviando(false)
    }
  }

  const botaoVirarRef = useRef<HTMLButtonElement>(null)
  const emSessao = fila !== null && indiceAtual < fila.length

  // Atalhos de teclado da sessao: Espaco vira o card, 0-5 avalia.
  useEffect(() => {
    if (!emSessao) return

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.metaKey || evento.ctrlKey || evento.altKey || ehAlvoInterativo(evento.target)) return

      if (!virado && evento.key === ' ') {
        evento.preventDefault()
        setVirado(true)
      } else if (virado && !enviando && /^[0-5]$/.test(evento.key)) {
        evento.preventDefault()
        void aoAvaliar(Number(evento.key))
      }
    }

    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
    // aoAvaliar le fila/indiceAtual atuais - recriado a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emSessao, virado, enviando, indiceAtual])

  // RN44 - ocultar vale para as próximas sessões deste navegador; reativa em Perfil.
  function ocultarElaboracao() {
    definirElaboracaoVisivel(false)
    setMostrarElaboracao(false)
    toast('Opções de aprofundamento ocultadas. Reative em Perfil.')
  }

  const totalNaFila = fila?.length ?? 0
  const concluidos = Math.min(indiceAtual, totalNaFila)

  useDefinirMargem(
    fila === null ? null : fila.length > 0 ? (
      <NotaMargem
        valor={
          <>
            {concluidos}
            <span className="text-ink-400">/{totalNaFila}</span>
          </>
        }
        rotulo="cards revisados nesta sessão"
      >
        {ultimaAvaliacao && (
          <div
            key={ultimaAvaliacao.contador}
            role="status"
            className={cn('animate-entrada space-y-0.5 rounded-r-lg border-l-[3px] px-3 py-2.5', notaAvaliacao(ultimaAvaliacao.qualidade).cor)}
          >
            <p className="font-semibold">{notaAvaliacao(ultimaAvaliacao.qualidade).texto}</p>
            <p className="text-sm opacity-90">
              Você vai rever este card em {ultimaAvaliacao.intervaloDias} dia{ultimaAvaliacao.intervaloDias === 1 ? '' : 's'}.
            </p>
          </div>
        )}

        {notasCard && <div className="space-y-3 border-t border-ink-100 pt-4 text-foreground">{notasCard}</div>}

        {notasElaboracao && <div className="border-t border-ink-100 pt-4 text-foreground">{notasElaboracao}</div>}
      </NotaMargem>
    ) : (
      <NotaMargem valor="Em dia" tom="positivo" rotulo="Nenhuma revisão pendente hoje." />
    ),
    fila === null ? null : fila.length > 0 ? (
      <div className="flex items-center gap-3">
        <Progress value={totalNaFila ? (concluidos / totalNaFila) * 100 : 0} className="h-1.5" aria-label="Progresso da sessão" />
        <p className="shrink-0 text-sm font-semibold tabular-nums">
          {concluidos}/{totalNaFila}
        </p>
      </div>
    ) : (
      <p className="text-center text-sm font-semibold text-success-700">Em dia, nada pendente hoje</p>
    ),
    // `fila` precisa estar nas deps: ao passar de "carregando" (null) para
    // "vazia" ([]), concluidos/totalNaFila continuam os dois em 0 - sem
    // `fila` aqui, o efeito nao reexecuta nessa transicao e a margem fica
    // presa no conteudo (null) do primeiro render.
    [fila, concluidos, totalNaFila, ultimaAvaliacao, notasCard, notasElaboracao],
  )

  if (fila === null && erroCarregamento === null) {
    return (
      <Carregando rotulo="Carregando sua fila de estudo..." className="mx-auto max-w-xl space-y-4">
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </Carregando>
    )
  }

  if (erroCarregamento !== null) {
    return <EstadoErro mensagem={erroCarregamento} onTentarNovamente={() => void carregarFila(modoCompleto)} />
  }

  if (fila !== null && fila.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-success-200 bg-success-50/60 px-6 py-14 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-100 text-success-700 ring-8 ring-success-50">
          <PartyPopper className="h-7 w-7" strokeWidth={1.75} />
        </span>
        <div className="space-y-1">
          <p className="font-heading text-h2 text-success-800">
            {modoCompleto ? 'Este deck ainda não tem flashcards.' : 'Nenhuma revisão pendente hoje!'}
          </p>
          {!modoCompleto && <p className="text-sm text-success-800">Volte amanhã, ou continue revisando se preferir.</p>}
        </div>
        {!modoCompleto && (
          <Button variant="outline" onClick={() => void carregarFila(true)}>
            <RotateCw />
            Revisar mesmo assim
          </Button>
        )}
      </div>
    )
  }

  if (fila !== null && indiceAtual >= fila.length) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-success-200 bg-success-50/60 px-6 py-14 text-center animate-entrada">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-100 text-success-700 ring-8 ring-success-50">
          <CheckCircle2 className="h-7 w-7" strokeWidth={1.75} />
        </span>
        <div className="space-y-1">
          <p className="font-heading text-h2 text-success-800">Sessão concluída!</p>
          <p className="text-sm text-success-800">
            Você revisou {fila.length} flashcard{fila.length === 1 ? '' : 's'} hoje.
          </p>
        </div>
        <Button variant="outline" onClick={() => void carregarFila(false)}>
          <RotateCw />
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
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-foreground">
            Card <span className="tabular-nums">{indiceAtual + 1}</span> de <span className="tabular-nums">{fila.length}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-ink-600">
            <Sparkles className="h-3.5 w-3.5 text-brand-700" />
            {modoCompleto ? 'Revisão livre' : 'Repetição espaçada'}
          </span>
        </div>
        <Progress value={progresso} aria-label="Progresso da sessão" />
      </div>

      <FlashcardEstudoCard key={itemAtual.flashcardId} item={itemAtual} virado={virado} onNotasChange={setNotasCard} />

      {!virado ? (
        <div className="flex flex-col items-center gap-2">
          <Button ref={botaoVirarRef} size="lg" className="w-full sm:w-auto sm:min-w-56" onClick={() => setVirado(true)}>
            <RotateCw />
            Virar card
          </Button>
          <p className="hidden items-center gap-1.5 text-xs text-ink-600 sm:flex" aria-hidden="true">
            ou pressione <kbd className="kbd">Espaço</kbd>
          </p>
        </div>
      ) : (
        <>
          {/* UC34 - opcional (RN44): nunca interfere em AvaliacaoRevisaoBotoes,
              que só depende de `enviando` (a própria avaliação). */}
          {mostrarElaboracao && (
            <ElaboracaoPainel
              key={itemAtual.flashcardId}
              flashcardId={itemAtual.flashcardId}
              onNotasChange={setNotasElaboracao}
              onOcultar={ocultarElaboracao}
            />
          )}
          <AvaliacaoRevisaoBotoes onAvaliar={(qualidade) => void aoAvaliar(qualidade)} desabilitado={enviando} />
        </>
      )}
    </div>
  )
}

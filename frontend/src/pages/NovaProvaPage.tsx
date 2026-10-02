import { Check, History, Layers, RotateCcw, Send, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { extrairMensagemErro } from '@/api/apiError'
import { listarDecks, type Deck } from '@/api/deckApi'
import { listarFlashcards, type Flashcard } from '@/api/flashcardApi'
import { ESTILOS_PROVA, gerarProva, type EstiloProva } from '@/api/provaApi'
import type { Quiz, ResultadoTentativa } from '@/api/quizApi'
import { responderTentativa } from '@/api/quizApi'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { QuestaoQuizItem } from '@/components/QuestaoQuizItem'
import { ResultadoQuiz } from '@/components/ResultadoQuiz'
import { RevisaoProvaQuestao } from '@/components/RevisaoProvaQuestao'
import { Alerta } from '@/components/ui/alerta'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { EstadoErro, EstadoVazio } from '@/components/ui/estados'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Carregando, Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type Fase = 'configurar' | 'fazendo' | 'resultado'

// UC27 - Gerar prova personalizada via IA: escolher deck + flashcard(s) +
// estilo, responder (reaproveitando QuestaoQuizItem/POST .../tentativas de
// UC10) e ver o resultado com revisao questao a questao (RN36). Quando
// aberta a partir do botao "Gerar prova" de um deck (DeckDetalhePage), o
// deck chega via ?deckId= e o passo 1 comeca ja preenchido.
export function NovaProvaPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [fase, setFase] = useState<Fase>('configurar')

  const [decks, setDecks] = useState<Deck[] | null>(null)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)
  const [deckId, setDeckId] = useState<number | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null)
  const [carregandoFlashcards, setCarregandoFlashcards] = useState(false)
  const [erroFlashcards, setErroFlashcards] = useState<string | null>(null)
  const [flashcardIdsSelecionados, setFlashcardIdsSelecionados] = useState<number[]>([])
  const [estilo, setEstilo] = useState<EstiloProva | null>(null)
  const [gerando, setGerando] = useState(false)
  const [gerandoDemorando, setGerandoDemorando] = useState(false)
  const [erroAcao, setErroAcao] = useState<string | null>(null)

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [respostas, setRespostas] = useState<Record<number, string>>({})
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoTentativa | null>(null)

  // N4 (Docs/auditoria-coerencia-seguranca-2026-09.md): o backend tenta a
  // chamada a IA ate 2x antes de desistir - mesmo padrao de MaterialItem.tsx.
  useEffect(() => {
    if (!gerando) {
      setGerandoDemorando(false)
      return
    }

    const temporizador = setTimeout(() => setGerandoDemorando(true), 15_000)
    return () => clearTimeout(temporizador)
  }, [gerando])

  const carregarDecks = useCallback(async () => {
    setErroCarregamento(null)

    try {
      setDecks(await listarDecks())
    } catch (erro) {
      setErroCarregamento(extrairMensagemErro(erro, 'Não foi possível carregar seus decks.'))
    }
  }, [])

  useEffect(() => {
    void carregarDecks()
  }, [carregarDecks])

  // Guarda o id do deck mais recentemente pedido: se o usuario trocar de
  // deck duas vezes rapido, a resposta de uma escolha anterior (que pode
  // chegar depois da mais recente) e ignorada em vez de sobrescrever a
  // lista de flashcards do deck errado na tela.
  const deckIdSolicitadoRef = useRef<number | null>(null)

  const carregarFlashcards = useCallback(async (id: number) => {
    deckIdSolicitadoRef.current = id
    setErroFlashcards(null)
    setCarregandoFlashcards(true)

    try {
      const dados = await listarFlashcards(id)
      if (deckIdSolicitadoRef.current !== id) {
        return
      }
      setFlashcards(dados)
    } catch (erro) {
      if (deckIdSolicitadoRef.current !== id) {
        return
      }
      setErroFlashcards(extrairMensagemErro(erro, 'Não foi possível carregar os flashcards deste deck.'))
    } finally {
      if (deckIdSolicitadoRef.current === id) {
        setCarregandoFlashcards(false)
      }
    }
  }, [])

  const aoEscolherDeck = useCallback(
    (idTexto: string) => {
      const id = Number(idTexto)
      setDeckId(id)
      setFlashcardIdsSelecionados([])
      setFlashcards(null)
      void carregarFlashcards(id)
    },
    [carregarFlashcards],
  )

  // Se a pagina foi aberta a partir do botao "Gerar prova" de um deck
  // (DeckDetalhePage), o deckId chega via query param e o passo 1 e
  // preenchido automaticamente, sem o usuario ter que escolher de novo.
  useEffect(() => {
    if (decks === null || deckId !== null) {
      return
    }

    const deckIdParam = Number(searchParams.get('deckId'))
    if (decks.some((deck) => deck.id === deckIdParam)) {
      aoEscolherDeck(String(deckIdParam))
    }
  }, [decks, deckId, searchParams, aoEscolherDeck])

  function alternarFlashcard(id: number) {
    setFlashcardIdsSelecionados((atual) => (atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id]))
  }

  async function aoGerarProva() {
    if (deckId === null || estilo === null || flashcardIdsSelecionados.length === 0) {
      return
    }

    setGerando(true)
    setErroAcao(null)

    try {
      const novoQuiz = await gerarProva(deckId, { flashcardIds: flashcardIdsSelecionados, estilo })
      setQuiz(novoQuiz)
      setRespostas({})
      setFase('fazendo')
      window.scrollTo({ top: 0 })
    } catch (erro) {
      setErroAcao(extrairMensagemErro(erro, 'Não foi possível gerar a prova. Tente novamente.'))
    } finally {
      setGerando(false)
    }
  }

  function selecionarResposta(questaoId: number, alternativa: string) {
    setRespostas((atual) => ({ ...atual, [questaoId]: alternativa }))
  }

  async function aoEnviarRespostas() {
    if (quiz === null) {
      return
    }

    setEnviando(true)
    setErroAcao(null)

    try {
      const payload = quiz.questoes.map((questao) => ({
        questaoId: questao.id,
        alternativaEscolhida: respostas[questao.id],
      }))
      setResultado(await responderTentativa(quiz.id, payload))
      setFase('resultado')
      window.scrollTo({ top: 0 })
    } catch (erro) {
      setErroAcao(extrairMensagemErro(erro, 'Não foi possível enviar suas respostas. Tente novamente.'))
    } finally {
      setEnviando(false)
    }
  }

  function comecarNovaProva() {
    setFase('configurar')
    setQuiz(null)
    setResultado(null)
    setRespostas({})
    setFlashcardIdsSelecionados([])
    setEstilo(null)
    setErroAcao(null)
  }

  if (fase === 'resultado' && resultado !== null) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <CabecalhoPagina voltar={{ para: '/provas', rotulo: 'Provas' }} sobretitulo="Resultado" titulo={quiz?.titulo ?? 'Sua prova'} />
        <ResultadoQuiz
          resultado={resultado}
          acoes={
            <>
              <Button variant="secondary" onClick={comecarNovaProva}>
                <RotateCcw />
                Nova prova
              </Button>
              <Button variant="outline" onClick={() => navigate('/provas')}>
                <History />
                Ver histórico
              </Button>
            </>
          }
        />

        <h2 className="pt-2 font-heading text-h3 text-foreground">Correção questão a questão</h2>
        <div className="space-y-3">
          {resultado.questoes.map((questao, indice) => (
            <RevisaoProvaQuestao key={questao.questaoId} questao={questao} numero={indice + 1} />
          ))}
        </div>
      </div>
    )
  }

  if (fase === 'fazendo' && quiz !== null) {
    const totalRespondidas = quiz.questoes.filter((questao) => respostas[questao.id] !== undefined).length
    const todasRespondidas = totalRespondidas === quiz.questoes.length
    const faltam = quiz.questoes.length - totalRespondidas

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <CabecalhoPagina
          sobretitulo="Prova em andamento"
          titulo={quiz.titulo}
          descricao={`${totalRespondidas} de ${quiz.questoes.length} respondidas`}
        />

        <div className="space-y-3">
          {quiz.questoes.map((questao, indice) => (
            <QuestaoQuizItem
              key={questao.id}
              questao={questao}
              numero={indice + 1}
              respostaSelecionada={respostas[questao.id]}
              onSelecionar={(alternativa) => selecionarResposta(questao.id, alternativa)}
              desabilitado={enviando}
            />
          ))}
        </div>

        {erroAcao && <Alerta variante="erro">{erroAcao}</Alerta>}

        <div className="flex flex-col-reverse items-stretch gap-3 border-t border-ink-200 pt-4 sm:flex-row sm:items-center sm:justify-end">
          {!todasRespondidas && (
            <p className="text-center text-sm text-ink-600 sm:text-right">
              Falta{faltam === 1 ? '' : 'm'} {faltam} questão{faltam === 1 ? '' : 'ões'} para enviar.
            </p>
          )}
          <Button onClick={() => void aoEnviarRespostas()} disabled={!todasRespondidas} loading={enviando}>
            <Send />
            {enviando ? 'Enviando...' : 'Enviar respostas'}
          </Button>
        </div>
      </div>
    )
  }

  const todosSelecionados = flashcards !== null && flashcards.length > 0 && flashcardIdsSelecionados.length === flashcards.length

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <CabecalhoPagina
        voltar={{ para: '/provas', rotulo: 'Provas' }}
        titulo="Nova prova"
        descricao="Escolha os flashcards e o estilo. A IA cria questões inéditas sobre o tema."
      />

      <ol className="space-y-4">
        <Passo numero={1} titulo="Escolha o deck" concluido={deckId !== null} ativo>
          {decks === null && erroCarregamento === null ? (
            <Skeleton className="h-11 w-full" />
          ) : erroCarregamento !== null ? (
            <EstadoErro compacto mensagem={erroCarregamento} onTentarNovamente={() => void carregarDecks()} />
          ) : decks !== null && decks.length === 0 ? (
            <EstadoVazio
              compacto
              icone={Layers}
              titulo="Você ainda não tem decks"
              descricao="Crie um deck com alguns flashcards para gerar uma prova."
              acao={
                <Button asChild variant="outline">
                  <Link to="/decks">Ir para Meus decks</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="deck-prova" className="sr-only">
                Deck
              </Label>
              <Select value={deckId !== null ? String(deckId) : undefined} onValueChange={aoEscolherDeck}>
                <SelectTrigger id="deck-prova">
                  <SelectValue placeholder="Selecione um deck" />
                </SelectTrigger>
                <SelectContent>
                  {(decks ?? []).map((deck) => (
                    <SelectItem key={deck.id} value={String(deck.id)}>
                      {deck.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </Passo>

        <Passo
          numero={2}
          titulo="Escolha os flashcards"
          descricao="As questões serão sobre o tema deles, inéditas, sem repetir pergunta e resposta."
          concluido={flashcardIdsSelecionados.length > 0}
          ativo={deckId !== null}
        >
          {deckId !== null && (
            <div className="space-y-2">
              {carregandoFlashcards && (
                <Carregando className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </Carregando>
              )}

              {!carregandoFlashcards && erroFlashcards !== null && (
                <EstadoErro compacto mensagem={erroFlashcards} onTentarNovamente={() => deckId !== null && void carregarFlashcards(deckId)} />
              )}

              {!carregandoFlashcards && erroFlashcards === null && flashcards !== null && flashcards.length === 0 && (
                <Alerta variante="aviso">Este deck ainda não tem flashcards. Escolha outro deck ou crie flashcards primeiro.</Alerta>
              )}

              {!carregandoFlashcards && erroFlashcards === null && flashcards !== null && flashcards.length > 0 && (
                <>
                  <div className="flex items-center justify-between gap-2 pb-1">
                    <p className="text-sm text-ink-600" aria-live="polite">
                      <span className="font-semibold tabular-nums text-foreground">{flashcardIdsSelecionados.length}</span> de{' '}
                      {flashcards.length} selecionados
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFlashcardIdsSelecionados(todosSelecionados ? [] : flashcards.map((flashcard) => flashcard.id))}
                    >
                      {todosSelecionados ? 'Limpar seleção' : 'Selecionar todos'}
                    </Button>
                  </div>
                  <div className="max-h-[22rem] space-y-2 overflow-y-auto pr-1">
                    {flashcards.map((flashcard) => {
                      const marcado = flashcardIdsSelecionados.includes(flashcard.id)
                      return (
                        <label
                          key={flashcard.id}
                          className={cn(
                            'flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-sm transition-colors duration-fast sm:text-base',
                            marcado ? 'border-ink-900 bg-ink-50' : 'border-ink-200 hover:border-ink-400 hover:bg-ink-50',
                          )}
                        >
                          <Checkbox className="mt-0.5" checked={marcado} onCheckedChange={() => alternarFlashcard(flashcard.id)} />
                          <span className="text-foreground">{flashcard.pergunta}</span>
                        </label>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </Passo>

        <Passo numero={3} titulo="Escolha o estilo da prova" concluido={estilo !== null} ativo={flashcardIdsSelecionados.length > 0}>
          {deckId !== null && flashcardIdsSelecionados.length > 0 && (
            <div role="radiogroup" aria-label="Estilo da prova" className="grid gap-3 sm:grid-cols-3">
              {ESTILOS_PROVA.map((opcao) => {
                const selecionado = estilo === opcao.valor
                return (
                  <button
                    key={opcao.valor}
                    type="button"
                    role="radio"
                    aria-checked={selecionado}
                    onClick={() => setEstilo(opcao.valor)}
                    className={cn(
                      'relative rounded-lg border p-4 text-left transition-[border-color,background-color,box-shadow] duration-fast ease-suave focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      selecionado
                        ? 'border-ink-900 bg-ink-50 shadow-[inset_0_0_0_1px_hsl(var(--foreground))]'
                        : 'border-ink-200 hover:border-ink-400 hover:bg-ink-50',
                    )}
                  >
                    {selecionado && (
                      <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-400 text-ink-950">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                    )}
                    <p className="pr-6 font-semibold text-foreground">{opcao.rotulo}</p>
                    <p className="mt-1 text-sm text-ink-600">{opcao.descricao}</p>
                  </button>
                )
              })}
            </div>
          )}
        </Passo>
      </ol>

      <div className="space-y-3 rounded-xl border border-ink-200/80 bg-card p-4 shadow-sm sm:p-5">
        {erroAcao && <Alerta variante="erro">{erroAcao}</Alerta>}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-600" role="status">
            {gerando
              ? gerandoDemorando
                ? 'Ainda gerando a prova, pode levar um pouco mais que o normal...'
                : 'A IA está escrevendo questões inéditas para você...'
              : estilo === null
                ? 'Complete os 3 passos para gerar a prova.'
                : 'Tudo pronto. Limitado a 10 gerações por minuto.'}
          </p>
          <Button size="lg" onClick={() => void aoGerarProva()} disabled={estilo === null || flashcardIdsSelecionados.length === 0} loading={gerando}>
            <Sparkles />
            {gerando ? 'Gerando prova...' : 'Gerar prova'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Passo({
  numero,
  titulo,
  descricao,
  concluido,
  ativo,
  children,
}: {
  numero: number
  titulo: string
  descricao?: string
  concluido: boolean
  ativo: boolean
  children?: ReactNode
}) {
  return (
    <li
      className={cn(
        'rounded-xl border bg-card p-5 shadow-sm transition-opacity duration-base sm:p-6',
        ativo ? 'border-ink-200/80' : 'border-dashed border-ink-200 opacity-60 shadow-none',
      )}
      aria-current={ativo && !concluido ? 'step' : undefined}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors',
            concluido ? 'bg-success-600 text-white' : ativo ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-600',
          )}
        >
          {concluido ? <Check className="h-4 w-4" strokeWidth={3} aria-label="Concluído" /> : numero}
        </span>
        <div className="min-w-0 flex-1 space-y-1 pt-1">
          <h2 className="font-semibold text-foreground">{titulo}</h2>
          {descricao && ativo && <p className="text-sm text-muted-foreground">{descricao}</p>}
        </div>
      </div>
      {ativo && children && <div className="mt-4 sm:pl-11">{children}</div>}
    </li>
  )
}

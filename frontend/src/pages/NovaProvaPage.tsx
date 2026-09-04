import { ChevronLeft, Loader2, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { listarDecks, type Deck } from '@/api/deckApi'
import { listarFlashcards, type Flashcard } from '@/api/flashcardApi'
import { ESTILOS_PROVA, gerarProva, type EstiloProva } from '@/api/provaApi'
import type { Quiz, ResultadoTentativa } from '@/api/quizApi'
import { responderTentativa } from '@/api/quizApi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { QuestaoQuizItem } from '@/components/QuestaoQuizItem'
import { RevisaoProvaQuestao } from '@/components/RevisaoProvaQuestao'
import { classificarPontuacao } from '@/utils/classificarPontuacao'
import { cn } from '@/lib/utils'

type Fase = 'configurar' | 'fazendo' | 'resultado'

// UC27 - Gerar prova personalizada via IA: escolher deck + flashcard(s) +
// estilo, responder (reaproveitando QuestaoQuizItem/POST .../tentativas de
// UC10) e ver o resultado com revisao questao a questao (RN36).
export function NovaProvaPage() {
  const navigate = useNavigate()

  const [fase, setFase] = useState<Fase>('configurar')

  const [decks, setDecks] = useState<Deck[] | null>(null)
  const [deckId, setDeckId] = useState<number | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null)
  const [carregandoFlashcards, setCarregandoFlashcards] = useState(false)
  const [flashcardIdsSelecionados, setFlashcardIdsSelecionados] = useState<number[]>([])
  const [estilo, setEstilo] = useState<EstiloProva | null>(null)
  const [gerando, setGerando] = useState(false)

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [respostas, setRespostas] = useState<Record<number, string>>({})
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoTentativa | null>(null)

  const carregarDecks = useCallback(async () => {
    try {
      setDecks(await listarDecks())
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível carregar seus decks.'))
    }
  }, [])

  useEffect(() => {
    void carregarDecks()
  }, [carregarDecks])

  async function aoEscolherDeck(idTexto: string) {
    const id = Number(idTexto)
    setDeckId(id)
    setFlashcardIdsSelecionados([])
    setCarregandoFlashcards(true)

    try {
      setFlashcards(await listarFlashcards(id))
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível carregar os flashcards deste deck.'))
    } finally {
      setCarregandoFlashcards(false)
    }
  }

  function alternarFlashcard(id: number) {
    setFlashcardIdsSelecionados((atual) => (atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id]))
  }

  async function aoGerarProva() {
    if (deckId === null || estilo === null || flashcardIdsSelecionados.length === 0) {
      return
    }

    setGerando(true)

    try {
      const novoQuiz = await gerarProva(deckId, { flashcardIds: flashcardIdsSelecionados, estilo })
      setQuiz(novoQuiz)
      setRespostas({})
      setFase('fazendo')
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível gerar a prova. Tente novamente.'))
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

    try {
      const payload = quiz.questoes.map((questao) => ({
        questaoId: questao.id,
        alternativaEscolhida: respostas[questao.id],
      }))
      setResultado(await responderTentativa(quiz.id, payload))
      setFase('resultado')
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível enviar suas respostas. Tente novamente.'))
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
  }

  if (fase === 'resultado' && resultado !== null) {
    const { icone: Icone, cores } = classificarPontuacao(resultado.pontuacao)

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className={cn('flex flex-col items-center gap-3 rounded-none border py-10 text-center', cores.borda, cores.fundo)}>
          <div className={cn('rounded-full p-4', cores.iconeFundo)}>
            <Icone className={cn('h-8 w-8', cores.icone)} />
          </div>
          <div className="space-y-1">
            <p className={cn('text-3xl font-bold', cores.texto)}>{resultado.pontuacao}%</p>
            <p className={cn('text-sm', cores.textoSecundario)}>
              Você acertou {resultado.acertos} de {resultado.total} questões
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={comecarNovaProva}>
              Nova prova
            </Button>
            <Button variant="outline" onClick={() => navigate('/provas')}>
              Ver histórico
            </Button>
          </div>
        </div>

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

    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-medium">{quiz.titulo}</h1>
          <span className="text-sm text-muted-foreground">
            {totalRespondidas} de {quiz.questoes.length} respondidas
          </span>
        </div>

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

        <div className="flex justify-end border-t pt-4">
          <Button onClick={() => void aoEnviarRespostas()} disabled={!todasRespondidas || enviando}>
            {enviando ? 'Enviando...' : 'Enviar respostas'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/provas" className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
          <ChevronLeft className="h-4 w-4" />
          Voltar para provas
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-semibold">Nova prova</h1>
        <p className="text-muted-foreground">Escolha os flashcards e o estilo. A IA cria questões inéditas sobre o tema.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">1. Escolha o deck</CardTitle>
        </CardHeader>
        <CardContent>
          {decks === null ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={deckId !== null ? String(deckId) : undefined} onValueChange={(valor) => void aoEscolherDeck(valor)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um deck" />
              </SelectTrigger>
              <SelectContent>
                {decks.map((deck) => (
                  <SelectItem key={deck.id} value={String(deck.id)}>
                    {deck.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {deckId !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">2. Escolha os flashcards</CardTitle>
            <CardDescription>As questões serão sobre o tema deles, inéditas, sem repetir pergunta/resposta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {carregandoFlashcards && (
              <>
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </>
            )}

            {!carregandoFlashcards && flashcards !== null && flashcards.length === 0 && (
              <p className="text-sm text-muted-foreground">Este deck ainda não tem flashcards.</p>
            )}

            {!carregandoFlashcards &&
              flashcards !== null &&
              flashcards.map((flashcard) => (
                <label
                  key={flashcard.id}
                  className="flex items-start gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent"
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={flashcardIdsSelecionados.includes(flashcard.id)}
                    onCheckedChange={() => alternarFlashcard(flashcard.id)}
                  />
                  {flashcard.pergunta}
                </label>
              ))}
          </CardContent>
        </Card>
      )}

      {deckId !== null && flashcardIdsSelecionados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">3. Escolha o estilo da prova</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {ESTILOS_PROVA.map((opcao) => (
              <button
                key={opcao.valor}
                type="button"
                onClick={() => setEstilo(opcao.valor)}
                className={cn(
                  'rounded-lg border p-3 text-left transition-colors',
                  estilo === opcao.valor ? 'border-primary bg-primary/5' : 'hover:bg-accent',
                )}
              >
                <p className="font-medium">{opcao.rotulo}</p>
                <p className="text-xs text-muted-foreground">{opcao.descricao}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {estilo !== null && (
        <Button size="lg" className="gap-2" onClick={() => void aoGerarProva()} disabled={gerando}>
          {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {gerando ? 'Gerando prova...' : 'Gerar prova'}
        </Button>
      )}
    </div>
  )
}

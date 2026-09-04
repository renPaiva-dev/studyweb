import { HelpCircle, Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { gerarQuiz, responderTentativa, type Quiz, type ResultadoTentativa } from '@/api/quizApi'
import { Button } from '@/components/ui/button'
import { QuestaoQuizItem } from '@/components/QuestaoQuizItem'
import { ResultadoQuiz } from '@/components/ResultadoQuiz'
import { useDefinirMargem } from '@/context/MargemContext'

interface QuizTabProps {
  deckId: number
}

// UC10 (extensao de escopo) - quiz de multipla escolha gerado a partir
// dos flashcards do deck. POST /api/decks/{id}/quizzes gera as questoes;
// POST /api/quizzes/{id}/tentativas envia as respostas de uma vez (RN15:
// so pontua se todas as questoes forem respondidas, por isso o botao de
// envio fica desabilitado ate responder tudo).
export function QuizTab({ deckId }: QuizTabProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [gerando, setGerando] = useState(false)
  const [respostas, setRespostas] = useState<Record<number, string>>({})
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoTentativa | null>(null)

  async function aoGerarQuiz() {
    setGerando(true)

    try {
      const novoQuiz = await gerarQuiz(deckId)
      setQuiz(novoQuiz)
      setRespostas({})
      setResultado(null)
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível gerar o quiz. Tente novamente.'))
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
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível enviar suas respostas. Tente novamente.'))
    } finally {
      setEnviando(false)
    }
  }

  const totalRespondidasParaMargem = quiz?.questoes.filter((questao) => respostas[questao.id] !== undefined).length ?? 0

  useDefinirMargem(
    quiz && resultado === null ? (
      <div className="space-y-1 text-sm">
        <p className="font-heading text-2xl font-semibold">
          {totalRespondidasParaMargem}/{quiz.questoes.length}
        </p>
        <p className="text-muted-foreground">questões respondidas</p>
      </div>
    ) : null,
    quiz && resultado === null ? (
      <p className="text-center text-sm font-medium">
        {totalRespondidasParaMargem}/{quiz.questoes.length} respondidas
      </p>
    ) : null,
    [quiz, resultado, totalRespondidasParaMargem],
  )

  if (resultado !== null) {
    return <ResultadoQuiz resultado={resultado} onNovoQuiz={() => void aoGerarQuiz()} />
  }

  if (quiz === null) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-none border border-dashed py-16 text-center">
        <div className="rounded-full bg-primary/10 p-3">
          <HelpCircle className="h-6 w-6 text-primary" />
        </div>
        <p className="font-medium">Teste seus conhecimentos</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Gere um quiz de múltipla escolha com base nos flashcards deste deck (mínimo de 4 flashcards).
        </p>
        <Button onClick={() => void aoGerarQuiz()} disabled={gerando}>
          {gerando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {gerando ? 'Gerando quiz...' : 'Gerar quiz'}
        </Button>
      </div>
    )
  }

  const totalRespondidas = quiz.questoes.filter((questao) => respostas[questao.id] !== undefined).length
  const todasRespondidas = totalRespondidas === quiz.questoes.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{quiz.titulo}</h2>
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

import { HelpCircle, Send, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { extrairMensagemErro } from '@/api/apiError'
import { gerarQuiz, responderTentativa, type Quiz, type ResultadoTentativa } from '@/api/quizApi'
import { NotaMargem } from '@/components/NotaMargem'
import { QuestaoQuizItem } from '@/components/QuestaoQuizItem'
import { ResultadoQuiz } from '@/components/ResultadoQuiz'
import { RevisaoProvaQuestao } from '@/components/RevisaoProvaQuestao'
import { Alerta } from '@/components/ui/alerta'
import { Button } from '@/components/ui/button'
import { EstadoVazio } from '@/components/ui/estados'
import { Progress } from '@/components/ui/progress'
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
  const [erro, setErro] = useState<string | null>(null)

  async function aoGerarQuiz() {
    if (gerando) return
    setGerando(true)
    setErro(null)

    try {
      const novoQuiz = await gerarQuiz(deckId)
      setQuiz(novoQuiz)
      setRespostas({})
      setResultado(null)
    } catch (erroCapturado) {
      setErro(extrairMensagemErro(erroCapturado, 'Não foi possível gerar o quiz. Tente novamente.'))
    } finally {
      setGerando(false)
    }
  }

  function selecionarResposta(questaoId: number, alternativa: string) {
    setRespostas((atual) => ({ ...atual, [questaoId]: alternativa }))
  }

  async function aoEnviarRespostas() {
    if (quiz === null || enviando) {
      return
    }

    setEnviando(true)
    setErro(null)

    try {
      const payload = quiz.questoes.map((questao) => ({
        questaoId: questao.id,
        alternativaEscolhida: respostas[questao.id],
      }))
      setResultado(await responderTentativa(quiz.id, payload))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (erroCapturado) {
      setErro(extrairMensagemErro(erroCapturado, 'Não foi possível enviar suas respostas. Tente novamente.'))
    } finally {
      setEnviando(false)
    }
  }

  const totalRespondidasParaMargem = quiz?.questoes.filter((questao) => respostas[questao.id] !== undefined).length ?? 0

  useDefinirMargem(
    quiz && resultado === null ? (
      <NotaMargem
        valor={
          <>
            {totalRespondidasParaMargem}
            <span className="text-ink-400">/{quiz.questoes.length}</span>
          </>
        }
        rotulo="questões respondidas"
      >
        <Progress value={(totalRespondidasParaMargem / quiz.questoes.length) * 100} aria-label="Questões respondidas" />
      </NotaMargem>
    ) : null,
    quiz && resultado === null ? (
      <div className="flex items-center gap-3">
        <Progress value={(totalRespondidasParaMargem / quiz.questoes.length) * 100} className="h-1.5" aria-label="Questões respondidas" />
        <p className="shrink-0 text-sm font-semibold tabular-nums">
          {totalRespondidasParaMargem}/{quiz.questoes.length}
        </p>
      </div>
    ) : null,
    [quiz, resultado, totalRespondidasParaMargem],
  )

  if (resultado !== null) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <ResultadoQuiz resultado={resultado} onNovoQuiz={() => void aoGerarQuiz()} carregandoNovo={gerando} />
        {erro && <Alerta variante="erro">{erro}</Alerta>}
        {resultado.questoes.length > 0 && (
          <>
            <h3 className="pt-4 font-heading text-h3 text-foreground">Correção questão a questão</h3>
            <div className="space-y-3">
              {resultado.questoes.map((questao, indice) => (
                <RevisaoProvaQuestao key={questao.questaoId} questao={questao} numero={indice + 1} />
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  if (quiz === null) {
    return (
      <div className="space-y-4">
        <EstadoVazio
          icone={HelpCircle}
          titulo="Teste seus conhecimentos"
          descricao="Gere um quiz de múltipla escolha com base nos flashcards deste deck. É preciso ter pelo menos 4 flashcards."
          acao={
            <Button onClick={() => void aoGerarQuiz()} loading={gerando}>
              <Sparkles />
              {gerando ? 'Gerando quiz...' : 'Gerar quiz'}
            </Button>
          }
        />
        {erro && <Alerta variante="erro">{erro}</Alerta>}
      </div>
    )
  }

  const totalRespondidas = quiz.questoes.filter((questao) => respostas[questao.id] !== undefined).length
  const todasRespondidas = totalRespondidas === quiz.questoes.length
  const faltam = quiz.questoes.length - totalRespondidas

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-h3 text-foreground">{quiz.titulo}</h2>
        <span className="text-sm font-medium text-ink-600" aria-live="polite">
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

      {erro && <Alerta variante="erro">{erro}</Alerta>}

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

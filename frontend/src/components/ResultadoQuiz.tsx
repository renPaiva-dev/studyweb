import { RotateCcw } from 'lucide-react'

import type { ResultadoTentativa } from '@/api/quizApi'
import { Button } from '@/components/ui/button'
import { classificarPontuacao } from '@/utils/classificarPontuacao'
import { cn } from '@/lib/utils'

interface ResultadoQuizProps {
  resultado: ResultadoTentativa
  onNovoQuiz: () => void
}

// UC10 - tela de resultado apos POST /api/quizzes/{id}/tentativas.
// Pontuacao (0-100) e acertos/total vem prontos do backend.
export function ResultadoQuiz({ resultado, onNovoQuiz }: ResultadoQuizProps) {
  const { icone: Icone, cores } = classificarPontuacao(resultado.pontuacao)

  return (
    <div className={cn('flex flex-col items-center gap-3 rounded-none border py-16 text-center', cores.borda, cores.fundo)}>
      <div className={cn('rounded-full p-4', cores.iconeFundo)}>
        <Icone className={cn('h-8 w-8', cores.icone)} />
      </div>
      <div className="space-y-1">
        <p className={cn('text-3xl font-bold', cores.texto)}>{resultado.pontuacao}%</p>
        <p className={cn('text-sm', cores.textoSecundario)}>
          Você acertou {resultado.acertos} de {resultado.total} questões
        </p>
      </div>
      <Button variant="outline" onClick={onNovoQuiz}>
        <RotateCcw className="mr-2 h-4 w-4" />
        Gerar novo quiz
      </Button>
    </div>
  )
}

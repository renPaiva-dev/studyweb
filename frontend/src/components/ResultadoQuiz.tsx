import { Award, RotateCcw, ThumbsUp, TrendingDown } from 'lucide-react'

import type { ResultadoTentativa } from '@/api/quizApi'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ResultadoQuizProps {
  resultado: ResultadoTentativa
  onNovoQuiz: () => void
}

// UC10 - tela de resultado apos POST /api/quizzes/{id}/tentativas.
// Pontuacao (0-100) e acertos/total vem prontos do backend.
export function ResultadoQuiz({ resultado, onNovoQuiz }: ResultadoQuizProps) {
  const { icone: Icone, cores } = classificar(resultado.pontuacao)

  return (
    <div className={cn('flex flex-col items-center gap-3 rounded-xl border py-16 text-center', cores.borda, cores.fundo)}>
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

function classificar(pontuacao: number) {
  if (pontuacao >= 70) {
    return {
      icone: Award,
      cores: {
        borda: 'border-emerald-200 dark:border-emerald-900',
        fundo: 'bg-emerald-50/60 dark:bg-emerald-950/20',
        iconeFundo: 'bg-emerald-100 dark:bg-emerald-900/40',
        icone: 'text-emerald-600 dark:text-emerald-400',
        texto: 'text-emerald-800 dark:text-emerald-300',
        textoSecundario: 'text-emerald-700/80 dark:text-emerald-400/80',
      },
    }
  }

  if (pontuacao >= 40) {
    return {
      icone: ThumbsUp,
      cores: {
        borda: 'border-amber-200 dark:border-amber-900',
        fundo: 'bg-amber-50/60 dark:bg-amber-950/20',
        iconeFundo: 'bg-amber-100 dark:bg-amber-900/40',
        icone: 'text-amber-600 dark:text-amber-400',
        texto: 'text-amber-800 dark:text-amber-300',
        textoSecundario: 'text-amber-700/80 dark:text-amber-400/80',
      },
    }
  }

  return {
    icone: TrendingDown,
    cores: {
      borda: 'border-red-200 dark:border-red-900',
      fundo: 'bg-red-50/60 dark:bg-red-950/20',
      iconeFundo: 'bg-red-100 dark:bg-red-900/40',
      icone: 'text-red-600 dark:text-red-400',
      texto: 'text-red-800 dark:text-red-300',
      textoSecundario: 'text-red-700/80 dark:text-red-400/80',
    },
  }
}

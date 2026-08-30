import { Award, ThumbsUp, TrendingDown, type LucideIcon } from 'lucide-react'

// UC10/UC27 - classificacao visual (icone + cores) de uma pontuacao 0-100,
// reaproveitada em ResultadoQuiz e NovaProvaPage para nao duplicar os
// mesmos limiares/cores em dois lugares.
export interface ClassificacaoPontuacao {
  icone: LucideIcon
  cores: {
    borda: string
    fundo: string
    iconeFundo: string
    icone: string
    texto: string
    textoSecundario: string
  }
}

export function classificarPontuacao(pontuacao: number): ClassificacaoPontuacao {
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

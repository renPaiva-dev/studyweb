import type { ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'

import type { ResultadoTentativa } from '@/api/quizApi'
import { AnelPontuacao } from '@/components/AnelPontuacao'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { classificarPontuacao } from '@/utils/classificarPontuacao'

interface ResultadoQuizProps {
  resultado: ResultadoTentativa
  onNovoQuiz?: () => void
  /** Substitui o botao padrao "Gerar novo quiz" (ex.: NovaProvaPage). */
  acoes?: ReactNode
  carregandoNovo?: boolean
}

// UC10/UC27 - placar apos POST /api/quizzes/{id}/tentativas.
// Pontuacao (0-100) e acertos/total vem prontos do backend.
export function ResultadoQuiz({ resultado, onNovoQuiz, acoes, carregandoNovo }: ResultadoQuizProps) {
  const { icone: Icone, cores, rotulo } = classificarPontuacao(resultado.pontuacao)

  return (
    <div
      role="status"
      className={cn('flex flex-col items-center gap-5 rounded-2xl border px-6 py-10 text-center animate-entrada sm:flex-row sm:text-left', cores.borda, cores.fundo)}
    >
      <AnelPontuacao pontuacao={resultado.pontuacao} tamanho={112} espessura={10} />
      <div className="flex-1 space-y-1.5">
        <p className={cn('inline-flex items-center gap-2 font-heading text-h2', cores.textoSecundario)}>
          <Icone className={cn('h-6 w-6', cores.icone)} aria-hidden="true" />
          {rotulo}
        </p>
        <p className={cn('text-base', cores.textoSecundario)}>
          Você acertou <strong className="tabular-nums">{resultado.acertos}</strong> de{' '}
          <strong className="tabular-nums">{resultado.total}</strong> questões.
        </p>
        <div className="flex flex-col gap-2 pt-3 sm:flex-row">
          {acoes ?? (
            <Button variant="outline" onClick={onNovoQuiz} loading={carregandoNovo}>
              <RotateCcw />
              Gerar novo quiz
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

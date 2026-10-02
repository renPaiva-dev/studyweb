import { ChevronRight, Sparkles } from 'lucide-react'

import { ESTILOS_PROVA, type HistoricoProvaResumo } from '@/api/provaApi'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { aoAtivarComTeclado } from '@/components/Monograma'
import { AnelPontuacao } from '@/components/AnelPontuacao'

interface HistoricoProvaCardProps {
  tentativa: HistoricoProvaResumo
  onAbrir: () => void
}

// UC28/RN36 - um item da lista de historico de provas. Clicar (ou Enter/
// Espaco) navega para o detalhe (revisao questao a questao).
export function HistoricoProvaCard({ tentativa, onAbrir }: HistoricoProvaCardProps) {
  const rotuloEstilo = ESTILOS_PROVA.find((estilo) => estilo.valor === tentativa.estilo)?.rotulo
  const data = new Date(tentativa.dataTentativa)

  return (
    <Card
      interactive
      onClick={onAbrir}
      onKeyDown={aoAtivarComTeclado(onAbrir)}
      role="link"
      tabIndex={0}
      aria-label={`${tentativa.titulo}, ${tentativa.pontuacao}% de acerto. Ver revisão`}
      className="group flex items-center gap-4 p-4 sm:p-5"
    >
      <AnelPontuacao pontuacao={tentativa.pontuacao} tamanho={52} />

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="min-w-0 truncate font-semibold text-foreground">{tentativa.titulo}</p>
          {tentativa.origem === 'IA_PERSONALIZADA' && (
            <Badge variant="default" className="shrink-0">
              <Sparkles />
              {rotuloEstilo}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          <time dateTime={tentativa.dataTentativa}>
            {data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} às{' '}
            {data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </time>
          <span aria-hidden="true"> · </span>
          <span className="tabular-nums">
            {tentativa.acertos} de {tentativa.total} questões
          </span>
        </p>
      </div>

      <ChevronRight className="h-5 w-5 shrink-0 text-ink-400 transition-transform duration-fast group-hover:translate-x-0.5 group-hover:text-ink-700" />
    </Card>
  )
}

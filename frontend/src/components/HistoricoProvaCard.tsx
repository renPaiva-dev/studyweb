import { ChevronRight, Sparkles } from 'lucide-react'

import { ESTILOS_PROVA, type HistoricoProvaResumo } from '@/api/provaApi'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { classificarPontuacao } from '@/utils/classificarPontuacao'

interface HistoricoProvaCardProps {
  tentativa: HistoricoProvaResumo
  onAbrir: () => void
}

// UC28/RN36 - um item da lista de historico de provas. Clicar navega para
// o detalhe (revisao questao a questao).
export function HistoricoProvaCard({ tentativa, onAbrir }: HistoricoProvaCardProps) {
  const rotuloEstilo = ESTILOS_PROVA.find((estilo) => estilo.valor === tentativa.estilo)?.rotulo
  const { cores } = classificarPontuacao(tentativa.pontuacao)

  return (
    <Card interactive onClick={onAbrir} role="button" tabIndex={0}>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{tentativa.titulo}</p>
            {tentativa.origem === 'IA_PERSONALIZADA' && (
              <Badge variant="secondary" className="gap-1 shrink-0">
                <Sparkles className="h-3 w-3" />
                {rotuloEstilo}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(tentativa.dataTentativa).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}, {tentativa.acertos}{' '}
            de {tentativa.total} questões
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <p className={`text-2xl font-bold ${cores.texto}`}>{tentativa.pontuacao}%</p>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}

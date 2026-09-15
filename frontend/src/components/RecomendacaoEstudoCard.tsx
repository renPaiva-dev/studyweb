import { Loader2, Sparkles, Target } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { gerarRecomendacaoEstudo, type RecomendacaoEstudo } from '@/api/recomendacaoApi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RecomendacaoEstudoCardProps {
  deckId: number
}

// UC13 - recomendação de foco de estudo (RN18). Sob demanda (POST, não
// carrega sozinho no mount do dashboard) - cada clique é uma chamada real à
// IA, então só dispara quando o estudante pede. Mesmo padrão de
// carregando/erro do "Não entendi, explique melhor" (UC14, ver
// FlashcardEstudoCard).
export function RecomendacaoEstudoCard({ deckId }: RecomendacaoEstudoCardProps) {
  const [carregando, setCarregando] = useState(false)
  const [recomendacao, setRecomendacao] = useState<RecomendacaoEstudo | null>(null)

  async function aoPedirRecomendacao() {
    setCarregando(true)

    try {
      setRecomendacao(await gerarRecomendacaoEstudo(deckId))
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível gerar uma recomendação agora. Tente novamente.'))
    } finally {
      setCarregando(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
        <Target className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium text-muted-foreground">Onde focar agora</CardTitle>
      </CardHeader>
      <CardContent>
        {recomendacao === null ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              A IA olha os tópicos com mais flashcards em risco neste deck e sugere por onde retomar o estudo.
            </p>
            <Button size="sm" onClick={() => void aoPedirRecomendacao()} disabled={carregando}>
              {carregando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Target className="mr-2 h-4 w-4" />}
              {carregando ? 'Analisando seus tópicos...' : 'Ver recomendação de foco'}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {recomendacao.baseadoEmDados && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Foco sugerido: {recomendacao.topicoFoco}
              </div>
            )}
            <p className="text-sm">{recomendacao.recomendacao}</p>
            <Button size="sm" variant="ghost" onClick={() => void aoPedirRecomendacao()} disabled={carregando}>
              {carregando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Atualizar recomendação
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

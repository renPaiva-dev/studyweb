import { Lightbulb, Loader2, MessageCircleQuestion, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import type { ItemFilaEstudo } from '@/api/estudoApi'
import { gerarExplicacao, type Explicacao } from '@/api/explicacaoApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface FlashcardEstudoCardProps {
  item: ItemFilaEstudo
  virado: boolean
}

// UC07/UC08 - cartao de estudo com efeito flip (rotateY em CSS puro, sem
// dependencia extra). A face da frente mostra a pergunta; virar revela a
// resposta e o mnemonico (UC06), quando houver. UC14 - na face da
// resposta, "Não entendi, explique melhor" pede uma explicação
// alternativa via IA (RN19), ancorada no material de origem quando
// disponível (sinalizado pelo badge). O pai deve passar `key={flashcardId}`
// para este componente, garantindo que o estado da explicação não vaze de
// um flashcard para o próximo.
export function FlashcardEstudoCard({ item, virado }: FlashcardEstudoCardProps) {
  const [carregandoExplicacao, setCarregandoExplicacao] = useState(false)
  const [explicacao, setExplicacao] = useState<Explicacao | null>(null)

  async function aoPedirExplicacao() {
    setCarregandoExplicacao(true)

    try {
      setExplicacao(await gerarExplicacao(item.flashcardId))
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível gerar uma explicação agora. Tente novamente.'))
    } finally {
      setCarregandoExplicacao(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl" style={{ perspective: '1600px' }}>
      <div
        className="relative h-80 w-full transition-transform duration-500 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: virado ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl border bg-card p-8 text-center shadow-lg"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <Badge variant="outline">Pergunta</Badge>
          <p className="text-xl font-semibold">{item.pergunta}</p>
        </div>

        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-y-auto rounded-2xl border bg-card p-8 text-center shadow-lg"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <Badge className="bg-brand-600 hover:bg-brand-600">Resposta</Badge>
          <p className="text-xl font-semibold">{item.resposta}</p>
          {item.mnemonico && (
            <div className="flex items-start gap-1.5 rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{item.mnemonico}</span>
            </div>
          )}

          {explicacao ? (
            <div className="space-y-1.5 rounded-md bg-muted/60 px-3 py-2 text-left text-sm">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                {explicacao.ancoradaNoMaterial ? 'Explicação baseada no seu material' : 'Explicação da IA'}
              </div>
              <p>{explicacao.explicacao}</p>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => void aoPedirExplicacao()} disabled={carregandoExplicacao}>
              {carregandoExplicacao ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MessageCircleQuestion className="mr-2 h-4 w-4" />
              )}
              {carregandoExplicacao ? 'Gerando explicação...' : 'Não entendi, explique melhor'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

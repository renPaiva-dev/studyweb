import { Lightbulb, Loader2, MessageCircleQuestion, Sparkles } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import type { ItemFilaEstudo } from '@/api/estudoApi'
import { gerarExplicacao, type Explicacao } from '@/api/explicacaoApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface FlashcardEstudoCardProps {
  item: ItemFilaEstudo
  virado: boolean
  // Quando informado, o mnemonico (UC06) e a explicacao sob demanda (UC14)
  // deixam de ser renderizados dentro do proprio cartao e sao reportados ao
  // componente pai via este callback - usado por EstudarTab para exibi-los
  // na margem de anotacao, em vez de empilhados no cartao. Sem esse prop
  // (ex.: DeckCompartilhadoPage, visao publica sem coluna de margem), o
  // comportamento original (notas dentro do proprio cartao) e mantido.
  onNotasChange?: (notas: ReactNode | null) => void
}

// UC07/UC08 - cartao de estudo com efeito flip (rotateY em CSS puro, sem
// dependencia extra). A face da frente mostra a pergunta; virar revela a
// resposta. UC14 - "Não entendi, explique melhor" pede uma explicação
// alternativa via IA (RN19), ancorada no material de origem quando
// disponível. O pai deve passar `key={flashcardId}` para este componente,
// garantindo que o estado da explicação não vaze de um flashcard para o
// próximo.
export function FlashcardEstudoCard({ item, virado, onNotasChange }: FlashcardEstudoCardProps) {
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

  const notas = (
    <div className="space-y-3">
      {item.mnemonico && (
        <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{item.mnemonico}</span>
        </div>
      )}

      {explicacao ? (
        <div className="space-y-1.5 text-sm">
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
  )

  // Notas so aparecem depois de virar o card - do contrario o mnemonico
  // entregaria a resposta antes da tentativa de recordar.
  useEffect(() => {
    onNotasChange?.(virado ? notas : null)
    // notas e recriado a cada render (JSX novo); a dependencia real e o
    // conteudo que a compoe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onNotasChange, virado, item.mnemonico, explicacao, carregandoExplicacao])

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
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-none border bg-card p-8 text-center"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <Badge variant="outline">Pergunta</Badge>
          <p className="max-w-[38ch] text-xl font-semibold">{item.pergunta}</p>
        </div>

        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-y-auto rounded-none border bg-card p-8 text-center"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <Badge>Resposta</Badge>
          <p className="max-w-[38ch] text-xl font-semibold">{item.resposta}</p>
          {!onNotasChange && notas}
        </div>
      </div>
    </div>
  )
}

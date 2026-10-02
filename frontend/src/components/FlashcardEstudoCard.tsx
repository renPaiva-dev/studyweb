import { Lightbulb, MessageCircleQuestion, Sparkles } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

import { extrairMensagemErro } from '@/api/apiError'
import type { ItemFilaEstudo } from '@/api/estudoApi'
import { gerarExplicacao, type Explicacao } from '@/api/explicacaoApi'
import { Alerta } from '@/components/ui/alerta'
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
  // UC14 so vale para o dono do flashcard (RN01: o endpoint devolve 404/401
  // para qualquer outro). A visao publica (UC24) passa false para nao
  // oferecer um botao que levaria o visitante para o login.
  permitirExplicacao?: boolean
}

// UC07/UC08 - cartao de estudo com efeito flip (rotateY em CSS puro, sem
// dependencia extra). A face da frente mostra a pergunta; virar revela a
// resposta. UC14 - "Não entendi, explique melhor" pede uma explicação
// alternativa via IA (RN19), ancorada no material de origem quando
// disponível. O pai deve passar `key={flashcardId}` para este componente,
// garantindo que o estado da explicação não vaze de um flashcard para o
// próximo.
export function FlashcardEstudoCard({ item, virado, onNotasChange, permitirExplicacao = true }: FlashcardEstudoCardProps) {
  const [carregandoExplicacao, setCarregandoExplicacao] = useState(false)
  const [carregandoExplicacaoDemorando, setCarregandoExplicacaoDemorando] = useState(false)
  const [explicacao, setExplicacao] = useState<Explicacao | null>(null)
  const [erroExplicacao, setErroExplicacao] = useState<string | null>(null)

  // N4 (Docs/auditoria-coerencia-seguranca-2026-09.md): o backend tenta a
  // chamada a IA ate 2x antes de desistir - mesmo padrao de MaterialItem.tsx.
  useEffect(() => {
    if (!carregandoExplicacao) {
      setCarregandoExplicacaoDemorando(false)
      return
    }

    const temporizador = setTimeout(() => setCarregandoExplicacaoDemorando(true), 15_000)
    return () => clearTimeout(temporizador)
  }, [carregandoExplicacao])

  async function aoPedirExplicacao() {
    setCarregandoExplicacao(true)
    setErroExplicacao(null)

    try {
      setExplicacao(await gerarExplicacao(item.flashcardId))
    } catch (erro) {
      setErroExplicacao(extrairMensagemErro(erro, 'Não foi possível gerar uma explicação agora. Tente novamente.'))
    } finally {
      setCarregandoExplicacao(false)
    }
  }

  const notas = (
    <div className="space-y-4 text-left">
      {item.mnemonico && (
        <div className="flex items-start gap-2 rounded-lg bg-brand-50 px-3 py-2.5 text-sm text-brand-900 ring-1 ring-inset ring-brand-100">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
          <span>
            <span className="font-semibold">Dica: </span>
            {item.mnemonico}
          </span>
        </div>
      )}

      {explicacao ? (
        <div className="space-y-1.5 text-sm animate-entrada">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-800">
            <Sparkles className="h-3.5 w-3.5" />
            {explicacao.ancoradaNoMaterial ? 'Explicação baseada no seu material' : 'Explicação da IA'}
          </div>
          <p className="leading-relaxed text-foreground">{explicacao.explicacao}</p>
        </div>
      ) : (
        permitirExplicacao && (
          <div className="space-y-2">
            <Button size="sm" variant="outline" onClick={() => void aoPedirExplicacao()} loading={carregandoExplicacao}>
              <MessageCircleQuestion />
              {carregandoExplicacao ? 'Gerando explicação...' : 'Não entendi, explique melhor'}
            </Button>
            {carregandoExplicacaoDemorando ? (
              <p className="text-sm text-ink-600">Ainda gerando a explicação, pode levar um pouco mais que o normal...</p>
            ) : (
              !carregandoExplicacao && <p className="text-xs text-ink-600">Limitado a 10 gerações por minuto.</p>
            )}
            {erroExplicacao && <Alerta variante="erro">{erroExplicacao}</Alerta>}
          </div>
        )
      )}
    </div>
  )

  const temNotas = Boolean(item.mnemonico) || explicacao !== null || permitirExplicacao

  // Notas so aparecem depois de virar o card - do contrario o mnemonico
  // entregaria a resposta antes da tentativa de recordar.
  useEffect(() => {
    onNotasChange?.(virado ? notas : null)
    // notas e recriado a cada render (JSX novo); a dependencia real e o
    // conteudo que a compoe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onNotasChange, virado, item.mnemonico, explicacao, carregandoExplicacao, carregandoExplicacaoDemorando, erroExplicacao])

  return (
    <div className="mx-auto w-full max-w-xl" style={{ perspective: '1600px' }}>
      <div
        className="relative min-h-[18rem] w-full transition-transform duration-500 ease-suave sm:min-h-[20rem]"
        style={{
          transformStyle: 'preserve-3d',
          transform: virado ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <FaceCard rotulo="Pergunta" oculta={virado}>
          <p className="max-w-[34ch] font-heading text-h3 leading-snug text-foreground sm:text-h2">{item.pergunta}</p>
        </FaceCard>

        <FaceCard rotulo="Resposta" verso oculta={!virado}>
          <p className="max-w-[34ch] font-heading text-h3 leading-snug text-foreground sm:text-h2">{item.resposta}</p>
          {!onNotasChange && temNotas && <div className="mt-6 w-full max-w-md">{notas}</div>}
        </FaceCard>
      </div>
    </div>
  )
}

function FaceCard({ rotulo, verso, oculta, children }: { rotulo: string; verso?: boolean; oculta: boolean; children: ReactNode }) {
  return (
    <div
      aria-hidden={oculta}
      className="absolute inset-0 flex flex-col overflow-y-auto rounded-2xl border border-ink-200 bg-card shadow-lg"
      style={{ backfaceVisibility: 'hidden', transform: verso ? 'rotateY(180deg)' : undefined }}
    >
      {/* Pauta de caderno no topo - identidade "caderno ativamente corrigido". */}
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
        <span
          className={
            verso
              ? 'inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-brand-900'
              : 'inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-ink-700'
          }
        >
          {rotulo}
        </span>
        <span className="h-2.5 w-2.5 rounded-full bg-brand-400" aria-hidden="true" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center sm:px-10">{children}</div>
    </div>
  )
}

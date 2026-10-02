import { ArrowLeft, CheckCheck, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { confirmarSugestoes } from '@/api/flashcardApi'
import type { SugestaoFlashcard } from '@/api/materialApi'
import { CartaoSugestaoFlashcard, type SugestaoEditavel } from '@/components/CartaoSugestaoFlashcard'
import { Alerta } from '@/components/ui/alerta'
import { Button } from '@/components/ui/button'
import { EstadoVazio } from '@/components/ui/estados'

interface RevisaoSugestoesFlashcardsProps {
  deckId: number
  sugestoesIniciais: SugestaoFlashcard[]
  onConfirmado: () => void
  onCancelar: () => void
}

// UC05 - revisao das sugestoes geradas pela IA antes de confirmar (RN05:
// nada aqui esta salvo ainda). POST
// /api/decks/{id}/flashcards/confirmar-sugestoes envia so as aceitas.
export function RevisaoSugestoesFlashcards({
  deckId,
  sugestoesIniciais,
  onConfirmado,
  onCancelar,
}: RevisaoSugestoesFlashcardsProps) {
  const [sugestoes, setSugestoes] = useState<SugestaoEditavel[]>(() =>
    sugestoesIniciais.map((sugestao, indice) => ({ ...sugestao, id: indice, aceita: false })),
  )
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const totalAceitas = sugestoes.filter((sugestao) => sugestao.aceita).length
  const idsVazios = new Set(
    sugestoes.filter((sugestao) => sugestao.aceita && (!sugestao.pergunta.trim() || !sugestao.resposta.trim())).map((s) => s.id),
  )

  function atualizarSugestao(id: number, dados: Partial<Pick<SugestaoEditavel, 'pergunta' | 'resposta' | 'aceita'>>) {
    setErro(null)
    setSugestoes((atual) => atual.map((sugestao) => (sugestao.id === id ? { ...sugestao, ...dados } : sugestao)))
  }

  function descartarSugestao(id: number) {
    setSugestoes((atual) => atual.filter((sugestao) => sugestao.id !== id))
  }

  function aceitarTodas() {
    setSugestoes((atual) => atual.map((sugestao) => ({ ...sugestao, aceita: true })))
  }

  async function aoConfirmar() {
    if (confirmando) return
    const aceitas = sugestoes.filter((sugestao) => sugestao.aceita)

    if (aceitas.some((sugestao) => !sugestao.pergunta.trim() || !sugestao.resposta.trim())) {
      setErro('Uma sugestão aceita está com pergunta ou resposta vazia. Edite ou descarte antes de confirmar.')
      return
    }

    setConfirmando(true)
    setErro(null)

    try {
      await confirmarSugestoes(
        deckId,
        aceitas.map(({ pergunta, resposta, topico }) => ({
          pergunta: pergunta.trim(),
          resposta: resposta.trim(),
          topico,
          aceitar: true,
        })),
      )
      toast.success(`${aceitas.length} flashcard${aceitas.length === 1 ? '' : 's'} adicionado${aceitas.length === 1 ? '' : 's'} ao deck.`)
      onConfirmado()
    } catch (erroCapturado) {
      setErro(extrairMensagemErro(erroCapturado, 'Não foi possível salvar os flashcards selecionados. Tente novamente.'))
    } finally {
      setConfirmando(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-xl border border-brand-200 bg-brand-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-400 text-ink-950">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-foreground">Revise as {sugestoesIniciais.length} sugestões da IA</p>
            <p className="text-sm text-brand-900">
              Nada foi salvo ainda. Aceite, edite ou descarte cada sugestão antes de confirmar.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancelar} disabled={confirmando}>
            <ArrowLeft />
            Voltar
          </Button>
          {sugestoes.length > 0 && totalAceitas < sugestoes.length && (
            <Button variant="outline" onClick={aceitarTodas} disabled={confirmando}>
              <CheckCheck />
              Aceitar todas
            </Button>
          )}
        </div>
      </div>

      {sugestoes.length === 0 ? (
        <EstadoVazio
          icone={Sparkles}
          titulo="Todas as sugestões foram descartadas"
          descricao="Volte para os materiais e gere novamente, ou crie flashcards manualmente."
          acao={
            <Button variant="outline" onClick={onCancelar}>
              <ArrowLeft />
              Voltar para materiais
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {sugestoes.map((sugestao) => (
            <CartaoSugestaoFlashcard
              key={sugestao.id}
              sugestao={sugestao}
              invalida={idsVazios.has(sugestao.id) && erro !== null}
              onAtualizar={(dados) => atualizarSugestao(sugestao.id, dados)}
              onDescartar={() => descartarSugestao(sugestao.id)}
            />
          ))}
        </div>
      )}

      {/* Barra de confirmacao fixa no fim da lista - acompanha o scroll. */}
      <div className="sticky bottom-[calc(var(--altura-nav-mobile)+env(safe-area-inset-bottom)+0.75rem)] z-sticky space-y-3 rounded-xl border border-ink-200 bg-card/95 p-3 shadow-lg backdrop-blur md:bottom-4 sm:p-4">
        {erro && <Alerta variante="erro">{erro}</Alerta>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-700" aria-live="polite">
            <span className="font-semibold tabular-nums text-foreground">{totalAceitas}</span> de {sugestoes.length} selecionada
            {totalAceitas === 1 ? '' : 's'}
          </p>
          <Button onClick={() => void aoConfirmar()} loading={confirmando} disabled={totalAceitas === 0}>
            {confirmando ? 'Salvando...' : `Confirmar selecionados (${totalAceitas})`}
          </Button>
        </div>
      </div>
    </div>
  )
}

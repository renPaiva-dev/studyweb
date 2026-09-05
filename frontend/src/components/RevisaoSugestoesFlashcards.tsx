import { useState } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { confirmarSugestoes } from '@/api/flashcardApi'
import type { SugestaoFlashcard } from '@/api/materialApi'
import { Button } from '@/components/ui/button'
import { CartaoSugestaoFlashcard, type SugestaoEditavel } from '@/components/CartaoSugestaoFlashcard'

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

  const totalAceitas = sugestoes.filter((sugestao) => sugestao.aceita).length

  function atualizarSugestao(id: number, dados: Partial<Pick<SugestaoEditavel, 'pergunta' | 'resposta' | 'aceita'>>) {
    setSugestoes((atual) => atual.map((sugestao) => (sugestao.id === id ? { ...sugestao, ...dados } : sugestao)))
  }

  function descartarSugestao(id: number) {
    setSugestoes((atual) => atual.filter((sugestao) => sugestao.id !== id))
  }

  async function aoConfirmar() {
    const aceitas = sugestoes.filter((sugestao) => sugestao.aceita)

    if (aceitas.some((sugestao) => !sugestao.pergunta.trim() || !sugestao.resposta.trim())) {
      toast.error('Uma sugestão aceita está com pergunta ou resposta vazia. Edite ou descarte antes de confirmar.')
      return
    }

    setConfirmando(true)

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
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível salvar os flashcards selecionados.'))
    } finally {
      setConfirmando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">Revise as sugestões da IA</p>
          <p className="text-sm text-muted-foreground">
            Nada foi salvo ainda. Aceite, edite ou descarte cada sugestão antes de confirmar.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancelar} disabled={confirmando}>
          Cancelar
        </Button>
      </div>

      {sugestoes.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Todas as sugestões foram descartadas.</p>
      ) : (
        <div className="space-y-3">
          {sugestoes.map((sugestao) => (
            <CartaoSugestaoFlashcard
              key={sugestao.id}
              sugestao={sugestao}
              onAtualizar={(dados) => atualizarSugestao(sugestao.id, dados)}
              onDescartar={() => descartarSugestao(sugestao.id)}
            />
          ))}
        </div>
      )}

      <div className="flex justify-end border-t pt-4">
        <Button onClick={() => void aoConfirmar()} disabled={confirmando || totalAceitas === 0}>
          {confirmando ? 'Salvando...' : `Confirmar selecionados (${totalAceitas})`}
        </Button>
      </div>
    </div>
  )
}

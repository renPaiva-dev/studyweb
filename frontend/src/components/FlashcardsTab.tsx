import { Layers, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { extrairMensagemErro } from '@/api/apiError'
import { listarFlashcards, type Flashcard } from '@/api/flashcardApi'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ExcluirFlashcardDialog } from '@/components/ExcluirFlashcardDialog'
import { FlashcardFormDialog } from '@/components/FlashcardFormDialog'
import { FlashcardItem } from '@/components/FlashcardItem'
import { useDefinirMargem } from '@/context/MargemContext'

interface FlashcardsTabProps {
  deckId: number
}

// UC05/UC06 - aba "Flashcards" da visao geral do deck: lista os
// flashcards do deck (GET /api/decks/{id}/flashcards), permite criar
// manualmente (POST) e editar/excluir cada um (PUT/DELETE
// /api/flashcards/{id}) - docs/contrato-api.md.
export function FlashcardsTab({ deckId }: FlashcardsTabProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)

  const [dialogAberto, setDialogAberto] = useState(false)
  const [flashcardEditando, setFlashcardEditando] = useState<Flashcard | null>(null)
  const [flashcardExcluindo, setFlashcardExcluindo] = useState<Flashcard | null>(null)

  const carregarFlashcards = useCallback(async () => {
    setErroCarregamento(null)

    try {
      setFlashcards(await listarFlashcards(deckId))
    } catch (erro) {
      setErroCarregamento(extrairMensagemErro(erro, 'Não foi possível carregar os flashcards deste deck.'))
    }
  }, [deckId])

  useEffect(() => {
    void carregarFlashcards()
  }, [carregarFlashcards])

  function abrirNovoFlashcard() {
    setFlashcardEditando(null)
    setDialogAberto(true)
  }

  function abrirEdicaoFlashcard(flashcard: Flashcard) {
    setFlashcardEditando(flashcard)
    setDialogAberto(true)
  }

  const totalIA = flashcards?.filter((flashcard) => flashcard.origem === 'IA').length ?? 0
  const totalManual = flashcards?.filter((flashcard) => flashcard.origem === 'MANUAL').length ?? 0

  useDefinirMargem(
    flashcards && flashcards.length > 0 ? (
      <div className="space-y-1 text-sm">
        <p className="font-heading text-2xl font-semibold">{flashcards.length}</p>
        <p className="text-muted-foreground">
          {totalIA} da IA, {totalManual} manual{totalManual === 1 ? '' : 'is'}
        </p>
      </div>
    ) : null,
    null,
    [flashcards?.length, totalIA, totalManual],
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {flashcards === null ? 'Carregando flashcards...' : `${flashcards.length} flashcard${flashcards.length === 1 ? '' : 's'}`}
        </p>
        <Button size="sm" onClick={abrirNovoFlashcard}>
          <Plus className="mr-2 h-4 w-4" />
          Criar flashcard manual
        </Button>
      </div>

      {flashcards === null && erroCarregamento === null && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-none" />
          <Skeleton className="h-24 w-full rounded-none" />
        </div>
      )}

      {erroCarregamento !== null && (
        <div className="flex flex-col items-center gap-3 rounded-none border py-10 text-center">
          <p className="text-muted-foreground">{erroCarregamento}</p>
          <Button variant="outline" size="sm" onClick={() => void carregarFlashcards()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {flashcards !== null && flashcards.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-none border border-dashed py-16 text-center">
          <div className="rounded-full bg-primary/10 p-3">
            <Layers className="h-6 w-6 text-primary" />
          </div>
          <p className="font-medium">Nenhum flashcard ainda</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Crie um flashcard manualmente ou envie um PDF na aba "Materiais" para gerar sugestões via IA.
          </p>
        </div>
      )}

      {flashcards !== null && flashcards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {flashcards.map((flashcard) => (
            <FlashcardItem
              key={flashcard.id}
              flashcard={flashcard}
              onEditar={() => abrirEdicaoFlashcard(flashcard)}
              onExcluir={() => setFlashcardExcluindo(flashcard)}
            />
          ))}
        </div>
      )}

      <FlashcardFormDialog
        deckId={deckId}
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        flashcardParaEditar={flashcardEditando}
        onSalvo={() => void carregarFlashcards()}
      />

      <ExcluirFlashcardDialog
        flashcard={flashcardExcluindo}
        onOpenChange={(open) => {
          if (!open) setFlashcardExcluindo(null)
        }}
        onExcluido={() => void carregarFlashcards()}
      />
    </div>
  )
}

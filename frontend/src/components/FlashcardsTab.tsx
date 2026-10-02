import { FileText, Layers, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { extrairMensagemErro } from '@/api/apiError'
import { listarFlashcards, type Flashcard } from '@/api/flashcardApi'
import { ExcluirFlashcardDialog } from '@/components/ExcluirFlashcardDialog'
import { FlashcardFormDialog } from '@/components/FlashcardFormDialog'
import { FlashcardItem } from '@/components/FlashcardItem'
import { NotaMargem } from '@/components/NotaMargem'
import { Button } from '@/components/ui/button'
import { EstadoErro, EstadoVazio } from '@/components/ui/estados'
import { Carregando, Skeleton } from '@/components/ui/skeleton'
import { useDefinirMargem } from '@/context/MargemContext'

interface FlashcardsTabProps {
  deckId: number
  /** Atalho do estado vazio para a aba de Materiais (gerar via IA). */
  onIrParaMateriais?: () => void
}

// UC05/UC06 - aba "Flashcards" da visao geral do deck: lista os
// flashcards do deck (GET /api/decks/{id}/flashcards), permite criar
// manualmente (POST) e editar/excluir cada um (PUT/DELETE
// /api/flashcards/{id}) - docs/contrato-api.md.
export function FlashcardsTab({ deckId, onIrParaMateriais }: FlashcardsTabProps) {
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
      <NotaMargem
        valor={flashcards.length}
        rotulo={`flashcard${flashcards.length === 1 ? '' : 's'} neste deck`}
        detalhes={[
          { rotulo: 'Gerados pela IA', valor: totalIA },
          { rotulo: 'Criados por você', valor: totalManual },
        ]}
      />
    ) : null,
    null,
    [flashcards?.length, totalIA, totalManual],
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink-700" aria-live="polite">
          {flashcards === null
            ? 'Carregando flashcards...'
            : `${flashcards.length} flashcard${flashcards.length === 1 ? '' : 's'}`}
        </p>
        <Button onClick={abrirNovoFlashcard}>
          <Plus />
          Novo flashcard
        </Button>
      </div>

      {flashcards === null && erroCarregamento === null && (
        <Carregando className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, indice) => (
            <div key={indice} className="space-y-3 rounded-xl border border-ink-200/80 bg-card p-5 shadow-sm">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3.5 w-2/3" />
            </div>
          ))}
        </Carregando>
      )}

      {erroCarregamento !== null && <EstadoErro mensagem={erroCarregamento} onTentarNovamente={() => void carregarFlashcards()} />}

      {flashcards !== null && flashcards.length === 0 && (
        <EstadoVazio
          icone={Layers}
          titulo="Nenhum flashcard ainda"
          descricao="Crie um flashcard manualmente ou envie um PDF na aba Materiais para a IA sugerir vários de uma vez."
          acao={
            <>
              <Button onClick={abrirNovoFlashcard}>
                <Plus />
                Criar flashcard
              </Button>
              {onIrParaMateriais && (
                <Button variant="outline" onClick={onIrParaMateriais}>
                  <FileText />
                  Enviar um PDF
                </Button>
              )}
            </>
          }
        />
      )}

      {flashcards !== null && flashcards.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

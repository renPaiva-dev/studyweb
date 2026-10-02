import { Layers, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { extrairMensagemErro } from '@/api/apiError'
import { listarDecks, type Deck } from '@/api/deckApi'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { DeckCard } from '@/components/DeckCard'
import { DeckFormDialog } from '@/components/DeckFormDialog'
import { ExcluirDeckDialog } from '@/components/ExcluirDeckDialog'
import { DeckCardSkeleton } from '@/components/SkeletonsLista'
import { Button } from '@/components/ui/button'
import { EstadoErro, EstadoVazio } from '@/components/ui/estados'
import { Carregando } from '@/components/ui/skeleton'

// UC02 - Meus decks. GET /api/decks (docs/contrato-api.md).
export function DecksPage() {
  const navigate = useNavigate()

  const [decks, setDecks] = useState<Deck[] | null>(null)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)

  const [dialogAberto, setDialogAberto] = useState(false)
  const [deckEditando, setDeckEditando] = useState<Deck | null>(null)
  const [deckExcluindo, setDeckExcluindo] = useState<Deck | null>(null)

  const carregarDecks = useCallback(async () => {
    setErroCarregamento(null)

    try {
      setDecks(await listarDecks())
    } catch (erro) {
      setErroCarregamento(extrairMensagemErro(erro, 'Não foi possível carregar seus decks.'))
    }
  }, [])

  useEffect(() => {
    void carregarDecks()
  }, [carregarDecks])

  function abrirNovoDeck() {
    setDeckEditando(null)
    setDialogAberto(true)
  }

  function abrirEdicaoDeck(deck: Deck) {
    setDeckEditando(deck)
    setDialogAberto(true)
  }

  async function aoSalvarDeck() {
    await carregarDecks()
  }

  async function aoExcluirDeck() {
    await carregarDecks()
  }

  const totalFlashcards = decks?.reduce((soma, deck) => soma + deck.totalFlashcards, 0) ?? 0

  return (
    <div className="space-y-8">
      <CabecalhoPagina
        titulo="Meus decks"
        descricao={
          decks && decks.length > 0
            ? `${decks.length} deck${decks.length === 1 ? '' : 's'} · ${totalFlashcards} flashcard${totalFlashcards === 1 ? '' : 's'} no total`
            : 'Organize seus estudos por tema.'
        }
        acoes={
          <Button onClick={abrirNovoDeck}>
            <Plus />
            Novo deck
          </Button>
        }
      />

      {decks === null && erroCarregamento === null && (
        <Carregando rotulo="Carregando seus decks..." className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, indice) => (
            <DeckCardSkeleton key={indice} />
          ))}
        </Carregando>
      )}

      {erroCarregamento !== null && <EstadoErro mensagem={erroCarregamento} onTentarNovamente={() => void carregarDecks()} />}

      {decks !== null && decks.length === 0 && (
        <EstadoVazio
          icone={Layers}
          titulo="Você ainda não tem nenhum deck"
          descricao="Crie um deck por tema (ex.: “Anatomia — Sistema Nervoso”) e envie um PDF para a IA sugerir os primeiros flashcards."
          acao={
            <Button onClick={abrirNovoDeck}>
              <Plus />
              Criar meu primeiro deck
            </Button>
          }
        />
      )}

      {decks !== null && decks.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {decks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onAbrir={() => navigate(`/decks/${deck.id}`)}
              onEditar={() => abrirEdicaoDeck(deck)}
              onExcluir={() => setDeckExcluindo(deck)}
            />
          ))}
        </div>
      )}

      <DeckFormDialog
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        deckParaEditar={deckEditando}
        onSalvo={() => void aoSalvarDeck()}
      />

      <ExcluirDeckDialog
        deck={deckExcluindo}
        onOpenChange={(open) => {
          if (!open) setDeckExcluindo(null)
        }}
        onExcluido={() => void aoExcluirDeck()}
      />
    </div>
  )
}

import { LayoutGrid, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { extrairMensagemErro } from '@/api/apiError'
import { listarDecks, type Deck } from '@/api/deckApi'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DeckCard } from '@/components/DeckCard'
import { DeckFormDialog } from '@/components/DeckFormDialog'
import { ExcluirDeckDialog } from '@/components/ExcluirDeckDialog'

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meus decks</h1>
          <p className="text-muted-foreground">Organize seus estudos por tema</p>
        </div>
        <Button onClick={abrirNovoDeck}>
          <Plus className="mr-2 h-4 w-4" />
          Novo deck
        </Button>
      </div>

      {decks === null && erroCarregamento === null && <ListaDecksSkeleton />}

      {erroCarregamento !== null && (
        <div className="flex flex-col items-center gap-4 rounded-xl border py-16 text-center">
          <p className="text-muted-foreground">{erroCarregamento}</p>
          <Button variant="outline" onClick={() => void carregarDecks()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {decks !== null && decks.length === 0 && <EstadoVazio onCriarDeck={abrirNovoDeck} />}

      {decks !== null && decks.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

function ListaDecksSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, indice) => (
        <div key={indice} className="space-y-3 rounded-xl border p-6">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-6 w-24" />
        </div>
      ))}
    </div>
  )
}

function EstadoVazio({ onCriarDeck }: { onCriarDeck: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-20 text-center">
      <div className="rounded-full bg-primary/10 p-4">
        <LayoutGrid className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">Você ainda não tem nenhum deck</p>
        <p className="text-sm text-muted-foreground">Crie seu primeiro deck para começar a organizar seus estudos</p>
      </div>
      <Button onClick={onCriarDeck}>
        <Plus className="mr-2 h-4 w-4" />
        Criar seu primeiro deck
      </Button>
    </div>
  )
}

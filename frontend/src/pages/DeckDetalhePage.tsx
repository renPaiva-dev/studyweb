import { Share2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { buscarDeck, type DeckDetalhe } from '@/api/deckApi'
import { extrairMensagemErro } from '@/api/apiError'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CompartilharDeckDialog } from '@/components/CompartilharDeckDialog'
import { DashboardTab } from '@/components/DashboardTab'
import { EstudarTab } from '@/components/EstudarTab'
import { FlashcardsTab } from '@/components/FlashcardsTab'
import { MateriaisTab } from '@/components/MateriaisTab'
import { QuizTab } from '@/components/QuizTab'

// UC02 - visao geral de um deck. GET /api/decks/{id} (docs/contrato-api.md).
// Abas: Materiais (UC03/UC04), Flashcards (UC05/UC06), Estudar
// (UC07/08/09), Quiz (UC10) e Dashboard (UC11) tem implementacao completa.
// UC29 - botao "Compartilhar" abre o dialogo de link publico somente leitura.
export function DeckDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const deckId = Number(id)

  const [deck, setDeck] = useState<DeckDetalhe | null>(null)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)
  const [abaAtiva, setAbaAtiva] = useState('flashcards')
  const [compartilhando, setCompartilhando] = useState(false)

  const carregarDeck = useCallback(async () => {
    setErroCarregamento(null)

    try {
      setDeck(await buscarDeck(deckId))
    } catch (erro) {
      setErroCarregamento(extrairMensagemErro(erro, 'Não foi possível carregar este deck.'))
    }
  }, [deckId])

  useEffect(() => {
    void carregarDeck()
  }, [carregarDeck])

  if (erroCarregamento !== null) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border py-16 text-center">
        <p className="text-muted-foreground">{erroCarregamento}</p>
        <Button variant="outline" onClick={() => void carregarDeck()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (deck === null) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-4 h-9 w-80" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{deck.titulo}</h1>
          {deck.descricao && <p className="text-muted-foreground">{deck.descricao}</p>}
        </div>
        <Button variant="outline" onClick={() => setCompartilhando(true)}>
          <Share2 className="mr-2 h-4 w-4" />
          Compartilhar
        </Button>
      </div>

      <CompartilharDeckDialog
        deck={compartilhando ? { id: deckId, titulo: deck.titulo } : null}
        onOpenChange={(open) => setCompartilhando(open)}
      />

      <Tabs value={abaAtiva} onValueChange={setAbaAtiva}>
        <TabsList>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="materiais">Materiais</TabsTrigger>
          <TabsTrigger value="estudar">Estudar</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="flashcards">
          <FlashcardsTab deckId={deckId} />
        </TabsContent>

        <TabsContent value="materiais">
          <MateriaisTab deckId={deckId} onFlashcardsConfirmados={() => setAbaAtiva('flashcards')} />
        </TabsContent>

        <TabsContent value="estudar">
          <EstudarTab deckId={deckId} />
        </TabsContent>

        <TabsContent value="quiz">
          <QuizTab deckId={deckId} />
        </TabsContent>

        <TabsContent value="dashboard">
          <DashboardTab deckId={deckId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

import { BarChart3, Layers, ListChecks } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { buscarDeck, type DeckDetalhe } from '@/api/deckApi'
import { extrairMensagemErro } from '@/api/apiError'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MateriaisTab } from '@/components/MateriaisTab'

// UC02 - visao geral de um deck. GET /api/decks/{id} (docs/contrato-api.md).
// Abas: Materiais tem a implementacao completa do UC03 (upload de PDF);
// Flashcards/Estudar/Dashboard sao placeholders para prompts futuros
// (UC05/UC06, UC07/08/09, UC11).
export function DeckDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const deckId = Number(id)

  const [deck, setDeck] = useState<DeckDetalhe | null>(null)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)
  const [abaAtiva, setAbaAtiva] = useState('flashcards')

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{deck.titulo}</h1>
        {deck.descricao && <p className="text-muted-foreground">{deck.descricao}</p>}
      </div>

      <Tabs value={abaAtiva} onValueChange={setAbaAtiva}>
        <TabsList>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="materiais">Materiais</TabsTrigger>
          <TabsTrigger value="estudar">Estudar</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="flashcards">
          <AbaEmConstrucao
            icone={Layers}
            titulo="Flashcards"
            descricao="A gestão de flashcards deste deck chega em um próximo prompt."
          />
        </TabsContent>

        <TabsContent value="materiais">
          <MateriaisTab deckId={deckId} onFlashcardsConfirmados={() => setAbaAtiva('flashcards')} />
        </TabsContent>

        <TabsContent value="estudar">
          <AbaEmConstrucao
            icone={ListChecks}
            titulo="Estudar"
            descricao="A fila de estudo com repetição espaçada (SM-2) chega em um próximo prompt."
          />
        </TabsContent>

        <TabsContent value="dashboard">
          <AbaEmConstrucao
            icone={BarChart3}
            titulo="Dashboard"
            descricao="O progresso do deck (% dominado / em risco) chega em um próximo prompt."
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AbaEmConstrucao({
  icone: Icone,
  titulo,
  descricao,
}: {
  icone: typeof Layers
  titulo: string
  descricao: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
      <div className="rounded-full bg-primary/10 p-3">
        <Icone className="h-6 w-6 text-primary" />
      </div>
      <p className="font-medium">{titulo}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{descricao}</p>
    </div>
  )
}

import { BarChart3, BookOpenCheck, FileText, HelpCircle, Layers, Library, MessageCircleQuestion, Share2, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { buscarDeck, type DeckDetalhe } from '@/api/deckApi'
import { extrairMensagemErro } from '@/api/apiError'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { CompartilharDeckDialog } from '@/components/CompartilharDeckDialog'
import { DashboardTab } from '@/components/DashboardTab'
import { EstudarTab } from '@/components/EstudarTab'
import { FlashcardsTab } from '@/components/FlashcardsTab'
import { MateriaisTab } from '@/components/MateriaisTab'
import { PerguntarTab } from '@/components/PerguntarTab'
import { QuizTab } from '@/components/QuizTab'
import { Button } from '@/components/ui/button'
import { EstadoErro } from '@/components/ui/estados'
import { Carregando, Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const ABAS = [
  { valor: 'materiais', rotulo: 'Materiais', icone: FileText },
  { valor: 'flashcards', rotulo: 'Flashcards', icone: Layers },
  { valor: 'perguntar', rotulo: 'Perguntar', icone: MessageCircleQuestion },
  { valor: 'estudar', rotulo: 'Estudar', icone: BookOpenCheck },
  { valor: 'quiz', rotulo: 'Quiz', icone: HelpCircle },
  { valor: 'dashboard', rotulo: 'Dashboard', icone: BarChart3 },
] as const

// UC02 - visao geral de um deck. GET /api/decks/{id} (docs/contrato-api.md).
// Abas na ordem do fluxo real: Materiais (UC03/UC04) -> Flashcards (UC05/UC06)
// -> Perguntar (UC32) -> Estudar (UC07/08/09) -> Quiz (UC10) -> Dashboard
// (UC11). UC29 - botao "Compartilhar" abre o dialogo de link publico somente
// leitura; "Gerar prova" leva para UC27 (NovaProvaPage) com este deck
// pre-selecionado via query param, sem precisar escolher de novo.
export function DeckDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
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
      <div className="space-y-8">
        <CabecalhoPagina voltar={{ para: '/decks', rotulo: 'Meus decks' }} titulo="Deck" />
        <EstadoErro mensagem={erroCarregamento} onTentarNovamente={() => void carregarDeck()} />
      </div>
    )
  }

  if (deck === null) {
    return (
      <Carregando rotulo="Carregando deck..." className="space-y-6">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-10 w-2/3 max-w-md" />
        <Skeleton className="h-5 w-1/2 max-w-sm" />
        <Skeleton className="h-11 w-full" />
      </Carregando>
    )
  }

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        voltar={{ para: '/decks', rotulo: 'Meus decks' }}
        sobretitulo={
          deck.colecaoNome ? (
            <span className="inline-flex items-center gap-1.5">
              <Library className="h-3.5 w-3.5" />
              {deck.colecaoNome}
            </span>
          ) : (
            'Deck'
          )
        }
        titulo={deck.titulo}
        descricao={deck.descricao || undefined}
        acoes={
          <>
            <Button variant="outline" onClick={() => setCompartilhando(true)}>
              <Share2 />
              Compartilhar
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/provas/nova?deckId=${deckId}`)}>
              <Sparkles />
              Gerar prova
            </Button>
          </>
        }
      />

      <CompartilharDeckDialog
        deck={compartilhando ? { id: deckId, titulo: deck.titulo } : null}
        onOpenChange={(open) => setCompartilhando(open)}
      />

      {/* key={deckId} forca remontagem completa de todas as abas ao trocar de
          deck (mesmo padrao de `key` por rota usado em Layout.tsx) - sem isso,
          nenhuma aba reseta seu estado nem descarta respostas de requisicao
          em voo de um deck anterior ao navegar rapido entre decks (achados
          F0/F5/F6/F7 da auditoria). */}
      <Tabs key={deckId} value={abaAtiva} onValueChange={setAbaAtiva}>
        <TabsList aria-label="Seções do deck">
          {ABAS.map(({ valor, rotulo, icone: Icone }) => (
            <TabsTrigger key={valor} value={valor}>
              <Icone aria-hidden="true" />
              {rotulo}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="materiais">
          <MateriaisTab deckId={deckId} onFlashcardsConfirmados={() => setAbaAtiva('flashcards')} />
        </TabsContent>

        <TabsContent value="flashcards">
          <FlashcardsTab deckId={deckId} onIrParaMateriais={() => setAbaAtiva('materiais')} />
        </TabsContent>

        <TabsContent value="perguntar">
          <PerguntarTab deckId={deckId} />
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

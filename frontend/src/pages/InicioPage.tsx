import { ArrowRight, Brain, ClipboardList, Flame, LayoutDashboard, Layers, ListChecks, Plus, Repeat, Sparkles, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { extrairMensagemErro } from '@/api/apiError'
import { listarDecks, type Deck } from '@/api/deckApi'
import { listarHistoricoProvas, type HistoricoProvaResumo } from '@/api/provaApi'
import { buscarDashboardGeral, type DashboardGeral } from '@/api/usuarioApi'
import { DeckCard } from '@/components/DeckCard'
import { DeckFormDialog } from '@/components/DeckFormDialog'
import { ExcluirDeckDialog } from '@/components/ExcluirDeckDialog'
import { HistoricoProvaCard } from '@/components/HistoricoProvaCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'

const RECURSOS = [
  {
    icone: Brain,
    titulo: 'Flashcards com IA',
    descricao: 'Envie um PDF do seu material e receba sugestões de flashcards prontas para revisar e confirmar.',
  },
  {
    icone: Repeat,
    titulo: 'Repetição espaçada',
    descricao: 'O algoritmo SM-2 organiza suas revisões no momento certo para fixar o conteúdo a longo prazo.',
  },
  {
    icone: ListChecks,
    titulo: 'Quizzes e provas',
    descricao: 'Teste o que aprendeu com quizzes gerados automaticamente a partir dos seus próprios flashcards.',
  },
]

// Tela inicial do app (clicar em "Plataforma de Estudos" no cabecalho leva
// aqui) - combina um resumo do progresso (dashboard geral, UC20), uma
// pre-visualizacao dos decks (UC02) e uma apresentacao do sistema, servindo
// como ponto de partida unico em vez de cair direto em "Meus decks".
export function InicioPage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()

  const [decks, setDecks] = useState<Deck[] | null>(null)
  const [dashboard, setDashboard] = useState<DashboardGeral | null>(null)
  const [historicoProvas, setHistoricoProvas] = useState<HistoricoProvaResumo[] | null>(null)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)

  const [dialogAberto, setDialogAberto] = useState(false)
  const [deckEditando, setDeckEditando] = useState<Deck | null>(null)
  const [deckExcluindo, setDeckExcluindo] = useState<Deck | null>(null)

  const carregar = useCallback(async () => {
    setErroCarregamento(null)

    try {
      const [listaDecks, dashboardGeral, historico] = await Promise.all([
        listarDecks(),
        buscarDashboardGeral(),
        listarHistoricoProvas(),
      ])
      setDecks(listaDecks)
      setDashboard(dashboardGeral)
      setHistoricoProvas(historico)
    } catch (erro) {
      setErroCarregamento(extrairMensagemErro(erro, 'Não foi possível carregar sua página inicial.'))
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  function abrirNovoDeck() {
    setDeckEditando(null)
    setDialogAberto(true)
  }

  function abrirEdicaoDeck(deck: Deck) {
    setDeckEditando(deck)
    setDialogAberto(true)
  }

  async function aoSalvarOuExcluirDeck() {
    await carregar()
  }

  if (erroCarregamento !== null) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border py-16 text-center">
        <p className="text-muted-foreground">{erroCarregamento}</p>
        <Button variant="outline" onClick={() => void carregar()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  const primeiroNome = usuario?.nome?.split(' ')[0]

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 rounded-2xl border bg-card p-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md space-y-2">
          <p className="text-eyebrow uppercase text-primary">Plataforma de Estudos</p>
          <h1 className="font-heading text-display">{primeiroNome ? `Olá, ${primeiroNome}` : 'Bem-vindo(a) de volta'}</h1>
          <p className="text-muted-foreground">
            Organize seus materiais em decks, gere flashcards com IA e deixe a repetição espaçada guiar suas revisões.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button size="lg" className="gap-2" onClick={() => navigate('/dashboard-geral')}>
            <LayoutDashboard className="h-4 w-4" />
            Ver visão geral completa
          </Button>
          <Button size="lg" variant="outline" className="gap-2" onClick={abrirNovoDeck}>
            <Plus className="h-4 w-4" />
            Novo deck
          </Button>
        </div>
      </div>

      {dashboard === null ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Decks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{dashboard.totalDecks}</p>
              <p className="text-xs text-muted-foreground">{dashboard.totalFlashcards} flashcards no total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
              <Flame className="h-4 w-4 text-coral-500" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Sequência de estudo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {dashboard.streakDias} dia{dashboard.streakDias === 1 ? '' : 's'}
              </p>
              <p className="text-xs text-muted-foreground">consecutivos com revisão</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Dominado (geral)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{dashboard.percentualDominadoGeral}%</p>
              <Link to="/dashboard-geral" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                Ver todos os gráficos <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Seus decks</h2>
          {decks !== null && decks.length > 0 && (
            <Link to="/decks" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {decks === null && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, indice) => (
              <Skeleton key={indice} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        )}

        {decks !== null && decks.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Layers className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Você ainda não tem nenhum deck</p>
              <p className="text-sm text-muted-foreground">Crie seu primeiro deck para começar a organizar seus estudos</p>
            </div>
            <Button onClick={abrirNovoDeck}>
              <Plus className="mr-2 h-4 w-4" />
              Criar seu primeiro deck
            </Button>
          </div>
        )}

        {decks !== null && decks.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {decks.slice(0, 6).map((deck) => (
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
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Provas</h2>
          {historicoProvas !== null && historicoProvas.length > 0 && (
            <Link to="/provas" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Ver histórico <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {historicoProvas === null && <Skeleton className="h-20 w-full rounded-xl" />}

        {historicoProvas !== null && historicoProvas.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <ClipboardList className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Você ainda não fez nenhuma prova</p>
              <p className="text-sm text-muted-foreground">
                Escolha flashcards de um deck e um estilo (ENEM, Vestibular...) — a IA gera questões inéditas
              </p>
            </div>
            <Button onClick={() => navigate('/provas/nova')}>
              <Sparkles className="mr-2 h-4 w-4" />
              Fazer minha primeira prova
            </Button>
          </div>
        )}

        {historicoProvas !== null && historicoProvas.length > 0 && (
          <div className="space-y-3">
            {historicoProvas.slice(0, 3).map((tentativa) => (
              <HistoricoProvaCard
                key={tentativa.tentativaId}
                tentativa={tentativa}
                onAbrir={() => navigate(`/provas/${tentativa.tentativaId}`)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Como funciona</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {RECURSOS.map(({ icone: Icone, titulo, descricao }) => (
            <Card key={titulo}>
              <CardHeader className="space-y-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icone className="h-5 w-5" />
                </span>
                <CardTitle className="text-base font-semibold">{titulo}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{descricao}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <DeckFormDialog
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        deckParaEditar={deckEditando}
        onSalvo={() => void aoSalvarOuExcluirDeck()}
      />

      <ExcluirDeckDialog
        deck={deckExcluindo}
        onOpenChange={(open) => {
          if (!open) setDeckExcluindo(null)
        }}
        onExcluido={() => void aoSalvarOuExcluirDeck()}
      />
    </div>
  )
}

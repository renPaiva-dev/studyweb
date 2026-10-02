import { ArrowRight, Brain, ClipboardList, Flame, Layers, ListChecks, Plus, Repeat, Sparkles, Target } from 'lucide-react'
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
import { DeckCardSkeleton, LinhaSkeleton } from '@/components/SkeletonsLista'
import { Button } from '@/components/ui/button'
import { EstadoErro, EstadoVazio } from '@/components/ui/estados'
import { Carregando, Skeleton } from '@/components/ui/skeleton'
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

function saudacao() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

// Tela inicial do app (clicar em "Sinapse" no cabecalho leva aqui) - combina
// um resumo do progresso (dashboard geral, UC20), uma pre-visualizacao dos
// decks (UC02) e das provas (UC28), servindo como ponto de partida unico em
// vez de cair direto em "Meus decks".
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
    return <EstadoErro mensagem={erroCarregamento} onTentarNovamente={() => void carregar()} />
  }

  const primeiroNome = usuario?.nome?.split(' ')[0]
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-2xl bg-ink-900 px-5 py-7 text-white shadow-lg sm:px-8 sm:py-9">
        {/* Motivo do logo (dois discos que se sobrepoem), como textura. */}
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/[0.04]" aria-hidden="true" />
        <div className="pointer-events-none absolute -top-6 right-6 h-20 w-20 rounded-full bg-brand-400 sm:right-16" aria-hidden="true" />
        <div className="pointer-events-none absolute -top-16 right-20 h-36 w-36 rounded-full bg-ink-800/80 sm:right-32" aria-hidden="true" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl space-y-3">
            <p className="text-sm font-medium text-white/70 first-letter:uppercase">{hoje}</p>
            <h1 className="font-heading text-h1 text-white sm:text-[2.75rem] sm:leading-[1.1]">
              {saudacao()}
              {primeiroNome ? `, ${primeiroNome}` : ''}.
            </h1>
            <p className="text-base text-white/75">
              Organize seus materiais em decks, gere flashcards com IA e deixe a repetição espaçada guiar suas revisões.
            </p>
            <div className="flex flex-col gap-2 pt-3 sm:flex-row">
              <Button size="lg" onClick={abrirNovoDeck}>
                <Plus />
                Novo deck
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-white ring-1 ring-inset ring-white/20 hover:bg-white/10 hover:text-white active:bg-white/15"
                onClick={() => navigate('/dashboard-geral')}
              >
                Ver visão geral
                <ArrowRight />
              </Button>
            </div>
          </div>

          <ResumoProgresso dashboard={dashboard} />
        </div>
      </section>

      <section aria-labelledby="titulo-decks" className="space-y-4">
        <CabecalhoSecao id="titulo-decks" titulo="Seus decks" link={decks && decks.length > 0 ? { para: '/decks', rotulo: 'Ver todos' } : undefined} />

        {decks === null && (
          <Carregando rotulo="Carregando seus decks..." className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, indice) => (
              <DeckCardSkeleton key={indice} />
            ))}
          </Carregando>
        )}

        {decks !== null && decks.length === 0 && (
          <EstadoVazio
            icone={Layers}
            titulo="Seu primeiro deck começa aqui"
            descricao="Um deck agrupa os flashcards de um tema. Crie um e envie um PDF para a IA sugerir os primeiros cards."
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
      </section>

      <section aria-labelledby="titulo-provas" className="space-y-4">
        <CabecalhoSecao
          id="titulo-provas"
          titulo="Provas recentes"
          link={historicoProvas && historicoProvas.length > 0 ? { para: '/provas', rotulo: 'Ver histórico' } : undefined}
        />

        {historicoProvas === null && (
          <Carregando rotulo="Carregando suas provas..." className="space-y-3">
            <LinhaSkeleton />
            <LinhaSkeleton />
          </Carregando>
        )}

        {historicoProvas !== null && historicoProvas.length === 0 && (
          <EstadoVazio
            icone={ClipboardList}
            titulo="Nenhuma prova feita ainda"
            descricao="Escolha flashcards de um deck e um estilo (ENEM, Vestibular ou Conhecimentos Gerais). A IA gera questões inéditas."
            acao={
              <Button variant="secondary" onClick={() => navigate('/provas/nova')}>
                <Sparkles />
                Fazer minha primeira prova
              </Button>
            }
          />
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
      </section>

      <section aria-labelledby="titulo-como-funciona" className="space-y-4">
        <CabecalhoSecao id="titulo-como-funciona" titulo="Como o Sinapse funciona" />
        <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {RECURSOS.map(({ icone: Icone, titulo, descricao }, indice) => (
            <li key={titulo} className="relative rounded-xl border border-ink-200/80 bg-card p-5 shadow-xs">
              <span className="absolute right-5 top-4 font-heading text-h2 text-ink-200" aria-hidden="true">
                {String(indice + 1).padStart(2, '0')}
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-800">
                <Icone className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <p className="mt-4 font-semibold text-foreground">{titulo}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{descricao}</p>
            </li>
          ))}
        </ol>
      </section>

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

function CabecalhoSecao({ id, titulo, link }: { id: string; titulo: string; link?: { para: string; rotulo: string } }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 id={id} className="font-heading text-h2 text-foreground">
        {titulo}
      </h2>
      {link && (
        <Link
          to={link.para}
          className="group inline-flex h-9 shrink-0 items-center gap-1 rounded-md px-1 text-sm font-semibold text-brand-800 hover:text-brand-900"
        >
          {link.rotulo}
          <ArrowRight className="h-4 w-4 transition-transform duration-fast group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  )
}

// Os numeros de progresso (UC20) direto no hero - visiveis tambem no mobile.
function ResumoProgresso({ dashboard }: { dashboard: DashboardGeral | null }) {
  const itens = dashboard
    ? [
        {
          icone: Flame,
          valor: `${dashboard.streakDias}`,
          sufixo: dashboard.streakDias === 1 ? 'dia' : 'dias',
          rotulo: 'seguidos revisando',
          destaque: true,
        },
        { icone: Layers, valor: `${dashboard.totalFlashcards}`, sufixo: '', rotulo: `flashcards em ${dashboard.totalDecks} deck${dashboard.totalDecks === 1 ? '' : 's'}` },
        { icone: Target, valor: `${dashboard.percentualDominadoGeral}`, sufixo: '%', rotulo: 'dominado no geral' },
      ]
    : null

  return (
    <div className="relative grid grid-cols-3 gap-2 rounded-xl bg-white/[0.06] p-2 ring-1 ring-inset ring-white/10 backdrop-blur-sm lg:min-w-[26rem]">
      {itens === null
        ? Array.from({ length: 3 }, (_, indice) => <Skeleton key={indice} className="h-[84px] rounded-lg bg-white/10" />)
        : itens.map(({ icone: Icone, valor, sufixo, rotulo, destaque }) => (
            <dl key={rotulo} className="rounded-lg px-2.5 py-3 sm:px-3.5">
              <dt className="sr-only">{rotulo}</dt>
              <dd>
                <Icone className={destaque ? 'h-4 w-4 text-brand-300' : 'h-4 w-4 text-white/60'} aria-hidden="true" />
                <p className="mt-2 font-heading text-h2 leading-none tabular-nums text-white">
                  {valor}
                  {sufixo && <span className="ml-0.5 text-base font-semibold text-white/80">{sufixo}</span>}
                </p>
                <p className="mt-1.5 text-xs leading-4 text-white/70 sm:text-sm sm:leading-5" aria-hidden="true">{rotulo}</p>
              </dd>
            </dl>
          ))}
    </div>
  )
}

import { ArrowRight, ChevronLeft, ChevronRight, Layers, Link2Off, RotateCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { extrairMensagemErro } from '@/api/apiError'
import { buscarDeckCompartilhado, type DeckCompartilhado } from '@/api/compartilhamentoApi'
import { FlashcardEstudoCard } from '@/components/FlashcardEstudoCard'
import { Logo } from '@/components/Logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EstadoVazio } from '@/components/ui/estados'
import { Progress } from '@/components/ui/progress'
import { Carregando, Skeleton } from '@/components/ui/skeleton'

// UC29 - visualizacao publica e somente leitura de um deck compartilhado.
// GET /api/compartilhamentos/{token} (docs/contrato-api.md), sem autenticacao.
export function DeckCompartilhadoPage() {
  const { token } = useParams<{ token: string }>()

  const [deck, setDeck] = useState<DeckCompartilhado | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [indiceAtual, setIndiceAtual] = useState(0)
  const [virado, setVirado] = useState(false)

  const carregarDeck = useCallback(async () => {
    if (!token) {
      return
    }

    setErro(null)

    try {
      setDeck(await buscarDeckCompartilhado(token))
    } catch (erro) {
      setErro(extrairMensagemErro(erro, 'Este link de compartilhamento é inválido ou foi revogado pelo dono do deck.'))
    }
  }, [token])

  useEffect(() => {
    void carregarDeck()
  }, [carregarDeck])

  function irPara(indice: number) {
    setIndiceAtual(indice)
    setVirado(false)
  }

  const total = deck?.flashcards.length ?? 0

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-ink-200/80 bg-background/85 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 rounded-md font-heading text-xl font-semibold text-foreground">
            <Logo className="h-7 w-7" />
            Sinapse
          </Link>
          <Button asChild size="sm" variant="secondary">
            <Link to="/cadastro">
              Criar conta grátis
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </header>

      <main className="container max-w-2xl space-y-6 py-8 sm:py-10">
        {deck === null && erro === null && (
          <Carregando rotulo="Carregando deck compartilhado..." className="space-y-4">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-80 w-full rounded-2xl" />
          </Carregando>
        )}

        {erro !== null && (
          <EstadoVazio
            icone={Link2Off}
            titulo="Link indisponível"
            descricao={erro}
            acao={
              <Button asChild variant="outline">
                <Link to="/">Conhecer o Sinapse</Link>
              </Button>
            }
          />
        )}

        {deck !== null && (
          <div className="space-y-6 animate-entrada">
            <div className="space-y-2">
              <Badge variant="secondary">
                <Layers />
                Deck compartilhado · somente leitura
              </Badge>
              <h1 className="font-heading text-h2 text-foreground sm:text-h1">{deck.titulo}</h1>
              {deck.descricao && <p className="text-base text-muted-foreground">{deck.descricao}</p>}
            </div>

            {total === 0 ? (
              <EstadoVazio icone={Layers} titulo="Este deck ainda não tem flashcards" descricao="Volte mais tarde, o dono do deck pode adicionar cards a qualquer momento." />
            ) : (
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground" aria-live="polite">
                    Card <span className="tabular-nums">{indiceAtual + 1}</span> de <span className="tabular-nums">{total}</span>
                  </p>
                  <Progress value={((indiceAtual + 1) / total) * 100} aria-label="Posição no deck" />
                </div>

                <FlashcardEstudoCard
                  key={deck.flashcards[indiceAtual].id}
                  item={{
                    flashcardId: deck.flashcards[indiceAtual].id,
                    pergunta: deck.flashcards[indiceAtual].pergunta,
                    resposta: deck.flashcards[indiceAtual].resposta,
                    mnemonico: deck.flashcards[indiceAtual].mnemonico,
                  }}
                  virado={virado}
                  permitirExplicacao={false}
                />

                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => irPara(indiceAtual - 1)}
                    disabled={indiceAtual === 0}
                    aria-label="Card anterior"
                  >
                    <ChevronLeft />
                  </Button>

                  <Button size="lg" className="min-w-44" onClick={() => setVirado((atual) => !atual)}>
                    <RotateCw />
                    {virado ? 'Ver pergunta' : 'Virar card'}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => irPara(indiceAtual + 1)}
                    disabled={indiceAtual === total - 1}
                    aria-label="Próximo card"
                  >
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-brand-200 bg-brand-50 p-5 text-center sm:text-left">
              <p className="font-semibold text-foreground">Gostou? Crie seus próprios decks com IA.</p>
              <p className="mt-1 text-sm text-brand-900">Envie um PDF e receba flashcards prontos, com revisões no momento certo.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

import { Layers, Library, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { buscarColecao, type ColecaoDetalhe } from '@/api/colecaoApi'
import { atualizarDeck, buscarDeck } from '@/api/deckApi'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { aoAtivarComTeclado, Monograma } from '@/components/Monograma'
import { DeckCardSkeleton } from '@/components/SkeletonsLista'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EstadoErro, EstadoVazio } from '@/components/ui/estados'
import { Carregando, Skeleton } from '@/components/ui/skeleton'

// UC33 - detalhe de uma coleção. GET /api/colecoes/{id} (docs/contrato-api.md).
// Remover um deck da coleção reaproveita PUT /api/decks/{id} com
// colecaoId: null (não há endpoint dedicado para isso).
export function ColecaoDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const colecaoId = Number(id)

  const [colecao, setColecao] = useState<ColecaoDetalhe | null>(null)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)
  const [removendoId, setRemovendoId] = useState<number | null>(null)

  const carregarColecao = useCallback(async () => {
    setErroCarregamento(null)

    try {
      setColecao(await buscarColecao(colecaoId))
    } catch (erro) {
      setErroCarregamento(extrairMensagemErro(erro, 'Não foi possível carregar esta coleção.'))
    }
  }, [colecaoId])

  useEffect(() => {
    void carregarColecao()
  }, [carregarColecao])

  async function removerDaColecao(deckId: number, titulo: string) {
    setRemovendoId(deckId)

    try {
      const deckAtual = await buscarDeck(deckId)
      await atualizarDeck(deckId, { titulo: deckAtual.titulo, descricao: deckAtual.descricao, colecaoId: null })
      toast.success(`"${titulo}" saiu da coleção.`, { description: 'O deck continua disponível em Meus decks.' })
      await carregarColecao()
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível remover o deck da coleção. Tente novamente.'))
    } finally {
      setRemovendoId(null)
    }
  }

  if (erroCarregamento !== null) {
    return (
      <div className="space-y-8">
        <CabecalhoPagina voltar={{ para: '/colecoes', rotulo: 'Coleções' }} titulo="Coleção" />
        <EstadoErro mensagem={erroCarregamento} onTentarNovamente={() => void carregarColecao()} />
      </div>
    )
  }

  if (colecao === null) {
    return (
      <Carregando rotulo="Carregando coleção..." className="space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-1/2" />
          <Skeleton className="h-5 w-2/3" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <DeckCardSkeleton />
          <DeckCardSkeleton />
        </div>
      </Carregando>
    )
  }

  return (
    <div className="space-y-8">
      <CabecalhoPagina
        voltar={{ para: '/colecoes', rotulo: 'Coleções' }}
        sobretitulo={
          <span className="inline-flex items-center gap-1.5">
            <Library className="h-3.5 w-3.5" />
            Coleção · {colecao.decks.length} deck{colecao.decks.length === 1 ? '' : 's'}
          </span>
        }
        titulo={colecao.nome}
        descricao={colecao.descricao || undefined}
      />

      {colecao.decks.length === 0 && (
        <EstadoVazio
          icone={Layers}
          titulo="Nenhum deck nesta coleção ainda"
          descricao={
            <>
              Em <Link to="/decks" className="link">Meus decks</Link>, edite um deck e selecione “{colecao.nome}” no campo
              Coleção.
            </>
          }
        />
      )}

      {colecao.decks.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {colecao.decks.map((deck) => (
            <Card
              key={deck.id}
              interactive
              role="link"
              tabIndex={0}
              aria-label={`Abrir deck ${deck.titulo}`}
              onClick={() => navigate(`/decks/${deck.id}`)}
              onKeyDown={aoAtivarComTeclado(() => navigate(`/decks/${deck.id}`))}
              className="flex items-center gap-3.5 p-5"
            >
              <Monograma texto={deck.titulo} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">{deck.titulo}</p>
                <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Layers className="h-3.5 w-3.5" />
                  {deck.totalFlashcards} flashcard{deck.totalFlashcards === 1 ? '' : 's'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="-mr-2 shrink-0 text-ink-500 hover:bg-danger-50 hover:text-danger-700"
                aria-label={`Remover ${deck.titulo} da coleção`}
                title="Remover da coleção"
                loading={removendoId === deck.id}
                onClick={(evento) => {
                  evento.stopPropagation()
                  void removerDaColecao(deck.id, deck.titulo)
                }}
              >
                <X />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

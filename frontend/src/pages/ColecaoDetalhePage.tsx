import { Layers, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { buscarColecao, type ColecaoDetalhe } from '@/api/colecaoApi'
import { atualizarDeck, buscarDeck } from '@/api/deckApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

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
      toast.success(`"${titulo}" removido da coleção.`)
      await carregarColecao()
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível remover o deck da coleção. Tente novamente.'))
    } finally {
      setRemovendoId(null)
    }
  }

  if (erroCarregamento !== null) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-none border py-16 text-center">
        <p className="text-muted-foreground">{erroCarregamento}</p>
        <Button variant="outline" onClick={() => void carregarColecao()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (colecao === null) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">{colecao.nome}</h1>
        {colecao.descricao && <p className="text-muted-foreground">{colecao.descricao}</p>}
      </div>

      {colecao.decks.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-none border border-dashed py-16 text-center">
          <p className="font-medium">Nenhum deck nesta coleção ainda</p>
          <p className="text-sm text-muted-foreground">
            Edite um deck existente e selecione "{colecao.nome}" como coleção.
          </p>
        </div>
      )}

      {colecao.decks.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {colecao.decks.map((deck) => (
            <Card key={deck.id} interactive role="button" tabIndex={0} onClick={() => navigate(`/decks/${deck.id}`)}>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <CardTitle className="min-w-0 truncate">{deck.titulo}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="-mr-2 -mt-1 shrink-0"
                  aria-label="Remover da coleção"
                  disabled={removendoId === deck.id}
                  onClick={(evento) => {
                    evento.stopPropagation()
                    void removerDaColecao(deck.id, deck.titulo)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="gap-1">
                  <Layers className="h-3 w-3" />
                  {deck.totalFlashcards} flashcard{deck.totalFlashcards === 1 ? '' : 's'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

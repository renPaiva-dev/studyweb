import { ChevronLeft, ChevronRight, Layers, RotateCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { extrairMensagemErro } from '@/api/apiError'
import { buscarDeckCompartilhado, type DeckCompartilhado } from '@/api/compartilhamentoApi'
import { FlashcardEstudoCard } from '@/components/FlashcardEstudoCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

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

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-8">
      <Badge variant="secondary" className="w-fit gap-1">
        <Layers className="h-3 w-3" />
        Deck compartilhado
      </Badge>

      {deck === null && erro === null && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-80 w-full" />
        </div>
      )}

      {erro !== null && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-none border py-16 text-center">
          <p className="text-muted-foreground">{erro}</p>
        </div>
      )}

      {deck !== null && (
        <div className="space-y-6">
          <div>
            <h1 className="font-heading text-2xl font-semibold">{deck.titulo}</h1>
            {deck.descricao && <p className="text-muted-foreground">{deck.descricao}</p>}
          </div>

          {deck.flashcards.length === 0 ? (
            <p className="text-center text-muted-foreground">Este deck ainda não tem flashcards.</p>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Card {indiceAtual + 1} de {deck.flashcards.length}
              </p>

              <FlashcardEstudoCard
                key={deck.flashcards[indiceAtual].id}
                item={{
                  flashcardId: deck.flashcards[indiceAtual].id,
                  pergunta: deck.flashcards[indiceAtual].pergunta,
                  resposta: deck.flashcards[indiceAtual].resposta,
                  mnemonico: deck.flashcards[indiceAtual].mnemonico,
                }}
                virado={virado}
              />

              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => irPara(indiceAtual - 1)}
                  disabled={indiceAtual === 0}
                  aria-label="Card anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button onClick={() => setVirado((atual) => !atual)}>
                  <RotateCw className="mr-2 h-4 w-4" />
                  Virar card
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => irPara(indiceAtual + 1)}
                  disabled={indiceAtual === deck.flashcards.length - 1}
                  aria-label="Próximo card"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

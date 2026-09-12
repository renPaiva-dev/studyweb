import { AlertTriangle, CalendarClock, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import {
  buscarDataAlvoProva,
  buscarProntidaoProva,
  definirDataAlvoProva,
  removerDataAlvoProva,
  type ProntidaoProva,
} from '@/api/prontidaoApi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

interface ProntidaoProvaCardProps {
  deckId: number
}

// UC31 - previsao de prontidao para prova (RN40). GET/PUT/DELETE
// /api/decks/{id}/prova-alvo + GET /api/decks/{id}/prontidao-prova
// (docs/contrato-api.md). Diferente das demais features de IA do deck,
// e 100% algoritmico - nenhuma chamada a IA aqui.
export function ProntidaoProvaCard({ deckId }: ProntidaoProvaCardProps) {
  const [carregando, setCarregando] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)
  const [dataAlvo, setDataAlvo] = useState<string | null>(null)
  const [prontidao, setProntidao] = useState<ProntidaoProva | null>(null)
  const [dataInput, setDataInput] = useState('')
  const [processando, setProcessando] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErroCarregamento(null)

    try {
      const status = await buscarDataAlvoProva(deckId)
      setDataAlvo(status.dataAlvo)
      setDataInput(status.dataAlvo ?? '')
      setProntidao(status.dataAlvo !== null ? await buscarProntidaoProva(deckId) : null)
    } catch (erro) {
      setErroCarregamento(extrairMensagemErro(erro, 'Não foi possível carregar a prontidão para a prova.'))
    } finally {
      setCarregando(false)
    }
  }, [deckId])

  useEffect(() => {
    void carregar()
  }, [carregar])

  async function aoDefinirData(evento: FormEvent) {
    evento.preventDefault()

    if (!dataInput) {
      return
    }

    setProcessando(true)

    try {
      const status = await definirDataAlvoProva(deckId, dataInput)
      setDataAlvo(status.dataAlvo)
      setProntidao(await buscarProntidaoProva(deckId))
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível definir a data da prova.'))
    } finally {
      setProcessando(false)
    }
  }

  async function aoRemoverData() {
    setProcessando(true)

    try {
      await removerDataAlvoProva(deckId)
      setDataAlvo(null)
      setProntidao(null)
      setDataInput('')
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível remover a data da prova.'))
    } finally {
      setProcessando(false)
    }
  }

  if (carregando) {
    return <Skeleton className="h-40 w-full rounded-none" />
  }

  if (erroCarregamento !== null) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-muted-foreground">{erroCarregamento}</p>
          <Button variant="outline" onClick={() => void carregar()}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
        <CalendarClock className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium text-muted-foreground">Prontidão para a prova</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="flex flex-wrap items-end gap-2" onSubmit={(evento) => void aoDefinirData(evento)}>
          <div className="flex flex-col gap-1">
            <label htmlFor={`data-alvo-prova-${deckId}`} className="text-xs text-muted-foreground">
              Data da prova
            </label>
            <Input
              id={`data-alvo-prova-${deckId}`}
              type="date"
              value={dataInput}
              onChange={(evento) => setDataInput(evento.target.value)}
              className="w-44"
              disabled={processando}
            />
          </div>
          <Button type="submit" disabled={processando || !dataInput}>
            {processando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {dataAlvo !== null ? 'Atualizar data' : 'Definir data'}
          </Button>
          {dataAlvo !== null && (
            <Button type="button" variant="outline" onClick={() => void aoRemoverData()} disabled={processando}>
              Remover
            </Button>
          )}
        </form>

        {dataAlvo === null && (
          <p className="text-sm text-muted-foreground">
            Defina a data da sua prova para ver uma estimativa de retenção por tópico e um plano de revisão
            priorizado — calculado a partir do seu próprio histórico de revisões, sem uso de IA.
          </p>
        )}

        {prontidao !== null && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {prontidao.diasRestantes >= 0
                  ? `Faltam ${prontidao.diasRestantes} dia(s) para a prova`
                  : 'A data da prova já passou'}
              </p>
              <p className="font-heading text-2xl font-semibold text-verde-lousa">{prontidao.prontidaoGeral}%</p>
            </div>

            <p className="text-sm">{prontidao.mensagem}</p>

            {prontidao.topicos.length > 0 && (
              <ul className="space-y-2">
                {prontidao.topicos.map((topico) => (
                  <li key={topico.topico} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-1.5">
                      {topico.flashcardsPrecisandoRevisao > 0 && (
                        <AlertTriangle className="h-3.5 w-3.5 text-vermelho-correcao" />
                      )}
                      {topico.topico}
                      <span className="text-muted-foreground">({topico.totalFlashcards})</span>
                    </span>
                    <span className="font-medium">{topico.retencaoMediaEstimada}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

import { AlertTriangle, CalendarClock, CheckCircle2 } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'

import { extrairMensagemErro } from '@/api/apiError'
import {
  buscarDataAlvoProva,
  buscarProntidaoProva,
  definirDataAlvoProva,
  removerDataAlvoProva,
  type ProntidaoProva,
} from '@/api/prontidaoApi'
import { AnelPontuacao } from '@/components/AnelPontuacao'
import { Alerta } from '@/components/ui/alerta'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EstadoErro } from '@/components/ui/estados'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ProntidaoProvaCardProps {
  deckId: number
}

// I6 (Docs/auditoria-coerencia-seguranca-2026-09.md): reusa as mesmas faixas
// de classificarPontuacao.ts (verde-lousa >= 70, ambar 40-69, vermelho-
// correcao abaixo disso) em vez de inventar uma escala nova so para este
// indicador.
function corRetencao(percentual: number): { barra: string; texto: string } {
  if (percentual >= 70) return { barra: 'bg-success-600', texto: 'text-success-700' }
  if (percentual >= 40) return { barra: 'bg-brand-500', texto: 'text-warning-800' }
  return { barra: 'bg-danger-600', texto: 'text-danger-700' }
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
  const [erroAcao, setErroAcao] = useState<string | null>(null)

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
    setErroAcao(null)

    try {
      const status = await definirDataAlvoProva(deckId, dataInput)
      setDataAlvo(status.dataAlvo)
      setProntidao(await buscarProntidaoProva(deckId))
    } catch (erro) {
      setErroAcao(extrairMensagemErro(erro, 'Não foi possível definir a data da prova. Confira se é uma data futura.'))
    } finally {
      setProcessando(false)
    }
  }

  async function aoRemoverData() {
    setProcessando(true)
    setErroAcao(null)

    try {
      await removerDataAlvoProva(deckId)
      setDataAlvo(null)
      setProntidao(null)
      setDataInput('')
    } catch (erro) {
      setErroAcao(extrairMensagemErro(erro, 'Não foi possível remover a data da prova.'))
    } finally {
      setProcessando(false)
    }
  }

  if (carregando) {
    return <Skeleton className="h-48 w-full rounded-xl" />
  }

  if (erroCarregamento !== null) {
    return (
      <Card>
        <EstadoErro compacto mensagem={erroCarregamento} onTentarNovamente={() => void carregar()} />
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-brand-700" aria-hidden="true" />
          <CardTitle>Prontidão para a prova</CardTitle>
        </div>
        <CardDescription>
          Estimativa de retenção por tópico, calculada a partir do seu histórico de revisões, sem uso de IA.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(evento) => void aoDefinirData(evento)}>
          <div className="space-y-1.5">
            <Label htmlFor={`data-alvo-prova-${deckId}`}>Data da prova</Label>
            <Input
              id={`data-alvo-prova-${deckId}`}
              type="date"
              value={dataInput}
              onChange={(evento) => setDataInput(evento.target.value)}
              className="sm:w-48"
              disabled={processando}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="secondary" className="flex-1 sm:flex-none" loading={processando} disabled={!dataInput}>
              {dataAlvo !== null ? 'Atualizar data' : 'Definir data'}
            </Button>
            {dataAlvo !== null && (
              <Button type="button" variant="ghost" onClick={() => void aoRemoverData()} disabled={processando}>
                Remover
              </Button>
            )}
          </div>
        </form>

        {erroAcao && <Alerta variante="erro" onFechar={() => setErroAcao(null)}>{erroAcao}</Alerta>}

        {prontidao !== null && (
          <div className="grid gap-6 border-t border-ink-100 pt-5 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
            <div className="flex items-center gap-4 md:flex-col md:items-center md:text-center">
              <AnelPontuacao pontuacao={prontidao.prontidaoGeral} tamanho={104} espessura={9} rotulo="prontidão" />
              <p className="text-sm font-semibold text-ink-700">
                {prontidao.diasRestantes >= 0
                  ? `Faltam ${prontidao.diasRestantes} dia${prontidao.diasRestantes === 1 ? '' : 's'}`
                  : 'A data da prova já passou'}
              </p>
            </div>

            <div className="space-y-4">
              <Alerta variante="info">{prontidao.mensagem}</Alerta>

              {prontidao.topicos.length > 0 && (
                <ul className="space-y-3">
                  {prontidao.topicos.map((topico) => {
                    const cor = corRetencao(topico.retencaoMediaEstimada)
                    return (
                      <li key={topico.topico} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="flex min-w-0 items-center gap-1.5 font-medium text-foreground">
                            {topico.flashcardsPrecisandoRevisao > 0 ? (
                              <AlertTriangle className="h-4 w-4 shrink-0 text-danger-600" aria-label="Precisa de revisão" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-success-600" aria-label="Em dia" />
                            )}
                            <span className="truncate">{topico.topico}</span>
                            <span className="shrink-0 font-normal text-ink-500">({topico.totalFlashcards})</span>
                          </span>
                          <span className={cn('font-semibold tabular-nums', cor.texto)}>{topico.retencaoMediaEstimada}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-ink-100" aria-hidden="true">
                          <div className={cn('h-full rounded-full', cor.barra)} style={{ width: `${topico.retencaoMediaEstimada}%` }} />
                        </div>
                        {topico.flashcardsPrecisandoRevisao > 0 && (
                          <p className="text-xs font-medium text-danger-700">
                            {topico.flashcardsPrecisandoRevisao} card{topico.flashcardsPrecisandoRevisao === 1 ? '' : 's'} precisando de revisão
                          </p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

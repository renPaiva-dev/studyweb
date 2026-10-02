import { RotateCw, Sparkles, Target } from 'lucide-react'
import { useEffect, useState } from 'react'

import { extrairMensagemErro } from '@/api/apiError'
import { gerarRecomendacaoEstudo, type RecomendacaoEstudo } from '@/api/recomendacaoApi'
import { Alerta } from '@/components/ui/alerta'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface RecomendacaoEstudoCardProps {
  deckId: number
}

// UC13 - recomendação de foco de estudo (RN18). Sob demanda (POST, não
// carrega sozinho no mount do dashboard) - cada clique é uma chamada real à
// IA, então só dispara quando o estudante pede. Mesmo padrão de
// carregando/erro do "Não entendi, explique melhor" (UC14, ver
// FlashcardEstudoCard).
export function RecomendacaoEstudoCard({ deckId }: RecomendacaoEstudoCardProps) {
  const [carregando, setCarregando] = useState(false)
  const [carregandoDemorando, setCarregandoDemorando] = useState(false)
  const [recomendacao, setRecomendacao] = useState<RecomendacaoEstudo | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  // N4 (Docs/auditoria-coerencia-seguranca-2026-09.md): o backend tenta a
  // chamada a IA ate 2x antes de desistir - mesmo padrao de MaterialItem.tsx.
  useEffect(() => {
    if (!carregando) {
      setCarregandoDemorando(false)
      return
    }

    const temporizador = setTimeout(() => setCarregandoDemorando(true), 15_000)
    return () => clearTimeout(temporizador)
  }, [carregando])

  async function aoPedirRecomendacao() {
    setCarregando(true)
    setErro(null)

    try {
      setRecomendacao(await gerarRecomendacaoEstudo(deckId))
    } catch (erroCapturado) {
      setErro(extrairMensagemErro(erroCapturado, 'Não foi possível gerar uma recomendação agora. Tente novamente.'))
    } finally {
      setCarregando(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-brand-700" aria-hidden="true" />
          <CardTitle>Onde focar agora</CardTitle>
        </div>
        <CardDescription>A IA olha os tópicos com mais flashcards em risco neste deck e sugere por onde retomar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recomendacao === null ? (
          <div className="space-y-2">
            <Button onClick={() => void aoPedirRecomendacao()} loading={carregando}>
              <Sparkles />
              {carregando ? 'Analisando seus tópicos...' : 'Ver recomendação de foco'}
            </Button>
            <p className="text-sm text-ink-600">
              {carregandoDemorando ? 'Ainda analisando seus tópicos, pode levar um pouco mais que o normal...' : 'Limitado a 10 gerações por minuto.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 animate-entrada">
            <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
              {recomendacao.baseadoEmDados && (
                <p className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-800">
                  <Sparkles className="h-3.5 w-3.5" />
                  Foco sugerido: {recomendacao.topicoFoco}
                </p>
              )}
              <p className="leading-relaxed text-foreground">{recomendacao.recomendacao}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => void aoPedirRecomendacao()} loading={carregando}>
              <RotateCw />
              Atualizar recomendação
            </Button>
            {carregandoDemorando && (
              <p className="text-sm text-ink-600">Ainda analisando seus tópicos, pode levar um pouco mais que o normal...</p>
            )}
          </div>
        )}
        {erro && <Alerta variante="erro" onFechar={() => setErro(null)}>{erro}</Alerta>}
      </CardContent>
    </Card>
  )
}

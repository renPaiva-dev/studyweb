import { Loader2, MessageCircleQuestion, Sparkles } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'

import { extrairMensagemErro } from '@/api/apiError'
import { perguntarSobreMaterial } from '@/api/perguntaApi'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface PerguntarTabProps {
  deckId: number
}

interface Troca {
  pergunta: string
  resposta: string
  materiaisConsultados: number
}

// UC32/RN41 - pergunta livre sobre o material do deck, ancorada via IA no
// texto extraido de todos os materiais processados (RAG-lite, mesmo
// principio de UC14/explicacaoApi.ts, mas escopado ao deck inteiro). Cada
// pergunta e independente - RN41 nao preve memoria de perguntas anteriores,
// entao o historico abaixo e so estado local desta aba (nunca persistido;
// some ao trocar de deck via key={deckId} em DeckDetalhePage).
export function PerguntarTab({ deckId }: PerguntarTabProps) {
  const [pergunta, setPergunta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviandoDemorando, setEnviandoDemorando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [historico, setHistorico] = useState<Troca[]>([])

  // N4 (Docs/auditoria-coerencia-seguranca-2026-09.md): o backend tenta a
  // chamada a IA ate 2x antes de desistir - sem isso, o spinner fica preso
  // no texto "Consultando o material..." sem nenhuma pista do que esta
  // havendo se a primeira tentativa falhar/demorar (mesmo padrao de
  // MaterialItem.tsx).
  useEffect(() => {
    if (!enviando) {
      setEnviandoDemorando(false)
      return
    }

    const temporizador = setTimeout(() => setEnviandoDemorando(true), 15_000)
    return () => clearTimeout(temporizador)
  }, [enviando])

  async function aoPerguntar(evento: FormEvent) {
    evento.preventDefault()

    const perguntaEnviada = pergunta.trim()
    if (!perguntaEnviada || enviando) {
      return
    }

    setEnviando(true)
    setErro(null)

    try {
      const resposta = await perguntarSobreMaterial(deckId, perguntaEnviada)
      setHistorico((atual) => [
        ...atual,
        { pergunta: perguntaEnviada, resposta: resposta.resposta, materiaisConsultados: resposta.materiaisConsultados },
      ])
      setPergunta('')
    } catch (erroRequisicao) {
      setErro(
        extrairMensagemErro(erroRequisicao, 'Não foi possível responder sua pergunta agora. Tente novamente.'),
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-6">
      {historico.length === 0 && erro === null && (
        <div className="flex flex-col items-center gap-3 rounded-none border border-dashed py-16 text-center text-muted-foreground">
          <MessageCircleQuestion className="h-8 w-8" />
          <p className="max-w-sm text-sm">
            Pergunte qualquer coisa sobre os materiais enviados neste deck — a resposta vem só do que está
            realmente nos seus PDFs, nunca de conhecimento genérico.
          </p>
        </div>
      )}

      {historico.length > 0 && (
        <div className="space-y-6">
          {historico.map((troca, indice) => (
            <div key={indice} className="space-y-2">
              <p className="font-medium">{troca.pergunta}</p>
              <div className="flex items-start gap-1.5 text-sm">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="space-y-1">
                  <p>{troca.resposta}</p>
                  <p className="text-xs text-muted-foreground">
                    Baseado em {troca.materiaisConsultados}{' '}
                    {troca.materiaisConsultados === 1 ? 'material' : 'materiais'} deste deck.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {erro !== null && <p className="text-sm text-vermelho-correcao">{erro}</p>}

      <form className="space-y-2" onSubmit={(evento) => void aoPerguntar(evento)}>
        <Textarea
          value={pergunta}
          onChange={(evento) => setPergunta(evento.target.value)}
          placeholder="Ex.: qual a diferença entre X e Y? Me dá um exemplo de Z."
          maxLength={1000}
          disabled={enviando}
          rows={3}
        />
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Limitado a 10 perguntas por minuto.</p>
          <Button type="submit" disabled={enviando || !pergunta.trim()}>
            {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {enviando ? 'Consultando o material...' : 'Perguntar'}
          </Button>
        </div>
        {enviandoDemorando && (
          <p className="text-right text-xs text-muted-foreground">
            Ainda consultando o material, pode levar um pouco mais que o normal...
          </p>
        )}
      </form>
    </div>
  )
}

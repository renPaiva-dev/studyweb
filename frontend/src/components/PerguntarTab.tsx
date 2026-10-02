import { ArrowUp, FileText, MessageCircleQuestion, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'

import { extrairMensagemErro } from '@/api/apiError'
import { perguntarSobreMaterial } from '@/api/perguntaApi'
import { Alerta } from '@/components/ui/alerta'
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

const LIMITE = 1000

const SUGESTOES = ['Me explique o conceito principal com um exemplo', 'Qual a diferença entre os dois temas mais importantes?', 'Faça um resumo em tópicos']

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
  const [perguntaPendente, setPerguntaPendente] = useState<string | null>(null)
  const campoRef = useRef<HTMLTextAreaElement>(null)

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

  async function aoPerguntar(evento?: FormEvent) {
    evento?.preventDefault()

    const perguntaEnviada = pergunta.trim()
    if (!perguntaEnviada || enviando) {
      return
    }

    setEnviando(true)
    setErro(null)
    setPerguntaPendente(perguntaEnviada)

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
      requestAnimationFrame(() => campoRef.current?.focus())
    } finally {
      setEnviando(false)
      setPerguntaPendente(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {historico.length === 0 && !enviando && (
        <div className="rounded-xl border border-ink-200/80 bg-card p-6 text-center shadow-sm sm:p-8">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900 text-white shadow-md">
            <MessageCircleQuestion className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <p className="mt-4 font-heading text-h3 text-foreground">Pergunte ao seu material</p>
          <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
            A resposta vem só do que está nos PDFs deste deck, nunca de conhecimento genérico.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {SUGESTOES.map((sugestao) => (
              <button
                key={sugestao}
                type="button"
                onClick={() => {
                  setPergunta(sugestao)
                  campoRef.current?.focus()
                }}
                className="min-h-9 rounded-full border border-ink-200 bg-ink-50 px-3.5 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {sugestao}
              </button>
            ))}
          </div>
        </div>
      )}

      {(historico.length > 0 || perguntaPendente) && (
        <ol className="space-y-6" aria-live="polite">
          {historico.map((troca, indice) => (
            <li key={indice} className="space-y-3">
              <BalaoPergunta texto={troca.pergunta} />
              <div className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-400 text-ink-950" aria-hidden="true">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-ink-200/80 bg-card px-4 py-3 shadow-xs">
                  <p className="whitespace-pre-line leading-relaxed text-foreground">{troca.resposta}</p>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-ink-600">
                    <FileText className="h-3.5 w-3.5" />
                    Baseado em {troca.materiaisConsultados} {troca.materiaisConsultados === 1 ? 'material' : 'materiais'} deste deck
                  </p>
                </div>
              </div>
            </li>
          ))}
          {perguntaPendente && (
            <li className="space-y-3">
              <BalaoPergunta texto={perguntaPendente} />
              <div className="flex gap-3" role="status">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-400 text-ink-950" aria-hidden="true">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                </span>
                <div className="rounded-2xl rounded-tl-sm border border-ink-200/80 bg-card px-4 py-3 text-sm text-ink-600 shadow-xs">
                  <span className="inline-flex items-center gap-1" aria-hidden="true">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400" />
                  </span>
                  <span className="ml-2">
                    {enviandoDemorando ? 'Ainda consultando o material, pode levar um pouco mais que o normal...' : 'Consultando o material...'}
                  </span>
                </div>
              </div>
            </li>
          )}
        </ol>
      )}

      {erro !== null && (
        <Alerta variante="erro" titulo="Não deu para responder" onFechar={() => setErro(null)}>
          {erro}
        </Alerta>
      )}

      <form
        className="sticky bottom-[calc(var(--altura-nav-mobile)+env(safe-area-inset-bottom)+0.75rem)] z-sticky rounded-2xl border border-ink-300 bg-card p-2 shadow-lg transition-shadow focus-within:border-brand-700 focus-within:ring-[3px] focus-within:ring-brand-500/25 md:bottom-4"
        onSubmit={(evento) => void aoPerguntar(evento)}
      >
        <label htmlFor="pergunta-material" className="sr-only">
          Sua pergunta sobre o material
        </label>
        <Textarea
          id="pergunta-material"
          ref={campoRef}
          value={pergunta}
          onChange={(evento) => setPergunta(evento.target.value)}
          onKeyDown={(evento) => {
            // Enter envia, Shift+Enter quebra linha (padrao de chat).
            if (evento.key === 'Enter' && !evento.shiftKey) {
              evento.preventDefault()
              void aoPerguntar()
            }
          }}
          placeholder="Ex.: qual a diferença entre X e Y? Me dá um exemplo de Z."
          maxLength={LIMITE}
          disabled={enviando}
          rows={2}
          className="min-h-[60px] resize-none border-0 bg-transparent shadow-none hover:border-0 focus-visible:ring-0 disabled:bg-transparent"
        />
        <div className="flex items-center justify-between gap-2 px-2 pb-1 pt-1">
          <p className="text-xs text-ink-600">
            <span className="hidden sm:inline">Enter envia · Shift+Enter quebra linha · </span>
            <span className={pergunta.length > LIMITE * 0.9 ? 'font-semibold text-warning-800' : undefined}>
              {pergunta.length}/{LIMITE}
            </span>
          </p>
          <Button type="submit" size="sm" loading={enviando} disabled={!pergunta.trim()} aria-label="Perguntar">
            <ArrowUp />
            Perguntar
          </Button>
        </div>
      </form>
      <p className="text-center text-xs text-ink-600">Limitado a 10 perguntas por minuto.</p>
    </div>
  )
}

function BalaoPergunta({ texto }: { texto: string }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-tr-sm bg-ink-900 px-4 py-2.5 text-white shadow-sm">{texto}</p>
    </div>
  )
}

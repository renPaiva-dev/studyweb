import { isCancel } from 'axios'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import {
  gerarAnalogia,
  pedirFeedbackAutoexplicacao,
  type Analogia,
  type FeedbackAutoexplicacao,
} from '@/api/elaboracaoApi'
import { ElaboracaoAtalhos } from '@/components/ElaboracaoAtalhos'
import { FolhaAutoexplicacao } from '@/components/FolhaAutoexplicacao'
import { NotaAnalogia } from '@/components/NotaAnalogia'
import { NotasCorrecao } from '@/components/NotasCorrecao'
import { TextoCorrigido } from '@/components/TextoCorrigido'
import { numerarAnotacoes } from '@/utils/segmentarTextoCorrigido'

type Modo = 'fechado' | 'escrevendo' | 'corrigindo' | 'corrigido'

interface ElaboracaoPainelProps {
  flashcardId: number
  // Notas da margem (correção/analogia), mesmo contrato de
  // FlashcardEstudoCard#onNotasChange - o EstudarTab as põe na coluna de margem.
  onNotasChange: (notas: ReactNode | null) => void
  onOcultar: () => void
}

// UC34 - elaborar o card com a IA (RN43), sempre opcional (RN44). O pai
// monta este painel só com o card virado e com `key={flashcardId}`: avaliar
// o card desmonta o painel, e o cleanup abaixo aborta qualquer requisição em
// andamento, descartando o resultado sem toast de erro.
export function ElaboracaoPainel({ flashcardId, onNotasChange, onOcultar }: ElaboracaoPainelProps) {
  const idBaseNotas = useId()

  const [modo, setModo] = useState<Modo>('fechado')
  const [texto, setTexto] = useState('')
  const [textoCorrigido, setTextoCorrigido] = useState('')
  const [feedback, setFeedback] = useState<FeedbackAutoexplicacao | null>(null)

  const [analogia, setAnalogia] = useState<Analogia | null>(null)
  const [gerandoAnalogia, setGerandoAnalogia] = useState(false)

  const correcaoEmAndamento = useRef<AbortController | null>(null)
  const analogiaEmAndamento = useRef<AbortController | null>(null)

  useEffect(
    () => () => {
      correcaoEmAndamento.current?.abort()
      analogiaEmAndamento.current?.abort()
    },
    [],
  )

  async function pedirCorrecao() {
    const textoEnviado = texto.trim()
    const controlador = new AbortController()
    correcaoEmAndamento.current = controlador
    setModo('corrigindo')

    try {
      const resposta = await pedirFeedbackAutoexplicacao(flashcardId, textoEnviado, controlador.signal)
      setTextoCorrigido(textoEnviado)
      setFeedback(resposta)
      setModo('corrigido')
    } catch (erro) {
      if (isCancel(erro)) {
        return
      }
      toast.error(extrairMensagemErro(erro, 'Não foi possível corrigir sua explicação agora. Tente novamente.'))
      setModo('escrevendo')
    } finally {
      if (correcaoEmAndamento.current === controlador) {
        correcaoEmAndamento.current = null
      }
    }
  }

  function cancelarEscrita() {
    if (modo === 'corrigindo') {
      correcaoEmAndamento.current?.abort()
      setModo('escrevendo')
      return
    }
    setModo('fechado')
  }

  function reescrever() {
    setFeedback(null)
    setModo('escrevendo')
  }

  function fecharCorrecao() {
    setFeedback(null)
    setModo('fechado')
  }

  async function pedirAnalogia() {
    const controlador = new AbortController()
    analogiaEmAndamento.current = controlador
    setGerandoAnalogia(true)

    try {
      setAnalogia(await gerarAnalogia(flashcardId, analogia?.texto, controlador.signal))
    } catch (erro) {
      if (isCancel(erro)) {
        return
      }
      toast.error(extrairMensagemErro(erro, 'Não foi possível gerar uma analogia agora. Tente novamente.'))
    } finally {
      if (analogiaEmAndamento.current === controlador) {
        analogiaEmAndamento.current = null
        setGerandoAnalogia(false)
      }
    }
  }

  const numeros = feedback ? numerarAnotacoes(textoCorrigido, feedback.anotacoes) : []

  useEffect(() => {
    const correcao =
      modo === 'corrigido' && feedback ? (
        <NotasCorrecao feedback={feedback} numeros={numeros} idBaseNotas={idBaseNotas} />
      ) : null
    const notaAnalogia = analogia ? (
      <NotaAnalogia analogia={analogia} gerando={gerandoAnalogia} onOutra={() => void pedirAnalogia()} />
    ) : null

    onNotasChange(
      correcao || notaAnalogia ? (
        <div className="space-y-5">
          {correcao}
          {correcao && notaAnalogia && <div className="border-t border-manilha" />}
          {notaAnalogia}
        </div>
      ) : null,
    )
    // O JSX é recriado a cada render; a dependência real é o estado que o compõe
    // (mesmo raciocínio de FlashcardEstudoCard).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onNotasChange, modo, feedback, textoCorrigido, analogia, gerandoAnalogia])

  useEffect(() => () => onNotasChange(null), [onNotasChange])

  return (
    <div className="space-y-4">
      <ElaboracaoAtalhos
        escrevendo={modo !== 'fechado'}
        gerandoAnalogia={gerandoAnalogia}
        onExplicar={() => setModo('escrevendo')}
        onAnalogia={() => void pedirAnalogia()}
        onOcultar={onOcultar}
      />

      {(modo === 'escrevendo' || modo === 'corrigindo') && (
        <FolhaAutoexplicacao
          texto={texto}
          onTextoChange={setTexto}
          corrigindo={modo === 'corrigindo'}
          onPedirCorrecao={() => void pedirCorrecao()}
          onCancelar={cancelarEscrita}
        />
      )}

      {modo === 'corrigido' && feedback && (
        <TextoCorrigido
          texto={textoCorrigido}
          feedback={feedback}
          numeros={numeros}
          idBaseNotas={idBaseNotas}
          onReescrever={reescrever}
          onFechar={fecharCorrecao}
        />
      )}
    </div>
  )
}

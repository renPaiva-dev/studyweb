import { FileWarning } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { buscarMaterial, enviarMaterial, listarMateriais, type Material, type SugestaoFlashcard } from '@/api/materialApi'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MaterialItem } from '@/components/MaterialItem'
import { RevisaoSugestoesFlashcards } from '@/components/RevisaoSugestoesFlashcards'
import { UploadMaterialArea } from '@/components/UploadMaterialArea'

const TAMANHO_MAXIMO_BYTES = 15 * 1024 * 1024

interface MateriaisTabProps {
  deckId: number
  onFlashcardsConfirmados: () => void
}

// UC03 - aba "Materiais" da visao geral do deck. Upload de PDF
// (POST /api/decks/{id}/materiais) + lista dos materiais ja enviados
// (GET /api/decks/{id}/materiais). UC04/UC05 - gerar sugestoes de
// flashcard via IA e revisa-las antes de confirmar.
export function MateriaisTab({ deckId, onFlashcardsConfirmados }: MateriaisTabProps) {
  const [materiais, setMateriais] = useState<Material[] | null>(null)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [sugestoesEmRevisao, setSugestoesEmRevisao] = useState<SugestaoFlashcard[] | null>(null)

  const intervalosPollingRef = useRef<number[]>([])

  const carregarMateriais = useCallback(async () => {
    setErroCarregamento(null)

    try {
      setMateriais(await listarMateriais(deckId))
    } catch (erro) {
      setErroCarregamento(extrairMensagemErro(erro, 'Não foi possível carregar os materiais deste deck.'))
    }
  }, [deckId])

  useEffect(() => {
    void carregarMateriais()

    const intervalosAtivos = intervalosPollingRef.current
    return () => {
      intervalosAtivos.forEach(clearInterval)
    }
  }, [carregarMateriais])

  // Defensivo: o contrato documenta o material voltando PENDENTE na
  // resposta do upload (extracao processada de forma assincrona) - faz
  // polling ate resolver, mesmo que a implementacao atual do backend
  // resolva de forma sincrona antes de responder.
  function acompanharProcessamento(materialId: number) {
    const intervalo = window.setInterval(async () => {
      try {
        const atualizado = await buscarMaterial(materialId)
        setMateriais((atual) => atual?.map((m) => (m.id === materialId ? atualizado : m)) ?? atual)

        if (atualizado.statusProcessamento !== 'PENDENTE') {
          window.clearInterval(intervalo)
        }
      } catch {
        window.clearInterval(intervalo)
      }
    }, 2000)

    intervalosPollingRef.current.push(intervalo)
  }

  async function aoSelecionarArquivo(arquivo: File) {
    if (!arquivo.type.includes('pdf')) {
      toast.error('Apenas arquivos PDF são aceitos.')
      return
    }

    if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
      toast.error('O arquivo excede o tamanho máximo de 15MB.')
      return
    }

    setEnviando(true)

    try {
      const material = await enviarMaterial(deckId, arquivo)
      setMateriais((atual) => [material, ...(atual ?? [])])

      if (material.statusProcessamento === 'PENDENTE') {
        acompanharProcessamento(material.id)
      } else if (material.statusProcessamento === 'PROCESSADO') {
        toast.success('PDF enviado e processado com sucesso.')
      } else {
        toast.error('Não foi possível extrair o texto deste PDF.')
      }
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível enviar o material. Tente novamente.'))
    } finally {
      setEnviando(false)
    }
  }

  if (sugestoesEmRevisao !== null) {
    return (
      <RevisaoSugestoesFlashcards
        deckId={deckId}
        sugestoesIniciais={sugestoesEmRevisao}
        onConfirmado={() => {
          setSugestoesEmRevisao(null)
          onFlashcardsConfirmados()
        }}
        onCancelar={() => setSugestoesEmRevisao(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <UploadMaterialArea enviando={enviando} onArquivoSelecionado={(arquivo) => void aoSelecionarArquivo(arquivo)} />

      {materiais === null && erroCarregamento === null && (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      )}

      {erroCarregamento !== null && (
        <div className="flex flex-col items-center gap-3 rounded-xl border py-10 text-center">
          <FileWarning className="h-6 w-6 text-muted-foreground" />
          <p className="text-muted-foreground">{erroCarregamento}</p>
          <Button variant="outline" size="sm" onClick={() => void carregarMateriais()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {materiais !== null && materiais.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">Nenhum material enviado ainda.</p>
      )}

      {materiais !== null && materiais.length > 0 && (
        <div className="space-y-3">
          {materiais.map((material) => (
            <MaterialItem key={material.id} material={material} onSugestoesGeradas={setSugestoesEmRevisao} />
          ))}
        </div>
      )}
    </div>
  )
}

import { FileText } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { buscarMaterial, enviarMaterial, listarMateriais, type Material, type SugestaoFlashcard } from '@/api/materialApi'
import { Alerta } from '@/components/ui/alerta'
import { Button } from '@/components/ui/button'
import { EstadoErro, EstadoVazio } from '@/components/ui/estados'
import { Carregando, Skeleton } from '@/components/ui/skeleton'
import { MaterialItem } from '@/components/MaterialItem'
import { NotaMargem } from '@/components/NotaMargem'
import { RevisaoSugestoesFlashcards } from '@/components/RevisaoSugestoesFlashcards'
import { UploadMaterialArea } from '@/components/UploadMaterialArea'
import { useDefinirMargem } from '@/context/MargemContext'

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
  // Erro do ultimo arquivo escolhido (tipo/tamanho/falha no envio) - inline,
  // logo abaixo da area de upload, nunca so num toast que some.
  const [erroUpload, setErroUpload] = useState<string | null>(null)
  const [sugestoesEmRevisao, setSugestoesEmRevisao] = useState<SugestaoFlashcard[] | null>(null)

  // B5 - a listagem agora e paginada; guarda a pagina atual/total para o
  // botao "Carregar mais" e para o total real (totalItens), que pode ser
  // maior do que o que ja foi carregado na tela.
  const [paginaAtual, setPaginaAtual] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(0)
  const [totalItens, setTotalItens] = useState(0)
  const [carregandoMais, setCarregandoMais] = useState(false)

  const intervalosPollingRef = useRef<number[]>([])
  // `clearInterval` no cleanup do useEffect impede so os proximos ticks -
  // uma chamada de polling ja em voo no momento do unmount ainda resolve
  // depois e tentaria dar setState num componente desmontado. Esta flag e
  // checada antes de qualquer setState dentro do callback do polling.
  const canceladoRef = useRef(false)

  const carregarMateriais = useCallback(async () => {
    setErroCarregamento(null)

    try {
      const resultado = await listarMateriais(deckId, 0)
      setMateriais(resultado.itens)
      setPaginaAtual(resultado.pagina)
      setTotalPaginas(resultado.totalPaginas)
      setTotalItens(resultado.totalItens)
    } catch (erro) {
      setErroCarregamento(extrairMensagemErro(erro, 'Não foi possível carregar os materiais deste deck.'))
    }
  }, [deckId])

  async function carregarMaisMateriais() {
    setCarregandoMais(true)

    try {
      const resultado = await listarMateriais(deckId, paginaAtual + 1)
      setMateriais((atual) => [...(atual ?? []), ...resultado.itens])
      setPaginaAtual(resultado.pagina)
      setTotalPaginas(resultado.totalPaginas)
      setTotalItens(resultado.totalItens)
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível carregar mais materiais.'))
    } finally {
      setCarregandoMais(false)
    }
  }

  useEffect(() => {
    canceladoRef.current = false
    void carregarMateriais()

    const intervalosAtivos = intervalosPollingRef.current
    return () => {
      canceladoRef.current = true
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

        if (canceladoRef.current) {
          return
        }

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
    setErroUpload(null)

    if (!arquivo.type.includes('pdf')) {
      setErroUpload(`"${arquivo.name}" não é um PDF. Envie um arquivo com extensão .pdf.`)
      return
    }

    if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
      const tamanhoMb = (arquivo.size / 1024 / 1024).toFixed(1).replace('.', ',')
      setErroUpload(`"${arquivo.name}" tem ${tamanhoMb} MB, acima do limite de 15 MB. Tente dividir o PDF em partes menores.`)
      return
    }

    setEnviando(true)

    try {
      const material = await enviarMaterial(deckId, arquivo)
      // A resposta do POST (MaterialCriado) nao traz `criadoEm` (contrato) -
      // usa a hora local como fallback para inserir o item otimisticamente
      // na lista sem gerar "Invalid Date" na exibicao (MaterialItem).
      setMateriais((atual) => [{ ...material, criadoEm: new Date().toISOString() }, ...(atual ?? [])])
      setTotalItens((atual) => atual + 1)

      if (material.statusProcessamento === 'PENDENTE') {
        acompanharProcessamento(material.id)
      } else if (material.statusProcessamento === 'PROCESSADO') {
        toast.success('PDF enviado e processado!', { description: 'Agora é só gerar os flashcards com IA.' })
      } else {
        setErroUpload('O PDF foi enviado, mas não conseguimos extrair o texto dele. Veja o motivo na lista abaixo.')
      }
    } catch (erro) {
      setErroUpload(extrairMensagemErro(erro, 'Não foi possível enviar o material. Tente novamente.'))
    } finally {
      setEnviando(false)
    }
  }

  const totalProcessados = materiais?.filter((material) => material.statusProcessamento === 'PROCESSADO').length ?? 0
  const totalPendentes = materiais?.filter((material) => material.statusProcessamento === 'PENDENTE').length ?? 0
  const totalComErro = materiais?.filter((material) => material.statusProcessamento === 'ERRO').length ?? 0

  useDefinirMargem(
    materiais && materiais.length > 0 ? (
      <NotaMargem
        valor={totalItens}
        rotulo={totalItens === 1 ? 'material enviado' : 'materiais enviados'}
        detalhes={[
          { rotulo: 'Prontos para gerar', valor: totalProcessados, tom: totalProcessados > 0 ? 'positivo' : 'neutro' },
          ...(totalPendentes > 0 ? [{ rotulo: 'Processando', valor: totalPendentes }] : []),
          ...(totalComErro > 0 ? [{ rotulo: 'Com erro', valor: totalComErro, tom: 'atencao' as const }] : []),
        ]}
      />
    ) : null,
    null,
    [materiais?.length, totalItens, totalProcessados, totalPendentes, totalComErro],
  )

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
      <div className="space-y-3">
        <UploadMaterialArea
          enviando={enviando}
          invalido={erroUpload !== null}
          onArquivoSelecionado={(arquivo) => void aoSelecionarArquivo(arquivo)}
        />
        {erroUpload && (
          <Alerta id="erro-upload" variante="erro" titulo="Arquivo não enviado" onFechar={() => setErroUpload(null)}>
            {erroUpload}
          </Alerta>
        )}
      </div>

      {materiais === null && erroCarregamento === null && (
        <Carregando rotulo="Carregando materiais..." className="space-y-3">
          <Skeleton className="h-[76px] w-full rounded-xl" />
          <Skeleton className="h-[76px] w-full rounded-xl" />
        </Carregando>
      )}

      {erroCarregamento !== null && <EstadoErro mensagem={erroCarregamento} onTentarNovamente={() => void carregarMateriais()} />}

      {materiais !== null && materiais.length === 0 && (
        <EstadoVazio
          compacto
          icone={FileText}
          titulo="Nenhum material enviado ainda"
          descricao="Envie a apostila, os slides ou o resumo da matéria em PDF. A IA lê o conteúdo e sugere flashcards para você revisar."
        />
      )}

      {materiais !== null && materiais.length > 0 && (
        <div className="space-y-3">
          {materiais.map((material) => (
            <MaterialItem
              key={material.id}
              material={material}
              onSugestoesGeradas={setSugestoesEmRevisao}
              onExcluido={(materialId) => {
                setMateriais((atual) => atual?.filter((m) => m.id !== materialId) ?? atual)
                setTotalItens((atual) => Math.max(0, atual - 1))
              }}
            />
          ))}
        </div>
      )}

      {/* B5 - lista paginada (20 por vez); so aparece quando ha mais paginas
          alem da ja carregada, evitando trocar a UX de decks pequenos (o
          caso comum de um TCC). */}
      {materiais !== null && paginaAtual + 1 < totalPaginas && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => void carregarMaisMateriais()} loading={carregandoMais}>
            {carregandoMais ? 'Carregando...' : 'Carregar mais materiais'}
          </Button>
        </div>
      )}
    </div>
  )
}

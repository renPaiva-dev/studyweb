import { FileText, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { excluirMaterial, gerarFlashcards, type Material, type SugestaoFlashcard } from '@/api/materialApi'
import { ConfirmacaoDestrutivaDialog } from '@/components/ConfirmacaoDestrutivaDialog'
import { MaterialStatusBadge } from '@/components/MaterialStatusBadge'
import { Alerta } from '@/components/ui/alerta'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MaterialItemProps {
  material: Material
  onSugestoesGeradas: (sugestoes: SugestaoFlashcard[]) => void
  onExcluido: (materialId: number) => void
}

// UC03/UC04 - uma linha da lista de materiais. Quando PROCESSADO, exibe
// o botao que dispara POST /api/materiais/{id}/gerar-flashcards (RNF01:
// pode levar até 15s, por isso o loading e explicito). As sugestoes
// retornadas sobem para o pai, que abre a tela de revisao (UC05).
// UC22/RN29 - excluir remove o material (registro + arquivo fisico no
// backend); flashcards ja confirmados nao mantem vinculo com o material e
// nao sao afetados (mesmo aviso do dialogo de confirmacao).
export function MaterialItem({ material, onSugestoesGeradas, onExcluido }: MaterialItemProps) {
  const [gerando, setGerando] = useState(false)
  const [gerandoDemorando, setGerandoDemorando] = useState(false)
  const [erroGeracao, setErroGeracao] = useState<string | null>(null)
  const [dialogoAberto, setDialogoAberto] = useState(false)

  // N4/N6 (Docs/auditoria-coerencia-seguranca-2026-09.md): RNF01 promete
  // "até 15s em 90% dos casos", mas o backend tenta de novo (até 2x) em
  // falha de infraestrutura da IA (achado N4) e o timeout real é bem maior
  // (120s) - sem isso, o spinner ficava preso no texto "até 15 segundos"
  // mesmo bem depois desse prazo, sem nenhuma pista do que está havendo.
  useEffect(() => {
    if (!gerando) {
      setGerandoDemorando(false)
      return
    }

    const temporizador = setTimeout(() => setGerandoDemorando(true), 15_000)
    return () => clearTimeout(temporizador)
  }, [gerando])

  async function aoGerarFlashcards() {
    setGerando(true)
    setErroGeracao(null)

    try {
      const sugestoes = await gerarFlashcards(material.id)

      if (sugestoes.length === 0) {
        toast.info('A IA não encontrou conteúdo suficiente para sugerir flashcards neste material.')
        return
      }

      onSugestoesGeradas(sugestoes)
    } catch (erro) {
      setErroGeracao(extrairMensagemErro(erro, 'Não foi possível gerar flashcards a partir deste material. Tente novamente.'))
    } finally {
      setGerando(false)
    }
  }

  const status = material.statusProcessamento

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 shadow-xs transition-shadow duration-base sm:p-5',
        status === 'ERRO' ? 'border-danger-200' : 'border-ink-200/80',
        gerando && 'ring-2 ring-brand-300',
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              status === 'ERRO' ? 'bg-danger-50 text-danger-600' : 'bg-ink-100 text-ink-700',
            )}
          >
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground" title={material.nomeArquivo}>
              {material.nomeArquivo}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <MaterialStatusBadge status={status} motivo={material.motivoErro} />
              <span>Enviado em {new Date(material.criadoEm).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2">
          {status === 'PROCESSADO' && (
            <Button className="flex-1 sm:flex-none" onClick={() => void aoGerarFlashcards()} loading={gerando}>
              <Sparkles />
              {gerando ? 'Gerando com IA...' : 'Gerar flashcards com IA'}
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="text-ink-500 hover:bg-danger-50 hover:text-danger-700"
            disabled={gerando}
            onClick={() => setDialogoAberto(true)}
            aria-label={`Excluir material ${material.nomeArquivo}`}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      {gerando && (
        <p role="status" className="mt-3 text-sm text-ink-600 sm:text-right">
          {gerandoDemorando ? 'Ainda gerando, pode levar um pouco mais que o normal...' : 'A IA está lendo o material. Isso pode levar até 15 segundos.'}
        </p>
      )}

      {status === 'ERRO' && material.motivoErro && (
        <Alerta variante="erro" className="mt-4" titulo="Não conseguimos ler este PDF">
          {material.motivoErro}
        </Alerta>
      )}

      {erroGeracao && (
        <Alerta variante="erro" className="mt-4" onFechar={() => setErroGeracao(null)}>
          {erroGeracao}
        </Alerta>
      )}

      <ConfirmacaoDestrutivaDialog
        aberto={dialogoAberto}
        onOpenChange={setDialogoAberto}
        titulo="Excluir material?"
        descricao={
          <>
            Essa ação não pode ser desfeita. <span className="font-medium text-foreground">“{material.nomeArquivo}”</span> será
            removido permanentemente. Flashcards já confirmados a partir dele não serão afetados.
          </>
        }
        rotuloConfirmar="Excluir material"
        mensagemErroPadrao="Não foi possível excluir o material. Tente novamente."
        onConfirmar={async () => {
          await excluirMaterial(material.id)
          toast.success('Material excluído.')
          setDialogoAberto(false)
          onExcluido(material.id)
        }}
      />
    </div>
  )
}

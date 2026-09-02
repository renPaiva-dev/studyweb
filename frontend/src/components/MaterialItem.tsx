import { FileText, Loader2, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { excluirMaterial, gerarFlashcards, type Material, type SugestaoFlashcard } from '@/api/materialApi'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { MaterialStatusBadge } from '@/components/MaterialStatusBadge'

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
  const [excluindo, setExcluindo] = useState(false)
  const [dialogoAberto, setDialogoAberto] = useState(false)

  async function aoGerarFlashcards() {
    setGerando(true)

    try {
      const sugestoes = await gerarFlashcards(material.id)

      if (sugestoes.length === 0) {
        toast.info('A IA não retornou sugestões para este material.')
        return
      }

      onSugestoesGeradas(sugestoes)
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível gerar flashcards a partir deste material.'))
    } finally {
      setGerando(false)
    }
  }

  async function aoExcluir() {
    setExcluindo(true)

    try {
      await excluirMaterial(material.id)
      toast.success('Material excluído.')
      setDialogoAberto(false)
      onExcluido(material.id)
    } catch (erro) {
      toast.error(extrairMensagemErro(erro, 'Não foi possível excluir o material. Tente novamente.'))
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate font-medium">{material.nomeArquivo}</p>
            <p className="text-xs text-muted-foreground">
              Enviado em {new Date(material.criadoEm).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <MaterialStatusBadge status={material.statusProcessamento} />
          {material.statusProcessamento === 'PROCESSADO' && (
            <Button size="sm" variant="secondary" onClick={() => void aoGerarFlashcards()} disabled={gerando}>
              {gerando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {gerando ? 'Gerando flashcards com IA...' : 'Gerar flashcards com IA'}
            </Button>
          )}

          <AlertDialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" disabled={excluindo}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Excluir material</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir material?</AlertDialogTitle>
                <AlertDialogDescription>
                  Essa ação não pode ser desfeita. "{material.nomeArquivo}" será removido permanentemente. Flashcards
                  já confirmados a partir dele não serão afetados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(evento) => {
                    evento.preventDefault()
                    void aoExcluir()
                  }}
                  disabled={excluindo}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {excluindo ? 'Excluindo...' : 'Excluir'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {gerando && <p className="mt-2 text-right text-xs text-muted-foreground">Isso pode levar até 15 segundos.</p>}
    </div>
  )
}

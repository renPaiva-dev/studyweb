import { FileText, Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { extrairMensagemErro } from '@/api/apiError'
import { gerarFlashcards, type Material, type SugestaoFlashcard } from '@/api/materialApi'
import { Button } from '@/components/ui/button'
import { MaterialStatusBadge } from '@/components/MaterialStatusBadge'

interface MaterialItemProps {
  material: Material
  onSugestoesGeradas: (sugestoes: SugestaoFlashcard[]) => void
}

// UC03/UC04 - uma linha da lista de materiais. Quando PROCESSADO, exibe
// o botao que dispara POST /api/materiais/{id}/gerar-flashcards (RNF01:
// pode levar até 15s, por isso o loading e explicito). As sugestoes
// retornadas sobem para o pai, que abre a tela de revisao (UC05).
export function MaterialItem({ material, onSugestoesGeradas }: MaterialItemProps) {
  const [gerando, setGerando] = useState(false)

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
        </div>
      </div>

      {gerando && <p className="mt-2 text-right text-xs text-muted-foreground">Isso pode levar até 15 segundos.</p>}
    </div>
  )
}

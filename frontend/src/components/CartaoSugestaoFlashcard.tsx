import { Check, Pencil, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export interface SugestaoEditavel {
  id: number
  pergunta: string
  resposta: string
  aceita: boolean
}

interface CartaoSugestaoFlashcardProps {
  sugestao: SugestaoEditavel
  onAtualizar: (dados: Partial<Pick<SugestaoEditavel, 'pergunta' | 'resposta' | 'aceita'>>) => void
  onDescartar: () => void
}

// UC05 - um card de sugestao de flashcard vinda da IA, ainda nao salva
// (RN05: precisa passar por revisao/edicao antes de confirmar). Borda
// tracejada + badge deixam isso visualmente claro enquanto pendente.
export function CartaoSugestaoFlashcard({ sugestao, onAtualizar, onDescartar }: CartaoSugestaoFlashcardProps) {
  const [editando, setEditando] = useState(false)

  return (
    <div
      className={cn(
        'space-y-3 rounded-xl border-2 border-dashed p-4 transition-colors',
        sugestao.aceita && 'border-solid border-emerald-400 bg-emerald-50/60 dark:border-emerald-700 dark:bg-emerald-950/20',
      )}
    >
      <Badge
        variant="outline"
        className={cn(
          'gap-1',
          sugestao.aceita
            ? 'border-emerald-400 text-emerald-700 dark:text-emerald-400'
            : 'border-amber-400 text-amber-700 dark:text-amber-400',
        )}
      >
        <Sparkles className="h-3 w-3" />
        {sugestao.aceita ? 'Aceita' : 'Sugestão pendente'}
      </Badge>

      {editando ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor={`pergunta-${sugestao.id}`}>Pergunta</Label>
            <Input
              id={`pergunta-${sugestao.id}`}
              value={sugestao.pergunta}
              onChange={(evento) => onAtualizar({ pergunta: evento.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`resposta-${sugestao.id}`}>Resposta</Label>
            <Textarea
              id={`resposta-${sugestao.id}`}
              value={sugestao.resposta}
              onChange={(evento) => onAtualizar({ resposta: evento.target.value })}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="font-medium">{sugestao.pergunta}</p>
          <p className="text-sm text-muted-foreground">{sugestao.resposta}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={sugestao.aceita ? 'secondary' : 'default'}
          onClick={() => onAtualizar({ aceita: !sugestao.aceita })}
        >
          <Check className="mr-1 h-4 w-4" />
          {sugestao.aceita ? 'Aceita' : 'Aceitar'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditando((atual) => !atual)}>
          <Pencil className="mr-1 h-4 w-4" />
          {editando ? 'Concluir edição' : 'Editar'}
        </Button>
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDescartar}>
          <Trash2 className="mr-1 h-4 w-4" />
          Descartar
        </Button>
      </div>
    </div>
  )
}

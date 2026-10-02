import { Check, Pencil, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Campo } from '@/components/ui/campo'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export interface SugestaoEditavel {
  id: number
  pergunta: string
  resposta: string
  /** RN17 - classificacao curta de topico extraida junto com a sugestao. */
  topico: string
  aceita: boolean
}

interface CartaoSugestaoFlashcardProps {
  sugestao: SugestaoEditavel
  /** Aceita mas com pergunta/resposta vazia - destaca os campos. */
  invalida?: boolean
  onAtualizar: (dados: Partial<Pick<SugestaoEditavel, 'pergunta' | 'resposta' | 'aceita'>>) => void
  onDescartar: () => void
}

// UC05 - um card de sugestao de flashcard vinda da IA, ainda nao salva
// (RN05: precisa passar por revisao/edicao antes de confirmar). Borda
// tracejada + badge deixam isso visualmente claro enquanto pendente; aceita
// vira borda solida verde-lousa.
export function CartaoSugestaoFlashcard({ sugestao, invalida, onAtualizar, onDescartar }: CartaoSugestaoFlashcardProps) {
  const [editando, setEditando] = useState(false)
  const emEdicao = editando || Boolean(invalida)

  return (
    <article
      className={cn(
        'space-y-4 rounded-xl border-2 bg-card p-4 transition-[border-color,background-color,box-shadow] duration-base sm:p-5',
        sugestao.aceita ? 'border-success-500 bg-success-50/40 shadow-sm' : 'border-dashed border-ink-300',
        invalida && 'border-danger-500',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={sugestao.aceita ? 'positivo' : 'pendente'}>
          {sugestao.aceita ? <Check /> : <Sparkles />}
          {sugestao.aceita ? 'Aceita' : 'Sugestão pendente'}
        </Badge>
        {sugestao.topico && <Badge variant="secondary">{sugestao.topico}</Badge>}
      </div>

      {emEdicao ? (
        <div className="space-y-4">
          <Campo
            id={`pergunta-${sugestao.id}`}
            rotulo="Pergunta"
            erro={invalida && !sugestao.pergunta.trim() ? 'A pergunta não pode ficar vazia.' : undefined}
          >
            <Textarea rows={2} value={sugestao.pergunta} onChange={(evento) => onAtualizar({ pergunta: evento.target.value })} />
          </Campo>
          <Campo
            id={`resposta-${sugestao.id}`}
            rotulo="Resposta"
            erro={invalida && !sugestao.resposta.trim() ? 'A resposta não pode ficar vazia.' : undefined}
          >
            <Textarea rows={3} value={sugestao.resposta} onChange={(evento) => onAtualizar({ resposta: evento.target.value })} />
          </Campo>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="font-semibold leading-snug text-foreground">{sugestao.pergunta}</p>
          <p className="border-l-2 border-ink-200 pl-3 text-sm leading-relaxed text-ink-700">{sugestao.resposta}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-ink-100 pt-4">
        <Button
          size="sm"
          variant={sugestao.aceita ? 'positivo' : 'default'}
          aria-pressed={sugestao.aceita}
          onClick={() => onAtualizar({ aceita: !sugestao.aceita })}
        >
          <Check />
          {sugestao.aceita ? 'Aceita' : 'Aceitar'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditando((atual) => !atual)} aria-pressed={editando}>
          <Pencil />
          {editando ? 'Concluir edição' : 'Editar'}
        </Button>
        <Button size="sm" variant="destructive-ghost" className="ml-auto" onClick={onDescartar}>
          <Trash2 />
          Descartar
        </Button>
      </div>
    </article>
  )
}

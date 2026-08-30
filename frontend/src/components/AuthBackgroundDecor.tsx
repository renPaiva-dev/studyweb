import {
  BookOpen,
  Bookmark,
  GraduationCap,
  Highlighter,
  Library,
  NotebookPen,
  PenLine,
  Search,
  Sparkles,
  StickyNote,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

interface Doodle {
  Icon: LucideIcon
  className: string
  size: number
  rotate: number
  cor: 'primary' | 'coral'
}

// Cena de fundo tematica (livros, lupa, marcador...) para as telas de auth -
// personalidade e energia visual num lugar onde isso nao compete com dados
// (diferente das telas internas de estudo/dashboard, que ficam com a
// linguagem mais contida do design system). Icones de traco (lucide),
// nunca emoji - RN visual do projeto.
//
// Todos os icones ficam fora da faixa central (x entre ~25% e ~75%), onde o
// card de auth e centralizado - cards mais altos (cadastro, com mais campos)
// ocupam quase toda a altura da tela, entao qualquer doodle "central" acaba
// atravessando o card em algum breakpoint. Ficando so nas colunas laterais,
// nenhum icone disputa espaco com o card independente da altura dele.
const DOODLES: Doodle[] = [
  { Icon: Search, className: 'left-[6%] top-[14%]', size: 96, rotate: -18, cor: 'coral' },
  { Icon: NotebookPen, className: 'left-[4%] top-[38%]', size: 50, rotate: 22, cor: 'coral' },
  { Icon: PenLine, className: 'left-[12%] top-[58%]', size: 64, rotate: 24, cor: 'primary' },
  { Icon: Highlighter, className: 'left-[4%] bottom-[16%]', size: 52, rotate: 8, cor: 'primary' },
  { Icon: Bookmark, className: 'left-[16%] bottom-[4%]', size: 60, rotate: -20, cor: 'coral' },

  { Icon: BookOpen, className: 'right-[8%] top-[10%]', size: 110, rotate: 12, cor: 'primary' },
  { Icon: Sparkles, className: 'right-[4%] top-[34%]', size: 44, rotate: 0, cor: 'primary' },
  { Icon: Library, className: 'right-[6%] top-[52%]', size: 88, rotate: -10, cor: 'coral' },
  { Icon: StickyNote, className: 'right-[3%] bottom-[16%]', size: 56, rotate: -14, cor: 'coral' },
  { Icon: GraduationCap, className: 'right-[14%] bottom-[3%]', size: 72, rotate: 16, cor: 'primary' },
]

export function AuthBackgroundDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Blobs solidos (sem gradiente) por tras dos doodles - dao profundidade sem "efeito flutuante". */}
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-coral-300/25 blur-3xl" />
      <div className="absolute right-1/3 top-1/2 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

      {DOODLES.map(({ Icon, className, size, rotate, cor }, indice) => (
        <Icon
          key={indice}
          className={cn(
            'absolute stroke-[1.25]',
            cor === 'primary' ? 'text-primary/[0.22] dark:text-primary/30' : 'text-coral-400/35 dark:text-coral-400/35',
            className
          )}
          style={{ width: size, height: size, transform: `rotate(${rotate}deg)` }}
        />
      ))}
    </div>
  )
}

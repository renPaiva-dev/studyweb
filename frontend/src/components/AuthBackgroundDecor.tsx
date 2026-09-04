import { BookOpen, Bookmark, GraduationCap, Highlighter, NotebookPen, PenLine } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Doodle {
  Icon: LucideIcon
  className: string
  size: number
  rotate: number
}

// Cena de fundo tematica (caderno, marcador, lupa...) para as telas de
// auth - um toque de identidade sem o trope de blobs de gradiente desfocado
// (padrao visual de SaaS/produto de IA generico, em tensao com o conceito
// editorial do caderno). Icones de traco (lucide) em Manilha/Grafite, nunca
// emoji - RN visual do projeto.
//
// Todos os icones ficam fora da faixa central (x entre ~25% e ~75%), onde o
// card de auth e centralizado - cards mais altos (cadastro, com mais campos)
// ocupam quase toda a altura da tela, entao qualquer doodle "central" acaba
// atravessando o card em algum breakpoint. Ficando so nas colunas laterais,
// nenhum icone disputa espaco com o card independente da altura dele.
const DOODLES: Doodle[] = [
  { Icon: NotebookPen, className: 'left-[6%] top-[16%]', size: 64, rotate: -14 },
  { Icon: PenLine, className: 'left-[10%] top-[52%]', size: 48, rotate: 20 },
  { Icon: Highlighter, className: 'left-[4%] bottom-[14%]', size: 44, rotate: 8 },

  { Icon: BookOpen, className: 'right-[8%] top-[12%]', size: 80, rotate: 10 },
  { Icon: Bookmark, className: 'right-[5%] top-[48%]', size: 44, rotate: -16 },
  { Icon: GraduationCap, className: 'right-[12%] bottom-[10%]', size: 56, rotate: 14 },
]

export function AuthBackgroundDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {DOODLES.map(({ Icon, className, size, rotate }, indice) => (
        <Icon
          key={indice}
          className={`absolute stroke-[1.25] text-manilha/50 ${className}`}
          style={{ width: size, height: size, transform: `rotate(${rotate}deg)` }}
        />
      ))}
    </div>
  )
}

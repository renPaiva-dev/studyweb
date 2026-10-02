import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface NotaMargemProps {
  valor: ReactNode
  rotulo: ReactNode
  tom?: 'neutro' | 'positivo' | 'atencao'
  detalhes?: { rotulo: string; valor: ReactNode; tom?: 'neutro' | 'positivo' | 'atencao' }[]
  children?: ReactNode
}

const COR_TOM = {
  neutro: 'text-foreground',
  positivo: 'text-success-700',
  atencao: 'text-danger-700',
}

// Conteudo padrao da coluna de margem (Layout.tsx): um numero de destaque
// em Fraunces + rotulo, e uma lista curta de detalhes. Mantem todas as abas
// com a mesma "letra" de anotacao.
export function NotaMargem({ valor, rotulo, tom = 'neutro', detalhes, children }: NotaMargemProps) {
  return (
    <div className="space-y-4 text-sm">
      <p className="text-eyebrow uppercase text-brand-800">Na margem</p>
      <div>
        <p className={cn('font-heading text-h1 tabular-nums', COR_TOM[tom])}>{valor}</p>
        <p className="text-ink-600">{rotulo}</p>
      </div>
      {detalhes && detalhes.length > 0 && (
        <dl className="space-y-2 border-t border-ink-100 pt-4">
          {detalhes.map((detalhe) => (
            <div key={detalhe.rotulo} className="flex items-center justify-between gap-3">
              <dt className="text-ink-600">{detalhe.rotulo}</dt>
              <dd className={cn('font-semibold tabular-nums', COR_TOM[detalhe.tom ?? 'neutro'])}>{detalhe.valor}</dd>
            </div>
          ))}
        </dl>
      )}
      {children}
    </div>
  )
}

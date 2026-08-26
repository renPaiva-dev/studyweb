import { CheckCircle2, Clock, XCircle } from 'lucide-react'

import type { StatusProcessamento } from '@/api/materialApi'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const CONFIGURACAO: Record<StatusProcessamento, { rotulo: string; className: string; Icone: typeof Clock }> = {
  PENDENTE: {
    rotulo: 'Pendente',
    className: 'border-transparent bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300',
    Icone: Clock,
  },
  PROCESSADO: {
    rotulo: 'Processado',
    className:
      'border-transparent bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300',
    Icone: CheckCircle2,
  },
  ERRO: {
    rotulo: 'Erro',
    className: 'border-transparent bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-950 dark:text-red-300',
    Icone: XCircle,
  },
}

// UC03 - badge de statusProcessamento (PENDENTE/PROCESSADO/ERRO) com
// cores distintas por status.
export function MaterialStatusBadge({ status }: { status: StatusProcessamento }) {
  const { rotulo, className, Icone } = CONFIGURACAO[status]

  return (
    <Badge className={cn('gap-1', className)}>
      <Icone className="h-3 w-3" />
      {rotulo}
    </Badge>
  )
}

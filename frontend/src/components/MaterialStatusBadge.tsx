import { CheckCircle2, Clock, XCircle } from 'lucide-react'

import type { StatusProcessamento } from '@/api/materialApi'
import { Badge, type BadgeProps } from '@/components/ui/badge'

const CONFIGURACAO: Record<StatusProcessamento, { rotulo: string; variant: BadgeProps['variant']; Icone: typeof Clock }> = {
  // Ainda nao corrigido/processado - neutro tracejado, nunca uma cor de alarme.
  PENDENTE: { rotulo: 'Pendente', variant: 'pendente', Icone: Clock },
  PROCESSADO: { rotulo: 'Processado', variant: 'positivo', Icone: CheckCircle2 },
  ERRO: { rotulo: 'Erro', variant: 'destructive', Icone: XCircle },
}

// UC03 - badge de statusProcessamento (PENDENTE/PROCESSADO/ERRO) com
// cores distintas por status. `motivo` (achado I4) vira o title nativo do
// navegador quando o status é ERRO - o texto completo também aparece embaixo
// do card em MaterialItem.tsx, isso aqui é só um reforço no hover do badge.
export function MaterialStatusBadge({ status, motivo }: { status: StatusProcessamento; motivo?: string | null }) {
  const { rotulo, variant, Icone } = CONFIGURACAO[status]

  return (
    <Badge variant={variant} className="gap-1" title={motivo ?? undefined}>
      <Icone className="h-3 w-3" />
      {rotulo}
    </Badge>
  )
}

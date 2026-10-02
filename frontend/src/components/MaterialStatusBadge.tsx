import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

import type { StatusProcessamento } from '@/api/materialApi'
import { Badge, type BadgeProps } from '@/components/ui/badge'

const CONFIGURACAO: Record<StatusProcessamento, { rotulo: string; variant: BadgeProps['variant']; Icone: typeof CheckCircle2; girar?: boolean }> = {
  // Ainda nao processado - neutro tracejado com spinner, nunca uma cor de alarme.
  PENDENTE: { rotulo: 'Processando', variant: 'pendente', Icone: Loader2, girar: true },
  PROCESSADO: { rotulo: 'Pronto', variant: 'positivo', Icone: CheckCircle2 },
  ERRO: { rotulo: 'Falhou', variant: 'destructive', Icone: XCircle },
}

// UC03 - badge de statusProcessamento (PENDENTE/PROCESSADO/ERRO) com
// cores distintas por status. `motivo` (achado I4) vira o title nativo do
// navegador quando o status é ERRO - o texto completo também aparece embaixo
// do card em MaterialItem.tsx, isso aqui é só um reforço no hover do badge.
export function MaterialStatusBadge({ status, motivo }: { status: StatusProcessamento; motivo?: string | null }) {
  const { rotulo, variant, Icone, girar } = CONFIGURACAO[status]

  return (
    <Badge variant={variant} title={motivo ?? undefined}>
      <Icone className={girar ? 'animate-spin' : undefined} aria-hidden="true" />
      {rotulo}
    </Badge>
  )
}

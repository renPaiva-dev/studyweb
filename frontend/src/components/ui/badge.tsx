import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Badges informativos (nao clicaveis) - por isso sem hover. Variantes
// semanticas em tom suave: texto 700/800 sobre fundo 50/100, todas >= 4.5:1.
const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-5 [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-brand-200 bg-brand-100 text-brand-900",
        secondary: "border-ink-200 bg-ink-100 text-ink-700",
        outline: "border-ink-300 bg-card text-ink-700",
        destructive: "border-danger-200 bg-danger-50 text-danger-800",
        positivo: "border-success-200 bg-success-50 text-success-800",
        aviso: "border-warning-200 bg-warning-50 text-warning-800",
        info: "border-info-200 bg-info-50 text-info-800",
        // Ainda nao confirmado (ex.: PENDENTE, sugestao da IA aguardando
        // revisao) - tracejado neutro, nunca uma cor de alarme.
        pendente: "border-dashed border-ink-400 bg-transparent text-ink-700",
        solido: "border-transparent bg-ink-900 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

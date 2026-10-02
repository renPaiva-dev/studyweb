import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react"

import { cn } from "@/lib/utils"

const alertaVariants = cva(
  "flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-sm animate-alerta-entrada",
  {
    variants: {
      variante: {
        erro: "border-danger-200 bg-danger-50 text-danger-800 [&_[data-icone]]:text-danger-600",
        sucesso: "border-success-200 bg-success-50 text-success-800 [&_[data-icone]]:text-success-600",
        aviso: "border-warning-200 bg-warning-50 text-warning-800 [&_[data-icone]]:text-warning-600",
        info: "border-info-200 bg-info-50 text-info-800 [&_[data-icone]]:text-info-600",
      },
    },
    defaultVariants: { variante: "info" },
  }
)

const ICONES = {
  erro: AlertCircle,
  sucesso: CheckCircle2,
  aviso: AlertTriangle,
  info: Info,
} as const

export interface AlertaProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof alertaVariants> {
  titulo?: React.ReactNode
  /** Acao opcional (ex.: link "Reenviar e-mail") alinhada abaixo do texto. */
  acao?: React.ReactNode
  onFechar?: () => void
}

// Feedback inline (erro de formulario, sucesso de envio, aviso, informacao).
// Erro/aviso usam role="alert" (anunciado na hora pelo leitor de tela);
// sucesso/info usam role="status" (anuncio educado, sem interromper).
export const Alerta = React.forwardRef<HTMLDivElement, AlertaProps>(
  ({ className, variante = "info", titulo, acao, onFechar, children, ...props }, ref) => {
    const Icone = ICONES[variante ?? "info"]
    const urgente = variante === "erro" || variante === "aviso"

    return (
      <div
        ref={ref}
        role={urgente ? "alert" : "status"}
        className={cn(alertaVariants({ variante }), className)}
        {...props}
      >
        <Icone data-icone className="mt-0.5 h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1 space-y-1">
          {titulo && <p className="font-semibold leading-5">{titulo}</p>}
          {children && <div className="leading-5 [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-2">{children}</div>}
          {acao && <div className="pt-1">{acao}</div>}
        </div>
        {onFechar && (
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar aviso"
            className="-m-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
Alerta.displayName = "Alerta"

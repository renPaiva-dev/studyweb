import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-fast ease-suave focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // CTA ambar: a acao principal da tela (uma por contexto).
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-brand-500 active:bg-brand-600 active:text-ink-950",
        // Acao secundaria com peso: tinta solida.
        secondary:
          "bg-ink-900 text-white shadow-sm hover:bg-ink-800 active:bg-ink-950",
        outline:
          "border border-ink-300 bg-card text-foreground shadow-xs hover:border-ink-400 hover:bg-ink-50 active:bg-ink-100",
        ghost: "text-ink-700 hover:bg-ink-100 hover:text-foreground active:bg-ink-200",
        destructive:
          "bg-danger-600 text-white shadow-sm hover:bg-danger-700 active:bg-danger-800",
        // Destrutivo discreto (ex.: "Descartar", "Desativar") - nao compete
        // com a acao principal, mas continua inequivocamente vermelho.
        "destructive-ghost": "text-danger-700 hover:bg-danger-50 hover:text-danger-800 active:bg-danger-100",
        positivo:
          "bg-success-600 text-white shadow-sm hover:bg-success-700 active:bg-success-800",
        link: "h-auto px-0 text-brand-800 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 coarse:min-h-11",
        sm: "h-9 px-3 coarse:min-h-11",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10 coarse:min-h-11 coarse:min-w-11",
        "icon-sm": "h-9 w-9 coarse:min-h-11 coarse:min-w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Mostra um spinner no lugar do icone, trava o botao e anuncia aria-busy. */
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Slot>
      )
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        {loading ? stripLeadingIcon(children) : children}
      </button>
    )
  }
)
Button.displayName = "Button"

// Durante o loading o spinner ocupa o lugar do icone inicial do botao (o
// primeiro filho que for um <svg> do lucide) - evita dois icones lado a lado.
function stripLeadingIcon(children: React.ReactNode): React.ReactNode {
  const lista = React.Children.toArray(children)
  const primeiro = lista[0]
  if (React.isValidElement(primeiro) && typeof primeiro.type !== "string") {
    return lista.slice(1)
  }
  return children
}

export { Button, buttonVariants }

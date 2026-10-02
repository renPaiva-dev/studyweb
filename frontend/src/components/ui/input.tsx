import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"

// Estilo base compartilhado por Input, Textarea e SelectTrigger: borda ink-400
// (3.4:1, legivel como limite de campo), anel ambar no foco e estado de erro
// automatico via aria-invalid (borda + anel vermelhos), sem o chamador
// precisar lembrar de trocar classe.
export const campoBase =
  "w-full rounded-md border border-input bg-card px-3 text-base text-foreground shadow-xs transition-[border-color,box-shadow] duration-fast ease-suave placeholder:text-ink-500 hover:border-ink-500 focus-visible:border-brand-700 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-500/25 disabled:cursor-not-allowed disabled:border-ink-200 disabled:bg-ink-100 disabled:text-ink-600 aria-[invalid=true]:border-danger-600 aria-[invalid=true]:ring-[3px] aria-[invalid=true]:ring-danger-500/15 aria-[invalid=true]:focus-visible:border-danger-600 aria-[invalid=true]:focus-visible:ring-danger-500/25 sm:text-sm"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          campoBase,
          "flex h-11 py-2 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

// Campo de senha com botao de mostrar/ocultar (aria-pressed + rotulo que
// muda junto, para leitor de tela).
const PasswordInput = React.forwardRef<HTMLInputElement, Omit<React.ComponentProps<"input">, "type">>(
  ({ className, disabled, ...props }, ref) => {
    const [visivel, setVisivel] = React.useState(false)

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visivel ? "text" : "password"}
          className={cn("pr-12", className)}
          disabled={disabled}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisivel((atual) => !atual)}
          disabled={disabled}
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visivel}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-ink-500 transition-colors duration-fast hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:pointer-events-none"
        >
          {visivel ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export { Input, PasswordInput }

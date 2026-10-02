import type { LucideIcon } from "lucide-react"
import { RotateCw, WifiOff } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EstadoVazioProps {
  icone: LucideIcon
  titulo: string
  descricao?: ReactNode
  acao?: ReactNode
  /** compacto = dentro de um card/aba, sem moldura propria. */
  compacto?: boolean
  className?: string
}

// Estado vazio padrao: icone em "selo" ambar, titulo, explicacao do que fazer
// e (quase sempre) a acao que resolve o vazio.
export function EstadoVazio({ icone: Icone, titulo, descricao, acao, compacto, className }: EstadoVazioProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center px-6 text-center",
        compacto ? "py-10" : "rounded-xl border border-dashed border-ink-300 bg-card/60 py-14 sm:py-16",
        className
      )}
    >
      <div className="relative mb-4">
        <div className="absolute -right-1.5 -top-1.5 h-4 w-4 rounded-full bg-brand-400 ring-4 ring-background" aria-hidden="true" />
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-900 text-white shadow-md">
          <Icone className="h-6 w-6" strokeWidth={1.75} />
        </div>
      </div>
      <p className="font-heading text-h3 text-foreground">{titulo}</p>
      {descricao && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{descricao}</p>}
      {acao && <div className="mt-5 flex flex-wrap justify-center gap-2">{acao}</div>}
    </div>
  )
}

interface EstadoErroProps {
  mensagem: string
  onTentarNovamente?: () => void
  compacto?: boolean
  className?: string
}

// Falha ao carregar dados: nunca uma tela em branco - mensagem humana + retry.
export function EstadoErro({ mensagem, onTentarNovamente, compacto, className }: EstadoErroProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center px-6 text-center",
        compacto ? "py-8" : "rounded-xl border border-danger-200 bg-danger-50/60 py-12 sm:py-14",
        className
      )}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-danger-100 text-danger-600">
        <WifiOff className="h-5 w-5" />
      </div>
      <p className="font-semibold text-danger-800">Algo não carregou</p>
      <p className="mt-1 max-w-sm text-sm text-danger-800/90">{mensagem}</p>
      {onTentarNovamente && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onTentarNovamente}>
          <RotateCw />
          Tentar novamente
        </Button>
      )}
    </div>
  )
}

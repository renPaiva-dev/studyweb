import * as React from "react"
import { AlertCircle } from "lucide-react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface CampoProps {
  id: string
  rotulo: React.ReactNode
  erro?: string
  /** Texto de ajuda permanente abaixo do campo (some enquanto ha erro). */
  dica?: React.ReactNode
  opcional?: boolean
  /** Elemento alinhado a direita do rotulo (ex.: link "Esqueci minha senha"). */
  extraRotulo?: React.ReactNode
  className?: string
  children: React.ReactElement<Record<string, unknown>>
}

// Campo de formulario padrao: rotulo sempre visivel, controle, e a mensagem
// de erro inline logo abaixo - com icone, cor semantica e role="alert". O
// controle filho recebe id, aria-invalid e aria-describedby automaticamente,
// entao a borda vermelha (ver campoBase em input.tsx) e o anuncio do leitor
// de tela nunca ficam dessincronizados da mensagem.
export function Campo({ id, rotulo, erro, dica, opcional, extraRotulo, className, children }: CampoProps) {
  const idErro = `${id}-erro`
  const idDica = `${id}-dica`
  const descricao = [erro ? idErro : null, dica && !erro ? idDica : null].filter(Boolean).join(" ") || undefined

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <Label htmlFor={id}>{rotulo}</Label>
          {opcional && <span className="text-xs font-medium text-ink-500">Opcional</span>}
        </div>
        {extraRotulo}
      </div>
      {React.cloneElement(children, {
        id,
        "aria-invalid": erro ? true : children.props["aria-invalid"],
        "aria-describedby": [descricao, children.props["aria-describedby"]].filter(Boolean).join(" ") || undefined,
      })}
      {erro ? <MensagemErroCampo id={idErro}>{erro}</MensagemErroCampo> : dica ? (
        <p id={idDica} className="text-sm text-ink-600">{dica}</p>
      ) : null}
    </div>
  )
}

export function MensagemErroCampo({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="flex items-start gap-1.5 text-sm font-medium text-danger-700 animate-alerta-entrada">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}

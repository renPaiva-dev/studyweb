import { cn } from "@/lib/utils"

// Bloco de carregamento com varredura sutil (shimmer). Sempre desenhado no
// formato do conteudo real que vai substituir, para a tela nao "pular".
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative overflow-hidden rounded-md bg-ink-200/70", className)}
      {...props}
    >
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  )
}

// Wrapper acessivel: anuncia "Carregando..." uma vez, os blocos ficam ocultos.
function Carregando({ rotulo = "Carregando...", className, children }: { rotulo?: string; className?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">{rotulo}</span>
      {children}
    </div>
  )
}

export { Skeleton, Carregando }

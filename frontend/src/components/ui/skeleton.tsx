import { cn } from "@/lib/utils"

// Shimmer (varredura sutil) sobre um bloco Manilha claro - indicador de
// carregamento, nao decoracao ambiente (desativado em prefers-reduced-motion,
// ver index.css).
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-none bg-manilha/20", className)}
      {...props}
    >
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-papel/60 to-transparent" />
    </div>
  )
}

export { Skeleton }

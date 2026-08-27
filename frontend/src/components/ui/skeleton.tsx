import { cn } from "@/lib/utils"

// Shimmer (varredura de brilho) em vez de um pulse estatico - reforca a
// identidade "vivo/energetico" ate nos estados de loading.
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-md bg-primary/10", className)}
      {...props}
    >
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
    </div>
  )
}

export { Skeleton }

import { Skeleton } from '@/components/ui/skeleton'

// Skeletons no formato exato dos cards reais (DeckCard/ColecaoCard e
// HistoricoProvaCard) - a tela nao "pula" quando o conteudo chega.
export function DeckCardSkeleton() {
  return (
    <div className="rounded-xl border border-ink-200/80 bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3.5">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3.5 w-full" />
        </div>
      </div>
      <div className="mt-5 border-t border-ink-100 pt-4">
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  )
}

export function LinhaSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-ink-200/80 bg-card p-4 shadow-sm sm:p-5">
      <Skeleton className="h-[52px] w-[52px] rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3.5 w-1/3" />
      </div>
    </div>
  )
}

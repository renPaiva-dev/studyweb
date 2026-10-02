import type { KeyboardEvent } from 'react'

import { cn } from '@/lib/utils'

// Tres "capas de caderno" fixas da marca (tinta, ambar, papel) - a cor e
// escolhida de forma deterministica pelo titulo, para cada deck/colecao ter
// uma identidade visual estavel entre visitas.
const TONS = [
  'bg-ink-900 text-white',
  'bg-brand-100 text-brand-900 ring-1 ring-inset ring-brand-200',
  'bg-ink-100 text-ink-800 ring-1 ring-inset ring-ink-200',
] as const

function hash(texto: string) {
  let valor = 0
  for (let i = 0; i < texto.length; i++) valor = (valor * 31 + texto.charCodeAt(i)) | 0
  return Math.abs(valor)
}

export function Monograma({ texto, className }: { texto: string; className?: string }) {
  const letra = texto.trim().charAt(0).toUpperCase() || '?'

  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-heading text-xl font-semibold shadow-xs',
        TONS[hash(texto) % TONS.length],
        className,
      )}
    >
      {letra}
    </span>
  )
}

// Enter/Espaco ativam um card focavel (role="link"/"button" num <div>) -
// so quando o proprio card tem o foco, nunca um botao dentro dele.
export function aoAtivarComTeclado(acao: () => void) {
  return (evento: KeyboardEvent<HTMLElement>) => {
    if (evento.target !== evento.currentTarget) return
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault()
      acao()
    }
  }
}

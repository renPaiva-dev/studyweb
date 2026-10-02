import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// O tailwind-merge precisa conhecer os tamanhos de fonte customizados do
// sistema de design (tailwind.config.js) - senao trata `text-h1` como cor e
// o descarta ao lado de um `text-foreground`.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['caption', 'h1', 'h2', 'h3', 'display', 'eyebrow'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

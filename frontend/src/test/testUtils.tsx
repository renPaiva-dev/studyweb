import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'

import { MargemProvider } from '@/context/MargemContext'

// A maioria das abas de DeckDetalhePage (ex.: EstudarTab) usa
// useDefinirMargem, que exige um MargemProvider ancestral (ver
// context/MargemContext.tsx) - sem isso o hook lança. Helper de render
// compartilhado para não repetir o wrapper em cada teste.
export function renderComMargem(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: MargemProvider, ...options })
}

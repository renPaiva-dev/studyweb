import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

interface MargemState {
  conteudo: ReactNode | null
  resumoMobile: ReactNode | null
}

interface MargemContextValor extends MargemState {
  definir: (conteudo: ReactNode | null, resumoMobile?: ReactNode | null) => void
}

const MargemContext = createContext<MargemContextValor | null>(null)

// Provider da coluna de margem (anotacao fixa ao lado do conteudo - conceito
// "caderno ativamente corrigido"). Envolve as rotas protegidas em Layout.tsx;
// qualquer pagina/aba descendente pode "escrever" na margem via
// useDefinirMargem, sem prop-drilling.
export function MargemProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<MargemState>({ conteudo: null, resumoMobile: null })

  const valor = useMemo<MargemContextValor>(
    () => ({
      ...estado,
      definir: (conteudo, resumoMobile = null) => setEstado({ conteudo, resumoMobile }),
    }),
    [estado],
  )

  return <MargemContext.Provider value={valor}>{children}</MargemContext.Provider>
}

function useMargemContexto() {
  const contexto = useContext(MargemContext)
  if (!contexto) {
    throw new Error('useMargemContexto deve ser usado dentro de MargemProvider (ver Layout.tsx)')
  }
  return contexto
}

// Consumido pelo Layout para renderizar (ou nao) a coluna de margem.
export function useMargem() {
  const { conteudo, resumoMobile } = useMargemContexto()
  return { conteudo, resumoMobile }
}

// Consumido por paginas/abas para definir o conteudo da margem enquanto
// estiverem montadas. `deps` funciona como o array de dependencias de um
// useEffect comum - normalmente os mesmos valores usados para montar
// `conteudo` (ex.: contagens, progresso da sessao). Limpa a margem ao
// desmontar, para uma pagina nunca herdar a anotacao da anterior.
export function useDefinirMargem(
  conteudo: ReactNode | null,
  resumoMobile: ReactNode | null = null,
  deps: unknown[] = [],
) {
  const { definir } = useMargemContexto()

  useEffect(() => {
    definir(conteudo, resumoMobile)
    return () => definir(null, null)
    // deps e controlado pelo chamador (mesmo padrao de useEffect nativo).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

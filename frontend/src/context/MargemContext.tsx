import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

interface MargemState {
  conteudo: ReactNode | null
  resumoMobile: ReactNode | null
  fixa: boolean
}

interface MargemContextValor extends MargemState {
  definir: (conteudo: ReactNode | null, resumoMobile?: ReactNode | null, fixa?: boolean) => void
}

const MargemContext = createContext<MargemContextValor | null>(null)

// Provider da coluna de margem (anotacao fixa ao lado do conteudo - conceito
// "caderno ativamente corrigido"). Envolve as rotas protegidas em Layout.tsx;
// qualquer pagina/aba descendente pode "escrever" na margem via
// useDefinirMargem, sem prop-drilling. `fixa` controla se a margem acompanha
// o scroll (position: sticky) - por padrao sim (util quando o conteudo da
// margem e um progresso/resumo relevante durante uma lista longa, ex.: quiz,
// flashcards), mas paginas com uma margem curta e uma pagina longa por baixo
// (ex.: InicioPage) podem desligar para nao "flutuar" destacado do resto.
export function MargemProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<MargemState>({ conteudo: null, resumoMobile: null, fixa: true })

  const valor = useMemo<MargemContextValor>(
    () => ({
      ...estado,
      definir: (conteudo, resumoMobile = null, fixa = true) => setEstado({ conteudo, resumoMobile, fixa }),
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
  const { conteudo, resumoMobile, fixa } = useMargemContexto()
  return { conteudo, resumoMobile, fixa }
}

// Consumido por paginas/abas para definir o conteudo da margem enquanto
// estiverem montadas. `deps` funciona como o array de dependencias de um
// useEffect comum - normalmente os mesmos valores usados para montar
// `conteudo` (ex.: contagens, progresso da sessao). Limpa a margem ao
// desmontar, para uma pagina nunca herdar a anotacao da anterior. `fixa`
// (default true) repassa para MargemProvider#definir - false tira o sticky
// so daquela pagina (ver comentario em MargemContext acima).
export function useDefinirMargem(
  conteudo: ReactNode | null,
  resumoMobile: ReactNode | null = null,
  deps: unknown[] = [],
  fixa = true,
) {
  const { definir } = useMargemContexto()

  useEffect(() => {
    definir(conteudo, resumoMobile, fixa)
    return () => definir(null, null, true)
    // deps e controlado pelo chamador (mesmo padrao de useEffect nativo).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

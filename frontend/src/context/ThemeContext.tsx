import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Tema = 'light' | 'dark'

const CHAVE_ARMAZENAMENTO = 'tema'

interface ThemeContextValue {
  tema: Tema
  alternarTema: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function preferenciaSalva(): Tema | null {
  const valor = localStorage.getItem(CHAVE_ARMAZENAMENTO)
  return valor === 'light' || valor === 'dark' ? valor : null
}

function preferenciaDoSistema(): Tema {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Tailwind com darkMode: 'class' (tailwind.config.js) - o tema so muda de
// fato quando a classe "dark" e aplicada/removida do <html>, o que este
// provider controla. Preferencia salva no localStorage tem prioridade; sem
// nada salvo, cai para prefers-color-scheme do sistema operacional.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(() => preferenciaSalva() ?? preferenciaDoSistema())

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'dark')
    localStorage.setItem(CHAVE_ARMAZENAMENTO, tema)
  }, [tema])

  function alternarTema() {
    setTema((atual) => (atual === 'dark' ? 'light' : 'dark'))
  }

  return <ThemeContext.Provider value={{ tema, alternarTema }}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme precisa ser usado dentro de um <ThemeProvider>')
  }

  return context
}

import { useEffect, useState } from 'react'

// Recharts precisa de larguras em px (ex.: coluna de rotulos do eixo Y) -
// este hook deixa os graficos se adaptarem ao mobile sem scroll horizontal.
export function useTelaEstreita(larguraMaxima = 640) {
  const consulta = `(max-width: ${larguraMaxima - 1}px)`
  const [estreita, setEstreita] = useState(() => typeof window !== 'undefined' && window.matchMedia(consulta).matches)

  useEffect(() => {
    const mql = window.matchMedia(consulta)
    const aoMudar = () => setEstreita(mql.matches)
    aoMudar()
    mql.addEventListener('change', aoMudar)
    return () => mql.removeEventListener('change', aoMudar)
  }, [consulta])

  return estreita
}

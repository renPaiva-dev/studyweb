import { Navigate } from 'react-router-dom'

import { LandingPage } from '@/pages/LandingPage'
import { useAuth } from '@/context/AuthContext'

// Raiz do site: publica, mas so para visitante. Quem ja tem sessao e mandado
// direto para /inicio - a landing e material de marketing, nao faz sentido
// reexibi-la a quem ja esta logado.
export function PaginaRaiz() {
  const { token } = useAuth()

  if (token) {
    return <Navigate to="/inicio" replace />
  }

  return <LandingPage />
}

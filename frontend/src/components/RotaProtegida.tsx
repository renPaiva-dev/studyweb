import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '@/context/AuthContext'

// docs/boas-praticas-frontend.md, secao 6: toda rota exceto
// cadastro/login precisa estar protegida, redirecionando para /login se
// nao houver token.
export function RotaProtegida() {
  const { token } = useAuth()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

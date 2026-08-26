import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { Layout } from '@/components/Layout'
import { RotaProtegida } from '@/components/RotaProtegida'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/context/AuthContext'
import { CadastroPage } from '@/pages/CadastroPage'
import { DeckDetalhePage } from '@/pages/DeckDetalhePage'
import { DecksPage } from '@/pages/DecksPage'
import { LoginPage } from '@/pages/LoginPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<CadastroPage />} />

          <Route element={<RotaProtegida />}>
            <Route element={<Layout />}>
              <Route path="/decks" element={<DecksPage />} />
              <Route path="/decks/:id" element={<DeckDetalhePage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/decks" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </AuthProvider>
  )
}

export default App

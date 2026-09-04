import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { Layout } from '@/components/Layout'
import { RotaProtegida } from '@/components/RotaProtegida'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/context/AuthContext'
import { CadastroPage } from '@/pages/CadastroPage'
import { DashboardGeralPage } from '@/pages/DashboardGeralPage'
import { DeckCompartilhadoPage } from '@/pages/DeckCompartilhadoPage'
import { DeckDetalhePage } from '@/pages/DeckDetalhePage'
import { DecksPage } from '@/pages/DecksPage'
import { EsqueciSenhaPage } from '@/pages/EsqueciSenhaPage'
import { HistoricoProvaDetalhePage } from '@/pages/HistoricoProvaDetalhePage'
import { InicioPage } from '@/pages/InicioPage'
import { LoginPage } from '@/pages/LoginPage'
import { NovaProvaPage } from '@/pages/NovaProvaPage'
import { PerfilPage } from '@/pages/PerfilPage'
import { PoliticaDePrivacidadePage } from '@/pages/PoliticaDePrivacidadePage'
import { ProvasPage } from '@/pages/ProvasPage'
import { RedefinirSenhaPage } from '@/pages/RedefinirSenhaPage'
import { TermosDeUsoPage } from '@/pages/TermosDeUsoPage'
import { VerificarEmailPage } from '@/pages/VerificarEmailPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<CadastroPage />} />
          <Route path="/esqueci-senha" element={<EsqueciSenhaPage />} />
          <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />
          <Route path="/verificar-email" element={<VerificarEmailPage />} />
          <Route path="/termos-de-uso" element={<TermosDeUsoPage />} />
          <Route path="/politica-de-privacidade" element={<PoliticaDePrivacidadePage />} />
          <Route path="/compartilhado/:token" element={<DeckCompartilhadoPage />} />

          <Route element={<RotaProtegida />}>
            <Route element={<Layout />}>
              <Route path="/" element={<InicioPage />} />
              <Route path="/decks" element={<DecksPage />} />
              <Route path="/decks/:id" element={<DeckDetalhePage />} />
              <Route path="/dashboard-geral" element={<DashboardGeralPage />} />
              <Route path="/provas" element={<ProvasPage />} />
              <Route path="/provas/nova" element={<NovaProvaPage />} />
              <Route path="/provas/:id" element={<HistoricoProvaDetalhePage />} />
              <Route path="/perfil" element={<PerfilPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </AuthProvider>
  )
}

export default App

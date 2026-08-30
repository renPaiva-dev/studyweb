import { ClipboardList, GraduationCap, LayoutDashboard, LogOut, User, UserCircle } from 'lucide-react'
import { Link, Outlet, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggleButton } from '@/components/ThemeToggleButton'
import { useAuth } from '@/context/AuthContext'

// Layout compartilhado por todas as paginas protegidas: cabecalho com
// nome do app e menu do usuario (com logout). O conteudo de cada pagina
// entra via <Outlet /> (ver rotas em App.tsx).
export function Layout() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 font-heading text-lg font-bold text-foreground">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <GraduationCap className="h-5 w-5" />
              </span>
              Plataforma de Estudos
            </Link>

            <nav className="hidden items-center gap-1 sm:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard-geral" className="gap-1.5">
                  <LayoutDashboard className="h-4 w-4" />
                  Visão geral
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/decks">Meus decks</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/provas" className="gap-1.5">
                  <ClipboardList className="h-4 w-4" />
                  Provas
                </Link>
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggleButton />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <User className="h-4 w-4" />
                  {usuario?.nome ?? usuario?.email ?? 'Minha conta'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{usuario?.email ?? 'Minha conta'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/perfil">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Meu perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Outlet />
      </main>
    </div>
  )
}

import { ClipboardList, LayoutDashboard, LogOut, NotebookPen, User, UserCircle } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/context/AuthContext'
import { MargemProvider, useMargem } from '@/context/MargemContext'
import { cn } from '@/lib/utils'

const ITENS_NAV = [
  { to: '/dashboard-geral', label: 'Visão geral', icon: LayoutDashboard },
  { to: '/decks', label: 'Meus decks', icon: null },
  { to: '/provas', label: 'Provas', icon: ClipboardList },
]

// Layout compartilhado por todas as paginas protegidas: cabecalho com nome
// do app + navegacao, e a estrutura de duas colunas (conteudo de leitura +
// margem de anotacao) que da corpo ao conceito "caderno ativamente
// corrigido". O conteudo de cada pagina entra via <Outlet /> (ver rotas em
// App.tsx); a margem e opcional e definida pela propria pagina/aba, via
// useDefinirMargem (MargemContext.tsx).
export function Layout() {
  return (
    <MargemProvider>
      <LayoutConteudo />
    </MargemProvider>
  )
}

function LayoutConteudo() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { conteudo: margem, resumoMobile, fixa: margemFixa } = useMargem()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-2 border-tinta">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
              <NotebookPen className="h-5 w-5 text-foreground" strokeWidth={1.5} />
              Plataforma de Estudos
            </Link>

            <nav className="hidden items-center gap-6 sm:flex">
              {ITENS_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-1.5 border-b-2 border-transparent py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                      isActive && 'border-foreground text-foreground',
                    )
                  }
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-muted-foreground">
                <User className="h-4 w-4" />
                {usuario?.nome ?? usuario?.email ?? 'Minha conta'}
              </button>
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
      </header>

      <div
        className={cn(
          'container py-8',
          margem && 'grid gap-8 lg:grid-cols-[1fr_290px]',
          margem && resumoMobile && 'pb-20 lg:pb-8',
        )}
      >
        <main key={`main-${location.pathname}`} className="min-w-0 animate-caderno-entrada">
          <Outlet />
        </main>

        {margem && (
          // Em mobile a margem colapsa para abaixo do conteudo (fluxo normal
          // do grid de uma coluna); em desktop vira a coluna fixa a direita.
          <aside
            key={`aside-${location.pathname}`}
            className={cn(
              'animate-caderno-entrada-margem border-t border-manilha bg-papel-margem px-6 py-6 lg:self-start lg:border-t-0 lg:border-l lg:py-2',
              margemFixa && 'lg:sticky lg:top-24',
            )}
          >
            {margem}
          </aside>
        )}
      </div>

      {margem && resumoMobile && (
        // Faixa fixa no rodape com o essencial (ex.: progresso da sessao) -
        // o resto da nota completa (acima) some do primeiro scroll.
        <div className="fixed inset-x-0 bottom-0 border-t border-manilha bg-papel-margem px-4 py-3 lg:hidden">
          {resumoMobile}
        </div>
      )}
    </div>
  )
}

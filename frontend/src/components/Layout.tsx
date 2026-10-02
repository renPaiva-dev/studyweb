import { ChevronDown, ClipboardList, Home, Layers, LayoutDashboard, Library, LogOut, UserCircle } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { Logo } from '@/components/Logo'
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
  { to: '/inicio', label: 'Início', icon: Home },
  { to: '/dashboard-geral', label: 'Visão geral', icon: LayoutDashboard },
  { to: '/decks', label: 'Decks', icon: Layers },
  { to: '/colecoes', label: 'Coleções', icon: Library },
  { to: '/provas', label: 'Provas', icon: ClipboardList },
]

function iniciais(nome?: string, email?: string) {
  const base = (nome || email || '?').trim()
  const partes = base.split(/\s+/).filter(Boolean)
  const letras = partes.length > 1 ? partes[0][0] + partes[partes.length - 1][0] : base.slice(0, 2)
  return letras.toUpperCase()
}

// Layout compartilhado por todas as paginas protegidas: cabecalho com nome
// do app + navegacao, e a estrutura de duas colunas (conteudo de leitura +
// margem de anotacao) que da corpo ao conceito "caderno ativamente
// corrigido". O conteudo de cada pagina entra via <Outlet /> (ver rotas em
// App.tsx); a margem e opcional e definida pela propria pagina/aba, via
// useDefinirMargem (MargemContext.tsx). No mobile a navegacao vira uma barra
// inferior fixa (alvo de toque >= 44px, alcancavel com o polegar).
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

  const nomeExibido = usuario?.nome ?? usuario?.email ?? 'Minha conta'

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#conteudo"
        className="sr-only z-toast rounded-md bg-ink-900 px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
      >
        Pular para o conteúdo
      </a>

      <header className="sticky top-0 z-header border-b border-ink-200/80 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-8">
            <Link
              to="/inicio"
              className="flex h-11 shrink-0 items-center gap-2 rounded-md font-heading text-xl font-semibold tracking-tight text-foreground"
            >
              <Logo className="h-7 w-7" />
              Sinapse
            </Link>

            <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
              {ITENS_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'relative flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold text-ink-600 transition-colors duration-fast hover:bg-ink-100 hover:text-foreground',
                      isActive && 'bg-card text-foreground shadow-xs ring-1 ring-ink-200',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn('h-4 w-4', isActive ? 'text-brand-700' : 'text-ink-500')} />
                      {item.label}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label={`Menu da conta de ${nomeExibido}`}
                className="group flex h-11 min-w-11 items-center gap-2 rounded-full py-1 pl-1 pr-1 text-sm font-semibold text-foreground transition-colors hover:bg-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:pr-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-900 text-xs font-bold tracking-wide text-white ring-2 ring-brand-400 ring-offset-2 ring-offset-background">
                  {iniciais(usuario?.nome, usuario?.email)}
                </span>
                <span className="hidden max-w-[12rem] truncate sm:inline">{nomeExibido}</span>
                <ChevronDown className="hidden h-4 w-4 text-ink-500 transition-transform group-data-[state=open]:rotate-180 sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="space-y-0.5">
                <p className="truncate text-sm font-semibold">{usuario?.nome ?? 'Minha conta'}</p>
                {usuario?.email && <p className="truncate text-xs font-normal text-muted-foreground">{usuario.email}</p>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/perfil">
                  <UserCircle />
                  Meu perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-danger-700 focus:bg-danger-50 focus:text-danger-800 [&>svg]:text-danger-600">
                <LogOut />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div
        className={cn(
          'container pt-6 sm:pt-8',
          margem && resumoMobile
            ? 'pb-[calc(var(--altura-nav-mobile)+env(safe-area-inset-bottom)+5rem)] md:pb-24 lg:pb-12'
            : 'pb-nav-mobile md:pb-12',
          margem && 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10',
        )}
      >
        <main id="conteudo" tabIndex={-1} key={`main-${location.pathname}`} className="min-w-0 animate-entrada focus:outline-none">
          <Outlet />
        </main>

        {margem && (
          // "Nota na margem": em mobile colapsa para baixo do conteudo; em
          // desktop vira a coluna fixa a direita, com o filete ambar que
          // lembra a margem de um caderno.
          <aside
            key={`aside-${location.pathname}`}
            aria-label="Resumo"
            className={cn(
              'relative animate-entrada-atrasada overflow-hidden rounded-xl border border-ink-200/80 bg-card p-5 shadow-sm before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-brand-400 before:to-brand-200 lg:self-start',
              margemFixa && 'lg:sticky lg:top-24',
            )}
          >
            {margem}
          </aside>
        )}
      </div>

      {margem && resumoMobile && (
        // Faixa fixa logo acima da barra de navegacao com o essencial (ex.:
        // progresso da sessao) - o resto da nota completa fica abaixo do
        // conteudo.
        <div className="fixed inset-x-0 bottom-[calc(var(--altura-nav-mobile)+env(safe-area-inset-bottom))] z-sticky md:bottom-0 border-t border-ink-200 bg-card/95 px-4 py-2.5 shadow-[0_-4px_12px_-6px_rgb(15_16_32/0.12)] backdrop-blur lg:hidden">
          {resumoMobile}
        </div>
      )}

      <NavegacaoMobile />
    </div>
  )
}

function NavegacaoMobile() {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-nav border-t border-ink-200 bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_16px_-8px_rgb(15_16_32/0.15)] backdrop-blur-md md:hidden"
    >
      <ul className="grid h-[var(--altura-nav-mobile)] grid-cols-5">
        {ITENS_NAV.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'relative flex h-full flex-col items-center justify-center gap-1 text-xs font-semibold text-ink-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                  isActive && 'text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-base',
                      isActive ? 'bg-brand-100 text-brand-800' : 'text-ink-500',
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

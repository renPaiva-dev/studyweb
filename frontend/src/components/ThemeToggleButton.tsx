import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useTheme } from '@/context/ThemeContext'

// Botao de alternancia sol/lua (tema escuro) - visivel em toda tela
// autenticada (Layout) e nas telas de login/cadastro.
export function ThemeToggleButton() {
  const { tema, alternarTema } = useTheme()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={alternarTema}
      aria-label={tema === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={tema === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
    >
      {tema === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}

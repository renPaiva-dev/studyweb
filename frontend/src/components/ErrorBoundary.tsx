import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  temErro: boolean
}

// Rede de seguranca de ultima instancia: sem isso, qualquer erro de render
// nao tratado em qualquer componente da arvore derruba a aplicacao inteira
// e deixa a tela em branco, sem chance de recuperar sem F5. So um componente
// de classe pode implementar getDerivedStateFromError/componentDidCatch -
// nao existe equivalente em hooks.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { temErro: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { temErro: true }
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error('Erro não tratado na interface:', erro, info.componentStack)
  }

  render() {
    if (!this.state.temErro) {
      return this.props.children
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-medium">Algo deu errado</p>
          <p className="text-sm text-muted-foreground">
            Um erro inesperado interrompeu esta página. Recarregar costuma resolver.
          </p>
        </div>
        <Button onClick={() => window.location.reload()}>Recarregar página</Button>
      </div>
    )
  }
}

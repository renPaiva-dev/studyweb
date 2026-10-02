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
      <div role="alert" className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-100 text-danger-600 ring-8 ring-danger-50">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div className="space-y-1.5">
          <p className="font-heading text-h2 text-foreground">Algo deu errado</p>
          <p className="max-w-sm text-base text-muted-foreground">
            Um erro inesperado interrompeu esta página. Seus dados estão salvos. Recarregar costuma resolver.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => window.location.reload()}>Recarregar página</Button>
          <Button variant="outline" onClick={() => window.location.assign('/inicio')}>
            Ir para o início
          </Button>
        </div>
      </div>
    )
  }
}

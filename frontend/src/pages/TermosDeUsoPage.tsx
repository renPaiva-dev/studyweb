import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Logo } from '@/components/Logo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// UC23/RN30 (LGPD, consentimento) - pagina estatica referenciada pelo
// checkbox obrigatorio do cadastro. Conteudo placeholder generico, adaptado
// ao escopo deste projeto (nao e o foco juridico do TCC).
export function TermosDeUsoPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:py-12">
      <div className="flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 rounded-md font-heading text-xl font-semibold text-foreground">
          <Logo className="h-7 w-7" />
          Sinapse
        </Link>
        <Link to="/cadastro" className="inline-flex h-9 items-center gap-1.5 rounded-md px-1 text-sm font-semibold text-ink-600 hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao cadastro
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-h1">Termos de Uso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-base leading-relaxed text-ink-700">
          <p>
            Ao criar uma conta no Sinapse, você concorda com os termos abaixo, que regem o uso do
            serviço de organização de estudos e geração de flashcards por IA.
          </p>
          <p>
            <strong className="text-foreground">1. Uso do serviço.</strong> A plataforma é destinada ao uso pessoal
            de estudo. Você é responsável pelo conteúdo que envia (materiais, decks, flashcards) e deve ter os
            direitos necessários sobre esse conteúdo.
          </p>
          <p>
            <strong className="text-foreground">2. Geração por IA.</strong> Sugestões de flashcards geradas por IA
            são apoio ao estudo e podem conter imprecisões — cabe a você revisar e confirmar cada sugestão antes de
            salvá-la.
          </p>
          <p>
            <strong className="text-foreground">3. Conta e segurança.</strong> Você é responsável por manter suas
            credenciais em sigilo e por notificar qualquer uso não autorizado da sua conta.
          </p>
          <p>
            <strong className="text-foreground">4. Seus dados.</strong> O tratamento dos seus dados pessoais é
            descrito na{' '}
            <Link to="/politica-de-privacidade" className="link">
              Política de Privacidade
            </Link>
            .
          </p>
          <p>
            <strong className="text-foreground">5. Alterações.</strong> Estes termos podem ser atualizados; a versão
            aceita no seu cadastro fica registrada na sua conta.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

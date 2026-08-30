import { Link } from 'react-router-dom'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// UC23/RN30 (LGPD, consentimento) - pagina estatica referenciada pelo
// checkbox obrigatorio do cadastro. Conteudo placeholder generico, adaptado
// ao escopo deste projeto (nao e o foco juridico do TCC).
export function TermosDeUsoPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div>
        <Link to="/cadastro" className="text-sm font-medium text-primary hover:underline">
          &larr; Voltar ao cadastro
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Termos de Uso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Ao criar uma conta na Plataforma de Estudos, você concorda com os termos abaixo, que regem o uso do
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
            <Link to="/politica-de-privacidade" className="font-medium text-primary hover:underline">
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

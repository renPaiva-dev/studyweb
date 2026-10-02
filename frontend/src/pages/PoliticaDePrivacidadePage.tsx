import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Logo } from '@/components/Logo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// UC23/RN30 (LGPD, consentimento) - pagina estatica referenciada pelo
// checkbox obrigatorio do cadastro. Conteudo placeholder generico, adaptado
// ao escopo deste projeto (nao e o foco juridico do TCC).
export function PoliticaDePrivacidadePage() {
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
          <CardTitle className="font-heading text-h1">Política de Privacidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-base leading-relaxed text-ink-700">
          <p>
            Esta política descreve como o Sinapse trata seus dados pessoais, em conformidade com a Lei
            Geral de Proteção de Dados (LGPD).
          </p>
          <p>
            <strong className="text-foreground">1. Dados coletados.</strong> Nome, nome de usuário, e-mail e senha
            (armazenada com hash, nunca em texto plano), além dos decks, flashcards, materiais enviados, revisões e
            resultados de quizzes que você cria ao usar a plataforma.
          </p>
          <p>
            <strong className="text-foreground">2. Isolamento entre usuários.</strong> Seus dados só são visíveis
            para você, exceto quando você opta ativamente por gerar um link público de compartilhamento de um deck
            (recurso opt-in, revogável a qualquer momento) — nesse caso, qualquer pessoa com o link pode visualizar o
            conteúdo daquele deck sem precisar de conta. Fora essa exceção, nenhum outro usuário tem acesso ao seu
            conteúdo ou desempenho.
          </p>
          <p>
            <strong className="text-foreground">3. Seus direitos.</strong> Você pode, a qualquer momento, na tela de
            perfil: exportar uma cópia completa dos seus dados, ou excluir permanentemente sua conta e todos os
            dados vinculados.
          </p>
          <p>
            <strong className="text-foreground">4. Retenção.</strong> Seus dados são mantidos enquanto sua conta
            existir. Ao excluir a conta, os dados são removidos permanentemente do banco de dados.
          </p>
          <p>
            <strong className="text-foreground">5. Limitação conhecida.</strong> Um token de acesso (JWT) já emitido
            antes da exclusão da conta permanece tecnicamente válido até sua expiração natural (no máximo 1 hora),
            já que a autenticação é stateless nesta versão do sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

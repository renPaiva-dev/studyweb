import {
  Brain,
  LayoutDashboard,
  ListChecks,
  Mail,
  MessageCircleQuestion,
  Repeat,
  Share2,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'

import screenshotDashboard from '@/assets/screenshot-dashboard.png'
import screenshotEstudar from '@/assets/screenshot-estudar.png'
import screenshotProntidao from '@/assets/screenshot-prontidao.png'
import estudandoFoto from '@/assets/estudando.jpg'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'

const PASSOS = [
  {
    numero: '01',
    titulo: 'Envie seu material',
    descricao:
      'Suba um PDF e a IA sugere flashcards de pergunta e resposta, organizados por tópico. Você revisa e confirma antes de qualquer coisa entrar no seu deck.',
  },
  {
    numero: '02',
    titulo: 'Revise no tempo certo',
    descricao:
      'A cada resposta, o algoritmo SM-2 recalcula o intervalo até a próxima revisão — errou, o card volta rápido; acertou, o intervalo cresce. Nada de decidir na mão o que revisar hoje.',
  },
  {
    numero: '03',
    titulo: 'Teste o que aprendeu',
    descricao:
      'Gere provas inéditas no estilo ENEM, Vestibular ou Conhecimentos Gerais, a partir dos seus próprios flashcards, com histórico completo e revisão questão a questão.',
  },
]

const RECURSOS = [
  {
    icone: Brain,
    titulo: 'Flashcards com IA',
    descricao: 'Envie um PDF e receba sugestões de flashcards prontas para revisar e confirmar.',
  },
  {
    icone: Repeat,
    titulo: 'Repetição espaçada (SM-2)',
    descricao: 'Intervalos de revisão calculados a partir do seu desempenho real, não de um cronograma fixo.',
  },
  {
    icone: ListChecks,
    titulo: 'Provas geradas por IA',
    descricao: 'Estilo ENEM, Vestibular ou Conhecimentos Gerais, com histórico e revisão por questão.',
  },
  {
    icone: LayoutDashboard,
    titulo: 'Dashboard de evolução',
    descricao: 'Gráficos de desempenho, tópicos fracos, streak de dias consecutivos e visão geral de todos os decks.',
  },
  {
    icone: MessageCircleQuestion,
    titulo: 'Explicação ancorada no material',
    descricao: 'Errou um flashcard? A IA explica com base no que você mesmo enviou, não em conhecimento genérico.',
  },
  {
    icone: Share2,
    titulo: 'Compartilhamento de decks',
    descricao: 'Gere um link público para compartilhar um deck com outra pessoa.',
  },
  {
    icone: Mail,
    titulo: 'Lembrete por e-mail',
    descricao: 'Um aviso diário de revisões pendentes, para não depender só de lembrar sozinho.',
  },
  {
    icone: Sparkles,
    titulo: 'Pergunta livre sobre o deck',
    descricao: 'Tire dúvidas sobre o conteúdo de um deck a qualquer momento, com respostas baseadas no seu material.',
  },
]

interface IconeComBadgeProps {
  icone: ComponentType<{ className?: string; strokeWidth?: number }>
  tom?: 'primary' | 'verde-lousa'
}

// Badge circular colorido (mesmo padrao ja usado em InicioPage/LoginPage:
// "rounded-full bg-primary/10" ao redor de um icone) - aplicado aqui aos
// recursos/diferenciais pra sair do icone cinza "achatado".
function IconeComBadge({ icone: Icone, tom = 'primary' }: IconeComBadgeProps) {
  const cor = tom === 'primary' ? 'bg-primary/10 text-primary' : 'bg-verde-lousa/10 text-verde-lousa'
  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${cor}`}>
      <Icone className="h-5 w-5" strokeWidth={1.75} />
    </div>
  )
}

// Moldura minima "janela de navegador" (sem os tres pontos coloridos
// tradicionais - so pontos neutros na cor tinta, coerente com a paleta fixa
// da marca) para dar contexto de produto real a uma captura de tela.
function MockupFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="overflow-hidden border border-manilha shadow-sm">
      <div className="flex items-center gap-1.5 bg-tinta px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-papel/25" />
        <span className="h-2 w-2 rounded-full bg-papel/25" />
        <span className="h-2 w-2 rounded-full bg-papel/25" />
      </div>
      <img src={src} alt={alt} className="w-full" />
    </div>
  )
}

// Landing page publica (raiz do site para visitante nao autenticado - ver
// PaginaRaiz.tsx). Conteudo 100% estatico, sem chamada de API. Reaproveita a
// identidade visual ja usada nas telas de autenticacao (AuthSplitLayout: foto
// + gradiente + Logo) e o tom direto do resto do app (ver InicioPage.tsx).
// As capturas de tela (screenshot-*.png) sao do produto real, geradas a
// partir da conta de demonstracao (ver SeedDemoDataRunner/README) - nao sao
// mockups desenhados a parte.
export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b-2 border-tinta bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
            <Logo className="h-6 w-6" />
            Sinapse
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link to="/cadastro">Criar conta</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-manilha">
          {/* Formas decorativas com o motivo do Logo (dois discos que se
              sobrepoem) - baixa opacidade, so textura de fundo, nunca
              competindo com o conteudo. */}
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-tinta/5" aria-hidden="true" />
          <div className="pointer-events-none absolute -left-8 -top-8 h-40 w-40 rounded-full bg-spark/10" aria-hidden="true" />

          <div className="container relative grid gap-10 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
            <div className="animate-caderno-entrada space-y-6">
              <p className="text-eyebrow text-muted-foreground">Repetição espaçada + IA para quem estuda de verdade</p>
              <h1 className="font-heading text-display-lg">Transforme material em memória.</h1>
              <p className="max-w-md text-lg text-muted-foreground">
                Envie o PDF do seu material, receba flashcards prontos, e deixe o algoritmo SM-2 decidir quando revisar
                cada um — no momento exato antes de você esquecer.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link to="/cadastro">Criar conta grátis</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/login">Já tenho conta</Link>
                </Button>
              </div>
            </div>

            <div className="relative hidden overflow-hidden rounded-none border border-manilha lg:block">
              <img src={estudandoFoto} alt="" className="h-full w-full object-cover" aria-hidden="true" />
              <div className="absolute inset-0 bg-gradient-to-t from-tinta/85 via-tinta/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 rounded-none border border-papel/30 bg-tinta/60 p-4 text-papel backdrop-blur-sm">
                <p className="font-mono text-xs uppercase tracking-wide text-papel/70">SM-2</p>
                <p className="text-sm">O mesmo modelo de retenção usado por ferramentas de repetição espaçada consolidadas.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section className="border-b border-manilha">
          <div className="container space-y-10 py-16">
            <h2 className="font-heading text-2xl font-semibold sm:text-3xl">Como funciona</h2>
            <div className="grid gap-8 sm:grid-cols-3">
              {PASSOS.map((passo) => (
                <div key={passo.numero} className="space-y-2">
                  <p className="font-mono text-3xl font-semibold text-spark">{passo.numero}</p>
                  <p className="font-heading text-lg font-semibold">{passo.titulo}</p>
                  <p className="text-sm text-muted-foreground">{passo.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Produto real: fila de estudo */}
        <section className="border-b border-manilha bg-papel-margem">
          <div className="container grid gap-10 py-16 lg:grid-cols-2 lg:items-center">
            <div className="space-y-3">
              <p className="text-eyebrow text-muted-foreground">Direto do produto</p>
              <h2 className="font-heading text-2xl font-semibold sm:text-3xl">A fila de estudo do dia, sem enrolação.</h2>
              <p className="text-muted-foreground">
                Um card por vez: pergunta, resposta, e uma nota de 0 a 5 sobre o quanto você lembrou. É essa nota que
                alimenta o SM-2 e decide quando esse flashcard volta a aparecer.
              </p>
            </div>
            <MockupFrame src={screenshotEstudar} alt="Tela de estudo do Sinapse mostrando um flashcard virado e a escala de avaliação de 0 a 5" />
          </div>
        </section>

        {/* Recursos */}
        <section className="border-b border-manilha">
          <div className="container space-y-10 py-16">
            <h2 className="font-heading text-2xl font-semibold sm:text-3xl">Recursos</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {RECURSOS.map(({ icone, titulo, descricao }) => (
                <div key={titulo} className="space-y-3 border-t border-manilha pt-4">
                  <IconeComBadge icone={icone} />
                  <p className="font-medium">{titulo}</p>
                  <p className="text-sm text-muted-foreground">{descricao}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Diferenciais tecnicos */}
        <section className="border-b border-manilha bg-papel-margem">
          <div className="container space-y-10 py-16">
            <div className="max-w-2xl space-y-2">
              <p className="text-eyebrow text-muted-foreground">IA e ciência da memória, juntas</p>
              <h2 className="font-heading text-2xl font-semibold sm:text-3xl">Inteligência artificial a serviço da sua memória.</h2>
              <p className="text-muted-foreground">
                A IA gera conteúdo — flashcards, provas, explicações — aliada a matemática avançada e cálculos
                probabilísticos que decidem a melhor forma de fixar cada assunto na sua memória.
              </p>
            </div>

            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div className="space-y-6">
                <div className="space-y-2 border bg-card p-6">
                  <IconeComBadge icone={Repeat} tom="verde-lousa" />
                  <p className="font-heading text-lg font-semibold">Repetição espaçada (SM-2)</p>
                  <p className="text-sm text-muted-foreground">
                    A cada revisão, o sistema recalcula fator de facilidade, intervalo e repetições com base na sua
                    nota de 0 a 5 — é matemática pura misturada com inteligência artificial para aprimorar seus estudos.
                  </p>
                </div>
                <div className="space-y-2 border bg-card p-6">
                  <IconeComBadge icone={TrendingUp} tom="verde-lousa" />
                  <p className="font-heading text-lg font-semibold">Previsão de prontidão para prova</p>
                  <p className="text-sm text-muted-foreground">
                    Defina a data da sua prova e o sistema aplica um modelo de curva de esquecimento sobre o seu
                    histórico real, dizendo tópico por tópico o que revisar antes da sua avaliação.
                  </p>
                </div>
              </div>

              <MockupFrame
                src={screenshotProntidao}
                alt="Dashboard de um deck mostrando percentual dominado/em risco, previsão de prontidão para a prova e tópicos prioritários"
              />
            </div>
          </div>
        </section>

        {/* Visao geral consolidada */}
        <section className="border-b border-manilha">
          <div className="container grid gap-10 py-16 lg:grid-cols-2 lg:items-center">
            <MockupFrame src={screenshotDashboard} alt="Dashboard geral do Sinapse com ranking de decks por desempenho" />
            <div className="space-y-3">
              <p className="text-eyebrow text-muted-foreground">Uma tela, todos os decks</p>
              <h2 className="font-heading text-2xl font-semibold sm:text-3xl">Visão geral consolidada do seu estudo.</h2>
              <p className="text-muted-foreground">
                Streak de dias consecutivos, pontuação média nas provas, e um ranking dos seus decks por percentual
                dominado — pra saber onde focar sem abrir cada deck um por um.
              </p>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="container flex flex-col items-center gap-4 py-20 text-center">
          <h2 className="font-heading text-2xl font-semibold sm:text-3xl">
            Pronto para estudar com repetição espaçada de verdade?
          </h2>
          <p className="max-w-md text-muted-foreground">Crie sua conta gratuita e organize seu primeiro deck em minutos.</p>
          <Button size="lg" asChild>
            <Link to="/cadastro">Criar conta grátis</Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-manilha">
        <div className="container flex flex-col gap-6 py-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
              <Logo className="h-5 w-5" />
              Sinapse
            </div>
            <p className="text-sm text-muted-foreground">Transforme material em memória.</p>
          </div>
          <div className="flex flex-col gap-2 text-sm sm:items-end">
            <div className="flex gap-4">
              <Link to="/termos-de-uso" className="text-muted-foreground hover:text-foreground hover:underline">
                Termos de Uso
              </Link>
              <Link to="/politica-de-privacidade" className="text-muted-foreground hover:text-foreground hover:underline">
                Política de Privacidade
              </Link>
              <Link to="/login" className="text-muted-foreground hover:text-foreground hover:underline">
                Entrar
              </Link>
            </div>
            <p className="max-w-sm text-xs text-muted-foreground sm:text-right">
              Seus dados podem ser exportados ou excluídos a qualquer momento, conforme a LGPD.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

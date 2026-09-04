import { Award, ThumbsUp, TrendingDown, type LucideIcon } from 'lucide-react'

// UC10/UC27 - classificacao visual (icone + cores) de uma pontuacao 0-100,
// reaproveitada em ResultadoQuiz, NovaProvaPage e HistoricoProvaCard para
// nao duplicar os mesmos limiares/cores em varios lugares. Só existem duas
// cores de estado fortes na identidade visual - Verde-lousa (confirmação
// real) e Vermelho-correção (erro/atenção real, RN18-style: nunca
// decorativo) - por isso a faixa intermediária (40-69) fica neutra em vez
// de ganhar uma cor de alarme que não está na paleta aprovada.
export interface ClassificacaoPontuacao {
  icone: LucideIcon
  cores: {
    borda: string
    fundo: string
    iconeFundo: string
    icone: string
    texto: string
    textoSecundario: string
  }
}

export function classificarPontuacao(pontuacao: number): ClassificacaoPontuacao {
  if (pontuacao >= 70) {
    return {
      icone: Award,
      cores: {
        borda: 'border-verde-lousa/30',
        fundo: 'bg-verde-lousa/5',
        iconeFundo: 'bg-verde-lousa/10',
        icone: 'text-verde-lousa',
        texto: 'text-verde-lousa',
        textoSecundario: 'text-verde-lousa/80',
      },
    }
  }

  if (pontuacao >= 40) {
    return {
      icone: ThumbsUp,
      cores: {
        borda: 'border-manilha',
        fundo: 'bg-transparent',
        iconeFundo: 'bg-muted',
        icone: 'text-foreground',
        texto: 'text-foreground',
        textoSecundario: 'text-muted-foreground',
      },
    }
  }

  return {
    icone: TrendingDown,
    cores: {
      borda: 'border-vermelho-correcao/30',
      fundo: 'bg-vermelho-correcao/5',
      iconeFundo: 'bg-vermelho-correcao/10',
      icone: 'text-vermelho-correcao',
      texto: 'text-vermelho-correcao',
      textoSecundario: 'text-vermelho-correcao/80',
    },
  }
}

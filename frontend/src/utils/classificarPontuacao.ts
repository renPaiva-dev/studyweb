import { Award, ThumbsUp, TrendingDown, type LucideIcon } from 'lucide-react'

// UC10/UC27 - classificacao visual (icone + cores + rotulo) de uma pontuacao
// 0-100, reaproveitada em ResultadoQuiz, NovaProvaPage, HistoricoProvaCard e
// AnelPontuacao para nao duplicar os mesmos limiares/cores em varios lugares.
// Faixas: >= 70 verde-lousa (dominio), 40-69 ambar (no caminho), < 40
// vermelho-correcao (precisa revisar). Todas as cores de texto >= 4.5:1.
export interface ClassificacaoPontuacao {
  icone: LucideIcon
  rotulo: string
  cores: {
    borda: string
    fundo: string
    iconeFundo: string
    icone: string
    texto: string
    textoSecundario: string
    /** Classe stroke-* para o arco do AnelPontuacao. */
    traco: string
  }
}

export function classificarPontuacao(pontuacao: number): ClassificacaoPontuacao {
  if (pontuacao >= 70) {
    return {
      icone: Award,
      rotulo: 'Mandou bem!',
      cores: {
        borda: 'border-success-200',
        fundo: 'bg-success-50',
        iconeFundo: 'bg-success-100',
        icone: 'text-success-600',
        texto: 'text-success-700',
        textoSecundario: 'text-success-800',
        traco: 'stroke-success-600',
      },
    }
  }

  if (pontuacao >= 40) {
    return {
      icone: ThumbsUp,
      rotulo: 'No caminho certo',
      cores: {
        borda: 'border-warning-200',
        fundo: 'bg-warning-50',
        iconeFundo: 'bg-warning-100',
        icone: 'text-warning-700',
        texto: 'text-warning-800',
        textoSecundario: 'text-warning-800',
        traco: 'stroke-brand-500',
      },
    }
  }

  return {
    icone: TrendingDown,
    rotulo: 'Vale revisar este conteúdo',
    cores: {
      borda: 'border-danger-200',
      fundo: 'bg-danger-50',
      iconeFundo: 'bg-danger-100',
      icone: 'text-danger-600',
      texto: 'text-danger-700',
      textoSecundario: 'text-danger-800',
      traco: 'stroke-danger-600',
    },
  }
}

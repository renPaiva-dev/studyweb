import type { CSSProperties } from 'react'

import type { TipoAnotacao, VereditoAutoexplicacao } from '@/api/elaboracaoApi'

// UC34 - linguagem visual da correção (Docs/extensao-elaboracao-flashcard.md
// §6.4). Só tokens da identidade Sinapse: vermelho-correção é a "caneta do
// professor" e aparece apenas em erro real; verde-lousa confirma; grafite
// sinaliza imprecisão. A cor nunca é o único sinal - todo tipo tem rótulo
// escrito e número.
export const ESTILO_ANOTACAO: Record<TipoAnotacao, { rotulo: string; sublinhado: string; texto: string }> = {
  ERRO: {
    rotulo: 'Erro',
    sublinhado: 'decoration-wavy decoration-vermelho-correcao',
    texto: 'text-vermelho-correcao',
  },
  IMPRECISAO: {
    rotulo: 'Impreciso',
    sublinhado: 'decoration-dotted decoration-grafite',
    texto: 'text-grafite',
  },
  ACERTO: {
    rotulo: 'Certo',
    sublinhado: 'decoration-verde-lousa',
    texto: 'text-verde-lousa',
  },
}

export function textoVeredito(veredito: VereditoAutoexplicacao, ancoradaNoMaterial: boolean): string {
  switch (veredito) {
    case 'CONSISTENTE':
      return ancoradaNoMaterial ? 'Consistente com o material' : 'Consistente com a resposta do card'
    case 'PARCIAL':
      return 'No caminho — faltou um ponto'
    case 'EQUIVOCADA':
      return 'Há um equívoco para rever'
  }
}

export const CLASSE_VEREDITO: Record<VereditoAutoexplicacao, string> = {
  CONSISTENTE: 'border-verde-lousa text-verde-lousa',
  // Grafite, não Manilha: sobre o fundo da margem (papel-margem) a borda em
  // Manilha praticamente some.
  PARCIAL: 'border-grafite text-foreground',
  EQUIVOCADA: 'border-vermelho-correcao text-vermelho-correcao',
}

// Papel pautado: uma linha de Manilha a cada 1.75rem, igual ao line-height do
// texto, para as letras "sentarem" na pauta. background-origin content-box
// alinha a primeira linha ao topo do texto (independe do padding), e
// background-attachment local faz a pauta rolar junto com o texto.
export const ESTILO_PAUTA: CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(to bottom, transparent 0, transparent calc(1.75rem - 1px), hsl(var(--border)) calc(1.75rem - 1px), hsl(var(--border)) 1.75rem)',
  backgroundOrigin: 'content-box',
  backgroundAttachment: 'local',
  lineHeight: '1.75rem',
}

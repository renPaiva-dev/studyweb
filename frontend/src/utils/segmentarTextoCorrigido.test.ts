import { describe, expect, it } from 'vitest'

import type { AnotacaoAutoexplicacao } from '@/api/elaboracaoApi'
import { numerarAnotacoes, segmentarTextoCorrigido } from '@/utils/segmentarTextoCorrigido'

function anotacao(trecho: string | null, tipo: AnotacaoAutoexplicacao['tipo'] = 'ACERTO'): AnotacaoAutoexplicacao {
  return { trecho, tipo, comentario: 'comentário' }
}

const TEXTO = 'O ventrículo esquerdo bombeia sangue pro pulmão.'

// UC34/RN43 - sublinhar só o que o estudante escreveu, sem sobreposição.
describe('segmentarTextoCorrigido', () => {
  it('separa o texto em trechos anotados e texto comum, na ordem do texto', () => {
    const segmentos = segmentarTextoCorrigido(TEXTO, [anotacao('pro pulmão', 'ERRO'), anotacao('ventrículo esquerdo')])

    expect(segmentos).toEqual([
      { texto: 'O ' },
      { texto: 'ventrículo esquerdo', anotacaoIndice: 1 },
      { texto: ' bombeia sangue ' },
      { texto: 'pro pulmão', anotacaoIndice: 0 },
      { texto: '.' },
    ])
  })

  it('ignora anotações sem trecho ou com trecho que não está no texto', () => {
    const segmentos = segmentarTextoCorrigido(TEXTO, [anotacao(null), anotacao('átrio direito')])

    expect(segmentos).toEqual([{ texto: TEXTO }])
  })

  it('não sobrepõe um trecho a outro já posicionado', () => {
    const segmentos = segmentarTextoCorrigido(TEXTO, [anotacao('bombeia sangue'), anotacao('sangue pro')])

    expect(segmentos.filter((segmento) => segmento.anotacaoIndice !== undefined)).toEqual([
      { texto: 'bombeia sangue', anotacaoIndice: 0 },
    ])
  })

  it('usa a próxima ocorrência livre quando o mesmo trecho aparece duas vezes', () => {
    const segmentos = segmentarTextoCorrigido('ar e ar', [anotacao('ar'), anotacao('ar')])

    expect(segmentos).toEqual([
      { texto: 'ar', anotacaoIndice: 0 },
      { texto: ' e ' },
      { texto: 'ar', anotacaoIndice: 1 },
    ])
  })
})

describe('numerarAnotacoes', () => {
  it('numera só as anotações sublinhadas, deixando as notas gerais sem número', () => {
    const numeros = numerarAnotacoes(TEXTO, [anotacao('ventrículo'), anotacao(null), anotacao('pulmão')])

    expect(numeros).toEqual([1, null, 2])
  })
})

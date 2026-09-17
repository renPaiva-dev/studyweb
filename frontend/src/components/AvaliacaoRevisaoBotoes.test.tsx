import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AvaliacaoRevisaoBotoes } from '@/components/AvaliacaoRevisaoBotoes'

// UC08 - escala de avaliacao 0-5 que alimenta o recalculo SM-2 (RN09). O
// contrato com o backend (POST /api/flashcards/{id}/revisoes, campo
// qualidadeResposta) depende de cada botao emitir exatamente o valor
// numerico do rotulo, nao um indice de posicao.
describe('AvaliacaoRevisaoBotoes', () => {
  it('renderiza as 6 opções da escala 0-5', () => {
    render(<AvaliacaoRevisaoBotoes onAvaliar={vi.fn()} desabilitado={false} />)

    for (let qualidade = 0; qualidade <= 5; qualidade++) {
      expect(screen.getByRole('button', { name: new RegExp(`^${qualidade}`) })).toBeInTheDocument()
    }
  })

  it('chama onAvaliar com o valor numérico correspondente ao botão clicado', async () => {
    const usuario = userEvent.setup()
    const aoAvaliar = vi.fn()
    render(<AvaliacaoRevisaoBotoes onAvaliar={aoAvaliar} desabilitado={false} />)

    await usuario.click(screen.getByRole('button', { name: /Fácil/ }))

    expect(aoAvaliar).toHaveBeenCalledTimes(1)
    expect(aoAvaliar).toHaveBeenCalledWith(5)
  })

  it('desabilita todos os botões quando desabilitado=true, evitando avaliação em dobro', () => {
    render(<AvaliacaoRevisaoBotoes onAvaliar={vi.fn()} desabilitado={true} />)

    for (const botao of screen.getAllByRole('button')) {
      expect(botao).toBeDisabled()
    }
  })
})

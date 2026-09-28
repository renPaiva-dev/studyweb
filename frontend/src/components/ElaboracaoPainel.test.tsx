import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { FeedbackAutoexplicacao } from '@/api/elaboracaoApi'
import { ElaboracaoPainel } from '@/components/ElaboracaoPainel'

vi.mock('@/api/elaboracaoApi', () => ({
  pedirFeedbackAutoexplicacao: vi.fn(),
  gerarAnalogia: vi.fn(),
}))

const { pedirFeedbackAutoexplicacao, gerarAnalogia } = await import('@/api/elaboracaoApi')

const TEXTO = 'O ventrículo esquerdo bombeia sangue pro pulmão.'

const FEEDBACK: FeedbackAutoexplicacao = {
  veredito: 'PARCIAL',
  comentarioGeral: 'Você acertou quem bombeia, mas trocou o destino.',
  anotacoes: [
    { trecho: 'ventrículo esquerdo', tipo: 'ACERTO', comentario: 'Isso mesmo.' },
    { trecho: 'pro pulmão', tipo: 'ERRO', comentario: 'Vai para a aorta.' },
  ],
  faltou: 'A circulação sistêmica.',
  ancoradaNoMaterial: true,
}

// Painel + coluna de margem com as notas reportadas via onNotasChange - o
// mesmo arranjo que o EstudarTab monta.
function ComMargem({ onOcultar }: { onOcultar: () => void }) {
  const [notas, setNotas] = useState<ReactNode | null>(null)

  return (
    <>
      <ElaboracaoPainel flashcardId={7} onNotasChange={setNotas} onOcultar={onOcultar} />
      <aside data-testid="margem">{notas}</aside>
    </>
  )
}

function renderPainel() {
  const onOcultar = vi.fn()
  render(<ComMargem onOcultar={onOcultar} />)
  return { onOcultar, margem: () => screen.getByTestId('margem') }
}

// UC34 - autoexplicação e analogia (RN43), sempre opcionais (RN44).
describe('ElaboracaoPainel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('só libera "Pedir correção" a partir de 20 caracteres', async () => {
    const usuario = userEvent.setup()
    renderPainel()

    await usuario.click(screen.getByRole('button', { name: /Explicar com minhas palavras/ }))
    const campo = screen.getByLabelText('Sua explicação')
    await usuario.type(campo, 'curto demais')

    expect(screen.getByRole('button', { name: /Pedir correção/ })).toBeDisabled()

    await usuario.type(campo, ' agora já passa do mínimo')
    expect(screen.getByRole('button', { name: /Pedir correção/ })).toBeEnabled()
  })

  it('mostra o texto corrigido com os trechos sublinhados e reporta as notas para a margem', async () => {
    vi.mocked(pedirFeedbackAutoexplicacao).mockResolvedValue(FEEDBACK)
    const usuario = userEvent.setup()
    const { margem } = renderPainel()

    await usuario.click(screen.getByRole('button', { name: /Explicar com minhas palavras/ }))
    await usuario.type(screen.getByLabelText('Sua explicação'), TEXTO)
    await usuario.click(screen.getByRole('button', { name: /Pedir correção/ }))

    expect(await screen.findByText('Sua explicação, corrigida')).toBeInTheDocument()
    expect(pedirFeedbackAutoexplicacao).toHaveBeenCalledWith(7, TEXTO, expect.any(AbortSignal))
    expect(screen.getByText('pro pulmão')).toHaveClass('decoration-wavy')

    await waitFor(() => expect(margem()).toHaveTextContent('Vai para a aorta.'))
    expect(margem()).toHaveTextContent('No caminho — faltou um ponto')
    expect(margem()).toHaveTextContent('Comparado com o seu material')
  })

  it('preserva o texto quando a correção falha', async () => {
    vi.mocked(pedirFeedbackAutoexplicacao).mockRejectedValue(new Error('502'))
    const usuario = userEvent.setup()
    renderPainel()

    await usuario.click(screen.getByRole('button', { name: /Explicar com minhas palavras/ }))
    await usuario.type(screen.getByLabelText('Sua explicação'), TEXTO)
    await usuario.click(screen.getByRole('button', { name: /Pedir correção/ }))

    await waitFor(() => expect(screen.getByRole('button', { name: /Pedir correção/ })).toBeEnabled())
    expect(screen.getByLabelText('Sua explicação')).toHaveValue(TEXTO)
  })

  it('pede outra analogia enviando a anterior para ser evitada', async () => {
    vi.mocked(gerarAnalogia)
      .mockResolvedValueOnce({ tipo: 'ANALOGIA', texto: 'Como uma bomba de água.', ancoradaNoMaterial: true })
      .mockResolvedValueOnce({ tipo: 'EXEMPLO', texto: 'Numa corrida, o coração acelera.', ancoradaNoMaterial: true })
    const usuario = userEvent.setup()
    const { margem } = renderPainel()

    await usuario.click(screen.getByRole('button', { name: /Me dá uma analogia/ }))
    await waitFor(() => expect(margem()).toHaveTextContent('Como uma bomba de água.'))

    await usuario.click(await screen.findByRole('button', { name: /Outra analogia/ }))
    await waitFor(() =>
      expect(gerarAnalogia).toHaveBeenLastCalledWith(7, 'Como uma bomba de água.', expect.any(AbortSignal)),
    )
  })

  it('aciona onOcultar pelo botão de ocultar', async () => {
    const usuario = userEvent.setup()
    const { onOcultar } = renderPainel()

    await usuario.click(screen.getByRole('button', { name: 'Ocultar opções de aprofundamento' }))

    expect(onOcultar).toHaveBeenCalledTimes(1)
  })
})

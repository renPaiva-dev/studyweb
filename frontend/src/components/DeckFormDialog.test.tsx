import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Deck } from '@/api/deckApi'
import { DeckFormDialog } from '@/components/DeckFormDialog'

vi.mock('@/api/deckApi', () => ({
  criarDeck: vi.fn(),
  atualizarDeck: vi.fn(),
}))

vi.mock('@/api/colecaoApi', () => ({
  listarColecoes: vi.fn().mockResolvedValue([]),
}))

const { criarDeck, atualizarDeck } = await import('@/api/deckApi')

const DECK_EXISTENTE: Deck = {
  id: 7,
  titulo: 'Anatomia',
  descricao: 'Sistema nervoso',
  criadoEm: '2026-01-01T00:00:00Z',
  totalFlashcards: 12,
  colecaoId: null,
  colecaoNome: null,
}

// UC02 - criar/editar deck via Dialog (POST/PUT /api/decks). E1 da spec:
// título vazio bloqueia o envio sem chamar a API.
describe('DeckFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('bloqueia o envio e mostra erro quando o título está vazio (E1)', async () => {
    const usuario = userEvent.setup()
    render(<DeckFormDialog open={true} onOpenChange={vi.fn()} deckParaEditar={null} onSalvo={vi.fn()} />)

    await usuario.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('O título é obrigatório.')).toBeInTheDocument()
    expect(criarDeck).not.toHaveBeenCalled()
  })

  it('cria um deck novo com título e descrição sem espaços nas pontas', async () => {
    vi.mocked(criarDeck).mockResolvedValue({ ...DECK_EXISTENTE, id: 9 })
    const onSalvo = vi.fn()
    const onOpenChange = vi.fn()
    const usuario = userEvent.setup()

    render(<DeckFormDialog open={true} onOpenChange={onOpenChange} deckParaEditar={null} onSalvo={onSalvo} />)

    await usuario.type(screen.getByLabelText('Título'), '  Cálculo I  ')
    await usuario.type(screen.getByLabelText('Descrição'), '  Limites e derivadas  ')
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(criarDeck).toHaveBeenCalledWith({ titulo: 'Cálculo I', descricao: 'Limites e derivadas', colecaoId: null }),
    )
    expect(atualizarDeck).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onSalvo).toHaveBeenCalledTimes(1)
  })

  it('edita um deck existente chamando atualizarDeck com o id correto', async () => {
    vi.mocked(atualizarDeck).mockResolvedValue(DECK_EXISTENTE)
    const usuario = userEvent.setup()

    // O dialog fica montado o tempo todo em produção (DecksPage) e só troca
    // `open` - o preenchimento dos campos é disparado pela transição
    // false->true (ver comentário em DeckFormDialog sobre `estavaAberto`),
    // não por um render inicial já aberto.
    const { rerender } = render(
      <DeckFormDialog open={false} onOpenChange={vi.fn()} deckParaEditar={DECK_EXISTENTE} onSalvo={vi.fn()} />,
    )
    rerender(<DeckFormDialog open={true} onOpenChange={vi.fn()} deckParaEditar={DECK_EXISTENTE} onSalvo={vi.fn()} />)

    expect(screen.getByDisplayValue('Anatomia')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(atualizarDeck).toHaveBeenCalledWith(7, { titulo: 'Anatomia', descricao: 'Sistema nervoso', colecaoId: null }),
    )
    expect(criarDeck).not.toHaveBeenCalled()
  })
})

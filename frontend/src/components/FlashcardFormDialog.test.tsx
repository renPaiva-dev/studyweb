import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Flashcard } from '@/api/flashcardApi'
import { FlashcardFormDialog } from '@/components/FlashcardFormDialog'

vi.mock('@/api/flashcardApi', () => ({
  criarFlashcard: vi.fn(),
  atualizarFlashcard: vi.fn(),
}))

const { criarFlashcard, atualizarFlashcard } = await import('@/api/flashcardApi')

const FLASHCARD_IA: Flashcard = {
  id: 3,
  pergunta: 'O que é sinapse?',
  resposta: 'Junção entre neurônios',
  mnemonico: null,
  topico: 'Sistema nervoso',
  origem: 'IA',
}

// UC05 - editar flashcard. RN17: o PUT substitui o flashcard inteiro, então
// o formulário precisa reenviar o tópico para não apagar o que a IA gerou.
describe('FlashcardFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mantém o tópico existente ao editar só a resposta', async () => {
    vi.mocked(atualizarFlashcard).mockResolvedValue(FLASHCARD_IA)
    const usuario = userEvent.setup()
    const props = { deckId: 1, onOpenChange: vi.fn(), flashcardParaEditar: FLASHCARD_IA, onSalvo: vi.fn() }

    const { rerender } = render(<FlashcardFormDialog {...props} open={false} />)
    rerender(<FlashcardFormDialog {...props} open={true} />)

    const resposta = screen.getByLabelText('Resposta')
    await usuario.clear(resposta)
    await usuario.type(resposta, 'Junção entre dois neurônios')
    await usuario.click(screen.getByRole('button', { name: 'Salvar flashcard' }))

    await waitFor(() =>
      expect(atualizarFlashcard).toHaveBeenCalledWith(3, {
        pergunta: 'O que é sinapse?',
        resposta: 'Junção entre dois neurônios',
        mnemonico: undefined,
        topico: 'Sistema nervoso',
      }),
    )
  })

  it('envia o tópico opcional ao criar um flashcard manual', async () => {
    vi.mocked(criarFlashcard).mockResolvedValue({ ...FLASHCARD_IA, origem: 'MANUAL' })
    const usuario = userEvent.setup()
    const props = { deckId: 1, onOpenChange: vi.fn(), flashcardParaEditar: null, onSalvo: vi.fn() }

    const { rerender } = render(<FlashcardFormDialog {...props} open={false} />)
    rerender(<FlashcardFormDialog {...props} open={true} />)

    await usuario.type(screen.getByLabelText('Pergunta'), 'Pergunta')
    await usuario.type(screen.getByLabelText('Resposta'), 'Resposta')
    await usuario.type(screen.getByLabelText(/Tópico/), '  Genética  ')
    await usuario.click(screen.getByRole('button', { name: 'Salvar flashcard' }))

    await waitFor(() =>
      expect(criarFlashcard).toHaveBeenCalledWith(1, {
        pergunta: 'Pergunta',
        resposta: 'Resposta',
        mnemonico: undefined,
        topico: 'Genética',
      }),
    )
  })
})

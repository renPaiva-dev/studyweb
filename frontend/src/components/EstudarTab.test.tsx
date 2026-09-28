import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ItemFilaEstudo } from '@/api/estudoApi'
import { EstudarTab } from '@/components/EstudarTab'
import { renderComMargem } from '@/test/testUtils'

vi.mock('@/api/estudoApi', () => ({
  buscarFilaEstudo: vi.fn(),
  avaliarRevisao: vi.fn(),
}))

vi.mock('@/api/elaboracaoApi', () => ({
  pedirFeedbackAutoexplicacao: vi.fn(),
  gerarAnalogia: vi.fn(),
}))

const { buscarFilaEstudo, avaliarRevisao } = await import('@/api/estudoApi')
const { pedirFeedbackAutoexplicacao } = await import('@/api/elaboracaoApi')

function item(flashcardId: number, pergunta: string): ItemFilaEstudo {
  return { flashcardId, pergunta, resposta: `Resposta ${flashcardId}`, mnemonico: null }
}

// UC07/UC08/UC09 - fila diária de estudo (RN10) e avaliação que aciona o
// recalculo SM-2. Cobre o ciclo virar -> avaliar -> avançar, a fila vazia
// (com "Revisar mesmo assim") e o estado de erro com retry.
describe('EstudarTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('mostra a pergunta, depois vira o card e avalia avançando para o próximo item da fila', async () => {
    vi.mocked(buscarFilaEstudo).mockResolvedValue([item(1, 'Pergunta A'), item(2, 'Pergunta B')])
    vi.mocked(avaliarRevisao).mockResolvedValue({
      fatorFacilidade: 2.5,
      intervaloDias: 1,
      repeticoes: 1,
      proximaRevisao: '2026-09-18',
    })
    const usuario = userEvent.setup()

    renderComMargem(<EstudarTab deckId={42} />)

    expect(await screen.findByText('Pergunta A')).toBeInTheDocument()
    expect(buscarFilaEstudo).toHaveBeenCalledWith(42, false)

    await usuario.click(screen.getByRole('button', { name: /Virar card/ }))
    await usuario.click(screen.getByRole('button', { name: /^4/ }))

    await waitFor(() => expect(avaliarRevisao).toHaveBeenCalledWith(1, 4))
    expect(await screen.findByText('Pergunta B')).toBeInTheDocument()
  })

  it('mostra "Sessão concluída!" depois de avaliar o último item da fila', async () => {
    vi.mocked(buscarFilaEstudo).mockResolvedValue([item(1, 'Pergunta única')])
    vi.mocked(avaliarRevisao).mockResolvedValue({
      fatorFacilidade: 2.5,
      intervaloDias: 6,
      repeticoes: 2,
      proximaRevisao: '2026-09-23',
    })
    const usuario = userEvent.setup()

    renderComMargem(<EstudarTab deckId={42} />)

    await screen.findByText('Pergunta única')
    await usuario.click(screen.getByRole('button', { name: /Virar card/ }))
    await usuario.click(screen.getByRole('button', { name: /^5/ }))

    expect(await screen.findByText('Sessão concluída!')).toBeInTheDocument()
  })

  it('com a fila vazia, oferece "Revisar mesmo assim", que rebusca com incluirTodos=true', async () => {
    vi.mocked(buscarFilaEstudo).mockResolvedValueOnce([]).mockResolvedValueOnce([item(3, 'Pergunta C')])
    const usuario = userEvent.setup()

    renderComMargem(<EstudarTab deckId={42} />)

    expect(await screen.findByText('Nenhuma revisão pendente hoje!')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: /Revisar mesmo assim/ }))

    expect(buscarFilaEstudo).toHaveBeenLastCalledWith(42, true)
    expect(await screen.findByText('Pergunta C')).toBeInTheDocument()
  })

  it('mostra erro com botão de retry quando a fila falha ao carregar', async () => {
    vi.mocked(buscarFilaEstudo).mockRejectedValueOnce(new Error('falhou')).mockResolvedValueOnce([item(1, 'Pergunta A')])
    const usuario = userEvent.setup()

    renderComMargem(<EstudarTab deckId={42} />)

    expect(await screen.findByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByText('Pergunta A')).toBeInTheDocument()
    expect(buscarFilaEstudo).toHaveBeenCalledTimes(2)
  })

  // RN44 - a elaboração (UC34) nunca bloqueia a avaliação: avaliar com uma
  // correção em andamento avança normalmente e cancela a requisição.
  it('permite avaliar e avançar com uma correção de autoexplicação ainda em andamento', async () => {
    vi.mocked(buscarFilaEstudo).mockResolvedValue([item(1, 'Pergunta A'), item(2, 'Pergunta B')])
    vi.mocked(avaliarRevisao).mockResolvedValue({
      fatorFacilidade: 2.5,
      intervaloDias: 1,
      repeticoes: 1,
      proximaRevisao: '2026-09-18',
    })
    let sinalDaCorrecao: AbortSignal | undefined
    vi.mocked(pedirFeedbackAutoexplicacao).mockImplementation((_id, _texto, signal) => {
      sinalDaCorrecao = signal
      return new Promise(() => {})
    })
    const usuario = userEvent.setup()

    renderComMargem(<EstudarTab deckId={42} />)

    await screen.findByText('Pergunta A')
    await usuario.click(screen.getByRole('button', { name: /Virar card/ }))
    await usuario.click(screen.getByRole('button', { name: /Explicar com minhas palavras/ }))
    await usuario.type(screen.getByLabelText('Sua explicação'), 'Uma explicação com mais de vinte caracteres.')
    await usuario.click(screen.getByRole('button', { name: /Pedir correção/ }))

    const botaoBom = screen.getByRole('button', { name: /^4/ })
    expect(botaoBom).toBeEnabled()
    await usuario.click(botaoBom)

    await waitFor(() => expect(avaliarRevisao).toHaveBeenCalledWith(1, 4))
    expect(await screen.findByText('Pergunta B')).toBeInTheDocument()
    expect(sinalDaCorrecao?.aborted).toBe(true)
  })

  it('oculta as opções de aprofundamento e guarda a preferência', async () => {
    vi.mocked(buscarFilaEstudo).mockResolvedValue([item(1, 'Pergunta A')])
    const usuario = userEvent.setup()

    renderComMargem(<EstudarTab deckId={42} />)

    await screen.findByText('Pergunta A')
    await usuario.click(screen.getByRole('button', { name: /Virar card/ }))
    await usuario.click(screen.getByRole('button', { name: 'Ocultar opções de aprofundamento' }))

    expect(screen.queryByRole('button', { name: /Explicar com minhas palavras/ })).not.toBeInTheDocument()
    expect(localStorage.getItem('sinapse.elaboracao.visivel')).toBe('false')
  })
})

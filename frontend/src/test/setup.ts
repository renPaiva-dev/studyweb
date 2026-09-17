import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

import '@testing-library/jest-dom/vitest'

// Sem `test.globals: true` no vitest.config.ts, o afterEach automático que
// @testing-library/react tentaria registrar não encontra um `afterEach`
// global - sem isso, o DOM de um teste vaza para o próximo dentro do mesmo
// arquivo (ex.: dois botões "Virar card" no documento ao mesmo tempo).
afterEach(() => {
  cleanup()
})

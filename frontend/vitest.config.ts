import path from 'node:path'

import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config.ts'

// Config de teste separada de vite.config.ts (mantém o build de produção
// livre de qualquer coisa relacionada a teste). `mergeConfig` reaproveita o
// plugin do React e o alias `@` já definidos ali.
export default mergeConfig(
  viteConfig,
  defineConfig({
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
    },
  }),
)

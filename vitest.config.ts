import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ['tests/int/**/*.int.test.ts'],
    globalSetup: ['tests/int/global-setup.ts'],
    // Integration tests share one database — run files sequentially.
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 120000,
  },
})

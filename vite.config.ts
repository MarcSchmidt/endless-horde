import { defineConfig } from 'vite'

export default defineConfig({
  base: '/endless-horde/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
})
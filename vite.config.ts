import { defineConfig } from 'vite'

export default defineConfig({
  base: '/endless-horde-web-game/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
})
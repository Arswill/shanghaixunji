/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { readFileSync } from 'node:fs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const webRoot = dirname(fileURLToPath(import.meta.url))

/**
 * Treat .geojson files as JSON modules so they can be imported with
 * `import data from './file.geojson'`. Vite's built-in JSON plugin only
 * handles .json files, so we intercept .geojson here.
 */
function geojsonPlugin() {
  return {
    name: 'geojson-loader',
    load(id: string) {
      if (!id.includes('.geojson')) return null
      const cleanId = id.replace(/\?.*$/, '').replace(/^\/@fs\//, '')
      const json = readFileSync(cleanId, 'utf8')
      return `export default ${json}`
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  cacheDir: resolve(webRoot, 'node_modules', '.vite'),
  resolve: {
    dedupe: ['react', 'react-dom', 'react-dom/client', 'scheduler'],
  },
  plugins: [
    react(),
    geojsonPlugin(),
    {
      name: 'local-api-proxy',
      configureServer(server) {
        server.middlewares.use('/api/chat', async (req, res) => {
          const { default: chatHandler } = await server.ssrLoadModule('/dev-server.ts')
          await chatHandler(req, res)
        })
        server.middlewares.use('/api/tts', async (req, res) => {
          const { default: ttsHandler } = await server.ssrLoadModule('/dev-server-tts.ts')
          await ttsHandler(req, res)
        })
      },
    },
  ],
  server: {
    fs: { allow: [projectRoot] },
    watch: { ignored: ['**/node_modules/.vite/**'] },
    warmup: { clientFiles: [] },
    hmr: false,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'zustand',
      'zustand/middleware',
      'use-sync-external-store/shim/with-selector',
      'scheduler',
      'd3',
      'd3-geo',
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
    css: true,
  },
  esbuild: { target: 'esnext', logOverride: { 'this-is-undefined-in-esm': 'silent' } },
  build: {
    minify: false,
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/d3') || id.includes('node_modules/d3-geo')) {
            return 'vendor-d3'
          }
        },
      },
    },
  },
})

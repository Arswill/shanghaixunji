// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'

const swPath = resolve(__dirname, '../../public/sw.js')
const swSource = readFileSync(swPath, 'utf8')

function extractStaticAssets(): string[] {
  const match = swSource.match(/const STATIC_ASSETS\s*=\s*\[([\s\S]*?)\]/)
  if (!match) throw new Error('STATIC_ASSETS not found in sw.js')
  return match[1]
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.startsWith("'") || s.startsWith('"'))
    .map((s) => s.slice(1, -1))
    .filter((url) => url.startsWith('/'))
}

describe('sw.js STATIC_ASSETS', () => {
  it('每条本地静态资源都应实际存在', () => {
    const assets = extractStaticAssets()
    expect(assets.length).toBeGreaterThan(0)
    const publicDir = resolve(__dirname, '../../public')
    const missing: string[] = []
    for (const url of assets) {
      if (url === '/' || url === '/index.html') continue
      const filePath = resolve(publicDir, url.slice(1).replace('?', ''))
      if (!existsSync(filePath)) {
        missing.push(url)
      }
    }
    expect(missing).toEqual([])
  })

  it('不应包含已知的占位图占位条目', () => {
    const assets = extractStaticAssets()
    expect(assets).not.toContain('/assets/images/placeholder.jpg')
  })
})

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const tokensPath = resolve(__dirname, '../design/tokens.css')
const tokensSource = readFileSync(tokensPath, 'utf8')
const tailwindPath = resolve(__dirname, '../../tailwind.config.ts')
const tailwindSource = readFileSync(tailwindPath, 'utf8')

function tokenVar(name: string): string | undefined {
  const re = new RegExp(`--${name}\\s*:\\s*([^;]+);`)
  const m = tokensSource.match(re)
  return m ? m[1].trim() : undefined
}

function tailwindColor(line: string): string | null {
  const m = line.match(/:\s*'(#[0-9a-fA-F]{3,8})'/)
  return m ? m[1].toLowerCase() : null
}

describe('Tailwind 与 tokens.css 色板一致性', () => {
  it('bg.base 应与 --celestial-mist 一致（暗色）', () => {
    const expected = tokenVar('celestial-mist')
    const line = tailwindSource.split('\n').find((l) => l.includes('base:'))
    const actual = line ? tailwindColor(line) : null
    expect(actual).toBe(expected?.toLowerCase())
  })

  it('ink.primary 应与 --ink-zhong 一致（暗色浅字）', () => {
    const expected = tokenVar('ink-zhong')
    const line = tailwindSource.split('\n').find((l) => l.includes('primary:'))
    const actual = line ? tailwindColor(line) : null
    expect(actual).toBe(expected?.toLowerCase())
  })

  it('celestial.mist 应与 --celestial-mist 一致', () => {
    const expected = tokenVar('celestial-mist')
    const line = tailwindSource.split('\n').find((l) => l.includes('mist:'))
    const actual = line ? tailwindColor(line) : null
    expect(actual).toBe(expected?.toLowerCase())
  })

  it('bg.base 不应是亮色 #f0f5f1', () => {
    const line = tailwindSource.split('\n').find((l) => l.includes('base:'))
    const actual = line ? tailwindColor(line) : null
    expect(actual).not.toBe('#f0f5f1')
  })
})

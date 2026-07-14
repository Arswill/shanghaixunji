/**
 * postinstall script: patch rollup's native.js to fall back to WASM
 * when the native binary fails to load (missing MSVC runtime on Windows).
 *
 * This patch is NOT tracked by npm and gets overwritten on every `npm install`.
 * Add to package.json: "scripts": { "postinstall": "node scripts/patch-rollup.mjs" }
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const nativePath = join(__dirname, '..', 'node_modules', 'rollup', 'dist', 'native.js')

if (!existsSync(nativePath)) {
  console.log('[patch-rollup] rollup not found, skipping')
  process.exit(0)
}

let content = readFileSync(nativePath, 'utf8')

// Check if already patched
if (content.includes('Fall back to WASM build')) {
  console.log('[patch-rollup] already patched, skipping')
  process.exit(0)
}

// Simple string replacement — find the exact line and replace it
const oldLine = 'const { parse, parseAsync, xxhashBase64Url, xxhashBase36, xxhashBase16 } = requireWithFriendlyError('
const oldLine2 = "\texistsSync(path.join(__dirname, localName)) ? localName : `@rollup/rollup-${packageBase}`"
const oldLine3 = ');'

const newBlock = `let parse, parseAsync, xxhashBase64Url, xxhashBase36, xxhashBase16;
try {
	({ parse, parseAsync, xxhashBase64Url, xxhashBase36, xxhashBase16 } = requireWithFriendlyError(
		existsSync(path.join(__dirname, localName)) ? localName : \`@rollup/rollup-\${packageBase}\`
	));
} catch (_nativeError) {
	// Native binary failed (missing MSVC runtime). Fall back to WASM build.
	const wasmPath = path.join(__dirname, '..', '..', '@rollup', 'wasm-node', 'dist', 'native.js');
	const wasm = require(existsSync(wasmPath) ? wasmPath : '@rollup/wasm-node');
	parse = wasm.parse;
	parseAsync = wasm.parseAsync;
	xxhashBase64Url = wasm.xxhashBase64Url;
	xxhashBase36 = wasm.xxhashBase36;
	xxhashBase16 = wasm.xxhashBase16;
}`

// Find and replace the exact 3-line block
const oldBlock = oldLine + '\n' + oldLine2 + '\n' + oldLine3

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock)
  writeFileSync(nativePath, content, 'utf8')
  console.log('[patch-rollup] Successfully patched rollup native.js with WASM fallback')
} else {
  console.warn('[patch-rollup] WARNING: exact block not found, trying regex fallback...')
  // Fallback: use regex to match the pattern
  const regex = /const \{ parse, parseAsync, xxhashBase64Url, xxhashBase36, xxhashBase16 \} = requireWithFriendlyError\(\s*\n\s*existsSync\(path\.join\(__dirname, localName\)\) \? localName : `@rollup\/rollup-\$\{packageBase\}`\s*\n\);/
  if (regex.test(content)) {
    content = content.replace(regex, newBlock)
    writeFileSync(nativePath, content, 'utf8')
    console.log('[patch-rollup] Successfully patched via regex fallback')
  } else {
    console.error('[patch-rollup] FAILED: Could not find pattern to patch. Manual patching required.')
    console.error('[patch-rollup] The rollup native binary may not load without MSVC runtime.')
    // Don't fail the install — the WASM fallback in the try/catch will handle it at runtime
    // if the user has @rollup/wasm-node installed
  }
}

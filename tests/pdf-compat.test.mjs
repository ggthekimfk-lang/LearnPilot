import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

test('PDF extraction works without native Promise.withResolvers and Map.getOrInsertComputed', () => {
  const preload = 'data:text/javascript,delete Promise.withResolvers;delete Map.prototype.getOrInsertComputed;'
  const env = { ...process.env }
  delete env.NODE_TEST_CONTEXT
  const result = execFileSync(process.execPath, ['--import', preload, '--import', new URL('../src/leanpilot/pdf-compat.ts', import.meta.url).href, '--test', '--test-reporter=spec', fileURLToPath(new URL('./pdf-text.test.mjs', import.meta.url))], { encoding: 'utf8', env })
  assert.match(result, /pass 9/)
  assert.match(result, /fail 0/)
})

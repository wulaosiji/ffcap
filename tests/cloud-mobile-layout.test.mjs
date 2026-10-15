import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'

test('wide short viewports cannot force scene controls below the visible height', async () => {
  const css = await readFile(new URL('../src/app/settlement.css', import.meta.url), 'utf8')
  const start = css.indexOf('@media(max-height:600px) and (min-width:761px)')
  assert.ok(start >= 0)
  const rule = css.slice(start, css.indexOf('@media', start + 1))
  assert.match(rule, /min-height:min\(430px,100svh\)/)
  assert.match(rule, /bottom:max\(15px,env\(safe-area-inset-bottom\)\)/)
  assert.doesNotMatch(rule, /min-height:430px/)
})

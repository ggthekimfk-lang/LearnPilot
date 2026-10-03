import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

test('PDF extraction works without native promise helpers, map helpers or WebKit stream async iteration', () => {
  const preload = 'data:text/javascript,delete Promise.withResolvers;delete Map.prototype.getOrInsertComputed;delete ReadableStream.prototype[Symbol.asyncIterator];delete ReadableStream.prototype.values;'
  const env = { ...process.env }
  delete env.NODE_TEST_CONTEXT
  const result = execFileSync(process.execPath, ['--import', preload, '--import', new URL('../src/leanpilot/pdf-compat.ts', import.meta.url).href, '--test', '--test-reporter=spec', fileURLToPath(new URL('./pdf-text.test.mjs', import.meta.url))], { encoding: 'utf8', env })
  assert.match(result, /pass 9/)
  assert.match(result, /fail 0/)
})

test('stream fallback reads in order and releases locks when exhausted, cancelled or interrupted', () => {
  const env = { ...process.env }
  delete env.NODE_TEST_CONTEXT
  const code = `
    import assert from 'node:assert/strict';
    delete ReadableStream.prototype[Symbol.asyncIterator];
    delete ReadableStream.prototype.values;
    await import(${JSON.stringify(new URL('../src/leanpilot/pdf-compat.ts', import.meta.url).href)});
    const stream = new ReadableStream({start(c){c.enqueue('a');c.enqueue('b');c.close()}});
    const items=[]; for await(const value of stream) items.push(value);
    assert.deepEqual(items,['a','b']); assert.equal(stream.locked,false);
    let cancelled=false;
    const early=new ReadableStream({start(c){c.enqueue('a')},cancel(){cancelled=true}});
    for await(const value of early) { assert.equal(value,'a'); break; }
    assert.equal(cancelled,true); assert.equal(early.locked,false);
    cancelled=false;
    const retained=new ReadableStream({start(c){c.enqueue('a');c.enqueue('b');c.close()},cancel(){cancelled=true}});
    for await(const value of retained.values({preventCancel:true})) { assert.equal(value,'a'); break; }
    assert.equal(cancelled,false); assert.equal(retained.locked,false);
    const reader=retained.getReader(); assert.equal((await reader.read()).value,'b'); reader.releaseLock();
    const broken=new ReadableStream({start(c){c.error(new Error('read failed'))}});
    await assert.rejects(async()=>{for await(const value of broken) void value},/read failed/);
    assert.equal(broken.locked,false);
  `
  execFileSync(process.execPath, ['--input-type=module', '--eval', code], { encoding: 'utf8', env })
})

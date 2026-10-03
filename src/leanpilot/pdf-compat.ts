// PDF.js also needs this API on Safari versions before 17.4.
type PromiseFactory = typeof Promise & { withResolvers?: () => unknown }
const factory = Promise as PromiseFactory
if (typeof factory.withResolvers !== 'function') {
  Object.defineProperty(Promise, 'withResolvers', {
    configurable: true,
    writable: true,
    value: function <T>(this: PromiseConstructor) {
      let resolve!: (value: T | PromiseLike<T>) => void
      let reject!: (reason?: unknown) => void
      const promise = new this<T>((yes, no) => { resolve = yes; reject = no })
      return { promise, resolve, reject }
    },
  })
}

// PDF.js getTextContent uses `for await` on a ReadableStream. Older WebKit
// exposes getReader() but not the stream's async iterator, even in legacy builds.
if (typeof ReadableStream !== 'undefined' && typeof ReadableStream.prototype[Symbol.asyncIterator] !== 'function') {
  const iterate = async function* <T>(this: ReadableStream<T>, options: { preventCancel?: boolean } = {}) {
    const reader = this.getReader()
    let complete = false
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) { complete = true; return }
        yield value
      }
    } finally {
      try { if (!complete && !options.preventCancel) await reader.cancel() }
      finally { reader.releaseLock() }
    }
  }
  Object.defineProperty(ReadableStream.prototype, Symbol.asyncIterator, { configurable: true, writable: true, value: iterate })
  if (typeof ReadableStream.prototype.values !== 'function') {
    Object.defineProperty(ReadableStream.prototype, 'values', { configurable: true, writable: true, value: iterate })
  }
}

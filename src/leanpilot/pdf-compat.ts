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

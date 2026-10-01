// Minimal host declarations for local typechecking; deployment uses the Deno runtime.
declare const Deno: {
  env: { get(name: string): string | undefined }
  serve(handler: (request: Request) => Response | Promise<Response>): void
}
declare const EdgeRuntime: { waitUntil(work: Promise<unknown>): void }

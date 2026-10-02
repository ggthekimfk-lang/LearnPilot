// Retry only explicit provider unavailability: at most 5 requests, with 2/4/8/16 second backoff.
// The caller keeps the original 90-second request deadline.
export async function retryUnavailable(
  request: () => Promise<Response>,
  pause: (ms: number) => Promise<void> = ms => new Promise(resolve => setTimeout(resolve, ms)),
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const response = await request()
    if (response.status !== 503 || attempt === 4) return response
    await response.body?.cancel()
    await pause(2000 * 2 ** attempt)
  }
}


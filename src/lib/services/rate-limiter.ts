// Rate limiter local para respeitar os termos de uso da Open Food Facts
// (recomendado: ate 1 requisicao / 1000ms para chamadas anonimas).
// Serializa via cadeia de promises e suporta "penalidade" global quando a
// API retorna 429 (rate limit), respeitando o limite sem martelar o servidor.

export class RateLimiter {
  private minIntervalMs: number
  private nextAvailableAt = 0
  // Cooldown absoluto global: quando recebemos 429, empurramos este timestamp
  // para a frente, espacando TODAS as chamadas seguintes ate o limite esvaziar.
  private cooldownUntil = 0
  private chain: Promise<void> = Promise.resolve()

  constructor(minIntervalMs = 1000) {
    this.minIntervalMs = minIntervalMs
  }

  /** Aplica um cooldown global extra (ms) apos receber 429 da API. */
  penalize(extraMs: number): void {
    const until = Date.now() + extraMs
    if (until > this.cooldownUntil) this.cooldownUntil = until
  }

  async acquire(): Promise<void> {
    const run = async () => {
      const now = Date.now()
      const floor = Math.max(this.nextAvailableAt, this.cooldownUntil)
      const wait = Math.max(0, floor - now)
      if (wait > 0) {
        await new Promise((resolve) => setTimeout(resolve, wait))
      }
      this.nextAvailableAt = Date.now() + this.minIntervalMs
    }
    const previous = this.chain
    this.chain = previous.then(run, run)
    await this.chain
  }
}

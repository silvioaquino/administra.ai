// Métricas em memória do subsistema de normalização.
// Em serverless o contador reseta no cold start — aceitável para esta fase;
// a interface já está pronta para persistir em Redis/DB futuramente.

import type { FonteDados } from '@/types/produto-normalizacao'

interface MetricsState {
  offSuccess: number
  offNotFound: number
  offFailure: number
  latencySumMs: number
  latencyCount: number
  byFonte: Record<FonteDados, number>
  precisaRevisaoCount: number
  manualCorrections: number
}

function createInitialState(): MetricsState {
  return {
    offSuccess: 0,
    offNotFound: 0,
    offFailure: 0,
    latencySumMs: 0,
    latencyCount: 0,
    byFonte: { OPEN_FOOD_FACTS: 0, NORMALIZACAO_LOCAL: 0, MANUAL: 0 },
    precisaRevisaoCount: 0,
    manualCorrections: 0,
  }
}

export interface NormalizationSnapshot {
  api: {
    success: number
    notFound: number
    failure: number
    total: number
    successRate: number
    avgLatencyMs: number
  }
  byFonte: Record<FonteDados, number>
  produtosPrecisaRevisao: number
  correcoesManuais: number
}

class NormalizationMetrics {
  private state: MetricsState = createInitialState()

  recordOff(status: 'success' | 'not_found' | 'failure', latencyMs: number): void {
    this.state.latencySumMs += latencyMs
    this.state.latencyCount += 1
    if (status === 'success') this.state.offSuccess += 1
    else if (status === 'not_found') this.state.offNotFound += 1
    else this.state.offFailure += 1
  }

  recordFonte(fonte: FonteDados, precisaRevisao: boolean): void {
    this.state.byFonte[fonte] += 1
    if (precisaRevisao) this.state.precisaRevisaoCount += 1
  }

  recordManualCorrection(): void {
    this.state.manualCorrections += 1
  }

  snapshot(): NormalizationSnapshot {
    const { offSuccess, offNotFound, offFailure, latencySumMs, latencyCount, byFonte, precisaRevisaoCount, manualCorrections } = this.state
    const total = offSuccess + offNotFound + offFailure
    return {
      api: {
        success: offSuccess,
        notFound: offNotFound,
        failure: offFailure,
        total,
        successRate: total > 0 ? offSuccess / total : 0,
        avgLatencyMs: latencyCount > 0 ? latencySumMs / latencyCount : 0,
      },
      byFonte: { ...byFonte },
      produtosPrecisaRevisao: precisaRevisaoCount,
      correcoesManuais: manualCorrections,
    }
  }

  reset(): void {
    this.state = createInitialState()
  }
}

export const normalizationMetrics = new NormalizationMetrics()

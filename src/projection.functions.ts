import { createServerFn } from '@tanstack/react-start'

import { findBenchmarkOption } from './lib/projection-data.js'
import type { ProjectionData } from './projection.types.js'

export type {
  AppSettingsData,
  BenchmarkRate,
  ProjectionData,
} from './projection.types.js'

function requireObject(data: unknown) {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid request.')
  }

  return data as Record<string, unknown>
}

function requireBenchmarkSymbol(value: unknown) {
  if (typeof value !== 'string') {
    throw new Error('Choose a benchmark.')
  }

  const option = findBenchmarkOption(value)

  if (!option) {
    throw new Error('Choose a benchmark from the list.')
  }

  return option
}

function requireSavingsRate(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('Enter a savings rate.')
  }

  if (value < 0 || value > 100) {
    throw new Error('Savings rate must be between 0 and 100.')
  }

  return value
}

function requireRefreshHours(value: unknown) {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error('Enter a refresh interval.')
  }

  if (value < 1 || value > 720) {
    throw new Error('Refresh interval must be between 1 and 720 hours.')
  }

  return value
}

export const getProjectionData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ProjectionData> => {
    const { getProjectionDataImpl } = await import('./projection.server.js')
    return getProjectionDataImpl()
  },
)

export const updateAppSettings = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const input = requireObject(data)
    const benchmark = requireBenchmarkSymbol(input.benchmarkSymbol)

    return {
      benchmarkSymbol: benchmark.symbol,
      benchmarkLabel: benchmark.label,
      savingsRate: requireSavingsRate(input.savingsRate),
      refreshHours: requireRefreshHours(input.refreshHours),
    }
  })
  .handler(async ({ data }) => {
    const { updateAppSettingsImpl } = await import('./projection.server.js')
    await updateAppSettingsImpl(data)
    return { ok: true as const }
  })

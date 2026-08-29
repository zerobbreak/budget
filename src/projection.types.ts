import type { ProjectionPoint } from './lib/projection-data.js'

export type AppSettingsData = {
  benchmarkSymbol: string
  benchmarkLabel: string
  savingsRate: number
  refreshHours: number
}

export type BenchmarkRate = {
  symbol: string
  label: string
  annualReturn: number
  asOf: string
  usingLiveData: boolean
}

export type ProjectionData = {
  surplus: number
  settings: AppSettingsData
  benchmark: BenchmarkRate
  projections: ProjectionPoint[]
}

export type AppSettingsUpdate = {
  benchmarkSymbol: string
  benchmarkLabel: string
  savingsRate: number
  refreshHours: number
}

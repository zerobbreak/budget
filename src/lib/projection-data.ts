export type BenchmarkOption = {
  symbol: string
  label: string
}

/** Curated list of well-known, liquid index ETFs with long Alpha Vantage price history. */
export const BENCHMARK_OPTIONS: BenchmarkOption[] = [
  { symbol: 'SPY', label: 'S&P 500 (SPY)' },
  { symbol: 'VOO', label: 'S&P 500 (VOO)' },
  { symbol: 'QQQ', label: 'Nasdaq 100 (QQQ)' },
  { symbol: 'VTI', label: 'Total US Market (VTI)' },
]

export function findBenchmarkOption(symbol: string) {
  return BENCHMARK_OPTIONS.find((option) => option.symbol === symbol)
}

export const BENCHMARK_TRAILING_YEARS = 5

export const PROJECTION_HORIZONS = [1, 5, 10] as const
export type ProjectionHorizon = (typeof PROJECTION_HORIZONS)[number]

export type ProjectionPoint = {
  years: ProjectionHorizon
  savingsValue: number
  investmentValue: number
}

/**
 * Standard compound interest: FV = P x (1 + r/n)^(n*t).
 * `principal` is the current surplus, compounded as if set aside today —
 * this is a simple "what could this amount become" illustration, not a
 * recurring monthly-contribution annuity.
 */
export function compoundGrowth(
  principal: number,
  annualRate: number,
  years: number,
  periodsPerYear = 12,
): number {
  if (principal <= 0) {
    return 0
  }

  return (
    principal * Math.pow(1 + annualRate / periodsPerYear, periodsPerYear * years)
  )
}

export function buildProjections(
  surplus: number,
  savingsRate: number,
  investmentRate: number,
): ProjectionPoint[] {
  return PROJECTION_HORIZONS.map((years) => ({
    years,
    savingsValue: compoundGrowth(surplus, savingsRate, years),
    investmentValue: compoundGrowth(surplus, investmentRate, years),
  }))
}

/** Compound annual growth rate between two prices `years` apart. */
export function calculateCagr(
  startPrice: number,
  endPrice: number,
  years: number,
): number {
  if (startPrice <= 0 || endPrice <= 0 || years <= 0) {
    return 0
  }

  return Math.pow(endPrice / startPrice, 1 / years) - 1
}

import '@tanstack/react-start/server-only'

import { getPrisma } from './db.js'
import { getMonthFinanceData } from './finance.server.js'
import {
  buildMockMonthlySeries,
  fetchAlphaVantageMonthlySeries,
  getAlphaVantageApiKey,
} from './lib/market-data.js'
import {
  BENCHMARK_TRAILING_YEARS,
  buildProjections,
  calculateCagr,
} from './lib/projection-data.js'
import type {
  AppSettingsData,
  AppSettingsUpdate,
  ProjectionData,
} from './projection.types.js'

async function getOrCreateSettings() {
  const prisma = getPrisma()
  const existing = await prisma.appSettings.findFirst()

  if (existing) {
    return existing
  }

  return prisma.appSettings.create({ data: {} })
}

async function getBenchmarkAnnualReturn(
  symbol: string,
  refreshHours: number,
): Promise<{ annualReturn: number; asOf: string; usingLiveData: boolean }> {
  const prisma = getPrisma()
  const cached = await prisma.benchmarkRateCache.findUnique({
    where: { symbol },
  })
  const refreshMs = Math.max(1, refreshHours) * 60 * 60 * 1000
  const usingLiveData = Boolean(getAlphaVantageApiKey())

  if (cached && Date.now() - cached.fetchedAt.getTime() < refreshMs) {
    return {
      annualReturn: cached.annualReturn,
      asOf: cached.asOf,
      usingLiveData,
    }
  }

  const apiKey = getAlphaVantageApiKey()
  let series: Array<{ date: string; close: number }> | undefined

  if (apiKey) {
    try {
      series = await fetchAlphaVantageMonthlySeries(symbol, apiKey)
    } catch {
      series = undefined
    }
  }

  const resolved =
    series ?? buildMockMonthlySeries(symbol, BENCHMARK_TRAILING_YEARS)
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - BENCHMARK_TRAILING_YEARS)
  const trailing = resolved.filter(
    (point) => new Date(`${point.date}T12:00:00`) >= cutoff,
  )
  const windowed = trailing.length > 1 ? trailing : resolved
  const start = windowed[0]
  const end = windowed[windowed.length - 1]
  const annualReturn = calculateCagr(
    start.close,
    end.close,
    BENCHMARK_TRAILING_YEARS,
  )
  const asOf = end.date

  await prisma.benchmarkRateCache.upsert({
    where: { symbol },
    create: { symbol, annualReturn, asOf },
    update: { annualReturn, asOf, fetchedAt: new Date() },
  })

  return { annualReturn, asOf, usingLiveData }
}

function toSettingsData(settings: {
  benchmarkSymbol: string
  benchmarkLabel: string
  savingsRate: number
  refreshHours: number
}): AppSettingsData {
  return {
    benchmarkSymbol: settings.benchmarkSymbol,
    benchmarkLabel: settings.benchmarkLabel,
    savingsRate: settings.savingsRate,
    refreshHours: settings.refreshHours,
  }
}

export async function getProjectionDataImpl(): Promise<ProjectionData> {
  const [settingsRow, monthFinance] = await Promise.all([
    getOrCreateSettings(),
    getMonthFinanceData(),
  ])

  const settings = toSettingsData(settingsRow)
  const benchmark = await getBenchmarkAnnualReturn(
    settings.benchmarkSymbol,
    settings.refreshHours,
  )
  const surplus = monthFinance.overview.summary.net
  const projections = buildProjections(
    surplus,
    settings.savingsRate / 100,
    benchmark.annualReturn,
  )

  return {
    surplus,
    settings,
    benchmark: {
      symbol: settings.benchmarkSymbol,
      label: settings.benchmarkLabel,
      annualReturn: benchmark.annualReturn,
      asOf: benchmark.asOf,
      usingLiveData: benchmark.usingLiveData,
    },
    projections,
  }
}

export async function updateAppSettingsImpl(data: AppSettingsUpdate) {
  const existing = await getPrisma().appSettings.findFirst()

  if (existing) {
    await getPrisma().appSettings.update({
      where: { id: existing.id },
      data,
    })
  } else {
    await getPrisma().appSettings.create({ data })
  }
}

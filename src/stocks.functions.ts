import { createServerFn } from '@tanstack/react-start'

import { findCuratedStock } from './lib/stocks-data.js'
import type { StocksPageData } from './stocks.types.js'

export type { FavoriteStock, StocksPageData } from './stocks.types.js'

function requireObject(data: unknown) {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid request.')
  }

  return data as Record<string, unknown>
}

function requireSymbol(value: unknown) {
  if (typeof value !== 'string' || !findCuratedStock(value)) {
    throw new Error('Choose a stock from the watchlist.')
  }

  return value
}

function requirePositiveInt(value: unknown, label: string) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be a whole number of at least 1.`)
  }

  if (value > 1_000_000) {
    throw new Error(`${label} is too large.`)
  }

  return value
}

function requireFutureDateInput(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('Choose a target date.')
  }

  const date = new Date(`${value}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    throw new Error('Choose a valid target date.')
  }

  if (date.getTime() <= Date.now()) {
    throw new Error('Target date must be in the future.')
  }

  return value
}

export const getStocksPageData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<StocksPageData> => {
    const { getStocksPageDataImpl } = await import('./stocks.server.js')
    return getStocksPageDataImpl()
  },
)

export const toggleFavoriteStock = createServerFn({ method: 'POST' })
  .validator((data: unknown) => ({
    symbol: requireSymbol(requireObject(data).symbol),
  }))
  .handler(async ({ data }) => {
    const { toggleFavoriteStockImpl } = await import('./stocks.server.js')
    await toggleFavoriteStockImpl(data.symbol)
    return { ok: true as const }
  })

export const setStockSavingsGoal = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const input = requireObject(data)

    return {
      symbol: requireSymbol(input.symbol),
      targetShares: requirePositiveInt(input.targetShares, 'Target shares'),
      targetDate: requireFutureDateInput(input.targetDate),
    }
  })
  .handler(async ({ data }) => {
    const { setStockSavingsGoalImpl } = await import('./stocks.server.js')
    await setStockSavingsGoalImpl(data)
    return { ok: true as const }
  })

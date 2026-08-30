import { createServerFn } from '@tanstack/react-start'

import { ensureSession } from './auth.functions.js'
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
    const session = await ensureSession()
    const { getStocksPageDataImpl } = await import('./stocks.server.js')
    return getStocksPageDataImpl(session.user.id)
  },
)

export const toggleFavoriteStock = createServerFn({ method: 'POST' })
  .validator((data: unknown) => ({
    symbol: requireSymbol(requireObject(data).symbol),
  }))
  .handler(async ({ data }) => {
    const session = await ensureSession()
    const { toggleFavoriteStockImpl } = await import('./stocks.server.js')
    await toggleFavoriteStockImpl(session.user.id, data.symbol)
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
    const session = await ensureSession()
    const { setStockSavingsGoalImpl } = await import('./stocks.server.js')
    await setStockSavingsGoalImpl(session.user.id, data)
    return { ok: true as const }
  })

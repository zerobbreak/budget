import '@tanstack/react-start/server-only'

import { getPrisma } from './db.js'
import {
  buildMockDailySeries,
  fetchAlphaVantageDailySeries,
  getAlphaVantageApiKey,
  toDateInput,
} from './lib/market-data.js'
import {
  CURATED_STOCKS,
  calculateSavingsPlan,
  findCuratedStock,
  type StockPoint,
  type StockQuote,
} from './lib/stocks-data.js'
import type {
  FavoriteStock,
  StockSavingsGoalInput,
  StocksPageData,
} from './stocks.types.js'

/** In-memory cache so repeated page loads don't burn through Alpha Vantage's free-tier rate limit. */
type CacheEntry<T> = { value: T; expiresAt: number }
const SERIES_TTL_MS = 30 * 60 * 1000
const seriesCache = new Map<string, CacheEntry<StockPoint[]>>()

function readCache<T>(cache: Map<string, CacheEntry<T>>, key: string) {
  const entry = cache.get(key)
  return entry && entry.expiresAt > Date.now() ? entry.value : undefined
}

function writeCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  value: T,
  ttlMs: number,
) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs })
}

async function getStockSeries(symbol: string): Promise<StockPoint[]> {
  const cached = readCache(seriesCache, symbol)

  if (cached) {
    return cached
  }

  const apiKey = getAlphaVantageApiKey()
  let points: StockPoint[] | undefined

  if (apiKey) {
    try {
      points = await fetchAlphaVantageDailySeries(symbol, apiKey)
    } catch {
      points = undefined
    }
  }

  const resolved = points ?? buildMockDailySeries(symbol)
  writeCache(seriesCache, symbol, resolved, SERIES_TTL_MS)
  return resolved
}

function quoteFromSeries(
  symbol: string,
  name: string,
  series: StockPoint[],
): StockQuote {
  const last = series[series.length - 1]
  const previous = series[series.length - 2] ?? last
  const change = last.close - previous.close

  return {
    symbol,
    name,
    price: last.close,
    change: Math.round(change * 100) / 100,
    changePercent:
      previous.close === 0
        ? 0
        : Math.round((change / previous.close) * 10000) / 100,
  }
}

export async function getStocksPageDataImpl(
  userId: string,
): Promise<StocksPageData> {
  const rows = await getPrisma().stockFavorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })
  const favoriteSymbols = new Set(rows.map((row) => row.symbol))

  const favorites = await Promise.all(
    rows.map(async (row): Promise<FavoriteStock> => {
      const meta = findCuratedStock(row.symbol)
      const name = meta?.name ?? row.symbol
      const series = await getStockSeries(row.symbol)
      const quote = quoteFromSeries(row.symbol, name, series)
      const goal =
        row.targetShares && row.targetDate
          ? {
              targetShares: row.targetShares,
              targetDate: toDateInput(row.targetDate),
            }
          : null
      const savingsPlan = goal
        ? calculateSavingsPlan({
            targetShares: goal.targetShares,
            targetDate: goal.targetDate,
            price: quote.price,
          })
        : null

      return { symbol: row.symbol, name, quote, series, goal, savingsPlan }
    }),
  )

  return {
    curated: CURATED_STOCKS.map((stock) => ({
      ...stock,
      favorited: favoriteSymbols.has(stock.symbol),
    })),
    favorites,
    usingLiveData: Boolean(getAlphaVantageApiKey()),
  }
}

export async function toggleFavoriteStockImpl(userId: string, symbol: string) {
  const prisma = getPrisma()
  const existing = await prisma.stockFavorite.findUnique({
    where: { userId_symbol: { userId, symbol } },
  })

  if (existing) {
    await prisma.stockFavorite.delete({ where: { id: existing.id, userId } })
  } else {
    await prisma.stockFavorite.create({ data: { userId, symbol } })
  }
}

export async function setStockSavingsGoalImpl(
  userId: string,
  data: StockSavingsGoalInput,
) {
  await getPrisma().stockFavorite.upsert({
    where: { userId_symbol: { userId, symbol: data.symbol } },
    create: {
      userId,
      symbol: data.symbol,
      targetShares: data.targetShares,
      targetDate: new Date(`${data.targetDate}T12:00:00`),
    },
    update: {
      targetShares: data.targetShares,
      targetDate: new Date(`${data.targetDate}T12:00:00`),
    },
  })
}

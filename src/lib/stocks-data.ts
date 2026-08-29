export type CuratedStock = {
  symbol: string
  name: string
}

/** Small curated watchlist so users pick from known tickers instead of free-text search. */
export const CURATED_STOCKS: CuratedStock[] = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'NVDA', name: 'Nvidia' },
  { symbol: 'META', name: 'Meta Platforms' },
  { symbol: 'NFLX', name: 'Netflix' },
  { symbol: 'DIS', name: 'Disney' },
  { symbol: 'JPM', name: 'JPMorgan Chase' },
]

export function findCuratedStock(symbol: string) {
  return CURATED_STOCKS.find((stock) => stock.symbol === symbol)
}

export type { PricePoint as StockPoint } from './market-data.js'

export type StockQuote = {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

export type SavingsPlan = {
  targetShares: number
  targetDate: string
  targetCost: number
  monthsRemaining: number
  monthlySavings: number
  onTrack: boolean
}

/** Whole months between now and a target date, floored to at least 1 so the math never divides by zero. */
export function monthsUntil(targetDate: Date, from = new Date()): number {
  const months =
    (targetDate.getFullYear() - from.getFullYear()) * 12 +
    (targetDate.getMonth() - from.getMonth()) -
    (targetDate.getDate() < from.getDate() ? 1 : 0)

  return Math.max(1, months)
}

export function calculateSavingsPlan({
  targetShares,
  targetDate,
  price,
}: {
  targetShares: number
  targetDate: string
  price: number
}): SavingsPlan {
  const parsedDate = new Date(`${targetDate}T12:00:00`)
  const monthsRemaining = monthsUntil(parsedDate)
  const targetCost = targetShares * price
  const monthlySavings = targetCost / monthsRemaining

  return {
    targetShares,
    targetDate,
    targetCost,
    monthsRemaining,
    monthlySavings,
    onTrack: parsedDate.getTime() > Date.now(),
  }
}

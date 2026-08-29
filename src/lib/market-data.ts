export type PricePoint = {
  date: string
  close: number
}

export function getAlphaVantageApiKey() {
  const key = process.env.ALPHA_VANTAGE_API_KEY?.trim()
  return key && key.length > 0 ? key : undefined
}

export function toDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/** Deterministic pseudo-random generator so mock prices stay stable across requests for the same symbol. */
export function seededRandom(seed: string) {
  let state = 0

  for (let i = 0; i < seed.length; i++) {
    state = (state * 31 + seed.charCodeAt(i)) >>> 0
  }

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0xffffffff
  }
}

/** ~60 trading days of simulated daily closes, used when no API key is configured or a fetch fails. */
export function buildMockDailySeries(symbol: string): PricePoint[] {
  const random = seededRandom(symbol)
  const days = 60
  const now = new Date()
  const points: PricePoint[] = []
  let price = 40 + random() * 400

  for (let offset = days; offset >= 0; offset--) {
    const date = new Date(now)
    date.setDate(date.getDate() - offset)
    price = Math.max(1, price + (random() - 0.48) * price * 0.025)
    points.push({ date: toDateInput(date), close: Math.round(price * 100) / 100 })
  }

  return points
}

/** Simulated month-end closes for `years` years, used as a benchmark fallback when no API key is configured. */
export function buildMockMonthlySeries(
  symbol: string,
  years: number,
): PricePoint[] {
  const random = seededRandom(`${symbol}-monthly`)
  const months = years * 12
  const now = new Date()
  const points: PricePoint[] = []
  // Slight upward drift so the mock benchmark looks like a plausible index fund.
  let price = 100

  for (let offset = months; offset >= 0; offset--) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    price = Math.max(1, price * (1 + 0.006 + (random() - 0.5) * 0.05))
    points.push({ date: toDateInput(date), close: Math.round(price * 100) / 100 })
  }

  return points
}

export async function fetchAlphaVantageDailySeries(
  symbol: string,
  apiKey: string,
): Promise<PricePoint[] | undefined> {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&outputsize=compact&apikey=${apiKey}`
  const response = await fetch(url)

  if (!response.ok) {
    return undefined
  }

  const json = (await response.json()) as Record<string, unknown>
  const series = json['Time Series (Daily)'] as
    | Record<string, { '4. close': string }>
    | undefined

  if (!series) {
    return undefined
  }

  const points = Object.entries(series)
    .map(([date, values]) => ({ date, close: Number(values['4. close']) }))
    .filter((point) => Number.isFinite(point.close))
    .sort((a, b) => a.date.localeCompare(b.date))

  return points.length > 1 ? points.slice(-60) : undefined
}

export async function fetchAlphaVantageMonthlySeries(
  symbol: string,
  apiKey: string,
): Promise<PricePoint[] | undefined> {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`
  const response = await fetch(url)

  if (!response.ok) {
    return undefined
  }

  const json = (await response.json()) as Record<string, unknown>
  const series = json['Monthly Adjusted Time Series'] as
    | Record<string, { '5. adjusted close': string }>
    | undefined

  if (!series) {
    return undefined
  }

  const points = Object.entries(series)
    .map(([date, values]) => ({
      date,
      close: Number(values['5. adjusted close']),
    }))
    .filter((point) => Number.isFinite(point.close))
    .sort((a, b) => a.date.localeCompare(b.date))

  return points.length > 1 ? points : undefined
}

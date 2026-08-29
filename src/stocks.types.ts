import type { SavingsPlan, StockPoint, StockQuote } from './lib/stocks-data.js'

export type FavoriteStock = {
  symbol: string
  name: string
  quote: StockQuote
  series: StockPoint[]
  goal: { targetShares: number; targetDate: string } | null
  savingsPlan: SavingsPlan | null
}

export type StocksPageData = {
  curated: Array<{ symbol: string; name: string; favorited: boolean }>
  favorites: FavoriteStock[]
  usingLiveData: boolean
}

export type StockSavingsGoalInput = {
  symbol: string
  targetShares: number
  targetDate: string
}

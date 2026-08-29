-- CreateTable
CREATE TABLE "AppSettings" (
    "id" SERIAL NOT NULL,
    "benchmarkSymbol" TEXT NOT NULL DEFAULT 'SPY',
    "benchmarkLabel" TEXT NOT NULL DEFAULT 'S&P 500 (SPY)',
    "savingsRate" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "refreshHours" INTEGER NOT NULL DEFAULT 168,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenchmarkRateCache" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "annualReturn" DOUBLE PRECISION NOT NULL,
    "asOf" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BenchmarkRateCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BenchmarkRateCache_symbol_key" ON "BenchmarkRateCache"("symbol");

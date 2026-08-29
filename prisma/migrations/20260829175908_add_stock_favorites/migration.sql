-- CreateTable
CREATE TABLE "StockFavorite" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "targetShares" INTEGER,
    "targetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockFavorite_symbol_key" ON "StockFavorite"("symbol");

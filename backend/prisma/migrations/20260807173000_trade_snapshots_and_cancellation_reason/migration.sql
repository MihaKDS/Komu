-- AlterTable
ALTER TABLE "Trade"
ADD COLUMN "cancelledReason" TEXT;

-- AlterTable
ALTER TABLE "TradeItem"
ADD COLUMN "agreedPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;

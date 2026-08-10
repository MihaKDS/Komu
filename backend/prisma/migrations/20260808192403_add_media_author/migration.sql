-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "author" TEXT,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "releaseYear" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TradeItem" ALTER COLUMN "agreedPrice" DROP DEFAULT;

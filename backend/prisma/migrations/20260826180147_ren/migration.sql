/*
  Warnings:

  - The values [REJECTED] on the enum `TradeStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `deposit` on the `BoxSet` table. All the data in the column will be lost.
  - You are about to drop the column `rentPrice` on the `BoxSet` table. All the data in the column will be lost.
  - You are about to drop the column `deposit` on the `Copy` table. All the data in the column will be lost.
  - You are about to drop the column `rentPrice` on the `Copy` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TradeStatus_new" AS ENUM ('REQUESTED', 'ACCEPTED', 'CANCELLED', 'RENTING', 'COMPLETED');
ALTER TABLE "public"."Trade" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Trade" ALTER COLUMN "status" TYPE "TradeStatus_new" USING ("status"::text::"TradeStatus_new");
ALTER TYPE "TradeStatus" RENAME TO "TradeStatus_old";
ALTER TYPE "TradeStatus_new" RENAME TO "TradeStatus";
DROP TYPE "public"."TradeStatus_old";
ALTER TABLE "Trade" ALTER COLUMN "status" SET DEFAULT 'REQUESTED';
COMMIT;

-- AlterTable
ALTER TABLE "BoxSet" DROP COLUMN "deposit",
DROP COLUMN "rentPrice";

-- AlterTable
ALTER TABLE "Copy" DROP COLUMN "deposit",
DROP COLUMN "rentPrice";

-- AlterTable
ALTER TABLE "TradeItem" ADD COLUMN     "sellerAccepted" BOOLEAN NOT NULL DEFAULT true;

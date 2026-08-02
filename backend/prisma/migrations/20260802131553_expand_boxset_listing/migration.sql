/*
  Warnings:

  - Added the required column `updatedAt` to the `BoxSet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BoxSet" ADD COLUMN     "canRent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canSell" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deposit" DOUBLE PRECISION,
ADD COLUMN     "listingNote" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "rentPrice" DOUBLE PRECISION,
ADD COLUMN     "sellPrice" DOUBLE PRECISION,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

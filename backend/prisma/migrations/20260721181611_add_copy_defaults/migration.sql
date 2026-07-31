/*
  Warnings:

  - You are about to drop the column `contents` on the `Copy` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Copy` table. All the data in the column will be lost.
  - You are about to drop the column `deposit` on the `Copy` table. All the data in the column will be lost.
  - You are about to drop the column `rentPrice` on the `Copy` table. All the data in the column will be lost.
  - You are about to drop the column `sellPrice` on the `Copy` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Copy` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Copy" DROP COLUMN "contents",
DROP COLUMN "createdAt",
DROP COLUMN "deposit",
DROP COLUMN "rentPrice",
DROP COLUMN "sellPrice",
DROP COLUMN "updatedAt",
ALTER COLUMN "condition" SET DEFAULT 'MINT';

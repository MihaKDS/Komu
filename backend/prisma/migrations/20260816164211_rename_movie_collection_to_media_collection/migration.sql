/*
  Warnings:

  - You are about to drop the column `movieCollectionId` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the `MovieCollection` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Media" DROP CONSTRAINT "Media_movieCollectionId_fkey";

-- AlterTable
ALTER TABLE "Media" DROP COLUMN "movieCollectionId",
ADD COLUMN     "mediaCollectionId" INTEGER;

-- DropTable
DROP TABLE "MovieCollection";

-- CreateTable
CREATE TABLE "MediaCollection" (
    "id" SERIAL NOT NULL,
    "tmdbId" INTEGER,
    "title" TEXT NOT NULL,
    "overview" TEXT,
    "poster" TEXT,
    "category" "Category" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaCollection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaCollection_tmdbId_key" ON "MediaCollection"("tmdbId");

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_mediaCollectionId_fkey" FOREIGN KEY ("mediaCollectionId") REFERENCES "MediaCollection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

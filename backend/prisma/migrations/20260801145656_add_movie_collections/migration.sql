-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "collectionPosition" INTEGER,
ADD COLUMN     "movieCollectionId" INTEGER;

-- CreateTable
CREATE TABLE "MovieCollection" (
    "id" SERIAL NOT NULL,
    "tmdbId" INTEGER,
    "title" TEXT NOT NULL,
    "overview" TEXT,
    "poster" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovieCollection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MovieCollection_tmdbId_key" ON "MovieCollection"("tmdbId");

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_movieCollectionId_fkey" FOREIGN KEY ("movieCollectionId") REFERENCES "MovieCollection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

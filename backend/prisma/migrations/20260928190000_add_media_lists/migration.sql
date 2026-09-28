CREATE TYPE "ListStatus" AS ENUM (
    'WISHLIST',
    'TO_WATCH',
    'WATCHING',
    'COMPLETED'
);

CREATE TABLE "Lists" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "mediaId" INTEGER NOT NULL,
    "status" "ListStatus" NOT NULL,
    "progress" INTEGER,
    "note" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lists_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Lists_userId_mediaId_key" ON "Lists"("userId", "mediaId");
CREATE INDEX "Lists_userId_status_idx" ON "Lists"("userId", "status");

ALTER TABLE "Lists" ADD CONSTRAINT "Lists_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lists" ADD CONSTRAINT "Lists_mediaId_fkey"
    FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

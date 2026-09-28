CREATE TYPE "ShareDuration" AS ENUM (
    'ONE_HOUR',
    'ONE_DAY',
    'SEVEN_DAYS',
    'THIRTY_DAYS'
);

CREATE TABLE "CollectionShare" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "duration" "ShareDuration" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionShare_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CollectionShare_userId_key" ON "CollectionShare"("userId");
CREATE UNIQUE INDEX "CollectionShare_token_key" ON "CollectionShare"("token");

ALTER TABLE "CollectionShare" ADD CONSTRAINT "CollectionShare_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
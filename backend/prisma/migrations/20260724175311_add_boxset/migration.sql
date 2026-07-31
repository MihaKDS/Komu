-- AlterTable
ALTER TABLE "Copy" ADD COLUMN     "boxSetId" INTEGER,
ADD COLUMN     "includesBluRay" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "BoxSet" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoxSet_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Copy" ADD CONSTRAINT "Copy_boxSetId_fkey" FOREIGN KEY ("boxSetId") REFERENCES "BoxSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

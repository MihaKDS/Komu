-- CreateEnum
CREATE TYPE "MediaApprovalStatus" AS ENUM ('PENDING', 'APPROVED');

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY[]::TEXT[];

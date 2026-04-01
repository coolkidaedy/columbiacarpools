-- CreateEnum
CREATE TYPE "PreferredCommunication" AS ENUM ('EMAIL', 'PHONE', 'BOTH');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "preferredCommunication" "PreferredCommunication";

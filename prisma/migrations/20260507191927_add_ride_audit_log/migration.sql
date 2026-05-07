-- CreateEnum
CREATE TYPE "RideAuditAction" AS ENUM ('CREATED', 'UPDATED', 'DELETED');

-- CreateTable
CREATE TABLE "RideAuditLog" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "action" "RideAuditAction" NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RideAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RideAuditLog_rideId_createdAt_idx" ON "RideAuditLog"("rideId", "createdAt");

-- CreateIndex
CREATE INDEX "RideAuditLog_action_createdAt_idx" ON "RideAuditLog"("action", "createdAt");

/*
  Warnings:

  - A unique constraint covering the columns `[secretKey]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "UserRegistrationStepEnum" ADD VALUE 'PENDING_AUTHENTICATION';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "secretKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_secretKey_key" ON "User"("secretKey");

/*
  Warnings:

  - You are about to drop the column `lastResetCode` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "lastResetCode",
ADD COLUMN     "signupCode" TEXT;

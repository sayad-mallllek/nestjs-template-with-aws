-- CreateEnum
CREATE TYPE "IdentityProviderEnum" AS ENUM ('COGNITO', 'FACEBOOK', 'INSTAGRAM', 'APPLE', 'GOOGLE');

-- CreateEnum
CREATE TYPE "UserRegistrationStepEnum" AS ENUM ('PENDING_CONFIRMATION', 'DONE');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "sub" TEXT NOT NULL,
    "registrationStep" "UserRegistrationStepEnum" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_sub_key" ON "User"("sub");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

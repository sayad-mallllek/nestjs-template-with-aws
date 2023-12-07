-- CreateEnum
CREATE TYPE "IdentityProviderEnum" AS ENUM ('COGNITO', 'FACEBOOK', 'APPLE', 'GOOGLE');

-- CreateEnum
CREATE TYPE "UserRegistrationStepEnum" AS ENUM ('PENDING_CONFIRMATION', 'DONE');

-- CreateTable
CREATE TABLE "IdentityProvider" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "sub" TEXT NOT NULL,
    "provider" "IdentityProviderEnum" NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "IdentityProvider_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "IdentityProvider_sub_key" ON "IdentityProvider"("sub");

-- CreateIndex
CREATE UNIQUE INDEX "IdentityProvider_user_id_key" ON "IdentityProvider"("user_id");

-- CreateIndex
CREATE INDEX "IdentityProvider_sub_idx" ON "IdentityProvider"("sub");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_sub_key" ON "User"("sub");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- AddForeignKey
ALTER TABLE "IdentityProvider" ADD CONSTRAINT "IdentityProvider_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

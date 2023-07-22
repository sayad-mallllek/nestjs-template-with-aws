-- CreateEnum
CREATE TYPE "UserRegistrationStepEnum" AS ENUM ('PENDING_CONFIRMATION', 'TRIAL_PERIOD', 'PENDING_PAYMENT', 'DONE');

-- AlterTable
ALTER TABLE "IdentityProvider" ADD COLUMN     "registrationStep" "UserRegistrationStepEnum" NOT NULL DEFAULT 'PENDING_CONFIRMATION';

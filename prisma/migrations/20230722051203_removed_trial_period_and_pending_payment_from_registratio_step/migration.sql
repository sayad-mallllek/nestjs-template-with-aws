/*
  Warnings:

  - The values [TRIAL_PERIOD,PENDING_PAYMENT] on the enum `UserRegistrationStepEnum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRegistrationStepEnum_new" AS ENUM ('PENDING_CONFIRMATION', 'DONE');
ALTER TABLE "IdentityProvider" ALTER COLUMN "registrationStep" DROP DEFAULT;
ALTER TABLE "IdentityProvider" ALTER COLUMN "registrationStep" TYPE "UserRegistrationStepEnum_new" USING ("registrationStep"::text::"UserRegistrationStepEnum_new");
ALTER TYPE "UserRegistrationStepEnum" RENAME TO "UserRegistrationStepEnum_old";
ALTER TYPE "UserRegistrationStepEnum_new" RENAME TO "UserRegistrationStepEnum";
DROP TYPE "UserRegistrationStepEnum_old";
ALTER TABLE "IdentityProvider" ALTER COLUMN "registrationStep" SET DEFAULT 'PENDING_CONFIRMATION';
COMMIT;

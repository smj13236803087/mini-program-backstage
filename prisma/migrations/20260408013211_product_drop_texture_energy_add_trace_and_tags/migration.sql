/*
  Warnings:

  - You are about to drop the column `energyScience` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `texture` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Product` DROP COLUMN `energyScience`,
    DROP COLUMN `texture`,
    ADD COLUMN `chakra` VARCHAR(191) NULL,
    ADD COLUMN `classicSixDimensions` TEXT NULL,
    ADD COLUMN `constellation` VARCHAR(191) NULL,
    ADD COLUMN `coreEnergyTag` TEXT NULL,
    ADD COLUMN `fiveElements` VARCHAR(191) NULL,
    ADD COLUMN `materialTrace` TEXT NULL,
    ADD COLUMN `mineVeinTrace` TEXT NULL,
    ADD COLUMN `visualFeatures` TEXT NULL,
    ADD COLUMN `zodiac` VARCHAR(191) NULL;

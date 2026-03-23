/*
  Warnings:

  - You are about to drop the column `energy_tags` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `images` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `productType` on the `Product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[materialCode]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Product` DROP COLUMN `energy_tags`,
    DROP COLUMN `images`,
    DROP COLUMN `productType`,
    ADD COLUMN `colorSeries` VARCHAR(191) NULL,
    ADD COLUMN `energyScience` LONGTEXT NULL,
    ADD COLUMN `majorCategory` VARCHAR(191) NULL,
    ADD COLUMN `materialCode` VARCHAR(191) NULL,
    ADD COLUMN `productGender` VARCHAR(191) NULL,
    ADD COLUMN `texture` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Product_materialCode_key` ON `Product`(`materialCode`);

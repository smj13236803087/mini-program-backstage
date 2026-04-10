/*
  Warnings:

  - You are about to drop the column `chakra` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `classicSixDimensions` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `colorSeries` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `constellation` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `coreEnergyTag` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `fiveElements` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `materialTrace` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `mineVeinTrace` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `productGender` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `visualFeatures` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `zodiac` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Product` DROP COLUMN `chakra`,
    DROP COLUMN `classicSixDimensions`,
    DROP COLUMN `colorSeries`,
    DROP COLUMN `constellation`,
    DROP COLUMN `coreEnergyTag`,
    DROP COLUMN `fiveElements`,
    DROP COLUMN `imageUrl`,
    DROP COLUMN `materialTrace`,
    DROP COLUMN `mineVeinTrace`,
    DROP COLUMN `productGender`,
    DROP COLUMN `title`,
    DROP COLUMN `visualFeatures`,
    DROP COLUMN `zodiac`,
    ADD COLUMN `atlasId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `product_atlas` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `majorCategory` VARCHAR(191) NULL,
    `colorSeries` VARCHAR(191) NULL,
    `coreEnergyTag` TEXT NULL,
    `mineVeinTrace` TEXT NULL,
    `materialTrace` TEXT NULL,
    `visualFeatures` TEXT NULL,
    `classicSixDimensions` TEXT NULL,
    `zodiac` VARCHAR(191) NULL,
    `fiveElements` VARCHAR(191) NULL,
    `constellation` VARCHAR(191) NULL,
    `chakra` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `product_atlas_title_idx`(`title`),
    INDEX `product_atlas_majorCategory_idx`(`majorCategory`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Product_atlasId_idx` ON `Product`(`atlasId`);

-- CreateIndex
CREATE INDEX `Product_majorCategory_idx` ON `Product`(`majorCategory`);

-- CreateIndex
CREATE INDEX `Product_diameter_idx` ON `Product`(`diameter`);

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_atlasId_fkey` FOREIGN KEY (`atlasId`) REFERENCES `product_atlas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the `product_six_dimensions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `product_six_dimensions` DROP FOREIGN KEY `product_six_dimensions_productId_fkey`;

-- DropTable
DROP TABLE `product_six_dimensions`;

-- CreateTable
CREATE TABLE `atlas_six_dimensions` (
    `id` VARCHAR(191) NOT NULL,
    `atlasId` VARCHAR(191) NOT NULL,
    `love` DECIMAL(5, 4) NULL,
    `wealth` DECIMAL(5, 4) NULL,
    `career` DECIMAL(5, 4) NULL,
    `focus` DECIMAL(5, 4) NULL,
    `emotion` DECIMAL(5, 4) NULL,
    `protection` DECIMAL(5, 4) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `atlas_six_dimensions_atlasId_key`(`atlasId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `atlas_six_dimensions` ADD CONSTRAINT `atlas_six_dimensions_atlasId_fkey` FOREIGN KEY (`atlasId`) REFERENCES `product_atlas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

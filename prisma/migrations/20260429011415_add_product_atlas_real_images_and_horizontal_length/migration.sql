-- AlterTable
ALTER TABLE `Product` ADD COLUMN `horizontalLength` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `product_atlas` ADD COLUMN `realImages` JSON NULL;

-- AlterTable
ALTER TABLE `Product` ADD COLUMN `productType` ENUM('BEAD', 'PENDANT', 'SPACER') NOT NULL DEFAULT 'BEAD';

-- CreateIndex
CREATE INDEX `Product_productType_idx` ON `Product`(`productType`);

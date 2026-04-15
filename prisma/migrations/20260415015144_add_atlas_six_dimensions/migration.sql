-- CreateTable
CREATE TABLE `product_six_dimensions` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `love` DECIMAL(5, 4) NULL,
    `wealth` DECIMAL(5, 4) NULL,
    `career` DECIMAL(5, 4) NULL,
    `focus` DECIMAL(5, 4) NULL,
    `emotion` DECIMAL(5, 4) NULL,
    `protection` DECIMAL(5, 4) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `product_six_dimensions_productId_key`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `product_six_dimensions` ADD CONSTRAINT `product_six_dimensions_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

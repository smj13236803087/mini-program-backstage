-- CreateTable
CREATE TABLE `bracelet_designs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `totalPrice` DOUBLE NOT NULL,
    `totalWeight` DOUBLE NULL,
    `averageDiameter` DOUBLE NULL,
    `wristSize` DOUBLE NULL,
    `wearingStyle` VARCHAR(191) NULL,
    `items` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `bracelet_designs_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bracelet_designs` ADD CONSTRAINT `bracelet_designs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

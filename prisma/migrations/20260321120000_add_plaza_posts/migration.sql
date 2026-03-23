-- CreateTable
CREATE TABLE `plaza_posts` (
    `id` VARCHAR(191) NOT NULL,
    `braceletDesignId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `snapshot` JSON NOT NULL,
    `adoptCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `plaza_posts_braceletDesignId_key`(`braceletDesignId`),
    INDEX `plaza_posts_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `plaza_posts` ADD CONSTRAINT `plaza_posts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

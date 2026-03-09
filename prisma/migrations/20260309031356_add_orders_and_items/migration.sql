/*
  Warnings:

  - You are about to alter the column `signature` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(500)` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `order_items` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `orders` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `users` MODIFY `signature` VARCHAR(191) NULL,
    MODIFY `phone` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

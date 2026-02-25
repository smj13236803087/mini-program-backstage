/*
  Warnings:

  - You are about to drop the column `shopifyCustomerId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `shopifyEmail` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `users_shopifyCustomerId_key` ON `users`;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `shopifyCustomerId`,
    DROP COLUMN `shopifyEmail`;

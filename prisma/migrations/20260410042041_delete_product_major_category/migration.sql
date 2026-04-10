/*
  Warnings:

  - You are about to drop the column `majorCategory` on the `Product` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Product_majorCategory_idx` ON `Product`;

-- AlterTable
ALTER TABLE `Product` DROP COLUMN `majorCategory`;

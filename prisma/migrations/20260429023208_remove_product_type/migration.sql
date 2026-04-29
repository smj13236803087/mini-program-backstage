/*
  Warnings:

  - You are about to drop the column `productType` on the `Product` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Product_productType_idx` ON `Product`;

-- AlterTable
ALTER TABLE `Product` DROP COLUMN `productType`;

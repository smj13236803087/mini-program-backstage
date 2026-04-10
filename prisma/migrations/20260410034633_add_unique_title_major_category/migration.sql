/*
  Warnings:

  - A unique constraint covering the columns `[title,majorCategory]` on the table `product_atlas` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `product_atlas_title_majorCategory_key` ON `product_atlas`(`title`, `majorCategory`);

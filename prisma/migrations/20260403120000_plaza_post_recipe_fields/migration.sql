-- AlterTable
ALTER TABLE `plaza_posts` ADD COLUMN `recipeName` VARCHAR(120) NULL,
ADD COLUMN `recipePhilosophy` TEXT NULL,
ADD COLUMN `recipeTags` JSON NULL;

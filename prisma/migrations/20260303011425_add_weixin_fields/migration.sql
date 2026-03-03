/*
  Warnings:

  - A unique constraint covering the columns `[weixin_openid]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `avatar` VARCHAR(191) NULL,
    ADD COLUMN `gender` INTEGER NULL,
    ADD COLUMN `last_login_ip` VARCHAR(191) NULL,
    ADD COLUMN `last_login_time` INTEGER NULL,
    ADD COLUMN `nickname` VARCHAR(191) NULL,
    ADD COLUMN `register_ip` VARCHAR(191) NULL,
    ADD COLUMN `register_time` INTEGER NULL,
    ADD COLUMN `weixin_openid` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_weixin_openid_key` ON `users`(`weixin_openid`);

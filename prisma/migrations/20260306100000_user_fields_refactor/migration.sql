-- 删除 User 表中不再使用的字段，添加 signature 和 phone
-- 1. 添加新字段
ALTER TABLE `users` ADD COLUMN `signature` VARCHAR(500) NULL;
ALTER TABLE `users` ADD COLUMN `phone` VARCHAR(20) NULL;

-- 2. 删除旧字段
ALTER TABLE `users` DROP COLUMN `email`;
ALTER TABLE `users` DROP COLUMN `password`;
ALTER TABLE `users` DROP COLUMN `name`;
ALTER TABLE `users` DROP COLUMN `register_ip`;
ALTER TABLE `users` DROP COLUMN `last_login_time`;
ALTER TABLE `users` DROP COLUMN `last_login_ip`;

-- 添加生日和手机号验证状态字段
ALTER TABLE `users` ADD COLUMN `birthday` DATETIME(3) NULL;
ALTER TABLE `users` ADD COLUMN `phone_verified` BOOLEAN NOT NULL DEFAULT false;

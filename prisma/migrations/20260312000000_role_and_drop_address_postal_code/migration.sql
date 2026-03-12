-- 1) users: add role enum (migrate from isAdmin)
ALTER TABLE `users`
  ADD COLUMN `role` ENUM('SUPER_ADMIN', 'ADMIN', 'USER') NOT NULL DEFAULT 'USER';

-- existing admins -> SUPER_ADMIN (your requirement: register defaults to super admin)
UPDATE `users` SET `role` = 'SUPER_ADMIN' WHERE `isAdmin` = TRUE;

-- drop old flag
ALTER TABLE `users` DROP COLUMN `isAdmin`;

-- 2) addresses: drop postalCode (no longer needed)
ALTER TABLE `addresses` DROP COLUMN `postalCode`;


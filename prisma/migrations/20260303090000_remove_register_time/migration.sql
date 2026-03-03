-- Remove legacy register_time column (createdAt already exists)
ALTER TABLE `users` DROP COLUMN `register_time`;


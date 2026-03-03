-- Convert users.last_login_time from INTEGER (unix seconds) to DATETIME
-- 1) add temp datetime column
ALTER TABLE `users` ADD COLUMN `last_login_time_dt` DATETIME NULL;

-- 2) backfill temp column from unix seconds
UPDATE `users`
SET `last_login_time_dt` = FROM_UNIXTIME(`last_login_time`)
WHERE `last_login_time` IS NOT NULL;

-- 3) drop old integer column
ALTER TABLE `users` DROP COLUMN `last_login_time`;

-- 4) rename temp column to last_login_time
ALTER TABLE `users` CHANGE COLUMN `last_login_time_dt` `last_login_time` DATETIME NULL;


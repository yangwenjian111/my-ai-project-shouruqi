-- 更新 demo_user 密码哈希为 abc123456 的正确 bcrypt 值
USE `daily_finance`;
UPDATE `users` SET `password_hash` = '$2a$10$PyL0feqO03T4R7w8JXw7L.1kUDnoXm7F3lUcWx4N.mTg2dT0xrYgS' WHERE `username` = 'demo_user';

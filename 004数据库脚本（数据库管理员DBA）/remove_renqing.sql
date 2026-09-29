USE `daily_finance`;

-- 将人情分类的账单转移到"其他"（id=9）
UPDATE `transactions` SET `category_id` = 9, `category_name` = '其他' WHERE `category_id` = 8;

-- 删除人情分类
DELETE FROM `categories` WHERE `id` = 8;

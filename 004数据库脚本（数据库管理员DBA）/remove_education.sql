USE `daily_finance`;

-- 将教育分类的账单转移到"其他"（id=9）
UPDATE `transactions` SET `category_id` = 9, `category_name` = '其他' WHERE `category_id` = 7;

-- 删除教育分类
DELETE FROM `categories` WHERE `id` = 7;

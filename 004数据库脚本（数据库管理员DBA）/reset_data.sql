-- 清空所有业务数据，保留表结构
USE `daily_finance`;

SET FOREIGN_KEY_CHECKS = 0;

-- 按外键依赖顺序删除（TRUNCATE 自动重置自增ID）
TRUNCATE TABLE `transactions`;
TRUNCATE TABLE `reserve_funds`;
TRUNCATE TABLE `budgets`;
TRUNCATE TABLE `user_preferences`;
TRUNCATE TABLE `categories`;
TRUNCATE TABLE `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- 重新插入系统预设分类（支出）
INSERT INTO `categories` (`user_id`, `type`, `name`, `icon`, `color`, `bg_color`, `sort_order`, `is_default`) VALUES
(NULL, 'expense', '餐饮', '🍜', '#E8849E', '#FDDDE6',  1, 1),
(NULL, 'expense', '交通', '🚗', '#C9B8E6', '#E8DFF5',  2, 1),
(NULL, 'expense', '购物', '🛒', '#FFD6A5', '#FFE5C2',  3, 1),
(NULL, 'expense', '娱乐', '🎮', '#B8E6D0', '#D5F5E8',  4, 1),
(NULL, 'expense', '居住', '🏠', '#F2A6C0', '#FDDDE6',  5, 1),
(NULL, 'expense', '医疗', '💊', '#A8D8EA', '#D5EEF5',  6, 1),
(NULL, 'expense', '通讯', '📱', '#FFD6A5', '#FFE5C2',  7, 1),
(NULL, 'expense', '其他', '📌', '#9C8578', '#F2E8E0',  8, 1);

-- 重新插入系统预设储备金分类
INSERT INTO `categories` (`user_id`, `type`, `name`, `icon`, `color`, `bg_color`, `sort_order`, `is_default`) VALUES
(NULL, 'reserve', '工资', '💰', '#7BC89C', '#D5F5E8', 1, 1),
(NULL, 'reserve', '兼职', '💼', '#B8E6D0', '#D5F5E8', 2, 1),
(NULL, 'reserve', '理财', '📈', '#FFD6A5', '#FFE5C2', 3, 1),
(NULL, 'reserve', '其他', '📌', '#9C8578', '#F2E8E0', 4, 1);

-- 重新插入演示用户（密码 abc123456）
INSERT INTO `users` (`id`, `username`, `password_hash`, `nickname`, `avatar`) VALUES
(1, 'demo_user', '$2a$10$PyL0feqO03T4R7w8JXw7L.1kUDnoXm7F3lUcWx4N.mTg2dT0xrYgS', '记账达人', 'pink');

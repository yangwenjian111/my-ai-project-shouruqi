-- V1.1 迁移脚本：新增储备金表，修改 income → reserve
USE `daily_finance`;

-- 1. 新增储备金表
DROP TABLE IF EXISTS `reserve_funds`;
CREATE TABLE `reserve_funds` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '储备金ID',
  `user_id`    BIGINT UNSIGNED NOT NULL                COMMENT '所属用户ID',
  `month`      CHAR(7)         NOT NULL                COMMENT '月份，格式 YYYY-MM',
  `amount`     DECIMAL(12,2)   NOT NULL                COMMENT '储备金金额',
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_month` (`user_id`, `month`),
  CONSTRAINT `fk_reserve_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB COMMENT = '月度储备金表';

-- 2. 扩展 categories 枚举，加入 reserve
ALTER TABLE `categories` MODIFY COLUMN `type` ENUM('expense','income','reserve') NOT NULL;
-- 将 income 数据改为 reserve
UPDATE `categories` SET `type` = 'reserve' WHERE `type` = 'income';
-- 缩小枚举，移除 income
ALTER TABLE `categories` MODIFY COLUMN `type` ENUM('expense','reserve') NOT NULL COMMENT '分类类型：支出/储备金';

-- 3. 扩展 transactions 枚举，加入 reserve
ALTER TABLE `transactions` MODIFY COLUMN `type` ENUM('expense','income','reserve') NOT NULL;
-- 将 income 数据改为 reserve
UPDATE `transactions` SET `type` = 'reserve' WHERE `type` = 'income';
-- 缩小枚举，移除 income
ALTER TABLE `transactions` MODIFY COLUMN `type` ENUM('expense','reserve') NOT NULL COMMENT '类型：支出/储备金';

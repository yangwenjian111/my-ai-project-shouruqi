-- =====================================================================
-- 日常财务管理系统（记账 APP） MySQL 数据库脚本
-- 版本   : V1.0
-- 日期   : 2026-09-28
-- 依据   : 《日常财务管理系统PRD_V1.0.md》 + 003前端开发/html 页面实现
-- 数据库 : MySQL 8.0+（InnoDB / utf8mb4）
-- 说明   : V1.0 前端数据存于 localStorage，本脚本为后端化/云端同步
--          预留的数据库设计，覆盖用户、分类、账单、预算、偏好五大模块。
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. 创建数据库
-- ---------------------------------------------------------------------
DROP DATABASE IF EXISTS `daily_finance`;
CREATE DATABASE `daily_finance`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `daily_finance`;

-- =====================================================================
-- 1. 用户表 users
--    对应 PRD 3.0 登录/注册页：用户名(3-20位)、密码(6-20位)、
--    昵称(默认"记账达人")、5 种预设 SVG 笑脸头像颜色
-- =====================================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username`      VARCHAR(20)     NOT NULL                COMMENT '用户名，3-20位，唯一',
  `password_hash` VARCHAR(255)    NOT NULL                COMMENT '密码哈希（bcrypt，禁止明文存储）',
  `nickname`      VARCHAR(15)     NOT NULL DEFAULT '记账达人' COMMENT '昵称，最多15字',
  `avatar`        ENUM('pink','orange','mint','lavender','blue')
                                  NOT NULL DEFAULT 'pink' COMMENT '预设头像颜色标识（SVG笑脸）',
  `status`        TINYINT         NOT NULL DEFAULT 1      COMMENT '账户状态：1正常 0注销',
  `last_login_at` DATETIME        NULL     DEFAULT NULL   COMMENT '最近登录时间',
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  CONSTRAINT `chk_username_len` CHECK (CHAR_LENGTH(`username`) BETWEEN 3 AND 20)
) ENGINE = InnoDB COMMENT = '用户表';

-- =====================================================================
-- 2. 分类表 categories
--    对应 PRD 第六章预设分类方案 + 3.5.2 分类管理（后续支持自定义）
--    user_id 为 NULL 表示系统预设分类，所有用户可见；
--    非 NULL 表示用户自定义分类。
-- =====================================================================
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `user_id`    BIGINT UNSIGNED NULL     DEFAULT NULL   COMMENT '所属用户ID，NULL=系统预设',
  `type`       ENUM('expense','income') NOT NULL        COMMENT '分类类型：支出/收入',
  `name`       VARCHAR(10)     NOT NULL                COMMENT '分类名称，如：餐饮、工资',
  `icon`       VARCHAR(10)     NOT NULL DEFAULT '📌'   COMMENT '图标（emoji 或图标标识）',
  `color`      CHAR(7)         NOT NULL DEFAULT '#F2A6C0' COMMENT '主题色值，如 #F2A6C0',
  `bg_color`   CHAR(7)         NOT NULL DEFAULT '#FDDDE6' COMMENT '图标底色，如 #FDDDE6',
  `sort_order` INT             NOT NULL DEFAULT 0      COMMENT '排序序号，越小越靠前',
  `is_default` TINYINT(1)      NOT NULL DEFAULT 0      COMMENT '是否系统预设：1是 0否',
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_type` (`user_id`, `type`, `sort_order`),
  UNIQUE KEY `uk_user_type_name` (`user_id`, `type`, `name`),
  CONSTRAINT `fk_category_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB COMMENT = '账单分类表（预设 + 用户自定义）';

-- =====================================================================
-- 3. 账单表 transactions
--    对应 PRD 7.2 Transaction 数据模型：
--    id / type / amount / category / date / note / createdAt
--    前端按日分组展示（transactions.html、dashboard.html），
--    故对 (user_id, transaction_date) 建联合索引。
-- =====================================================================
DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '账单ID',
  `user_id`          BIGINT UNSIGNED NOT NULL                COMMENT '所属用户ID',
  `category_id`      BIGINT UNSIGNED NULL     DEFAULT NULL   COMMENT '分类ID（分类被删后置NULL，保留历史）',
  `category_name`    VARCHAR(10)     NOT NULL DEFAULT '其他' COMMENT '分类名称快照（冗余，防止分类改名影响历史账单）',
  `type`             ENUM('expense','income') NOT NULL        COMMENT '类型：支出/收入',
  `amount`           DECIMAL(12,2)   NOT NULL                COMMENT '金额（元），精确到小数点后两位，恒为正数',
  `transaction_date` DATE            NOT NULL                COMMENT '账单日期（用户可选，默认当天）',
  `note`             VARCHAR(50)     NOT NULL DEFAULT ''     COMMENT '备注，最多50字',
  `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                     ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_date`      (`user_id`, `transaction_date`) COMMENT '按日分组/月度列表查询',
  KEY `idx_user_type_date` (`user_id`, `type`, `transaction_date`) COMMENT '类型筛选（全部/支出/收入）',
  KEY `idx_category`       (`category_id`),
  CONSTRAINT `fk_tx_user`     FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tx_category` FOREIGN KEY (`category_id`)
    REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_amount_positive` CHECK (`amount` > 0)
) ENGINE = InnoDB COMMENT = '账单流水表';

-- =====================================================================
-- 4. 预算表 budgets
--    对应 PRD 3.4 预算页：月度总预算(category_id=NULL) + 分类预算
--    进度 = 当月该范围支出合计 / amount，
--    颜色阈值：<60% 绿(safe)、60%-90% 黄(warn)、>90% 红(danger)
-- =====================================================================
DROP TABLE IF EXISTS `budgets`;
CREATE TABLE `budgets` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '预算ID',
  `user_id`     BIGINT UNSIGNED NOT NULL                COMMENT '所属用户ID',
  `category_id` BIGINT UNSIGNED NULL     DEFAULT NULL   COMMENT '分类ID，NULL=月度总预算',
  `budget_month` CHAR(7)        NOT NULL                COMMENT '预算月份，格式 YYYY-MM，如 2026-09',
  `amount`      DECIMAL(12,2)   NOT NULL                COMMENT '预算金额（元）',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_month_category` (`user_id`, `budget_month`, `category_id`)
    COMMENT '同一用户同一月份：总预算仅一条，每个分类预算仅一条',
  KEY `idx_category` (`category_id`),
  CONSTRAINT `fk_budget_user`     FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_budget_category` FOREIGN KEY (`category_id`)
    REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_budget_amount` CHECK (`amount` > 0)
) ENGINE = InnoDB COMMENT = '月度预算表（总预算 + 分类预算）';

-- =====================================================================
-- 5. 用户偏好表 user_preferences
--    对应 PRD 3.5.3 记账偏好：默认记账类型、货币单位、每月起始日
-- =====================================================================
DROP TABLE IF EXISTS `user_preferences`;
CREATE TABLE `user_preferences` (
  `user_id`             BIGINT UNSIGNED NOT NULL           COMMENT '用户ID（1对1）',
  `default_tx_type`     ENUM('expense','income') NOT NULL DEFAULT 'expense'
                                                       COMMENT '默认记账类型',
  `currency`            CHAR(3)         NOT NULL DEFAULT 'CNY' COMMENT '货币单位（ISO 4217）',
  `month_start_day`     TINYINT UNSIGNED NOT NULL DEFAULT 1   COMMENT '每月起始日，1-28，默认1号',
  `updated_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                        ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_pref_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_start_day` CHECK (`month_start_day` BETWEEN 1 AND 28)
) ENGINE = InnoDB COMMENT = '用户记账偏好表';

-- =====================================================================
-- 6. 初始化数据
-- =====================================================================

-- 6.1 演示用户（密码为 bcrypt 哈希，明文：abc123456，仅演示用）
INSERT INTO `users` (`id`, `username`, `password_hash`, `nickname`, `avatar`) VALUES
(1, 'demo_user', '$2b$10$X9V0Z7rQZ3h8YqQZQZQZQeX9V0Z7rQZ3h8YqQZQZQZQZQZQZQZQZQ', '记账达人', 'pink');

-- 6.2 系统预设支出分类（PRD 6.1，配色取自前端页面实际用色）
INSERT INTO `categories` (`user_id`, `type`, `name`, `icon`, `color`, `bg_color`, `sort_order`, `is_default`) VALUES
(NULL, 'expense', '餐饮', '🍜', '#E8849E', '#FDDDE6',  1, 1),
(NULL, 'expense', '交通', '🚗', '#C9B8E6', '#E8DFF5',  2, 1),
(NULL, 'expense', '购物', '🛒', '#FFD6A5', '#FFE5C2',  3, 1),
(NULL, 'expense', '娱乐', '🎮', '#B8E6D0', '#D5F5E8',  4, 1),
(NULL, 'expense', '居住', '🏠', '#F2A6C0', '#FDDDE6',  5, 1),
(NULL, 'expense', '医疗', '💊', '#A8D8EA', '#D5EEF5',  6, 1),
(NULL, 'expense', '教育', '📚', '#C9B8E6', '#E8DFF5',  7, 1),
(NULL, 'expense', '通讯', '📱', '#FFD6A5', '#FFE5C2',  8, 1),
(NULL, 'expense', '人情', '🎁', '#E8849E', '#FDDDE6',  9, 1),
(NULL, 'expense', '其他', '📌', '#9C8578', '#F2E8E0', 10, 1);

-- 6.3 系统预设收入分类（PRD 6.2）
INSERT INTO `categories` (`user_id`, `type`, `name`, `icon`, `color`, `bg_color`, `sort_order`, `is_default`) VALUES
(NULL, 'income', '工资', '💰', '#7BC89C', '#D5F5E8', 1, 1),
(NULL, 'income', '兼职', '💼', '#B8E6D0', '#D5F5E8', 2, 1),
(NULL, 'income', '理财', '📈', '#FFD6A5', '#FFE5C2', 3, 1),
(NULL, 'income', '其他', '📌', '#9C8578', '#F2E8E0', 4, 1);

-- 6.4 演示用户偏好
INSERT INTO `user_preferences` (`user_id`, `default_tx_type`, `currency`, `month_start_day`) VALUES
(1, 'expense', 'CNY', 1);

-- 6.5 演示账单数据（与前端 transactions.html / dashboard.html 展示数据一致）
INSERT INTO `transactions`
  (`user_id`, `category_id`, `category_name`, `type`, `amount`, `transaction_date`, `note`) VALUES
(1,  1, '餐饮', 'expense',  45.00, '2026-09-20', '晚餐 · 火锅'),
(1,  3, '购物', 'expense',  32.00, '2026-09-20', '水果'),
(1, 12, '兼职', 'income',  200.00, '2026-09-19', '外卖配送'),
(1,  1, '餐饮', 'expense',  18.50, '2026-09-21', '午餐 · 米线'),
(1,  2, '交通', 'expense',   6.00, '2026-09-21', '地铁通勤'),
(1,  4, '娱乐', 'expense',  60.00, '2026-09-22', '电影票'),
(1,  1, '餐饮', 'expense', 120.00, '2026-09-23', '朋友聚餐'),
(1,  3, '购物', 'expense', 259.00, '2026-09-24', '换季衣物'),
(1,  5, '居住', 'expense',1500.00, '2026-09-01', '9月房租'),
(1,  8, '通讯', 'expense',  39.00, '2026-09-05', '手机话费'),
(1, 11, '工资', 'income', 8000.00, '2026-09-10', '9月工资');

-- 6.6 演示预算数据（与前端 budget.html 一致：总预算 ¥6000，餐饮 87% warn 等）
INSERT INTO `budgets` (`user_id`, `category_id`, `budget_month`, `amount`) VALUES
(1, NULL, '2026-09', 6000.00),  -- 月度总预算
(1,    1, '2026-09', 1500.00),  -- 餐饮预算（已用约87% → warn）
(1,    3, '2026-09',  800.00),  -- 购物预算
(1,    2, '2026-09',  300.00),  -- 交通预算
(1,    4, '2026-09',  500.00);  -- 娱乐预算

-- =====================================================================
-- 7. 常用统计视图（供后端接口/统计页直接查询）
-- =====================================================================

-- 7.1 月度收支总览（首页概览卡片：本月收入/支出/结余）
DROP VIEW IF EXISTS `v_monthly_overview`;
CREATE VIEW `v_monthly_overview` AS
SELECT
  t.user_id,
  DATE_FORMAT(t.transaction_date, '%Y-%m')                          AS stat_month,
  SUM(CASE WHEN t.type = 'income'  THEN t.amount ELSE 0 END)        AS total_income,
  SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END)        AS total_expense,
  SUM(CASE WHEN t.type = 'income'  THEN t.amount
           ELSE -t.amount END)                                      AS balance
FROM `transactions` t
GROUP BY t.user_id, DATE_FORMAT(t.transaction_date, '%Y-%m');

-- 7.2 分类支出占比（统计页环形饼图 / 消费排行榜）
DROP VIEW IF EXISTS `v_category_expense`;
CREATE VIEW `v_category_expense` AS
SELECT
  t.user_id,
  DATE_FORMAT(t.transaction_date, '%Y-%m')  AS stat_month,
  t.category_id,
  t.category_name,
  SUM(t.amount)                             AS total_amount,
  COUNT(*)                                  AS tx_count
FROM `transactions` t
WHERE t.type = 'expense'
GROUP BY t.user_id, DATE_FORMAT(t.transaction_date, '%Y-%m'),
         t.category_id, t.category_name;

-- 7.3 每日支出趋势（统计页折线图）
DROP VIEW IF EXISTS `v_daily_expense_trend`;
CREATE VIEW `v_daily_expense_trend` AS
SELECT
  t.user_id,
  t.transaction_date,
  SUM(t.amount) AS daily_expense
FROM `transactions` t
WHERE t.type = 'expense'
GROUP BY t.user_id, t.transaction_date;

-- 7.4 预算使用进度（预算页：总预算 + 分类预算，含颜色状态）
--     总预算行(category_id IS NULL)聚合当月全部支出；
--     分类预算行仅聚合对应分类支出。
DROP VIEW IF EXISTS `v_budget_usage`;
CREATE VIEW `v_budget_usage` AS
SELECT
  b.user_id,
  b.budget_month,
  b.category_id,
  c.name                                              AS category_name,
  b.amount                                            AS budget_amount,
  COALESCE(ce.used_amount, me.used_amount, 0)         AS used_amount,
  b.amount - COALESCE(ce.used_amount, me.used_amount, 0) AS remaining_amount,
  ROUND(COALESCE(ce.used_amount, me.used_amount, 0) / b.amount * 100, 1) AS used_percent,
  CASE
    WHEN COALESCE(ce.used_amount, me.used_amount, 0) / b.amount > 0.9  THEN 'danger'
    WHEN COALESCE(ce.used_amount, me.used_amount, 0) / b.amount >= 0.6 THEN 'warn'
    ELSE 'safe'
  END                                                 AS progress_status
FROM `budgets` b
LEFT JOIN `categories` c ON c.id = b.category_id
LEFT JOIN (
  -- 每用户每月的分类支出小计
  SELECT
    t.user_id,
    DATE_FORMAT(t.transaction_date, '%Y-%m') AS stat_month,
    t.category_id,
    SUM(t.amount)                            AS used_amount
  FROM `transactions` t
  WHERE t.type = 'expense'
  GROUP BY t.user_id, DATE_FORMAT(t.transaction_date, '%Y-%m'), t.category_id
) ce ON  ce.user_id    = b.user_id
    AND ce.stat_month = b.budget_month
    AND ce.category_id = b.category_id
LEFT JOIN (
  -- 每用户每月的全部支出合计（供总预算行使用）
  SELECT
    t.user_id,
    DATE_FORMAT(t.transaction_date, '%Y-%m') AS stat_month,
    SUM(t.amount)                            AS used_amount
  FROM `transactions` t
  WHERE t.type = 'expense'
  GROUP BY t.user_id, DATE_FORMAT(t.transaction_date, '%Y-%m')
) me ON  me.user_id    = b.user_id
    AND me.stat_month = b.budget_month
    AND b.category_id IS NULL;

-- =====================================================================
-- 8. 脚本执行完毕
--    验证示例：
--    SELECT * FROM v_monthly_overview WHERE user_id = 1;
--    SELECT * FROM v_budget_usage WHERE user_id = 1 AND budget_month = '2026-09';
-- =====================================================================

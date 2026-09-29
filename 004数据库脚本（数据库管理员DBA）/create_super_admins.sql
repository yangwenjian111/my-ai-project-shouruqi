-- =====================================================================
-- 超级管理员表 super_admins
-- 版本   : V1.0
-- 日期   : 2026-09-29
-- 依据   : 《后台管理系统PRD_V1.0.md》
-- 说明   : 仅用于后台管理系统登录，与用户端 users 表完全隔离
-- =====================================================================

USE `daily_finance`;

-- ---------------------------------------------------------------------
-- 1. 创建超级管理员表
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `super_admins`;
CREATE TABLE `super_admins` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '管理员ID',
  `username`      VARCHAR(20)     NOT NULL                COMMENT '管理员用户名，唯一',
  `password_hash` VARCHAR(255)    NOT NULL                COMMENT '密码哈希（bcrypt，禁止明文存储）',
  `nickname`      VARCHAR(15)     NOT NULL DEFAULT '超级管理员' COMMENT '显示名称',
  `last_login_at` DATETIME        NULL     DEFAULT NULL   COMMENT '最近登录时间',
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '超级管理员表（后台管理系统专用）';

-- ---------------------------------------------------------------------
-- 2. 初始数据
--    用户名: admin
--    密码:   admin123（bcrypt 哈希，SALT_ROUNDS=10）
-- ---------------------------------------------------------------------
INSERT INTO `super_admins` (`username`, `password_hash`, `nickname`) VALUES
('admin', '$2a$10$lLWY2S..owd8z.X/QUOBYeXhXWsKcDGhPu9ofSAcNLqqW/6dRLosa', '超级管理员');

-- =====================================================================
-- 验证
-- =====================================================================
SELECT id, username, nickname, created_at FROM `super_admins`;

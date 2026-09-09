-- OneCoder 博客 MySQL 数据库建表脚本
-- 适用范围：自建 MySQL 8.0+、阿里云 RDS、腾讯云 CDB 等

-- 1. 文章阅读量表
CREATE TABLE IF NOT EXISTS `post_views` (
  `slug` VARCHAR(191) NOT NULL,
  `views` INT NOT NULL DEFAULT 0,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 读者留言表
CREATE TABLE IF NOT EXISTS `post_comments` (
  `id` VARCHAR(64) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `author` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `site` VARCHAR(255) DEFAULT '',
  `content` TEXT NOT NULL,
  `likes` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_post_comments_slug` (`slug`),
  KEY `idx_post_comments_created_at` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

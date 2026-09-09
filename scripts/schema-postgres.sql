-- OneCoder 博客 PostgreSQL 数据库建表脚本
-- 适用范围：自建 PostgreSQL (Docker/VPS)、Supabase、Neon、AWS RDS

-- 1. 文章阅读量表
CREATE TABLE IF NOT EXISTS post_views (
  slug VARCHAR(191) PRIMARY KEY,
  views INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 读者留言表
CREATE TABLE IF NOT EXISTS post_comments (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(191) NOT NULL,
  author VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  site VARCHAR(255) DEFAULT '',
  content TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 索引优化 (加速单文章留言查询与按时间排序)
CREATE INDEX IF NOT EXISTS idx_post_comments_slug ON post_comments(slug);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at DESC);

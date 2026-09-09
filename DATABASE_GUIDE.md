# OneCoder 博客自建数据库接入与运维指南

本文档指导博主为 OneCoder 博客配置自建数据库（**PostgreSQL** 或 **MySQL**），用于持久化存储**文章阅读量（Views）**与**读者留言交流（Comments）**。

---

## 一、 架构与容错机制

1. **自动双模运行**：
   - **配置了 `DATABASE_URL`**：系统自动启用数据库连接池进行读写；
   - **未配置或数据库异常**：系统自动无缝回退至本地文件模式（`.db_data/views.json`、`.db_data/comments.json`），控制台打印日志，保障前台页面 100% 不白屏、不报错。
2. **连接池复用**：
   - 在 Next.js 开发环境（HMR 热重载）与 Vercel Serverless 环境下已做全局连接池单例缓存，防止连接泄漏或耗尽数据库连接配额。
3. **阅读量防刷机制**：
   - 内置 2 小时 HttpOnly Cookie 签名防刷机制，同一访客短期内重复刷新不重复计次。

---

## 二、 推荐接入方案（三选一）

### 方案 1：免费云托管 Serverless PostgreSQL（极力推荐，最省心）

由于博客托管在 **Vercel**，使用免费的云原生托管 PostgreSQL 是最佳实践：
- **Supabase**（推荐，每月提供免费 500MB 数据库与连接池 Transaction Pooler）：
  1. 前往 [Supabase 官网](https://supabase.com) 注册并新建项目；
  2. 进入项目 **Project Settings -> Database -> Connection string**；
  3. 选择 **URI -> Transaction**（端口通常为 6543，适合 Serverless）；
  4. 复制连接串，例如：
     ```bash
     DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require"
     ```
  5. 在 Supabase 的 **SQL Editor** 中粘贴并执行项目下的 `scripts/schema-postgres.sql` 完成建表。

- **Neon.tech**（支持毫秒冷启动分支管理的 Postgres）：
  1. 前往 [Neon 官网](https://neon.tech) 创建项目；
  2. 复制控制台生成的带 `sslmode=require` 连接串；
  3. 在 Neon 控制台 SQL Editor 执行 `scripts/schema-postgres.sql`。

---

### 方案 2：自建 VPS Docker 一键部署（已有云服务器/独立主机）

如果博主有自己的阿里云/腾讯云/搬瓦工等 VPS 服务器：

1. **将项目下的 `docker-compose.db.yml` 与 `scripts/schema-postgres.sql` 上传至服务器**；
2. **启动数据库容器**：
   ```bash
   docker compose -f docker-compose.db.yml up -d
   ```
   > 容器启动时会自动执行 `scripts/schema-postgres.sql`，一键建好所有数据表与索引。
3. **配置连接串**：
   ```bash
   DATABASE_URL="postgresql://onecoder:onecoder_secure_password@<你的VPS公网IP>:5432/coderli_blog"
   ```
   *(注：请在 VPS 防火墙/安全组中放行 5432 端口，或通过反向代理配置域名访问)*

---

### 方案 3：自建传统 MySQL 8.0+

如果博主倾向于使用已有的 MySQL 数据库：
1. 登录 MySQL 客户端，创建数据库：
   ```sql
   CREATE DATABASE coderli_blog DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. 执行项目中的 `scripts/schema-mysql.sql` 完成建表；
3. 配置连接串：
   ```bash
   DATABASE_URL="mysql://root:你的密码@<服务器IP>:3306/coderli_blog"
   ```

---

## 三、 表结构设计与 SQL 脚本

建表 SQL 已内置于项目 `scripts/` 目录下：

- **PostgreSQL 脚本**：`scripts/schema-postgres.sql`
- **MySQL 脚本**：`scripts/schema-mysql.sql`

核心包含两张表：
1. `post_views`：
   - `slug` (VARCHAR 191, 主键)：文章永久唯一标识；
   - `views` (INT)：累积阅读次数；
   - `updated_at` (TIMESTAMP)：最后更新时间。
2. `post_comments`：
   - `id` (VARCHAR 64, 主键)：留言唯一 ID；
   - `slug` (VARCHAR 191, 索引)：所属文章；
   - `author` (VARCHAR 100)：访客昵称；
   - `email` (VARCHAR 150)：访客邮箱（用于匹配 Gravatar 头像）；
   - `site` (VARCHAR 255)：访客个人网址；
   - `content` (TEXT)：留言 Markdown 内容；
   - `likes` (INT)：点赞数；
   - `created_at` (TIMESTAMP, 索引)：提交时间。

---

## 四、 本地开发与生产部署配置

### 1. 本地开发环境生效
在项目根目录新建 `.env.local` 文件（该文件已被 `.gitignore` 忽略，安全不会提交到代码仓库）：
```bash
# 复制模板
cp .env.example .env.local
```
编辑 `.env.local` 中的 `DATABASE_URL`，保存后重启 `pnpm dev` 即可。

### 2. Vercel 生产环境部署生效
将项目代码推送到 GitHub 并关联 Vercel 后：
1. 打开 **Vercel Dashboard -> 你的项目 -> Settings -> Environment Variables**；
2. 添加变量：
   - **Key**: `DATABASE_URL`
   - **Value**: 你的数据库连接串
   - **Environment**: 勾选 `Production`, `Preview`, `Development`
3. 添加按需重新验证密钥：
   - **Key**: `REVALIDATE_SECRET`
   - **Value**: 自定义的安全随机字符串
4. 点击 **Save** 并重新触发一次 Deploy，生产环境即接入自建数据库！

---

## 五、 联调与测试验证

服务启动后，可通过以下接口验证数据库读写：

1. **测试阅读量接口**：
   ```bash
   # 获取某文章阅读量
   curl http://localhost:3000/api/views/gesp-3-luogu-p2089/
   
   # 触发阅读量递增 (+1)
   curl -X POST http://localhost:3000/api/views/gesp-3-luogu-p2089/
   ```

2. **测试留言接口**：
   ```bash
   # 获取留言列表
   curl http://localhost:3000/api/comments/gesp-3-luogu-p2089/
   
   # 提交一条测试留言
   curl -X POST http://localhost:3000/api/comments/gesp-3-luogu-p2089/ \
     -H "Content-Type: application/json" \
     -d '{"author":"OneCoder","email":"wushikezuo@gmail.com","content":"测试数据库持久化留言！"}'
   ```
在数据库中执行 `SELECT * FROM post_views;` 和 `SELECT * FROM post_comments;` 即可看到实时写入的数据。

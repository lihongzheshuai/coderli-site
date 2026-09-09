# OneCoder 博客现代化改造技术方案与架构设计规范

## 一、 项目背景与重构目标
本博客由 Jekyll (Chirpy 主题) 演进而来，积累了 **936 篇高质量技术博文**（以 C++ GESP/CSP 考级题解、Java 架构实战、算法、Python 为主）。
本次重构目标：
1. **托管平台**：继续托管在 **Vercel**；
2. **全新技术栈**：采用 **Next.js 14 (App Router) + TypeScript + Tailwind CSS**；
3. **发布工作流**：支持 **免全站重新编译即时发布**（基于 Vercel 边缘 On-Demand ISR，耗时 < 1 秒）；
4. **历史资产保全**：
   - 100% 保持原有永久链接结构：`https://www.coderli.com/:title/`（不破坏 SEO 反向链接）；
   - 现有 411 张图片静态映射到 `/public/images/`，Markdown 内部图片链接无需批量修改；
5. **内容体系**：5 大核心主题分类智能映射，文章全自动预览图（真实插图 + 动态算法视觉图）；
6. **商业收益**：完整继承原 Google AdSense 账号（`ca-pub-7615326632728696`）及 5 大广告位，防跳屏（CLS）优化；
7. **自建数据能力**：自建数据库存储文章级阅读量（Views）、全站统计（PV/UV）与读者留言系统；
8. **全站检索**：支持全局快捷键（`Ctrl+K` 或 `/`）毫秒级模糊检索 936 篇博文。

---

## 二、 核心模块技术方案

### 1. 内容引擎与路由对齐
- **Markdown 存储**：继续保存在 `_posts/` 目录，文件名格式 `YYYY-MM-DD-<slug>.md`。
- **Slug 提取逻辑**：
  ```typescript
  // 匹配文件名中的日期前缀并剥离，保留 slug
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
  const slug = match ? match[2] : filename.replace(/\.md$/, '');
  ```
- **路由映射**：`app/[slug]/page.tsx` 直接捕获 `/:slug`，与 Jekyll `permalink: /:title/` 完美契合。
- **解析技术栈**：
  - `gray-matter`：读取文章 YAML Front-matter 元数据；
  - `remark-gfm` + `remark-math`：支持 GitHub 规范表格、任务列表与数学公式；
  - `rehype-katex`：客户端/服务端极速渲染 LaTeX 公式；
  - `shiki`：VS Code 级别的代码高亮（支持 C++、Java、Python、SQL、Shell、XML、Gradle 等）；
  - `rehype-slug`：为文章所有二级、三级标题自动生成 ID，驱动目录（TOC）与滚动高亮监听。

### 2. 免全站重新编译的即时发布（On-Demand ISR）
- **接口路径**：`app/api/revalidate/route.ts`
- **安全验证**：通过请求参数或 Header 中的 `REVALIDATE_SECRET` 进行签名校验。
- **执行逻辑**：
  ```typescript
  import { revalidatePath } from 'next/cache';
  export async function POST(req: Request) {
    // 1. 验证密钥
    // 2. 局部重新验证：只刷新目标文章与首页
    revalidatePath(`/${slug}`);
    revalidatePath('/');
    return Response.json({ revalidated: true, now: Date.now() });
  }
  ```
- **发布流程**：本地/网页写完 Markdown 推送后，调用一次 Webhook，目标页面在 300 毫秒内在 Vercel Edge CDN 上生成静态缓存，其他 935 篇老文章完全无需重新编译。

### 3. 主题分类智能映射规则（无需手动修改 936 篇历史文件）
由 `lib/posts.ts` 中的规则引擎自动识别：
1. **GESP 考级专题** (`gesp`)：`categories` 或 `tags` 包含 `GESP`，并自动识别 `一级`、`二级`、`三级`、`四级`、`五级` 等考级级别；
2. **CSP / NOIP 信奥竞赛** (`csp`)：包含 `CSP`、`NOIP`、`NOI`、`信奥`；
3. **Java 架构实战** (`java`)：包含 `Java`、`Spring`、`Netty`、`Log`、`一起学Java`；
4. **算法刷题** (`algo`)：包含 `LeetCode`、`算法`、`动态规划`、`贪心`、`递归`；
5. **Python与数据工程** (`python-data`)：包含 `Python`、`MySQL`、`Hadoop`、`Spark`、`大数据`。

### 4. 文章预览图（Cover Image）三级自动化策略
1. **优先获取**：Front-matter 中的 `image` 字段（部分文章已有）；
2. **正文提取**：正则匹配提取文章内第一张 Markdown 插图（如洛谷题解图、几何梯形图）；
3. **动态生成兜底**：若无任何图片，根据文章主题与级别自动匹配算法视觉图形（如矩阵网格、八方向、DFS搜索树、Java门面图徽章），确保全站每篇文章均有高质量缩略图。

### 5. 自建数据库：文章/站点访问量与留言系统
- **数据库兼容**：支持 MySQL 8.0+ 或 PostgreSQL 14+（无论是自建云服务器还是 Supabase/Neon 均可）。
- **文章阅读量防刷机制**：
  - 客户端使用 SWR 异步向 `/api/views/[slug]` 发送 POST 请求；
  - 服务端通过带时间戳的 HttpOnly Cookie 标记（有效期 2 小时），同一访客在有效时间内重复刷新不重复累加。
- **读者留言系统**：
  - 表结构支持昵称、邮箱（匹配 Gravatar 头像）、个人主页、内容与时间戳；
  - 配合 Cloudflare Turnstile 或 Akismet 预防垃圾评论。

### 6. 全局站内快速检索功能
- **构建期生成**：在打包时将 936 篇博文的标题、标签、分类、摘要导出至 `public/search-index.json`（压缩后约 200KB）。
- **客户端交互**：监听全局按键 `/` 或 `Ctrl+K`（Mac `Cmd+K`），唤起搜索弹窗，毫秒级模糊检索匹配并高亮关键字。

### 7. Google AdSense 5 大广告位集成规范
- **Client ID**：`ca-pub-7615326632728696`
- **Slot 分配**：
  - 广告位 1（文首推荐流式）：Slot `1669039692`（高度预留 min-height: 120px，防跳屏）
  - 广告位 2（文中段落穿插）：Slot `2477304429`
  - 广告位 3（文末推荐横幅）：Slot `6416549436`
  - 广告位 4（桌面侧栏吸顶）：Slot `6734143049`（300x250 自适应）
  - 广告位 5（首页信息流穿插）：Slot `9656071817`（原生流式广告）
- **ads.txt 静态文件**：直接保留在 `public/ads.txt`。

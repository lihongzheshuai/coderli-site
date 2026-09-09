# OneCoder 博客重构项目上下文与接续指南 (Project Context)

> 本文件用于在新建或切换会话时，让 AI 能够 100% 无缝继承所有前期讨论、技术决策与已完成的架构成果。

---

## 一、 项目背景与关键决策

- **博客名称**：OneCoder（网址：`coderli.com`）
- **博主**：OneCoder (`lihongzheshuai`)
- **历史沉淀**：936 篇博文（从 2012 年开始沉淀），411 张插图，已放置在 `_posts/` 和 `public/images/`
- **原技术栈**：Jekyll (Chirpy 主题)，部署在 Vercel
- **新技术栈**：**Next.js 14 (App Router) + TypeScript + Tailwind CSS**，托管于 **Vercel**
- **核心痛点解决**：
  1. **免全站重新编译发布新文章**：基于 Next.js On-Demand ISR（按需重新验证），调用 `/api/revalidate?secret=...&slug=...` 仅重新生成指定页面与首页，耗时约 300ms，无需全站几分钟的 build。
  2. **100% 保持历史永久链接与 SEO**：Jekyll 原有格式为 `https://www.coderli.com/:title/`。在 `next.config.mjs` 中设置了 `trailingSlash: true`，路由为 `app/[slug]/page.tsx`，与历史链接完美一致，零 404！
  3. **继承原有 Google AdSense**：
     - Client ID: `ca-pub-7615326632728696`
     - 5 大广告位：文首流式 `1669039692`、文中穿插 `2477304429`、文末横幅 `6416549436`、侧栏吸顶 `6734143049`、信息流穿插 `9656071817`
     - 组件已封装在 `components/GoogleAd.tsx`（具备防跳屏 CLS 占位高度）
     - `public/ads.txt` 凭证文件已就绪
  4. **自建数据库阅读量与读者留言系统**：
     - `app/api/views/[slug]/route.ts`：文章阅读量统计，内置 2 小时 HttpOnly Cookie 防刷量；
     - `app/api/comments/[slug]/route.ts`：读者 Markdown 留言提交与查询；
     - `lib/db.ts`：支持连接自建 MySQL / PostgreSQL，未配置时具备本地容错；
     - 前端组件：`components/ViewCounter.tsx`、`components/Comments.tsx`。
  5. **5 大核心主题智能分类**（无需手工修改 936 篇历史 Front-matter）：
     - `gesp`：GESP 考级真题（504 篇），自动提取一级~八级级别；
     - `csp`：CSP / NOIP 信奥竞赛（37 篇）；
     - `java`：Java 架构实战与日志篇（146 篇）；
     - `algo`：算法专题与 LeetCode（81 篇）；
     - `python-data`：Python、MySQL 与大数据（60 篇）。
  6. **文章预览图 3 级自动提取**：
     - Front-matter `image:` -> 正文第一张 Markdown 图 -> 动态算法主题视觉封面。
  7. **全站快速检索**：
     - `scripts/build-search-index.mjs` 构建期提取 936 篇博文索引生成 `public/search-index.json`（约 640KB）；
     - `components/SearchModal.tsx`：全局监听 `/` 或 `Ctrl+K`，支持毫秒级模糊匹配。

---

## 二、 当前工程代码状态

本工程 `D:\MyCode\coderli-blog` 结构完整，代码已编写完毕并通过全量 TypeScript 静态检查：

```
D:\MyCode\coderli-blog\
├── _posts/                    # 936 篇博文 Markdown（数据完全自包含）
├── public/                    # 静态资源（411张图片、ads.txt、search-index.json）
├── app/                       # 页面路由层
│   ├── page.tsx               # 全站首页（大卡片理念、资产统计、主题切换、信息流广告）
│   ├── [slug]/page.tsx        # 博文详情阅读页（宽屏、TOC、KaTeX数学公式、代码高亮、留言）
│   ├── topics/[topic]/page.tsx# 5大核心主题专栏聚合页
│   └── api/                   # views, comments, revalidate API 路由
├── components/                # Header, Footer, GoogleAd, TOC, Comments, ViewCounter, SearchModal
├── lib/                       # posts.ts (解析引擎), db.ts (数据库驱动)
├── types/                     # post.ts (数据类型定义)
├── scripts/                   # build-search-index.mjs (搜索索引构建)
├── package.json               # 现代化依赖规范
├── tailwind.config.ts         # 样式配置（支持宽屏与深浅色模式）
├── next.config.mjs            # TrailingSlash 与图片优化配置
├── tsconfig.json              # TypeScript 配置
├── TECH_SPEC.md               # 详细技术规格说明书
└── prototype.html             # 验收通过的纯 HTML 原型备份
```

---

## 三、 新会话接续工作清单 (Next Steps)

新会话中请按以下步骤继续执行：

1. 执行 `pnpm install` 安装所有 Node 依赖包；
2. 运行 `node scripts/build-search-index.mjs` 验证搜索索引生成；
3. 执行 `pnpm dev` 启动本地开发服务，并在浏览器中验证 `http://localhost:3000`；
4. 补充 `.env.example`，指导博主配置自建数据库（MySQL / PostgreSQL）连接串；
5. 初始化 git 并指导关联至 GitHub 与 Vercel 部署。

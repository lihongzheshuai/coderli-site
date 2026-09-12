# OneCoder 微信公众号自动排版与草稿箱发布接入指南

本文档指导博主基于 **GitHub Actions + 腾讯云轻量应用服务器（固定 IP 代理）**，实现：
> **在本地写完 Markdown 推送至 GitHub 后，自动将文章转为精美微信富文本排版（代码高亮、公式转图、封面绑定、阅读原文关联），并自动推送到微信公众号的“草稿箱”。**

---

## 整体架构流程

```
本地 git push origin main
          ↓
GitHub Actions 自动触发
          ↓
1. 解析 Markdown，自动排版（Shiki C++/Java代码块 + 莫兰迪/护眼配色 + 标题卡片）
2. 将数学公式与插图自动转存至微信素材库
3. 通过腾讯云轻量服务器代理（带固定出网 IP）突破微信 IP 白名单限制
4. 调用微信官方 API 创建草稿 (draft/add)
          ↓
手机“订阅号助手”即时收到新草稿提醒，预览后一键群发！
```

---

## 第一步：在微信公众号后台获取开发者凭证与加白名单

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)；
2. 进入左侧菜单：**设置与开发 -> 基本配置**：
   - 获取 **开发者ID (AppID)**；
   - 生成或查看 **开发者密码 (AppSecret)**；
   - 找到 **IP 白名单**，点击配置：
     - 将您的**腾讯云轻量服务器的公网 IP** 填入白名单列表中并保存。

---

## 第二步：在腾讯云轻量服务器上启动代理网关

由于 GitHub Actions 的运行机 IP 是动态变化的，而微信官方强制校验固定 IP 白名单，因此我们在腾讯云服务器上运行一个轻量代理网关（脚本已内置于项目 `scripts/wechat-proxy-server.mjs`，零外部依赖）。

### 1. 将脚本上传至腾讯云服务器
登录您的腾讯云服务器（通过 SSH 或腾讯云网页控制台），创建工作目录并放入 `wechat-proxy-server.mjs`：
```bash
mkdir -p ~/wechat-proxy
cd ~/wechat-proxy
# 将项目中的 scripts/wechat-proxy-server.mjs 内容复制为该目录下的 index.mjs
```

### 2. 启动服务（推荐使用 PM2 常驻后台）
确保服务器上已安装 Node.js (v18+)：
```bash
# 安装 PM2 进程管理器（如果未安装）
npm install -g pm2

# 启动代理服务（默认端口 8080，可自定义 PROXY_TOKEN）
PORT=8080 PROXY_TOKEN="onecoder-wechat-proxy-secret" pm2 start index.mjs --name "wechat-proxy"

# 保存开机自启
pm2 save
pm2 startup
```

### 3. 腾讯云安全组放行端口
在腾讯云轻量服务器控制台的 **防火墙 / 安全组** 中，添加放行规则：
- **协议端口**：`TCP: 8080`
- **源 IP**：`0.0.0.0/0` (允许 GitHub Action 访问)

### 4. 验证代理服务是否运行正常
在您本地电脑终端运行测试命令：
```bash
curl http://<你的腾讯云公网IP>:8080/health
```
若返回 `{"status":"ok", ...}` 则说明代理部署成功！

---

## 第三步：在 GitHub 仓库中配置密钥 (Secrets)

打开您的 GitHub 仓库（`lihongzheshuai/coderli-site`）：
1. 进入 **Settings -> Secrets and variables -> Actions**；
2. 点击 **New repository secret**，依次添加以下 4 个密钥：

| 密钥名称 | 填入内容 | 作用 |
| :--- | :--- | :--- |
| `WECHAT_APP_ID` | 微信公众号的 AppID | 微信鉴权 |
| `WECHAT_APP_SECRET` | 微信公众号的 AppSecret | 微信鉴权 |
| `WECHAT_PROXY_URL` | `http://<你的腾讯云公网IP>:8080` | 腾讯云固定 IP 代理地址 |
| `WECHAT_PROXY_TOKEN` | `onecoder-wechat-proxy-secret` | 代理通信身份验证防盗刷 |

---

## 第四步：测试与日常使用

### 1. 手动测试现有文章（零风险验证）
无需新建文章，您可以在 GitHub 网页上手动测试一篇已有博文：
1. 进入 GitHub 仓库的 **Actions** 标签页；
2. 点击左侧的 **Publish to WeChat Official Account** 工作流；
3. 点击右侧 **Run workflow**：
   - 输入目标文章路径，如：`_posts/2026-09-12-luogu-p1873-eko.md`；
   - 点击绿色的 **Run workflow** 按钮；
4. 观察执行日志：大约 5 秒内，文章就会完成自动排版并推送到微信草稿箱！
5. 打开手机上的“微信订阅号助手”或网页版后台，即可看到精美排版的题解草稿。

### 2. 日常自动触发
以后您每次在 `_posts/` 下新增或修改博文并 `git push` 后：
- **博客网站端**：Vercel 极速部署，首页博文数量自动增加；
- **微信公众号端**：GitHub Actions 自动完成富文本排版、代码高亮渲染并写入草稿箱，手机端一键确认即可群发！

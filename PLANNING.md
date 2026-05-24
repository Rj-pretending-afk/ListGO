# 💌 ListGo · 让朋友替你做决定的轻协作工具 · 项目规划文档

> 版本：v2.0（最终版）· 状态：规划完成，待开发 · 最后更新：2026-05

---

## 目录

1. [项目概述](#1-项目概述)
2. [功能范围](#2-功能范围)
3. [技术选型](#3-技术选型)
4. [项目结构](#4-项目结构)
5. [开发阶段划分](#5-开发阶段划分)
6. [界面设计思路](#6-界面设计思路)
7. [核心功能技术实现](#7-核心功能技术实现)
8. [账号系统与权限模型](#8-账号系统与权限模型)
9. [匿名 vs 注册：能力对照](#9-匿名-vs-注册能力对照)
10. [实时同步方案](#10-实时同步方案)
11. [移动端体验保证](#11-移动端体验保证)
12. [GitHub 仓库规范](#12-github-仓库规范)
13. [测试策略](#13-测试策略)
14. [部署方案](#14-部署方案)
15. [未来扩展方向](#15-未来扩展方向)
16. [参考资源](#16-参考资源)

---

## 1. 项目概述

### 1.1 起源故事 · 为什么造这个

> "今晚我该吃啥？"
> 一个人在异乡，下班后累得不想动脑筋，想找个朋友帮我决定。
> 但是问"晚上吃啥"的群发消息显得很麻烦，做投票得用功能臃肿的工具，还要朋友注册账号。
>
> 我想要的就是一句话：**"帮我看看，今晚吃啥？"**
> 朋友点开链接、勾几下、投个票，我就能感受到那种"虽然不在身边，但有人愿意陪我做决定"的温柔。

ListGo 不是工作协作工具，**是一个让你感受被关心的小角落**。

### 1.2 定位

**ListGo 是一个让朋友替你做决定的极简清单工具。**

- 不像 Doodle 那样冷冰冰只能投票
- 不像 Notion 那样把人吓跑的复杂
- 不像微信群那样消息淹没在聊天里
- 是一个**温柔的、专属你的、朋友们能轻松参与的小空间**

### 1.3 与市面上其他产品的区别

| 特性 | 微信群投票 | 腾讯文档 | Doodle | **ListGo** |
|---|---|---|---|---|
| 启动门槛 | 微信生态 | 需登录 | 需注册 | **打开即用（匿名）** |
| 朋友参与 | 仅微信好友 | 需登录 | 需注册 | **链接即投票** |
| 情感氛围 | 消息淹没 | 严肃工作 | 工具感 | **温柔陪伴** |
| 投票 + 待办 | 部分 | 部分 | 仅投票 | ✅ **全有** |
| 主题（Pink） | ❌ | ❌ | ❌ | ✅ **Light + Dark Pink** |
| 反垃圾 | 无 | 无 | 无 | ✅ **邀请码** |
| 开源免费 | ❌ | ❌ | ❌ | ✅ MIT |

### 1.4 核心价值主张

> **"为你写一份清单，让朋友替你做决定。"**

### 1.5 设计原则

- **温柔优先**：UI/文案不冷硬，Pink mode 不是装饰是态度
- **创建者专属**：每个 list 是创建者的"小角落"，不是群体共有
- **零门槛体验**：匿名也能玩，但有合理限制
- **注册解锁能力**：邀请码筛选认真用户，给予完整权限和持久化
- **反垃圾**：邀请码制度防止 scammer
- **一链一事**：不做嵌套页面、不做项目管理

---

## 2. 功能范围

### 2.1 核心数据结构

每个清单（List）：
- **1 个标题**（必需）
- **1 个所有者**（注册用户 user.id 或匿名 ownerToken）
- **1 个权限设置**（4 级，仅注册用户可设；匿名清单强制公开）
- **1 个背景**（颜色 或 图片）
- **N 个模块**（自由组合）

模块类型（3 种）：

| 模块 | 用途 | 内容 |
|---|---|---|
| 📊 **投票模块** | "去哪吃" / "选啥礼物" | 题目 + 选项 + 单选/多选 + 实名/匿名 |
| ✅ **待办模块** | "周末该做啥" / "购物清单" | 一组带勾选框的条目 |
| 📝 **文本模块** | 说明、备注、附图 | 富文本（粗体/斜体/下划线/删除线/字号）+ 图片 |

### 2.2 Phase 1 · 本地 MVP（无账号）

**目标：** 完整的本地清单工具，无需注册即可玩

- [ ] 创建清单（标题必填）
- [ ] 添加 / 删除 / 编辑 3 种模块
- [ ] 自动保存到 IndexedDB
- [ ] 主页：本地所有清单卡片
- [ ] 四主题切换：Day / **Dark（默认）** / Light Pink / Dark Pink

### 2.3 Phase 2 · 视觉打磨

- [ ] 文本模块富文本：粗体 / 斜体 / 下划线 / 删除线 / 字号（小/正常/大）
- [ ] 文本模块插入图片（Phase 2：仅支持粘贴 URL）
- [ ] 清单背景：纯色（10 预设）或 背景图（URL）
- [ ] 模块拖拽排序（桌面鼠标 + 移动端长按）
- [ ] 模块右上角操作菜单
- [ ] 移动端体验全面打磨（详见第 11 章）

### 2.4 Phase 3 · 账号系统 + 云端 + 匿名清单云端化

**目标：** 用户可注册账号；同时匿名清单也开始上云（为分享铺路）

**账号系统：**
- [ ] **注册**：用户名 + 密码 + 邀请码（用户名唯一不可变）
- [ ] **显示昵称**：注册时初始 = 用户名，可在设置页改（支持 emoji）
- [ ] **登录**：用户名 + 密码 → JWT，**有效期 30 天**
- [ ] 邀请码机制：
  - 每个用户注册后获得 2 个邀请码
  - 一次性使用
  - 用户可"联系作者获取新邀请码"
- [ ] 修改密码 / 修改显示昵称 / 修改头像色
- [ ] **忘记密码**：联系管理员人工重置（页面给联系方式）
- [ ] **管理员后台页面**：仅特殊账号能进，可批量生成邀请码 / 查看 / 撤销

**云端清单：**
- [ ] 匿名清单上云：用浏览器生成的 `ownerToken` 标识所有权
- [ ] 注册清单上云：用 `user.id` 标识
- [ ] 个人主页：我创建的清单 + 我参与过的清单
- [ ] **匿名转注册时的清单领取**（详见 §8.6）

**匿名清单的限制：**
- [ ] 强制公开（无权限选项）
- [ ] 强制无背景图上传（仅 URL）
- [ ] 强制 30 天清理（按"最后访问"重置）

### 2.5 Phase 4 · 短链分享 + 4 级权限 + 实时同步

**目标：** 清单可分享，朋友实时协作

- [ ] **短链分享**：`listgo.pages.dev/l/{8 位 nanoid}`
- [ ] **4 级权限**（仅注册用户的清单可设）：
  - 🌐 公开 · 任何人（含匿名）可访问可编辑
  - 🔐 验证账户 · 仅登录用户
  - 💌 仅邀请 · 仅创建者输入的用户名
  - 🔒 仅自己 · 仅创建者
- [ ] **匿名身份**（仅在公开模式下访问）：进入选颜色 + 可选昵称（不持久化）
- [ ] **登录用户身份**：用户名 + 自选头像色（持久化）
- [ ] **轮询同步**：3 秒拉取 + debounce 写入
- [ ] **在线状态**：右上角头像组（10 秒心跳 / 30 秒超时）
- [ ] **投票独立 API**（避免文档冲突）
- [ ] **图片上传到 R2**（仅注册用户）
- [ ] **背景图上传到 R2**（仅注册用户）
- [ ] **邀请用户名输入框**：自动补全 / 校验用户存在

### 2.6 Phase 5 · 完善与发布

- [ ] PWA 支持（可"安装"到桌面）
- [ ] 加载状态、空状态、错误处理
- [ ] 网络断开提示 + 离线编辑
- [ ] README + 截图 + GIF 演示
- [ ] **匿名清单 30 天清理 cron**（Cloudflare Cron Triggers）
- [ ] v1.0.0 发布

### 2.7 明确不做（v1）

- ❌ 邮箱验证（邀请码已经控制垃圾用户）
- ❌ 第三方登录（Google/GitHub）
- ❌ 多人光标实时同步（贵且对场景没必要）
- ❌ 日历视图
- ❌ 提醒推送通知
- ❌ 子任务嵌套
- ❌ 表格 / 数据库 / 看板
- ❌ 子页面 / 页面层级
- ❌ AI 功能

---

## 3. 技术选型

### 3.1 技术栈一览

```
前端框架：     React 18 + TypeScript
构建工具：     Vite
样式方案：     Tailwind CSS + CSS Variables（4 主题）
本地存储：     Dexie.js（IndexedDB 封装）
富文本：       contenteditable + DOMPurify
拖拽：         dnd-kit
路由：         React Router v6
状态管理：     Zustand
ID 生成：      nanoid（短链 + 邀请码 + ownerToken）
图标库：       Lucide React
日期处理：     date-fns

后端（Phase 3+）：
运行时：       Cloudflare Workers
数据库：       Cloudflare D1 (SQLite)
图片存储：     Cloudflare R2
密码哈希：     PBKDF2（Web Crypto API）
鉴权：         JWT（HS256）
定时任务：     Cloudflare Cron Triggers（清理匿名清单）
实时通信：     轮询 → SSE（远期升级）

部署：         Cloudflare Pages
```

### 3.2 为什么选这种"用户名 + 密码 + 邀请码"

| 方案 | 优点 | 缺点 |
|---|---|---|
| 邮箱注册 | 最常见 | 注册流程长,需邮件服务 |
| 第三方登录 | 一键 | 依赖外部服务 |
| 仅匿名 | 零门槛 | 防不了 scammer |
| **用户名 + 密码 + 邀请码** | 简单可控 | 用户得记住密码（普遍能接受） |

**邀请码机制的妙处：**
- 控制增长速度（防被刷）
- 自带社交属性（朋友邀请朋友）
- 营造"小圈子"氛围（呼应"温柔陪伴"调性）

### 3.3 为什么 Cloudflare 全家桶

- **Pages**：免费托管 + 全球 CDN + 自动 HTTPS
- **Workers**：免费 10 万请求/天
- **D1**：免费 5GB SQLite + 500 万次读 / 10 万次写每天
- **R2**：免费 10GB 存储 + Cloudflare CDN 内免费流量
- **Cron Triggers**：免费定时任务（用于清理匿名过期清单）

---

## 4. 项目结构

```
listgo/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── List/
│   │   │   ├── ListView.tsx
│   │   │   ├── ListTitle.tsx
│   │   │   ├── ListBackground.tsx
│   │   │   ├── ModuleList.tsx
│   │   │   └── AddModuleButton.tsx
│   │   ├── modules/
│   │   │   ├── TodoModule.tsx
│   │   │   ├── VoteModule.tsx
│   │   │   ├── VoteResults.tsx
│   │   │   └── TextModule.tsx
│   │   ├── editor/
│   │   │   ├── RichTextEditor.tsx
│   │   │   ├── BubbleToolbar.tsx
│   │   │   └── ImageInsert.tsx
│   │   ├── auth/
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ChangePasswordDialog.tsx
│   │   │   ├── ProfileSettings.tsx
│   │   │   └── InviteCodesPanel.tsx
│   │   ├── admin/                     # 管理员后台
│   │   │   ├── AdminPage.tsx
│   │   │   ├── InviteCodeGenerator.tsx
│   │   │   └── InviteCodeList.tsx
│   │   ├── share/
│   │   │   ├── ShareDialog.tsx
│   │   │   ├── PermissionSelector.tsx
│   │   │   └── InviteUserInput.tsx
│   │   ├── presence/
│   │   │   ├── AvatarStack.tsx
│   │   │   └── ColorPicker.tsx
│   │   ├── claim/                     # 匿名清单领取
│   │   │   └── ClaimAnonymousDialog.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── theme/
│   │   │   └── ThemeSwitcher.tsx
│   │   └── ui/
│   ├── hooks/
│   │   ├── useList.ts
│   │   ├── useAuth.ts
│   │   ├── useSync.ts
│   │   ├── usePresence.ts
│   │   └── useTheme.ts
│   ├── lib/
│   │   ├── db.ts
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── ownerToken.ts              # 浏览器匿名身份
│   │   ├── shortid.ts
│   │   └── colors.ts
│   ├── types/
│   │   ├── list.types.ts
│   │   └── user.types.ts
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── ListPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── AdminPage.tsx
│   │   └── NotFound.tsx
│   ├── styles/
│   │   ├── globals.css
│   │   └── themes.css                 # Day/Dark/LightPink/DarkPink
│   ├── App.tsx
│   └── main.tsx
├── workers/
│   ├── api.ts
│   ├── cron.ts                        # 定时清理匿名清单
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── lists.ts
│   │   ├── sync.ts
│   │   ├── presence.ts
│   │   ├── votes.ts
│   │   ├── upload.ts                  # R2 图片上传
│   │   ├── admin.ts                   # 管理员接口
│   │   └── claim.ts                   # 匿名→注册领取清单
│   ├── middleware/
│   │   ├── auth.ts                    # JWT 校验
│   │   └── adminOnly.ts
│   ├── lib/
│   │   ├── crypto.ts
│   │   └── jwt.ts
│   └── schema.sql
├── scripts/
│   └── generate-seed-codes.ts         # 冷启动初始化邀请码
├── .github/
│   └── workflows/
│       └── deploy.yml
├── ...
└── wrangler.toml
```

---

## 5. 开发阶段划分

### Phase 0 · 项目搭建（预计 0.5 天）

- [x] Vite + React + TypeScript 初始化
- [x] Tailwind CSS + CSS 变量配置（4 主题占位）
  - 使用 Tailwind v4 + `@tailwindcss/vite`（无需 postcss/tailwind.config.js）
  - 主题通过 `data-theme` attribute + CSS 变量实现
- [x] 安装核心依赖
- [x] 创建 GitHub 仓库
- [x] .gitignore、README.md、PLANNING.md
- [x] 验证 `npm run dev` 跑通
  - `npm run build` 验证：TS 零报错，产物 JS 46KB gzip（远低于 200KB 限制）

### Phase 1 · MVP 本地工具（预计 4-5 天）

**目标：** 完整本地清单工具，三模块 + 四主题

- [x] IndexedDB schema（Dexie v4，`src/lib/db.ts`）
- [x] 主页：清单卡片网格
- [x] 创建清单（标题必填）
- [x] `+ 添加模块` → 选类型
- [x] **待办模块**：完整 CRUD（含小标题、勾选、删除）
- [x] **文本模块**：纯文字编辑（contenteditable，Phase 2 升级富文本）
- [x] **投票模块**：完整配置 + 投票交互 + 柱状图结果
  - 本地用 `votes['local']` 记录投票，Phase 4 升级为多用户
- [x] **四主题**：Day / Dark（默认）/ Light Pink / Dark Pink
  - 通过 Zustand store + `data-theme` attribute 切换，localStorage 持久化
- [x] 响应式布局（`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`）
  - build 验证：TS 零报错，JS gzip 98KB

**验收标准：**
> 创建"今晚吃啥"清单，加投票模块（3 选项）。切换 Light Pink 后整体明亮温柔，切 Dark Pink 后是夜玫瑰氛围。手机能用。

---

### Phase 2 · 视觉打磨（预计 3-4 天）

**目标：** 富文本、图片 URL、背景、移动端打磨

- [x] 富文本工具栏（选区浮现）：粗体 / 斜体 / 下划线 / 删除线 / 字号
  - 选中文字时顶部弹出工具栏（BubbleToolbar），execCommand 实现
- [x] 文本模块插入图片（粘贴 URL）
  - ImageInsert 组件，图片追加到 contenteditable 末尾
- [x] **清单背景**：色块 9 选 1 + 自定义颜色 + **背景图 URL**
  - ListBackground 组件嵌入子标题栏
- [x] 模块拖拽排序（桌面鼠标 + 移动端长按 500ms）
  - dnd-kit PointerSensor + TouchSensor，GripVertical 拖拽手柄
- [x] 模块操作菜单（⋯ 按钮替换 hover 删除）
  - ModuleMenu 组件，点击外部关闭
- [x] **移动端打磨**：触摸 ≥44px、底部弹层（AddModuleButton）、viewport-fit=cover
  - 全局 touch-action: manipulation 防双击缩放
  - CSS 基础字号设为 150%（24px）提升可读性

**验收标准：**
> 选中文字加粗变蓝；插入网络图片正确显示；背景换成樱花图整体协调；手机端拖拽顺滑。

---

### Phase 3 · 账号系统 + 云端 + 领取（预计 6-7 天）

> ⚠️ 这是最复杂的 Phase，估算偏保守。

**目标：** 注册登录、本地清单上云、匿名领取

**第 1-2 天：基础设施**
- [x] Cloudflare Workers + D1 + R2 配置（wrangler.toml，需填入 D1 ID）
- [x] D1 schema 部署（workers/schema.sql）
- [x] 密码哈希工具（PBKDF2，workers/lib/crypto.ts）
- [x] JWT 工具（30 天有效，workers/lib/jwt.ts，含 signJWT + verifyJWT）
- [x] auth middleware（workers/middleware/auth.ts + adminOnly.ts）

**第 3-4 天：注册登录流程**
- [x] `POST /auth/register`：用户名 + 密码 + 邀请码
- [x] `POST /auth/login` → JWT
- [x] `GET /auth/me`：拉用户信息
- [x] `PUT /auth/profile`：改昵称、头像色
- [x] `PUT /auth/password`：改密码（需输入旧密码）
- [x] 前端：注册页、登录页、个人设置页
- [x] 邀请码面板：列出我的码、是否已用

**第 5 天：云端清单**
- [x] `lib/ownerToken.ts`：浏览器生成 16 位 token 存 localStorage
- [x] `POST /lists`：创建（带 owner_id 或 owner_token）
- [x] `GET /lists/:id`：拉清单
- [x] `PUT /lists/:id`：更新（带版本号）
- [x] `DELETE /lists/:id`：删除
- [x] 前端：本地清单"上传到云"按钮（注册用户）
  - 登录用户新建清单时自动上传；编辑时 800ms debounce 同步到云端
  - 匿名清单卡片 hover 时显示 CloudUpload 图标，点击手动上传

**第 6 天：匿名领取**
- [x] `POST /claim`：把匿名清单转给注册用户（同时实现 GET /claim/preview）
- [x] 注册成功后弹窗：浏览器扫描所有匿名 ownerToken 的清单 → 让用户勾选要领取的
- [x] 领取后：`owner_id` 改成 user.id，`owner_token` 设 null，移出 30 天清理

**第 7 天：管理员后台**
- [x] 标记某账号为 `is_admin = 1`（DB 直改）
- [x] `/admin` 路由 + adminOnly middleware
- [x] 批量生成邀请码（输入数量）
- [x] 查看所有邀请码（已用 / 未用）
- [x] 撤销未用邀请码

**验收标准：**
> 用 wrangler 命令插入 5 个种子邀请码 → 用其中一个注册账号（同时收到 2 个新邀请码）→ 改昵称为"小李 🌸" → 把本地清单上传 → 注销登录、用同一邮箱无法重复注册（用户名唯一）→ 设管理员标志 → 进入 /admin 批量生成 10 个新邀请码。

---

### Phase 4 · 短链分享 + 4 级权限 + 实时同步（预计 4-5 天）

**目标：** 清单可分享，朋友实时协作

- [x] 短链生成（nanoid 8 位）
- [x] 路由 `/l/{id}`
- [x] **4 级权限校验**（中间件）：
  - 公开 → 全部放行
  - 验证账户 → 检查 JWT（已实现）
  - 仅邀请 → 检查 user.username ∈ invited_usernames（已实现）
  - 仅自己 → 检查 user.id == owner_id（已实现）
- [ ] **匿名身份弹窗**（仅公开模式）：选色 + 输昵称
- [x] **轮询同步**：3 秒拉取 + 版本号比对 + debounce 写入
  - GET ?since=N → { upToDate: true } 或全量 list；useListSync hook 每 5s 轮询；Tab 不可见时暂停；成功同步后版本号写回 store
- [x] **冲突处理**：远程版本更新时弹"保留本地/采纳远程"
  - 有 pending sync 时检测到远端更新 → 顶部黄色条；保留本地=升版本号强推；采纳远程=覆盖本地
- [x] **投票独立 API**
  - POST /votes/:moduleId；任意用户（JWT 或 anonymousId）；原子更新 D1；版本自增；PUT 时服务端 merge 保留已有投票
- [ ] **在线状态**：心跳 + 头像组
- [ ] **图片上传 R2**（仅注册用户）
- [ ] **背景图上传 R2**（仅注册用户）
- [ ] **邀请用户名输入**：fuzzy 搜索注册用户名（防输错）

**验收标准：**
> A 创建清单设"公开"→ B 匿名访问选玫瑰粉头像投票 → A 端 5 秒内更新柱状图 → A 改"验证账户"→ B 被拒 → A 改"仅邀请"加 C 用户名 → C 登录可访问，B 仍被拒。

---

### Phase 5 · 完善与发布（预计 1-2 天）

- [ ] PWA 配置
- [ ] SEO（OG 图用 Light Pink mode 截图）
- [ ] 错误页 / 空状态 / 加载状态
- [ ] 网络断开提示
- [ ] 完善 README（GIF 演示）
- [ ] **Cron Trigger**：每天凌晨清理 30 天未访问的匿名清单
- [ ] Cloudflare Pages 自动部署
- [ ] v1.0.0 tag + Release

**总开发周期估算：约 19-23 天**

---

## 6. 界面设计思路

### 6.1 整体布局

**桌面端清单页（已登录用户）：**
```
┌──────────────────────────────────────────────────────────┐
│  💌 ListGo               [☀/🌙/🌸] [@xiaoli ▼] [新建]    │
├──────────────────────────────────────────────────────────┤
│  ← 返回    今晚吃啥?      👥👥👥+1 在线    [🔐 验证] [分享] │
│  ────────────────────────────────────────────────────    │
│                                                          │
│  📝                                                [⋯]   │
│  我刚下班好累不想点外卖,几个备选,大家帮我选下吧 🥺       │
│  [图片：三个外卖选项的拼图]                              │
│                                                          │
│  📊 选哪个? (单选 · 实名 · 4 票)                  [⋯]    │
│  ○ 楼下日料           ████░ 50%   👤👤(@小李 @小王)     │
│  ○ 重庆小面           ██░░░ 25%   👤(@老张)            │
│  ○ 不吃了点杯奶茶睡觉  ██░░░ 25%   👤(@阿明)            │
│                                                          │
│  ✅ 顺便帮我提醒                                  [⋯]    │
│  □ 别忘了带垃圾下楼                                      │
│  □ 喝水                                                  │
│                                                          │
│            [+ 添加模块 ↓]                                 │
└──────────────────────────────────────────────────────────┘
```

**注册页：**
```
┌──────────────────────────────┐
│      💌 加入 ListGo          │
│                              │
│  用户名:  [_____________]    │
│  ⚠ 用户名一旦确定不可修改     │
│  密码:    [_____________]    │
│  邀请码:  [_____________]    │
│                              │
│  没有邀请码? 联系作者 → 链接 │
│                              │
│      [注册]                  │
│                              │
│  已有账号? 登录              │
└──────────────────────────────┘
```

**注册成功后弹窗（如果浏览器有匿名清单）：**
```
┌──────────────────────────────────────┐
│  欢迎,xiaoli！                        │
│                                      │
│  发现你之前创建过 3 个匿名清单,       │
│  要绑定到你的账户吗?(绑定后享受       │
│  完整权限设置,且不再 30 天清理)      │
│                                      │
│  ☑ 今晚吃啥?      (创建于 2 天前)    │
│  ☑ 周末计划       (创建于 5 天前)    │
│  ☐ 测试清单       (创建于 1 周前)    │
│                                      │
│      [跳过]   [领取选中的 (2)]        │
└──────────────────────────────────────┘
```

**点 `+ 添加模块`（移动端为底部弹层）：**
```
┌─────────────────┐
│ 选择模块类型    │
├─────────────────┤
│ ✅ 待办列表     │
│ 📊 投票        │
│ 📝 文本         │
└─────────────────┘
```

### 6.2 四套主题

**☀ Day mode（明亮）：**
```
背景 #FAFAF8 | 卡片 #FFFFFF | 主色 #10B981
文字 #1F2937 | 边框 #E5E7EB
```

**🌙 Dark mode（默认）：**
```
背景 #0F172A | 卡片 #1E293B | 主色 #34D399
文字 #F1F5F9 | 边框 #334155
```

**🌸 Light Pink mode（樱花/草莓奶昔）：**
```
背景 #FFF1F5 | 卡片 #FFFFFF | 主色 #EC4899
强调 #F472B6 | 文字 #831843 | 边框 #FCE7F3
```

**🥀 Dark Pink mode（暗夜玫瑰）：**
```
背景 #1F0A14 | 卡片 #3D1428 | 主色 #F472B6
强调 #EC4899 | 文字 #FCE7F3 | 边框 #5B1E3D
```

> 主题切换控件按顺序循环：☀→🌙→🌸→🥀→☀。OG 分享图建议用 🌸 Light Pink，最有辨识度。

### 6.3 头像颜色调色板（12 色）

```
珊瑚红 #EF7674    琥珀黄 #F59E0B    薄荷绿 #10B981
湖水蓝 #06B6D4    紫罗兰 #8B5CF6    玫瑰粉 #EC4899
深橄榄 #65A30D    天空蓝 #0EA5E9    暖橙 #F97316
靛青 #6366F1      青柠 #84CC16      石灰 #14B8A6
```

### 6.4 清单背景预设

**纯色 9 选：**
```
默认（透明） 暖米 薄荷 天蓝 浅紫 蜜桃 浅灰 墨绿 深灰
```
**自定义：** 颜色拾色器 / 背景图（匿名仅 URL，注册可上传）

---

## 7. 核心功能技术实现

### 7.1 数据结构定义

```typescript
// types/list.types.ts

export interface List {
  id: string;                    // nanoid 8 位
  title: string;
  background: ListBackground;
  modules: Module[];

  // 所有权（互斥）
  ownerId?: string;              // 注册用户的 user.id
  ownerToken?: string;           // 匿名所有者标识（浏览器 localStorage）

  // 仅注册用户的清单可设权限,匿名清单恒为 public
  permission: ListPermission;
  invitedUsernames?: string[];

  createdAt: number;
  updatedAt: number;
  lastAccessedAt: number;        // 用于 30 天清理判定
  version: number;
}

export type ListBackground =
  | { type: 'color'; value: string }
  | { type: 'image'; url: string };

export type ListPermission =
  | 'public'        // 任何人
  | 'verified'      // 仅登录用户（仅注册清单可设）
  | 'invite_only'   // 仅指定用户名（仅注册清单可设）
  | 'private';      // 仅创建者（仅注册清单可设）

export type Module = TextModule | TodoModule | VoteModule;

export interface TextModule {
  id: string;
  type: 'text';
  content: string;               // sanitized HTML
  imageUrl?: string;
}

export interface TodoModule {
  id: string;
  type: 'todo';
  subtitle?: string;
  items: TodoItem[];
}

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  doneBy?: string;               // user.id 或 anonymous-color-name
}

export interface VoteModule {
  id: string;
  type: 'vote';
  question: string;
  options: VoteOption[];
  multiSelect: boolean;
  anonymous: boolean;
}

export interface VoteOption {
  id: string;
  text: string;
}
```

```typescript
// types/user.types.ts

export interface User {
  id: string;                    // nanoid 12 位
  username: string;              // 唯一,3-20 字符,不可改
  displayName: string;           // 可改,可含 emoji
  avatarColor: string;
  inviteCodesRemaining: number;
  isAdmin: boolean;
  createdAt: number;
}

export interface InviteCode {
  code: string;
  ownerId: string | null;        // null = 官方/管理员签发
  usedById?: string;
  usedAt?: number;
  revoked?: boolean;
  createdAt: number;
}
```

### 7.2 D1 Schema

```sql
-- workers/schema.sql

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_color TEXT DEFAULT '#10B981',
  invite_codes_remaining INTEGER DEFAULT 2,
  is_admin INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE user_credentials (
  user_id TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE invite_codes (
  code TEXT PRIMARY KEY,
  owner_id TEXT,                 -- NULL = 官方签发
  used_by_id TEXT,
  used_at INTEGER,
  revoked INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (used_by_id) REFERENCES users(id)
);

CREATE TABLE lists (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  data TEXT NOT NULL,            -- JSON: { background, modules }
  owner_id TEXT,                 -- 注册用户(互斥)
  owner_token TEXT,              -- 匿名所有者(互斥)
  permission TEXT DEFAULT 'public',
  invited_usernames TEXT,        -- JSON array
  version INTEGER DEFAULT 1,
  created_at INTEGER,
  updated_at INTEGER,
  last_accessed_at INTEGER,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE votes (
  vote_module_id TEXT,
  list_id TEXT,
  user_id TEXT,
  option_ids TEXT,
  voted_at INTEGER,
  PRIMARY KEY (vote_module_id, user_id)
);

CREATE TABLE sessions (
  user_id TEXT,
  list_id TEXT,
  color TEXT,
  display_name TEXT,
  is_anonymous INTEGER DEFAULT 0,
  last_seen INTEGER,
  PRIMARY KEY (user_id, list_id)
);

CREATE INDEX idx_lists_owner ON lists(owner_id);
CREATE INDEX idx_lists_token ON lists(owner_token);
CREATE INDEX idx_lists_anon_cleanup
  ON lists(owner_id, last_accessed_at)
  WHERE owner_id IS NULL;        -- 加速 cron 清理
CREATE INDEX idx_invite_owner ON invite_codes(owner_id);
CREATE INDEX idx_sessions_list ON sessions(list_id);
```

### 7.3 浏览器匿名身份（ownerToken）

```typescript
// lib/ownerToken.ts
import { customAlphabet } from 'nanoid';

const KEY = 'listgo_owner_token';
const generateToken = customAlphabet(
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789',
  16
);

export function getOwnerToken(): string {
  let token = localStorage.getItem(KEY);
  if (!token) {
    token = generateToken();
    localStorage.setItem(KEY, token);
  }
  return token;
}

export function clearOwnerToken() {
  localStorage.removeItem(KEY);
}
```

匿名清单创建时绑定此 token，注册时浏览器扫描此 token 名下的所有清单，提供领取。

### 7.4 密码哈希（PBKDF2）

```typescript
// workers/lib/crypto.ts

export async function hashPassword(password: string, salt?: string) {
  const saltBytes = salt
    ? Uint8Array.from(atob(salt), c => c.charCodeAt(0))
    : crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' }, false, ['deriveBits']
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );

  return {
    hash: btoa(String.fromCharCode(...new Uint8Array(hashBuffer))),
    salt: btoa(String.fromCharCode(...saltBytes)),
  };
}

export async function verifyPassword(password: string, hash: string, salt: string) {
  const result = await hashPassword(password, salt);
  return result.hash === hash;
}
```

### 7.5 JWT（30 天）

```typescript
// workers/lib/jwt.ts

export async function signJWT(payload: any, secret: string) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
  const fullPayload = { ...payload, exp };

  const encode = (obj: any) =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const data = `${encode(header)}.${encode(fullPayload)}`;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigStr = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${data}.${sigStr}`;
}
```

### 7.6 Cron 清理（每日凌晨）

```typescript
// workers/cron.ts

export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    const cutoff = Date.now() - 30 * 24 * 3600 * 1000;
    const result = await env.DB.prepare(
      `DELETE FROM lists
       WHERE owner_id IS NULL AND last_accessed_at < ?`
    ).bind(cutoff).run();
    console.log(`Cleaned ${result.meta.changes} anonymous lists`);
  },
};
```

```toml
# wrangler.toml
[triggers]
crons = ["0 4 * * *"]   # 每天凌晨 4 点
```

### 7.7 简易富文本

```typescript
// components/editor/RichTextEditor.tsx
import { useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';

export function RichTextEditor({
  value, onChange,
}: { value: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={(e) => onChange(DOMPurify.sanitize((e.target as HTMLDivElement).innerHTML))}
      className="outline-none min-h-[40px] prose prose-sm"
    />
  );
}
```

---

## 8. 账号系统与权限模型

### 8.1 用户角色

| 角色 | 能做什么 |
|---|---|
| **匿名访问者** | 创建匿名清单（公开、无图片上传、30 天清理）；访问公开清单 |
| **注册用户** | 全功能：创建清单、设权限、上传图片、永久保留、签发邀请码 |
| **管理员** | 注册用户的所有 + `/admin` 后台批量生成邀请码 |

### 8.2 4 级清单权限

| 权限 | 谁可访问 | 谁可编辑 | 适用场景 |
|---|---|---|---|
| 🌐 公开 | 任何人 | 任何人 | 公开分享 |
| 🔐 验证账户 | 仅登录用户 | 仅登录用户 | 朋友圈 |
| 💌 仅邀请 | 仅指定用户名 | 同左 | 私密小群体 |
| 🔒 仅自己 | 仅创建者 | 仅创建者 | 私人草稿 |

> 匿名清单**强制公开**，不显示权限选项。

### 8.3 注册流程

```
访问 /register
  ↓
填: 用户名 + 密码 + 邀请码
  ↓
后端事务:
  ✓ 用户名 3-20 字符,字母数字下划线,唯一
  ✓ 密码 ≥ 8 字符
  ✓ 邀请码存在 && 未使用 && 未撤销
  ↓
  - 创建 user(display_name 默认 = username)
  - hash 密码存 user_credentials
  - 标记邀请码 used_by_id
  - 给新用户生成 2 个新邀请码
  ↓
返回 JWT(30 天)
  ↓
浏览器扫描 ownerToken 名下的清单 → 弹窗领取
```

### 8.4 用户名 vs 显示昵称

| 字段 | 例子 | 性质 |
|---|---|---|
| `username` | `xiaoli` | 唯一、不可改、用于登录 / @邀请 |
| `display_name` | `小李 🌸` | 可改、可含 emoji、其他用户看到的 |

注册时 `display_name = username`，用户可后续在设置页改。

### 8.5 忘记密码

无邮箱机制下，用户忘记密码后唯一恢复路径：**联系管理员**。

登录页底部有"忘记密码？联系作者"链接，跳到外部联系方式（Telegram/微博/邮件等，README 里写）。

管理员后台收到请求后，可以：
1. 重置该用户密码为临时密码（DB 直改）
2. 告知用户登录后自行修改

### 8.6 匿名 → 注册时的清单领取

**核心流程：**

1. 用户用浏览器创建若干匿名清单（每个清单 owner_token = 该浏览器的 token）
2. 用户决定注册账号
3. 注册成功后，前端：
   ```typescript
   const token = getOwnerToken();
   const orphans = await api.get(`/claim/preview?token=${token}`);
   if (orphans.length > 0) {
     showClaimDialog(orphans);  // 弹窗让用户勾选要领取的
   }
   ```
4. 用户勾选后调用 `POST /claim`：
   ```typescript
   {
     ownerToken: '...',
     listIds: ['abc12345', 'def67890'],
   }
   ```
5. 服务端事务：
   ```sql
   UPDATE lists
   SET owner_id = ?, owner_token = NULL
   WHERE id IN (?,?,...) AND owner_token = ?;
   ```
6. 这些清单从此享受完整权限设置，且不再被 30 天 cron 清理

**为什么用 ownerToken 而不是直接列出所有匿名清单？**
- 防止用户领取别人的清单（A 浏览器看不到 B 浏览器的 token）
- 浏览器自身的 token 才有所有权证明

### 8.7 管理员后台

**判定**：`users.is_admin = 1`（DB 直改激活）

**功能页面 `/admin`：**
- 批量生成邀请码（输入数量 → 生成 → 显示明文 → 复制 → 你自己分发）
- 列出所有邀请码（已用 / 未用 / 已撤销）
- 撤销未用邀请码
- （未来）重置用户密码

**冷启动：**
1. 你部署 Worker
2. 通过 wrangler 执行 SQL 给自己创建账号 + 设 is_admin = 1
3. 登录 `/admin` 生成第一批邀请码
4. 自己用其中一个码完成正式注册（之前的可以注销也可以保留）

或更简单：用 `scripts/generate-seed-codes.ts` 直接 DB 插入 20 个码，再注册。

### 8.8 防滥用补充

- 注册接口：同 IP 5 分钟内最多 3 次（防爆破）
- 登录接口：同用户名 5 次失败锁 5 分钟
- 用户名黑名单：admin / system / official / listgo / api

---

## 9. 匿名 vs 注册：能力对照

> 这张表是产品最关键的"差异化激励"。**注册的好处必须显而易见。**

| 能力 | 🚪 匿名 | ✅ 注册 |
|---|---|---|
| 创建清单 | ✅ | ✅ |
| 三种模块 | ✅ | ✅ |
| 富文本格式 | ✅ | ✅ |
| 主题切换 | ✅ | ✅ |
| 文本插图 | 仅 URL | URL + 上传 |
| 背景图 | 仅 URL | URL + 上传 |
| 权限设置 | ❌（强制公开） | ✅ 4 级 |
| 永久保留 | ❌（30 天清理） | ✅ |
| 个人主页历史 | ❌ | ✅ |
| 跨设备访问 | ❌（仅本浏览器） | ✅ |
| 投票署名显示 | 颜色昵称 | 用户名 |
| 邀请别人 | ❌ | ✅（每人 2 码） |

### 9.1 30 天清理的细节

- **触发条件**：`owner_id IS NULL AND last_accessed_at < (now - 30 天)`
- **重置时机**：任何用户访问该清单时（GET /lists/:id）更新 `last_accessed_at`
- **执行方式**：Cloudflare Cron Trigger 每日凌晨 4 点扫描清理
- **数据连带删除**：lists 行删除时连带删除 votes / sessions（数据库外键级联或事务）
- **过期前提示**：清单详情页若是匿名清单，顶部黄条提示"此清单将在 X 天后自动清理，注册账号可永久保留"

### 9.2 注册引导触点

不强推注册，但在"自然引发兴趣"的点提示：
- 创建清单后："想永久保留并设置权限? [注册]"
- 想上传图片时："上传需要账号 → [注册] / [粘贴 URL 代替]"
- 在清单详情顶部黄条（见上）
- 主页有"为什么注册"小卡片

---

## 10. 实时同步方案

### 10.1 文档同步（轮询 + 版本号）

```
客户端编辑 → debounce 500ms → POST /lists/{id}
  body: { modules, version }

服务端：
  if (db.version !== body.version) → 409 (返回最新版供 merge)
  else → version++,写入,返回新 version

客户端轮询：
  每 3 秒 GET /lists/{id}?since={localVersion}
  → 304 或返回新数据
  且每次 GET 都更新 last_accessed_at（用于 30 天计算）
```

### 10.2 投票独立同步

```
POST /votes/{voteModuleId}    body: { optionIds }
GET  /votes/{voteModuleId}    → { options: [{ id, count, voters? }] }
                              → 匿名时不返回 voters
```

### 10.3 在线状态

```typescript
POST /sessions { listId, color, displayName?, isAnonymous }
PUT  /sessions/heartbeat       // 每 10 秒
// 30 秒无心跳 = 离线
```

### 10.4 演进路径

| Stage | 方式 | 复杂度 | 延迟 |
|---|---|---|---|
| Phase 4（V1） | 3 秒轮询 | ⭐ | 1-3s |
| V1.1 升级 | SSE 服务端推送 | ⭐⭐⭐ | <500ms |
| 远期 | WebSocket + DO（需付费） | ⭐⭐⭐⭐ | 实时 |

---

## 11. 移动端体验保证

> 用户明确要求："手机端体验和电脑端一样简单顺滑"

### 11.1 触摸交互规范

- 触摸目标 ≥ 44×44px
- 避免 hover-only 交互
- viewport meta 设 `user-scalable=no`（仅清单详情页）

### 11.2 桌面 → 移动端交互替代

| 桌面端 | 移动端替代 |
|---|---|
| 模块右侧 hover 出现菜单 | 右上角始终显示 `⋯` 按钮 |
| 选区浮动工具栏 | 选中文字后底部弹出工具条 |
| 模块拖拽（鼠标） | 长按 500ms 进入拖拽（dnd-kit 支持） |
| 下拉菜单 | 底部 Bottom Sheet |
| Dialog | 全屏 Modal |
| 头像组 hover 看昵称 | 点击头像组展开列表 |

### 11.3 页面布局

- 单列纵向流
- 底部固定操作区（`+ 添加模块`、`分享`）
- 输入框自动滚到键盘上方

### 11.4 性能

- 首屏 JS < 200KB（gzip）
- 路由懒加载（auth、admin、profile）
- 图片 `loading="lazy"` + 占位骨架

### 11.5 测试设备清单

每个 Phase 必测：
- iPhone Safari（最常见）
- Android Chrome
- iPad / 平板

---

## 12. GitHub 仓库规范

### 12.1 分支策略

```
main          → 稳定版本,自动部署
└── dev       → 日常开发汇总
    ├── feat/auth-system
    ├── feat/anonymous-claim
    ├── feat/permission-levels
    └── fix/mobile-dnd
```

### 12.2 Commit（Conventional Commits）

```
feat(auth): 实现注册流程的邀请码校验
feat(claim): 添加注册后匿名清单领取弹窗
feat(theme): 添加 Light Pink + Dark Pink mode
fix(mobile): 修复 iOS 下拖拽光标错位
chore: 升级 Dexie 到 4.x
```

### 12.3 Issue 标签

| 标签 | 用途 |
|---|---|
| `bug` / `enhancement` / `good first issue` | 通用 |
| `phase-1` ~ `phase-5` | 阶段 |
| `module/todo` / `module/vote` / `module/text` | 模块 |
| `auth` / `sync` / `mobile` / `theme` / `admin` | 主题 |

### 12.4 README 必须包含

- [ ] Logo / GIF 演示（**Light Pink mode 截图最佳**）
- [ ] 起源故事（"今晚我该吃啥"）
- [ ] 在线体验链接
- [ ] **邀请码获取说明**（联系作者：xxx）
- [ ] 本地启动步骤
- [ ] Cloudflare 部署步骤
- [ ] License（MIT）

---

## 13. 测试策略

### 13.1 手动测试清单

**Phase 1：**
- [ ] 三种模块创建/编辑/删除
- [ ] 四主题切换循环
- [ ] 数据持久化

**Phase 2：**
- [ ] 富文本格式
- [ ] 图片 URL 插入
- [ ] 背景色 / 背景图 URL
- [ ] 移动端拖拽 / 长按 / 触控

**Phase 3：**
- [ ] 注册：用过的邀请码报错
- [ ] 注册：正常邀请码成功 + 收到 2 个新码
- [ ] 用户名重复报错
- [ ] 登录：错误密码报错
- [ ] 改昵称（含 emoji）
- [ ] 改密码：旧密码错报错
- [ ] 上传本地清单到云
- [ ] **领取流程**：注册前创建 3 个匿名清单，注册后弹窗显示，勾选领取后这些清单归属新用户
- [ ] **管理员**：is_admin=1 的账号可进 /admin，普通账号 403
- [ ] 批量生成邀请码

**Phase 4：**
- [ ] 4 级权限分别测（公开/验证/邀请/仅自己）
- [ ] 实时同步多端
- [ ] 投票独立同步
- [ ] R2 图片上传（仅注册用户能用）
- [ ] R2 背景图上传

**Phase 5：**
- [ ] PWA 安装
- [ ] **Cron 清理**：手动改某清单 last_accessed_at = 31 天前 + owner_id = NULL,跑 cron,该清单被删

### 13.2 未来引入

- Vitest 单元测试（auth、sync、claim 关键路径）
- Playwright E2E（注册 → 领取 → 创建 → 分享 → 朋友投票）

---

## 14. 部署方案

### 14.1 Cloudflare Pages（前端）

1. 推送到 GitHub
2. Cloudflare Dashboard → Workers & Pages → Create
3. 连接 GitHub 仓库
4. 构建：`npm run build` → `dist`
5. 自动部署
6. 默认域名：`listgo.pages.dev`

### 14.2 Workers + D1 + R2（Phase 3 启用）

```toml
# wrangler.toml
name = "listgo-api"
main = "workers/api.ts"
compatibility_date = "2025-01-01"

[[d1_databases]]
binding = "DB"
database_name = "listgo"
database_id = "xxx-uuid"

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "listgo-images"

[triggers]
crons = ["0 4 * * *"]      # 凌晨 4 点清理

# JWT_SECRET 通过 wrangler secret put 注入,不入库
```

部署：
```bash
npx wrangler d1 create listgo
npx wrangler d1 execute listgo --file=workers/schema.sql
npx wrangler r2 bucket create listgo-images
npx wrangler secret put JWT_SECRET
npx wrangler deploy
```

冷启动种子邀请码：
```bash
node scripts/generate-seed-codes.ts 20    # 生成 20 个,打印到控制台
```

### 14.3 免费额度评估

| 资源 | 免费额度 | 个人项目预估 |
|---|---|---|
| Pages 构建 | 500/月 | ~30/月 |
| Pages 流量 | 无限 | - |
| Workers 请求 | 100K/天 | <10K/天 |
| D1 读取 | 500 万/天 | <10 万/天 |
| D1 写入 | 10 万/天 | <1 万/天 |
| D1 存储 | 5 GB | <500 MB |
| R2 存储 | 10 GB | <2 GB |
| Cron Triggers | 无限 | 1 次/天 |

> 完全在免费额度内。

---

## 15. 未来扩展方向

| 功能 | 实现思路 | 难度 |
|---|---|---|
| 第三方登录（GitHub/Google） | OAuth 2.0 | ⭐⭐⭐ |
| 投票截止时间 | VoteModule 加 deadline | ⭐ |
| 待办设到期日 | TodoItem 加 dueDate | ⭐ |
| 评论 / @提醒 | 模块底部加评论区 | ⭐⭐⭐ |
| 模板库 | 静态 JSON | ⭐⭐ |
| 创建者收到投票通知 | Email Workers / 推送 | ⭐⭐⭐ |
| 多人光标同步 | Yjs + Durable Objects（需付费） | ⭐⭐⭐⭐ |
| 导出为图片 | html2canvas | ⭐⭐ |
| AI 帮你想选项 | "去哪吃" → AI 推荐 | ⭐⭐⭐ |
| AI 替朋友决定 | LLM 扮演朋友 | ⭐⭐⭐⭐ |
| 邮箱绑定（找回密码用） | 可选绑定 | ⭐⭐ |

---

## 16. 参考资源

### 库文档
- [Dexie.js](https://dexie.org/)
- [dnd-kit](https://dndkit.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Web Crypto PBKDF2](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveBits)

### 设计参考
- [Linear](https://linear.app) · 极简 UI
- [Excalidraw](https://excalidraw.com) · 协作 + 短链 + 匿名身份
- [Doodle](https://doodle.com/) / [Strawpoll](https://strawpoll.com/) · 投票 UI
- [Are.na](https://are.na) · 温柔小众的协作氛围

### 邀请码机制参考
- 早期 论坛 邀请制度

---

*本文档将随项目推进持续更新。每完成一个 Phase，在对应任务前打 ✅ 并补充遇到的问题和解决方案。*

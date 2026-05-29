# 💌 ListGo · 让朋友替你做决定 · Let friends decide for you

> 中文：朋友点开链接，帮你投票、勾待办、做决定。
> English: Share a link, let friends vote, check off todos, and help you decide.

ListGo 不是工作协作工具，**是一个让你感受被关心的小角落**。
ListGo isn't a work tool — **it's a cozy corner where friends show they care**.

🔗 **[listgo.pages.dev](https://listgo.pages.dev)**

---

## 特性 · Features

**零门槛 · Zero friction**
- 无需注册即可创建清单，链接分享给朋友直接参与
- Create a list without signing up; share the link and friends join instantly

**三种模块 · Three module types**
- 🗳️ 投票 Vote（单选 / 多选 · single or multi-choice）
- ✅ 待办 Todo（协作勾选 · collaborative check-off）
- 📝 富文本 Rich text（字体、颜色、大小 · font, color, size）

**7 种视觉风格 · 7 visual styles**（亮色 / 暗色 · light / dark）

| 风格 | Style |
|---|---|
| 🪨 粘土拟态 | Claymorphism |
| 🔮 玻璃拟态 | Glassmorphism |
| ◻ 极简主义 | Minimalism |
| ⬛ 新粗野 | Neo-Brutalism |
| 💎 质感设计 | Material |
| ◼ 包豪斯 | Bauhaus |
| 📺 复古未来 | Retrofuturism |

**账号系统 · Account system**
- 邀请码注册，清单云端持久化 · Invite-code signup, cloud persistence
- 匿名清单一键认领 · Claim anonymous lists to your account
- 多设备实时同步 · Multi-device real-time sync

**好友 & 权限 · Friends & permissions**
- 好友申请 / 通知中心 · Friend requests & notification center
- 5 级权限：公开 · 登录可见 · 邀请制 · 仅好友 · 私密
- 5 permission levels: Public · Logged-in · Invite-only · Friends-only · Private

---

## 本地开发 · Local development

```bash
npm install
npm run dev
```

Worker（API）本地调试 · Local Worker dev:

```bash
npx wrangler dev workers/api.ts
```

---

## 技术栈 · Tech stack

| 层 Layer | 技术 Tech |
|---|---|
| 前端 Frontend | React 18 · TypeScript · Vite · Tailwind CSS v4 |
| 后端 Backend | Cloudflare Workers · Hono |
| 数据库 Database | Cloudflare D1 (SQLite) |
| 存储 Storage | Cloudflare R2 |
| 部署 Deploy | Cloudflare Pages (frontend) · GitHub Actions (Worker CI) |

---

## 获取邀请码 · Get an invite code

注册需要邀请码，联系作者：Registration requires an invite code, contact:
[babyfox3100@gmail.com](mailto:babyfox3100@gmail.com)

---

## License

MIT

# 💌 ListGo · 让朋友替你做决定

> 朋友点开链接，帮你投票、勾待办、做决定。

ListGo 不是工作协作工具，**是一个让你感受被关心的小角落**。

🔗 **[listgo.pages.dev](https://listgo.pages.dev)** · [English](README.md)

---

## 特性

**零门槛**
- 无需注册即可创建清单，链接分享给朋友直接参与

**三种模块**
- 🗳️ 投票（单选 / 多选）
- ✅ 待办（协作勾选）
- 📝 富文本（自定义字体、颜色、大小）

**7 种视觉风格**（每种均支持亮色 / 暗色）

| 风格 | |
|---|---|
| 🪨 粘土拟态 Claymorphism | ◻ 极简主义 Minimalism |
| 🔮 玻璃拟态 Glassmorphism | 💎 质感设计 Material |
| ⬛ 新粗野 Neo-Brutalism | ◼ 包豪斯 Bauhaus |
| 📺 复古未来 Retrofuturism | |

**账号系统**
- 邀请码注册，清单云端持久化
- 匿名清单一键认领到账户
- 多设备实时同步

**好友 & 权限**
- 好友申请 / 通知中心
- 5 级权限：公开 · 登录可见 · 邀请制 · 仅好友 · 私密

---

## 本地开发

```bash
npm install
npm run dev
```

Worker（API）本地调试：

```bash
npx wrangler dev workers/api.ts
```

---

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 · TypeScript · Vite · Tailwind CSS v4 |
| 后端 | Cloudflare Workers · Hono |
| 数据库 | Cloudflare D1（SQLite） |
| 存储 | Cloudflare R2 |
| 部署 | Cloudflare Pages（前端）· GitHub Actions（Worker CI） |

---

## 获取邀请码

注册需要邀请码，联系作者：[babyfox3100@gmail.com](mailto:babyfox3100@gmail.com)

---

## License

MIT

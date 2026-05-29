# 💌 ListGo · 让朋友替你做决定

> "今晚我该吃啥？" —— 朋友点开链接，帮你投票、勾待办、做决定。

ListGo 不是工作协作工具，**是一个让你感受被关心的小角落**。

🔗 **[listgo.pages.dev](https://listgo.pages.dev)**

---

## 特性

**零门槛**
- 无需注册即可创建清单，链接分享给朋友直接参与

**三种模块**
- 🗳️ 投票（支持单选 / 多选）
- ✅ 待办（可勾选，支持协作）
- 📝 富文本（自定义字体、颜色、大小）

**账号系统**
- 邀请码注册，清单云端持久化
- 多设备同步，好友系统
- 匿名清单一键认领到账户

**体验细节**
- 4 套主题：☀ Day · 🌙 Dark · 🌸 Light Pink · 🥀 Dark Pink
- 实时协作（长轮询同步）
- 移动端友好

---

## 本地开发

```bash
npm install
npm run dev
```

Worker（API）本地调试需要 wrangler：

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
| 部署 | Cloudflare Pages（前端）· GitHub Actions（Worker） |

---

## 获取邀请码

注册需要邀请码，联系作者获取：[babyfox3100@gmail.com](mailto:babyfox3100@gmail.com)

---

## License

MIT

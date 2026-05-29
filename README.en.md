# 💌 ListGo · Let friends decide for you

> Share a link, let friends vote, check off todos, and help you decide.

ListGo isn't a work tool — **it's a cozy corner where friends show they care**.

🔗 **[listgo.pages.dev](https://listgo.pages.dev)** · [🌐 中文版本](README.md)

---

## Features

**Zero friction**
- Create a list without signing up; share the link and friends join instantly

**Three module types**
- 🗳️ Vote (single or multi-choice)
- ✅ Todo (collaborative check-off)
- 📝 Rich text (font, color, size)

**7 visual styles** (light / dark mode each)

| Style | |
|---|---|
| 🪨 Claymorphism | ◻ Minimalism |
| 🔮 Glassmorphism | 💎 Material |
| ⬛ Neo-Brutalism | ◼ Bauhaus |
| 📺 Retrofuturism | |

**Account system**
- Invite-code signup, cloud persistence
- Claim anonymous lists to your account
- Multi-device real-time sync

**Friends & permissions**
- Friend requests & notification center
- 5 permission levels: Public · Logged-in · Invite-only · Friends-only · Private

---

## Local development

```bash
npm install
npm run dev
```

Local Worker dev:

```bash
npx wrangler dev workers/api.ts
```

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS v4 |
| Backend | Cloudflare Workers · Hono |
| Database | Cloudflare D1 (SQLite) |
| Storage | Cloudflare R2 |
| Deploy | Cloudflare Pages (frontend) · GitHub Actions (Worker CI) |

---

## Get an invite code

Registration requires an invite code — contact: [babyfox3100@gmail.com](mailto:babyfox3100@gmail.com)

---

## License

MIT

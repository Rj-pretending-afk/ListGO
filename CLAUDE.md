# ListGo 项目须知

> 这份文件是 Claude Code 的"项目记忆"。每次会话开始时自动加载。
> 完整产品规划见 `PLANNING.md`,本文件只放工作规则和高频参考。

---

## 1. 当前阶段

**Phase 0 · 项目搭建**(尚未开始编码)

每次会话开始时,先确认当前 Phase 和上次会话留下的进度。完成任务后及时更新 `PLANNING.md` 的 checkbox。

---

## 2. 工作规则(必读)

### 2.1 推进节奏

- **严格按 PLANNING.md 的 Phase 顺序**:不超前实现后续 Phase 的功能
- 开始一个新 Phase 前,先把上一 Phase 的所有 checkbox 完成并打勾
- 不确定的设计决策**先问我**,不要擅自扩展功能范围或换方案

### 2.2 PLANNING.md 是单一事实来源

- 技术栈严格按 §3 不要替换
- 命名风格沿用文档中的示例(组件、Hook、文件名)
- 当 PLANNING.md 与实际开发出现矛盾时:**先指出冲突再问我**,不要擅自调整文档或代码
- 用户(我)同意的设计变更要**同步更新 PLANNING.md**,保持文档与代码一致

### 2.3 任务完成后必做

每完成一个 PLANNING.md 列出的子任务:
1. 把对应的 `- [ ]` 改为 `- [x]`
2. 如果实际做法与原规划有差异,在该任务下方加一行小字说明
3. 建议提交一次 git(见 §4 commit 规范)

---

## 3. 代码规范

### 3.1 TypeScript / React

- **严格模式**:`tsconfig.json` 开启 `strict: true`,不允许 `any`(除非有明确注释解释为什么)
- **函数式组件 + Hooks**:不写 class 组件
- **导出**:组件用 named export,工具函数用 default 都行;一个文件一个主导出
- **Props 类型**:用 `interface ComponentNameProps`,放在组件文件内
- **避免 inline 复杂逻辑**:超过 3 行的逻辑抽 Hook 或工具函数

### 3.2 命名

| 类型 | 风格 | 例子 |
|---|---|---|
| 组件文件 | PascalCase | `TodoModule.tsx` |
| Hook 文件 | camelCase 带 `use` 前缀 | `useList.ts` |
| 工具函数文件 | camelCase | `shortid.ts` |
| 类型文件 | `.types.ts` 后缀 | `list.types.ts` |
| CSS 类 | Tailwind 优先,自定义用 kebab-case | `vote-results-bar` |
| 常量 | UPPER_SNAKE | `MAX_TITLE_LENGTH` |

### 3.3 文件大小

- 单个 `.tsx` 文件超过 200 行就考虑拆分
- 单个 Hook 超过 100 行考虑拆分

### 3.4 注释

- **不写"做什么"注释**(代码自解释),只写"为什么这么做"
- 复杂的业务规则、不直观的 workaround 必须注释
- 不写 JSDoc 给每个参数列表(冗余,TS 类型已说明)

---

## 4. Git 规范

### 4.1 提交时机

- 完成一个 PLANNING.md 子任务 → 一次 commit
- 修复一个 bug → 一次 commit
- 不要把多个不相关变更塞一个 commit

### 4.2 Commit 消息(Conventional Commits,中文 ok)

格式:`<type>(<scope>): <描述>`

| type | 用途 |
|---|---|
| `feat` | 新功能 |
| `fix` | bug 修复 |
| `refactor` | 重构(不改变外部行为) |
| `style` | 仅样式/格式,无逻辑改动 |
| `docs` | 文档(含 PLANNING.md 更新) |
| `chore` | 依赖、配置、构建 |
| `test` | 测试相关 |

scope 例:`auth` / `editor` / `sync` / `module/vote` / `theme` / `mobile`

示例:
```
feat(theme): 实现 Light Pink 和 Dark Pink 主题变量
feat(module/vote): 投票模块支持多选切换
fix(mobile): 修复 iOS Safari 下 contentEditable 光标错位
docs: PLANNING.md 标记 Phase 1 三种模块任务完成
chore: 初始化 Vite + React + TS + Tailwind
```

### 4.3 不要做的事

- ❌ 不要 `git push --force`(除非我明确说可以)
- ❌ 不要直接提交到 `main`,所有功能走 `dev` 或 `feat/*` 分支
- ❌ 不要把密钥、JWT secret、邀请码明文提交

---

## 5. 文件 / 目录约定

### 5.1 创建文件前先确认

- 文件位置严格按 PLANNING.md §4 项目结构
- 拿不准放哪里:**先问我**,不要随意新建顶层目录

### 5.2 不要创建的内容

- 不要主动创建 README 之外的文档(除非我要求)
- 不要主动加 `examples/`、`demo/` 等示例目录
- 不要装规划外的依赖,需要新依赖时先问我

---

## 6. 沟通偏好

- **中文回复**,代码注释和 commit 可中文
- **简洁直接**:不要"好的!没问题!我来帮你..."这种开场
- **不过度铺垫**:回答问题直接给方案,需要权衡时列 2-3 个选项,不要写论文
- **承认不确定**:不知道就说不知道,不要瞎编 API 或库行为
- **代码先讲思路再贴代码**:除非是小改动

---

## 7. 安全与隐私红线

- 密码必须 PBKDF2 哈希(见 PLANNING.md §7.4),绝不明文存储
- JWT secret 通过 `wrangler secret put` 注入,绝不写进代码或 `wrangler.toml`
- 用户上传的 HTML 内容必须经 DOMPurify 净化后再存或渲染
- D1 查询全部用参数化(`prepare().bind()`),禁止字符串拼接 SQL
- R2 上传需校验文件类型和大小(防滥用)

---

## 8. 测试要求

按 PLANNING.md §13 的"手动测试清单"执行,但不要在 Phase 1-2 写自动化测试(过早优化)。

到了 Phase 3+,关键路径(注册、登录、领取、权限校验)可以补 Vitest 单测。

---

## 9. 询问清单

遇到以下情况,**先问我再动手**:

1. 想引入新的 npm 依赖(规划外的)
2. 想修改 PLANNING.md 的设计决策
3. 想跳过某个 PLANNING.md 列出的任务
4. 文件结构需要偏离 §4 项目结构
5. 两个方案各有优劣,需要权衡
6. 用户(我)的需求与 PLANNING.md 冲突

---

## 10. 高频参考速查

### 10.1 4 主题 CSS 变量(对照 PLANNING.md §6.2)

```css
/* Day */     bg:#FAFAF8  card:#FFFFFF  primary:#10B981  text:#1F2937
/* Dark */    bg:#0F172A  card:#1E293B  primary:#34D399  text:#F1F5F9
/* L.Pink */  bg:#FFF1F5  card:#FFFFFF  primary:#EC4899  text:#831843
/* D.Pink */  bg:#1F0A14  card:#3D1428  primary:#F472B6  text:#FCE7F3
```

主题循环顺序:☀ Day → 🌙 Dark → 🌸 Light Pink → 🥀 Dark Pink

### 10.2 ID 生成(对照 PLANNING.md §7)

| 用途 | 长度 | 字符集 |
|---|---|---|
| 清单短链 ID | 8 位 | 字母+数字(去歧义) |
| 用户 ID | 12 位 | 字母+数字(去歧义) |
| 邀请码 | 12 位 | 大写字母+数字 |
| ownerToken | 16 位 | 字母+数字(去歧义) |

### 10.3 关键限制值

- 用户名:3-20 字符,`[a-zA-Z0-9_]`
- 密码:≥ 8 字符
- 邀请码:每用户初始 2 个
- JWT 有效期:30 天
- 匿名清单清理:最后访问 30 天后
- 心跳:10 秒一次,30 秒超时
- 同步轮询:3 秒
- 写入 debounce:500ms

---

## 11. 卡住时怎么办

如果遇到技术问题搞不定:

1. 先尝试 3 个不同方向(包括查文档、改思路、换库)
2. 仍然不行 → **明确告诉我"我卡在 X 上,尝试过 A/B/C,你想我继续还是换方案"**
3. 不要"假装解决"或塞个能跑但有 bug 的版本上来
4. 不要无限循环改同一段代码

---

*维护提示:这份文件本身可以随项目演进更新。每个 Phase 开始时检查"当前阶段"是否最新。*

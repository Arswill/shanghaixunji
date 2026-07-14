# 山海寻迹 — Cloudflare Pages 部署指南

本指南说明如何将「山海寻迹」项目从 Vercel 迁移/部署到 **Cloudflare Pages**。前端（React + Vite）作为静态站点托管，聊天接口 `/api/chat` 由 **Pages Functions** 承载，并完整复用现有 `api/_shared.ts` 的多供应商回退逻辑。

> 部署过程**不会修改** `api/` 目录中的任何文件。Vercel 与 Cloudflare 两套部署可以并存。

---

## 目录

1. [工作原理](#一工作原理)
2. [前置条件](#二前置条件)
3. [项目结构说明](#三项目结构说明)
4. [安装部署工具](#四安装部署工具)
5. [配置环境变量](#五配置环境变量)
6. [构建前端](#六构建前端)
7. [SPA 路由与静态资源优化（重要）](#七spa-路由与静态资源优化重要)
8. [本地预览](#八本地预览)
9. [部署到 Cloudflare Pages](#九部署到-cloudflare-pages)
10. [验证部署](#十验证部署)
11. [环境变量速查表](#十一环境变量速查表)
12. [常见问题 FAQ](#十二常见问题-faq)

---

## 一、工作原理

| 关注点 | Vercel（原方案） | Cloudflare Pages（本方案） |
| --- | --- | --- |
| 静态站点 | `apps/web/dist` | `apps/web/dist`（`pages_build_output_dir`） |
| 聊天接口 | `api/chat.ts`（Serverless Function） | `functions/api/chat.ts`（Pages Function） |
| 共享逻辑 | `api/_shared.ts` | **同文件，原样复用** |
| 入口形式 | `export default (req, res)` | `export const onRequestPost` / `onRequestOptions` |
| 环境变量来源 | `process.env`（自动注入） | `context.env` → 由适配层写入 `process.env` |

关键点：`api/_shared.ts` 通过 `process.env` 读取密钥与配置。在 Cloudflare Workers 运行时中，环境变量通过 `context.env` 传入，而非 `process.env`。因此 `functions/api/chat.ts` 在每次请求开始时调用 `syncEnv(context.env)`，把绑定同步到 `process.env`，使 `_shared.ts` 无需任何改动即可运行。

`_shared.ts` 仅使用标准 Web API（`fetch`、`ReadableStream`、`TextEncoder`/`TextDecoder`、`AbortSignal.timeout`、`Response`），这些在 Workers 运行时中均可用。配合 `nodejs_compat` 兼容标志后 `process` 全局也可用，故迁移零改动。

路由映射：文件 `functions/api/chat.ts` 自动对应 `POST|OPTIONS /api/chat`，与前端现有调用地址完全一致。

---

## 二、前置条件

1. **Node.js** ≥ 20（建议 LTS 版本）。
2. 一个 **Cloudflare 账号**（免费额度即可）：https://dash.cloudflare.com/sign-up
3. 至少一个 LLM 供应商的 API Key（DeepSeek / 小米 MiMo / 阿里云 DashScope，任选其一）。
4. 已在本地能成功构建前端：`cd apps/web && npm install && npm run build`。

---

## 三、项目结构说明

部署相关的目录与文件如下（其余目录已省略）：

```
shanghaixunji/
├── api/
│   ├── _shared.ts        # 共享聊天代理逻辑（Vercel 与 Cloudflare 共用，勿改）
│   └── chat.ts           # Vercel Serverless Function（Vercel 专用，勿改）
├── apps/web/             # 前端（React + Vite）
│   ├── dist/             # 构建产物（Pages 静态资源来源）
│   └── public/           # 静态资源目录（_redirects / _routes.json 放这里）
├── functions/            # ← Cloudflare Pages Functions（新增）
│   └── api/
│       └── chat.ts       # Pages Function 适配层（复用 ../../api/_shared）
├── docs/
│   └── cloudflare-deploy.md   # 本文档
├── wrangler.toml         # ← Cloudflare 配置（新增）
└── vercel.json           # Vercel 配置（保留，不影响 Cloudflare）
```

---

## 四、安装部署工具

`wrangler` 是 Cloudflare 官方 CLI，用于本地预览、密钥管理与部署。

推荐全局安装：

```bash
npm install -g wrangler
```

或每次用 `npx` 调用（无需全局安装）：

```bash
npx wrangler --version
```

首次使用需登录（会打开浏览器授权）：

```bash
npx wrangler login
```

> 可选：为获得本地 TypeScript 类型检查，安装类型包：
> ```bash
> npm install -D @cloudflare/workers-types
> ```
> `functions/api/chat.ts` 中的 `PagesFunction` 类型即来自该包。`wrangler` 部署时用 esbuild 打包，会剥离类型，不安装也能成功部署。

---

## 五、配置环境变量

Cloudflare Pages 的环境变量分为两类：

- **加密密钥（Secret）**：API Key 等敏感信息，**必须**用加密方式设置，绝不可写入 `wrangler.toml`。
- **明文变量（Vars）**：如 `LLM_PROVIDER`、`ALLOWED_ORIGIN`，可写入 `wrangler.toml` 的 `[vars]`，或在仪表盘设置。

### 5.1 设置加密密钥

在项目根目录依次执行（会提示输入对应 Key 的值）：

```bash
# 推荐至少配置一个；配置多个可启用自动回退
npx wrangler pages secret put DEEPSEEK_API_KEY
npx wrangler pages secret put MIMO_API_KEY
npx wrangler pages secret put DASHSCOPE_API_KEY
```

> 若尚未创建 Pages 项目，首次 `secret put` 时 wrangler 会询问项目名，输入 `shanghaixunji`。也可先在仪表盘创建项目（见第九节）。

### 5.2 设置明文变量（可选）

以下两个变量在 `functions/api/chat.ts` 中已有合理默认值，通常**无需额外设置**：

- `ALLOWED_ORIGIN`：默认 `*`（允许任意来源跨域）。生产环境若需收紧，可设为你的域名，如 `https://shanghaixunji.pages.dev`。
- `LLM_PROVIDER`：默认按优先级 `deepseek → mimo → dashscope` 自动选择已配置的供应商。

如需显式指定，二选一：

**方式 A — 写入 `wrangler.toml`（适合纳入版本管理）：**

```toml
[vars]
LLM_PROVIDER = "deepseek"
ALLOWED_ORIGIN = "*"
```

**方式 B — 仪表盘设置（适合覆盖版本库默认值）：**

进入 Pages 项目 → **Settings** → **Environment variables** → 添加 `LLM_PROVIDER` / `ALLOWED_ORIGIN`（类型选 **Plaintext**）。

---

## 六、构建前端

Cloudflare Pages 不会自动运行前端构建，需要先生成 `apps/web/dist`：

```bash
cd apps/web
npm install
npm run build
```

构建成功后 `apps/web/dist/` 即为静态资源目录，与 `wrangler.toml` 中的 `pages_build_output_dir = "apps/web/dist"` 对应。

> 若用 Git 连接方式部署（见第九节），可在仪表盘里配置构建命令，由 Cloudflare 自动构建。

---

## 七、SPA 路由与静态资源优化（重要）

Vercel 通过 `vercel.json` 的 `rewrites: [/(.*) → /index.html]` 实现 SPA 路由回退；Cloudflare Pages 需用 `_redirects` 实现等价效果，并用 `_routes.json` 限定 Functions 的生效范围（避免静态资源请求也消耗 Functions 调用配额）。

在 `apps/web/public/` 下新建两个文件（Vite 构建时会自动复制到 `dist/` 根目录）：

### 7.1 `apps/web/public/_routes.json`

仅让 `/api/*` 走 Functions，其余全部作为静态资源直接由 CDN 返回：

```json
{
  "version": 1,
  "include": ["/api/*"],
  "exclude": []
}
```

### 7.2 `apps/web/public/_redirects`

未命中静态资源的路径（如客户端路由 `/map`、`/creature/xxx`）回退到 `index.html`，状态码 `200`（rewrite，不改变地址栏）：

```
/*    /index.html   200
```

> 优先级说明：`/api/*` 因 `_routes.json` 的 `include` 命中，优先由 Pages Function 处理，**不会**被 `/*` 回退规则误伤；其余路径先查静态资源，未命中再走 `_redirects` 回退。因此聊天接口与 SPA 路由可同时正常工作。

创建后重新执行第六节的构建，确保 `dist/_routes.json` 与 `dist/_redirects` 已生成。

---

## 八、本地预览

在项目根目录用 `wrangler pages dev` 本地预览（会同时加载 Functions 与静态资源）：

```bash
npx wrangler pages dev apps/web/dist --compatibility-date=2026-07-15 --compatibility-flags=nodejs_compat
```

本地预览的环境变量可在命令行用 `--var` 传入（密钥也可用 `--binding`，或先 `wrangler pages secret put`）：

```bash
# PowerShell 示例
$env:DEEPSEEK_API_KEY="sk-xxxxx"
npx wrangler pages dev apps/web/dist --compatibility-date=2026-07-15 --compatibility-flags=nodejs_compat --var DEEPSEEK_API_KEY:$env:DEEPSEEK_API_KEY
```

预览服务默认在 `http://localhost:8788`。访问 `http://localhost:8788/api/chat` 用 `POST` 测试接口（见第十节）。

> 也可以直接 `cd apps/web && npm run dev` 跑纯前端 Vite 开发服务器，并配合 `apps/web/dev-server.ts` 本地代理聊天接口；该路径与 Cloudflare 部署无关，保持原样即可。

---

## 九、部署到 Cloudflare Pages

有两种方式，任选其一。

### 方式 A：CLI 直接部署（最快）

确保已完成第六节构建，然后在项目根目录执行：

```bash
npx wrangler pages deploy apps/web/dist --project-name=shanghaixunji
```

`wrangler` 会自动识别项目根的 `wrangler.toml`、`functions/` 目录并打包 Functions。首次部署时若项目不存在，会提示创建，输入 `shanghaixunji` 即可。部署完成后会输出形如 `https://shanghaixunji.pages.dev` 的访问地址。

> 若 `wrangler.toml` 中已设置 `pages_build_output_dir`，也可省略路径参数直接执行 `npx wrangler pages deploy`。但**不会**自动触发前端构建，需先手动 `npm run build`。

### 方式 B：Git 连接（推荐长期维护）

1. 将代码推送到 GitHub/GitLab 仓库。
2. 进入 Cloudflare 仪表盘 → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**。
3. 选择仓库后配置：
   - **Framework preset**：`Vite`
   - **Build command**：`cd apps/web && npm install && npm run build`
   - **Build output directory**：`apps/web/dist`
   - **Root directory**：`/`（项目根）
4. 在同一页 **Environment variables** 中加入：
   - `DEEPSEEK_API_KEY` / `MIMO_API_KEY` / `DASHSCOPE_API_KEY`（类型选 **Encrypt**）
   - 可选 `LLM_PROVIDER`、`ALLOWED_ORIGIN`（类型选 **Plaintext**）
5. 点击 **Save and Deploy**。此后每次推送代码即自动构建部署。

> Git 连接方式下，`wrangler.toml` 与 `functions/` 目录会被自动识别；`_routes.json`、`_redirects` 来自 `apps/web/public/` 并随构建进入 `dist/`。

---

## 十、验证部署

部署成功后，访问 `https://shanghaixunji.pages.dev`（或你绑定的自定义域名）。

### 10.1 验证页面

打开首页，神兽对话、地图、3D 模型等应正常加载；直接访问客户端路由（如刷新 `/map`）不应出现 404（验证 `_redirects` 生效）。

### 10.2 验证聊天接口

用 `curl` 发起一次非流式请求（替换为实际神兽字段）：

```bash
curl -X POST https://shanghaixunji.pages.dev/api/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"creature\":{\"name\":\"九尾狐\",\"source\":\"《南山经》\",\"description\":\"青丘之兽\",\"original_text\":\"其状如狐而九尾\",\"modern_location\":\"青丘山\"},\"messages\":[{\"role\":\"user\",\"content\":\"你是谁？\"}]}"
```

期望返回：`{"content":"...文言回答..."}`。若未配置任何 Key，则返回 `{"content":"","offline":true}`（前端据此进入离线模式）。

验证流式（SSE）：

```bash
curl -N -X POST https://shanghaixunji.pages.dev/api/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"creature\":{...},\"messages\":[{\"role\":\"user\",\"content\":\"你好\"}],\"stream\":true}"
```

应逐块收到 `data: {"token":"..."}`，最后以 `data: [DONE]` 结束。

### 10.3 验证 CORS 预检

```bash
curl -i -X OPTIONS https://shanghaixunji.pages.dev/api/chat -H "Origin: https://example.com" -H "Access-Control-Request-Method: POST"
```

期望返回 `204 No Content`，并带有 `Access-Control-Allow-Origin` 等头。

---

## 十一、环境变量速查表

| 变量名 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `DEEPSEEK_API_KEY` | Secret | 任选其一 | — | DeepSeek 接口密钥 |
| `MIMO_API_KEY` | Secret | 任选其一 | — | 小米 MiMo 接口密钥 |
| `DASHSCOPE_API_KEY` | Secret | 任选其一 | — | 阿里云 DashScope(qwen-max) 密钥 |
| `LLM_PROVIDER` | Var | 否 | 按优先级自动 | `deepseek` / `mimo` / `dashscope` |
| `ALLOWED_ORIGIN` | Var | 否 | `*` | 允许跨域的来源 |

供应商优先级（无 `LLM_PROVIDER` 时）：**DeepSeek → MiMo → DashScope**，自动跳过未配置密钥的供应商；某个供应商失败会自动尝试下一个。

---

## 十二、常见问题 FAQ

**Q1：为什么部署后接口返回 `{"content":"","offline":true}`？**
A：表示未配置任何 API Key。检查是否执行了 `npx wrangler pages secret put ...`，并在 Cloudflare 仪表盘 → 项目 → Settings → Environment variables 中确认 Production 环境下确实存在密钥。Git 连接方式部署时，密钥必须在部署**之前**于仪表盘配置好。

**Q2：`process.env` 在 Workers 里可用吗？**
A：开启 `compatibility_flags = ["nodejs_compat"]` 后，`process` 全局可用，`process.env` 可读写。`functions/api/chat.ts` 已在每次请求把 `context.env` 同步到 `process.env`，故 `api/_shared.ts` 无需改动。

**Q3：`nodejs_compat` 在 `wrangler.toml` 里怎么写？**
A：使用 `compatibility_flags = ["nodejs_compat"]`（`wrangler.toml` 中无 `nodejs_compat = true` 这种写法，`compatibility_flags` 是官方正确字段）。本仓库 `wrangler.toml` 已配好。

**Q4：`functions/api/chat.ts` 与 `api/chat.ts` 会冲突吗？**
A：不会。`api/` 是 Vercel 专用，`functions/` 是 Cloudflare Pages 专用，两套部署互不影响。共享逻辑集中在 `api/_shared.ts`，被两端各自引用。

**Q5：直接访问 SPA 子路由（如 `/map`）报 404？**
A：缺少 `_redirects`。按第七节在 `apps/web/public/_redirects` 添加 `/* /index.html 200` 并重新构建部署。

**Q6：免费额度够用吗？Cloudflare Pages Functions 计费？**
A：免费额度含每日 100,000 次 Functions 调用与无限静态请求。第七节的 `_routes.json` 把静态资源排除在 Functions 之外，能显著降低调用次数。若仍担心超额，仪表盘可设置每日调用上限。

**Q7：如何切换到自定义域名？**
A：仪表盘 → Pages 项目 → **Custom domains** → Set up a custom domain。绑定后建议把 `ALLOWED_ORIGIN` 改为该域名以收紧 CORS。

**Q8：本地 `wrangler pages dev` 报找不到 `process`？**
A：确认命令带了 `--compatibility-flags=nodejs_compat`。线上部署由 `wrangler.toml` 自动生效，无需手动传参。

---

## 附：相关文件位置

- 适配层：`functions/api/chat.ts`
- 共享逻辑（勿改）：`api/_shared.ts`
- Cloudflare 配置：`wrangler.toml`
- SPA/路由：`apps/web/public/_routes.json`、`apps/web/public/_redirects`
- 本文档：`docs/cloudflare-deploy.md`

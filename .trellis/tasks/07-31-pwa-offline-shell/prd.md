# PWA offline shell with cached data

## Goal

把本主题做成可安装、回访更快的 PWA：断网时仍能按方案 A 打开部分页面并展示上次缓存数据；配合轻量路由/状态过渡，接近原生壳体验。不包含推送。

## Background

- 半套 PWA 已有（manifest 链、mobile-web-app meta），无 Service Worker；图标仅为 `/favicon.ico`，难满足可安装标准。
- Vite 8 + React 19；无 `vite-plugin-pwa`。
- Komari `web/public/public.go` 在受限页剥离  
  `<script id="vite-plugin-pwa:register-sw" src="/registerSW.js"></script>` → 主题必须用 **vite-plugin-pwa** 的标准注册脚本。
- 主题 `dist/` 挂站点根；`/sw.js`、`/manifest.json`、图标可从主题包提供。
- 业务数据几乎全在内存：React Query（默认 30s / 5min）、`wsStore` 无持久化；`localStorage` 只服务偏好/外观/汇率。
- 路由：`/` Home（eager）、`/instance/:uuid`、`/assets`、`/traffic`、404；ThemeManage 为 `/?view=theme-manage`。
- 现有动效几乎只有 skeleton pulse 与少量 color transition。

## Decisions

| ID | 决策 | 结论 |
|----|------|------|
| D1 | 缓存强度 | 方案 2：加强 precache 壳 + 关键首屏/路由 chunk |
| D2 | 离线页面与保真度 | **方案 A**（见 R4） |
| D3 | 动画 | **方案 A**：轻量原生感，无大型动画库 |
| D4 | 推送 | 不做 |
| D5 | 快照策略（技术默认） | 全站节点只保留**最新一份**；实例按 LRU 最多 **20** 个 uuid；records 仅缓存该 uuid **上次成功** 的 load/ping（当前 hours）；Assets/Traffic 各保留最近一次成功结果；展示无硬 TTL，超过 **24h** 文案标「较旧」 |

## Requirements

### R1 — Installable PWA shell
- 完整 manifest：名称对齐主题、192/512 PNG 图标、`display: standalone`、`start_url`/`scope` `/`、theme/background color。
- `vite-plugin-pwa` 生成并注册 SW（含 `registerSW.js` + `id="vite-plugin-pwa:register-sw"`），与 Komari strip 兼容。

### R2 — Revisit / offline assets
- Precache：入口 HTML 关联资源、字体、图标、Home 相关 bundle、以及 Instance/Assets/Traffic 等关键 chunk（在体积可接受前提下尽量 include）。
- Runtime：静态资源 cache-first / stale-while-revalidate；**`/api/*` 与 WebSocket network-only（不写入业务成功缓存）**。
- 主题发版后 SW 可更新，避免永久卡旧壳（prompt 或静默 activate + reload 策略在 design 定一种并测）。

### R3 — Offline storage
- 应用层持久化上次监控快照（IndexedDB 为主）。
- 在线成功路径写入；启动/离线时读出。
- 全局可感知离线态 + 数据时间戳；超过 24h 标「较旧」。
- 恢复在线后回到 live（store 继续 hydrate、query 正常 refetch）。

### R4 — Offline surfaces（方案 A）
- **Home**：完整上次节点快照（meta + 关键 metrics/online）。
- **Instance**：仅曾成功加载过的 uuid 展示缓存 meta + 上次图表；否则明确空态（需联网）。
- **Assets / Traffic**：可进壳；有缓存展示，无则需联网提示。
- **ThemeManage / 写操作**：不保证离线可写。

### R5 — Motion（方案 A）
- 路由切换短过渡（fade 或轻位移，~200ms 级）。
- 离线横幅出现/消失过渡。
- 尊重 `prefers-reduced-motion: reduce`（过渡关闭或瞬时）。
- 不引入 framer-motion 等大型库；CSS（+ 必要时极小封装）即可。

## Out of Scope

- Web Push。
- 伪造实时数据或隐瞒离线。
- 从未打开过的实例预缓存图表。
- 离线保存主题设置等写路径。
- 修改 Komari 后端（除非主题无法规避的 SW 服务缺陷）。
- 复杂共享元素 / 全站 View Transitions 体系（属动画方案 B，已否决）。

## Acceptance Criteria

- [ ] AC1：localhost/HTTPS 下 manifest + 图标满足可安装检查；standalone 可启动。
- [ ] AC2：二次冷/温访问静态资源走 SW 缓存；发版后旧 SW 可被替换，不永久卡死。
- [ ] AC3：在线浏览首页后断网刷新：首页仍显示上次节点快照 + 离线提示 + 缓存时间。
- [ ] AC4：曾打开的实例断网可进并见缓存图表/meta；未打开过的实例见空态文案。
- [ ] AC5：Assets/Traffic 断网可进壳；有/无缓存行为符合 R4。
- [ ] AC6：恢复网络后首页/实例回到 live（指标继续更新或 query 成功刷新）。
- [ ] AC7：路由切换与离线横幅有轻量过渡；`prefers-reduced-motion` 下无强动画。
- [ ] AC8：`npm run build` / `package` 产物含 SW、workbox、manifest、图标；typecheck/lint/相关测试通过。

## Technical Notes

- 插件：`vite-plugin-pwa@^1.3`（peer 含 Vite 8）。
- 业务：`wsStore` 快照 + 选择性 React Query 持久化（records / assets / traffic / 可选 public）。
- 详见 `design.md`、`implement.md`。
`)
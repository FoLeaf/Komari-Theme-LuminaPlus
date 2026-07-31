# Design: PWA offline shell with cached data

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  index.html + vite-plugin-pwa registerSW.js                 │
│  Service Worker (Workbox): precache shell + runtime static  │
│  /api/* + WS → NetworkOnly                                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  App                                                        │
│  - online/offline signal (navigator + events + optional     │
│    API failure streak)                                      │
│  - OfflineBanner (timestamp, stale-if->24h)                 │
│  - Route transition wrapper around <Outlet />               │
└───────┬─────────────────────────────┬───────────────────────┘
        │                             │
        ▼                             ▼
┌───────────────────┐       ┌───────────────────────────────┐
│ wsStore           │       │ React Query                   │
│ + offlineSnapshot │       │ + selective IDB persist       │
│ (meta/metrics/    │       │ records / assets / traffic    │
│  order)           │       │ (+ public config optional)    │
└─────────┬─────────┘       └───────────────┬───────────────┘
          │                                 │
          └────────────► IndexedDB ◄────────┘
               db: komari-theme-offline
```

## PWA / Service Worker

### Plugin
- `vite-plugin-pwa` 1.x，`registerType: "autoUpdate"`（发版后静默接管；首屏可 `onNeedRefresh` 若需提示，默认 auto 降低主题用户操作成本）。
- `manifest` 由插件生成或维护 `public/manifest.webmanifest` / 插件内联；**替换**现有简陋 `public/manifest.json`，避免双 manifest 冲突（build 只保留一份，`index.html` 链接一致）。
- `workbox.navigateFallback: "/index.html"`（或插件默认）保证 SPA 深链离线可开。
- `runtimeCaching`:
  - 同源静态（js/css/woff2/png/svg/ico）：`StaleWhileRevalidate` 或 `CacheFirst`（带 revision 的 precache 优先）。
  - `/api/**`：`NetworkOnly`。
  - 不缓存 WebSocket。
- `includeAssets` / `globPatterns`：尽量纳入 Instance/Assets/Traffic chunks 与字体、图标。
- 注册脚本必须保留 Komari 可 strip 的标记：  
  `id="vite-plugin-pwa:register-sw"` + `src="/registerSW.js"`。

### Icons
- 新增至少 `pwa-192x192.png`、`pwa-512x512.png`（及可选 maskable）。
- 来源：主题品牌色底 + 简标或现有 preview 裁切；不依赖仅 favicon.ico。
- `apple-touch-icon` 指向 180/192 PNG，不再指向 ico 冒充 png。

### Manifest fields
- `name`: 主题全名（如 Komari-Theme-LuminaPlus-19y 或更短产品名）
- `short_name`: LuminaPlus / Komari 等 ≤12 字符级
- `lang`: zh-CN
- `display`: standalone
- `start_url`: `/`
- `scope`: `/`
- `theme_color` / `background_color`: 与现有 dark 默认对齐（`#000000`），可随外观文档说明不动态改 manifest

## Offline data layer

### Store: IndexedDB `komari-theme-offline`
Suggested object stores:

| Store | Key | Value |
|-------|-----|-------|
| `meta` | `'home'` | `{ savedAt, version, order, metaByUuid, metricsByUuid }` — **无** trafficTrends 环形缓冲（可重建空） |
| `instanceMeta` | uuid | `{ savedAt, info 摘要 }` 可选若 home 已含则可省略 |
| `queries` | queryKey hash | `{ savedAt, queryKey, data }` 用于 records/assets/traffic |

`version` 字段便于结构迁移；不兼容则清空该 store。

### wsStore integration
1. 在线且 `hydrated` 且有节点时，**防抖**（如 2–5s）写入 `meta.home`。
2. 启动：`getNodes` 失败或 `navigator.onLine === false` 时，若 IDB 有快照 → 注入 state、`hydrated=true`、标记 `source: 'cache'`。
3. 在线成功拉取后覆盖内存与 IDB，清除 cache 展示态。
4. `failureStreak` 高且已有缓存：可保持展示缓存并升离线/降级提示（与纯 `onLine` 互补，避免 captive portal 误判）。

### React Query
- 不为全局所有 query 开 persist（避免 me/auth 等敏感或易过期键乱持久化）。
- 白名单 key 前缀：
  - `["records", ...]`
  - `["traffic-stats", ...]` 若 traffic 页使用
  - assets 页所用 queryKey
  - 可选 `["public"]` 以便离线壳读站点名（注意 private_site 逻辑）
- 每键只保留最新成功 data；实例 records 按 uuid LRU **最多 20**（写时淘汰最旧 uuid 的 records 键）。
- `maxAge`：可读 7 天仍展示，UI 在 >24h 显示「较旧」；超 7 天可丢弃。

### Online signal
- `useOnlineStatus()`：`navigator.onLine` + `online`/`offline` 事件。
- 派生 `isOfflineUi = !online || (hasCache && store degraded)` — 具体阈值在实现时保持简单：**优先 navigator**，API 全失败且有缓存时横幅文案可写「无法同步」而非仅「离线」。

### UI
- `OfflineBanner`：固定在 `AppShell` main 顶部（或 floating），文案示例：  
  `离线模式 · 数据截至 昨天 18:32` / `数据较旧 · …`  
- Instance 无缓存：现有错误区扩展为「该实例尚无离线缓存，请联网后打开一次」。
- Assets/Traffic 无数据：页内空态，不整页死 Spinner。

### Private site
- 未登录且 `private_site`：仍走 `PrivateSiteGate`（与现网一致）。
- 已能看到数据的会话：断网后允许继续看 **本机** 缓存快照（设备本地，不新增服务端泄露面）。

## Motion (方案 A)

- `AppShell` 内对 `<Outlet />` 包一层 `key={pathname}` 的过渡容器：
  - CSS：`opacity` + 轻微 `translateY`（4–8px），`transition ~180–220ms`。
  - `@media (prefers-reduced-motion: reduce)`：`transition: none`。
- `OfflineBanner`：`grid-template-rows` 或 max-height/opacity 过渡，避免布局猛跳。
- 不引入动画库；不使用跨路由 shared element。

## Compatibility & packaging

- `npm run build` 产出 `dist/sw.js`、`workbox-*.js`、`registerSW.js`、manifest、icons。
- `scripts/package-zip.mjs` 已 walk 整个 `dist/`，一般无需改；验证 zip 内含 SW。
- Dev：`vite-plugin-pwa` devOptions 可选关闭 SW，避免干扰 HMR；`?mock=1` 仍可用。

## Risks

| Risk | Mitigation |
|------|------------|
| SW 缓存旧主题 | autoUpdate + precache revision；验收 AC2 |
| 缓存过大 | 不存 trafficTrends；LRU 20 实例；query 白名单 |
| 离线误显示空白 Home | 启动先尝试 IDB hydrate，再网络 |
| 私有站缓存 | 沿用 PrivateSiteGate；仅已授权会话路径展示 |
| mime/SW 在部分反代 | 依赖 Komari 根路径静态；若失败记 research，尽量主题侧 |

## Rollback

- 移除 plugin 与 offline 模块、恢复旧 manifest 即可；IDB 可残留无害，或 bump version 丢弃。
`)
# Implement: PWA offline shell with cached data

## Checklist

### 1. PWA foundation
- [x] 添加 `vite-plugin-pwa`（及所需 workbox peer，按 npm 解析）。
- [x] 配置 `vite.config.ts`：manifest、icons、workbox precache/runtime、`navigateFallback`、API NetworkOnly。
- [x] 新增 192/512（可选 maskable）PNG 到 `public/`。
- [x] 更新/替换 `manifest` 与 `index.html` 的 manifest、apple-touch-icon、icon 链接。
- [x] 确认产物含 `registerSW.js` 且带 `vite-plugin-pwa:register-sw` id。

### 2. Offline persistence
- [x] 新增 IDB 封装（如 `src/services/offlineDb.ts`）。
- [x] `wsStore`：成功 hydrate/更新后防抖写入 home 快照；启动/失败时读快照恢复。
- [x] 导出/订阅「数据来源 + savedAt」供 UI。
- [x] React Query：白名单 persist（records、assets、traffic 相关）；LRU 20 uuid；maxAge 7d。
- [x] `useOnlineStatus` + `OfflineBanner` 接入 `AppShell`。
- [x] Instance / Assets / Traffic 空态与有缓存分支文案。

### 3. Motion
- [x] Outlet 路由短过渡 CSS + reduced-motion。
- [x] Banner 显隐过渡。

### 4. Tests & validation
- [x] 单测：offlineDb 序列化/LRU；纯函数层。
- [x] 合约/源码测试：PWA / OfflineBanner / route-transition。
- [x] `npm run typecheck` / `lint` / `test` / `build`。
- [ ] 手动：build preview 下 DevTools Application → SW、Offline 勾选验证 AC3–AC6。

### 5. Docs / task hygiene
- [ ] 若有可复用约定，任务结束后再考虑 `trellis-update-spec`（非阻塞开工）。

## Validation commands

```bash
npm run typecheck
npm run lint
npm run test
npm run build
# optional package:
npm run package
```

## Risky files

- `vite.config.ts` — 构建与 SW 入口
- `index.html` / `public/manifest*` — 安装元数据
- `src/services/wsStore.ts` — 首页数据正确性
- `src/services/queryClient.ts` / `src/main.tsx` 或 `App.tsx` — persist 挂载点
- `src/components/shell/AppShell.tsx` — 横幅与过渡、离线 UX
- `src/pages/Instance.tsx`、Assets、Traffic — 空态

## Rollback points

1. 仅 PWA 插件可独立回退（保留 offline 或反之）。
2. wsStore 快照读写可用 feature 开关或删除 hydrate-from-cache 分支快速禁用。

## Before `task.py start`

- [x] prd 决策 D1–D5 已定
- [x] design / implement 已写
- [ ] 用户批准本最终规划摘要
`)

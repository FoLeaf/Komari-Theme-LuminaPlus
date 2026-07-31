# Komari-Theme-LuminaPlus-19y

当前版本 **v1.2.6**。基于 [komari-theme-Lumina](https://github.com/stqfdyr/komari-theme-Lumina) 的增强分支，在本仓库中以 **LuminaPlus-19y** 身份继续维护。感谢原作者 [stqfdyr](https://github.com/stqfdyr) 开源 Lumina 主题。

由于项目在 1.1.10 版本更名，请大家**重新在 Komari 添加新的主题仓库地址**并重新配置，带来不便请谅解。

一直以来，我都比较支持这样一个观点：**如果有比较特殊的需求，并且自己具备相关能力，最好可以进行二次开发**。原因主要有几点：

1. **需要从整体方向出发进行设计和维护。**  
   产品的定位、使用逻辑以及整体体验需要保持一致，而每个人的审美、习惯和需求都会有所不同。毕竟「众口难调」，不可能完全满足每一位用户的个性化需求。
2. **技术栈和精力有限。**  
   后端为主、前端大量通过协作与 Vibe Coding 完成。若你具备前端能力，按自己的习惯二次开发往往最理想。
3. **版本迭代可能存在一定延迟。**  
   问题与建议会尽量记录并在后续版本优化，但更新节奏受本职工作影响，希望大家理解。

目标始终是：**用得舒服、看得舒服、体验更舒服**。欢迎就使用建议、功能、交互、设计或 Bug 提交 Issue，一起把体验做扎实。个性化需求若能自行二次开发，往往更快，也更有利于项目节奏。

---

## 本分支相对能力（v1.2.x）

在 Lumina / 早期 LuminaPlus 能力之上，本仓库近期重点包括：

| 方向 | 说明 |
|------|------|
| **首屏与加载体验** | 首页 eager 入口；冷启动优先画 **骨架（skeleton）**，避免整页转圈；首页 multi-ping 走精简路径，减轻首屏请求。 |
| **构建与分包** | Vite 手动分包（react / query / charts 等）、字体 preload、关键路径 memo，改善首次与回访加载。 |
| **实例页** | 图表与时间窗切换使用骨架占位；Ping / 负载图断点连线、刷新与尺寸更稳。 |
| **PWA** | 可安装（standalone）；静态资源加强缓存；**有限离线**：断网可开壳并展示上次缓存的首页节点快照；曾打开过的实例可看缓存图表；Assets / Traffic 有缓存则展示。全局离线横幅 + 数据时间提示。 |
| **品牌与图标** | 主题标识 LuminaPlus-19y；自带 favicon / PWA 图标（监控条样式）。Komari 后台若上传了自定义 `favicon.ico`，**标签页**会优先用服务器图标，**安装 PWA** 仍走主题 manifest 中的 PNG。 |
| **主题管理** | 总览评级、多 Ping、卡片展示项、资产入口、背景与透明度等可配。 |

### PWA 使用注意

1. 请使用完整主题包（`npm run package` 生成的 zip）导入，确保 `dist/icons/pwa-*.png` 与 `manifest.webmanifest` 一并覆盖。
2. 更新主题后若安装图标仍是旧图：在浏览器 **注销 Service Worker、清空该站 Cache**，卸载旧 PWA 后再安装。
3. 离线不伪造实时数据；恢复网络后会回到 live 同步。主题管理等写操作仍需联网。

---

## 效果预览

<p align="center">
  <img src="docs/images/theme-preview.png" alt="Komari-Theme-LuminaPlus-19y 综合预览" width="90%">
</p>

### 首页总览与节点卡片

首页总览支持文字评级；节点卡片优化流量额度、在线时长与布局密度；支持背景图与卡片透明度。

<p align="center">
  <img src="docs/images/v1.1.9/overview-large-card-solid.png" alt="首页总览与大卡片" width="70%">
</p>

<p align="center">
  <img src="docs/images/v1.1.9/overview-large-card-solid-dark.png" alt="首页总览与大卡片夜间模式" width="70%">
</p>

<p align="center">
  <img src="docs/images/v1.1.9/overview-compact-card-solid.png" alt="首页总览与小卡片" width="70%">
</p>

<p align="center">
  <img src="docs/images/v1.1.9/overview-compact-card-solid-dark.png" alt="首页总览与小卡片夜间模式" width="70%">
</p>

### 透明背景

背景图与卡片透明度可在主题管理中配置，支持大卡片、小卡片和移动端布局。

<p align="center">
  <img src="docs/images/v1.1.9/overview-large-card-glass.png" alt="透明背景首页总览与大卡片" width="70%">
</p>

<p align="center">
  <img src="docs/images/v1.1.9/overview-large-card-glass-dark.png" alt="透明背景首页总览与大卡片夜间模式" width="70%">
</p>

<p align="center">
  <img src="docs/images/v1.1.9/overview-compact-card-glass.png" alt="透明背景首页总览与小卡片" width="70%">
</p>

<p align="center">
  <img src="docs/images/v1.1.9/overview-compact-card-glass-dark.png" alt="透明背景首页总览与小卡片夜间模式" width="70%">
</p>

### 实例详情

实例详情页优化 Ping 与负载图表；加载与切换时间窗时使用骨架占位，支持断点连线、手动刷新与更稳定的图表尺寸。

<p align="center">
  <img src="docs/images/v1.1.9/instance-ping.png" alt="实例详情 Ping 图表" width="70%">
</p>

<p align="center">
  <img src="docs/images/v1.1.9/instance-ping-dark.png" alt="实例详情 Ping 图表夜间模式" width="70%">
</p>

<p align="center">
  <img src="docs/images/v1.1.9/instance-load.png" alt="实例详情负载图表" width="70%">
</p>

<p align="center">
  <img src="docs/images/v1.1.9/instance-load-dark.png" alt="实例详情负载图表夜间模式" width="70%">
</p>

### 移动端

移动端总览卡片更紧凑，保留评级和关键指标。

<p align="center">
  <img src="docs/images/v1.1.9/mobile-overview-solid.png" alt="移动端总览与小卡片" width="70%">
</p>

<p align="center">
  <img src="docs/images/v1.1.9/mobile-overview-solid-dark.png" alt="移动端总览与小卡片夜间模式" width="70%">
</p>

<p align="center">
  <img src="docs/images/v1.1.9/mobile-overview-glass.png" alt="移动端透明背景总览与小卡片" width="70%">
</p>

<p align="center">
  <img src="docs/images/v1.1.9/mobile-overview-glass-dark.png" alt="移动端透明背景总览与小卡片夜间模式" width="70%">
</p>

### 资产统计

资产统计整合入口、指标、明细排序与汇率信息。

<p align="center">
  <img src="docs/images/v1.1.7/asset-summary.png" alt="资产统计" width="70%">
</p>

### 主题管理

主题管理支持总览评级、小卡片在线时间、资产统计等显示项开关，以及背景与多 Ping 等配置。

<p align="center">
  <img src="docs/images/v1.1.7/settings-overview.png" alt="总览评级配置" width="70%">
</p>

<p align="center">
  <img src="docs/images/v1.1.7/settings-card-cost.png" alt="小卡片与资产统计配置" width="70%">
</p>

### 离线节点卡片

节点离线时保持清晰状态提示，并保留最近一次上报的关键指标。

<p align="center">
  <img src="docs/images/v1.1.7/offline-card.png" alt="离线节点状态" width="70%">
</p>

---

## 安装与更新

1. 在 Komari 主题市场 / 主题管理中添加本仓库或导入发布 zip：  
   `Komari-Theme-LuminaPlus-19y-v<version>.zip`
2. 启用主题后硬刷新浏览器。
3. **从旧版或其它主题升级 PWA 相关版本时**：务必导入完整 zip；更新后建议注销 SW 并清缓存，再视需要重新「安装应用」。

本地打包：

```bash
npm install
npm run package
```

会执行 `build`、生成 `preview.png`，并写出版本化 zip。

---

## 本地开发与 UI 审查

```bash
npm install
npm run dev -- --host 0.0.0.0
```

- 打开开发地址并追加 **`?mock=1`**：无需连接 Komari 后端即可审查完整数据界面（正常 / 高负载 / 临期 / 离线 / 多地区 / 多币种等）。仅 Vite 开发环境生效，生产构建不包含 mock。
- 去掉查询参数即恢复真实接口。
- 常用脚本：`npm run typecheck` / `lint` / `test` / `build` / `package`。

图标若需重新生成（favicon + PWA PNG）：

```bash
python scripts/make-icons.py
```

---

## 致谢

特别感谢 [stqfdyr/komari-theme-Lumina](https://github.com/stqfdyr/komari-theme-Lumina)。

也感谢 Komari 官方主题、Mochi、PurCarte 等主题项目为 Komari 生态提供的设计和实现思路。

## 参考

- [Komari](https://github.com/komari-monitor/komari)
- [komari-theme-Lumina](https://github.com/stqfdyr/komari-theme-Lumina)
- [Komari 主题开发文档](https://komari-document.pages.dev/)

## Star History

<a href="https://www.star-history.com/?repos=shanyang242%2FKomari-Theme-LuminaPlus&type=timeline&legend=bottom-right">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=shanyang242/Komari-Theme-LuminaPlus&type=timeline&theme=dark&legend=bottom-right" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=shanyang242/Komari-Theme-LuminaPlus&type=timeline&legend=bottom-right" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=shanyang242/Komari-Theme-LuminaPlus&type=timeline&legend=bottom-right" />
 </picture>
</a>

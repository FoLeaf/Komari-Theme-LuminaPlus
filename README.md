# Komari-Theme-LuminaPlus

由于项目在1.1.10版本更名 请大家**重新在komari添加一下新的主题仓库地址** 需要重新配置一下 带来不便请谅解，不好意思了铁铁们。一直以来，我都比较支持这样一个观点：**如果有比较特殊的需求，并且自己具备相关能力，最好可以进行二次开发** 原因主要有几点：

1. **我需要从整体方向出发进行设计和维护。**
   产品的定位、使用逻辑以及整体体验需要保持一致，而每个人的审美、习惯和需求都会有所不同。毕竟“众口难调”，不可能做到完全满足每一位用户的个性化需求。
2. **我的技术栈和精力也有限。**
   我本身主要负责后端开发，前端部分目前基本也是通过 Vibe Coding 的方式完成。如果你本身具备前端开发能力，能够根据自己的需求进行调整和优化，其实是最理想的方式，也能实现更符合个人习惯的体验。
3. **版本迭代可能存在一定延迟。**
   有些问题或者建议我可能会记录，并计划在后续版本中优化。但由于本职工作和现实时间安排的影响，更新节奏不一定能够完全按照预期推进，希望大家能够理解。

这个产品最初的价值和目标，就是希望大家能够**用得舒服、看得舒服、体验更舒服**。所以，无论是使用建议、功能优化、交互逻辑、设计思路，还是发现 Bug，**都非常欢迎大家积极、开放地提交 Issue**。大家一起交流、一起完善，让产品的使用体验越来越好。同时，也希望大家能够理解上面提到的这些限制。对于一些个性化需求，如果自己有能力进行二次开发，不仅能够更快满足自己的需求，也能让整个项目保持更好的发展节奏。

基于 [komari-theme-Lumina](https://github.com/stqfdyr/komari-theme-Lumina) 的增强分支。感谢原作者 [stqfdyr](https://github.com/stqfdyr) 开源 Lumina 主题。

## 效果预览

<p align="center">
  <img src="docs/images/theme-preview.png" alt="Komari-Theme-LuminaPlus 综合预览" width="90%">
</p>

### 首页总览与节点卡片

首页总览新增文字评级，节点卡片同步优化流量额度、在线时长与布局密度；支持背景图与卡片透明度调节。

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

实例详情页优化 Ping 与负载图表展示，支持断点连线、手动刷新和更稳定的图表尺寸。

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

移动端总览卡片采用更紧凑的信息展示，保留评级和关键指标。

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

资产统计界面重做，整合入口、指标、明细排序与汇率信息。

<p align="center">
  <img src="docs/images/v1.1.7/asset-summary.png" alt="资产统计" width="70%">
</p>

### 主题管理

主题管理新增总览评级配置，并加入小卡片在线时间、资产统计等显示项开关。

<p align="center">
  <img src="docs/images/v1.1.7/settings-overview.png" alt="总览评级配置" width="70%">
</p>

<p align="center">
  <img src="docs/images/v1.1.7/settings-card-cost.png" alt="小卡片与资产统计配置" width="70%">
</p>

### 离线状态

离线节点保持清晰的状态提示，同时保留最近一次上报的关键指标。

<p align="center">
  <img src="docs/images/v1.1.7/offline-card.png" alt="离线节点状态" width="70%">
</p>

## 致谢

特别感谢 [stqfdyr/komari-theme-Lumina](https://github.com/stqfdyr/komari-theme-Lumina)。

也感谢 Komari 官方主题、Mochi、PurCarte 等主题项目为 Komari 生态提供的设计和实现思路。

## 参考

- [Komari](https://github.com/komari-monitor/komari)
- [komari-theme-Lumina](https://github.com/stqfdyr/komari-theme-Lumina)
- [Komari 主题开发文档](https://komari-document.pages.dev/)

## 本地 UI 审查

无需连接 Komari 后端也可以检查完整数据界面：

```bash
npm run dev -- --host 0.0.0.0
```

打开开发地址并追加 `?mock=1`。该模式只在 Vite 开发环境启用，会提供正常、高负载、临期、离线、多地区与多币种节点；生产构建不会包含这份测试数据。去掉查询参数即可恢复真实接口。

## Star History

<a href="https://www.star-history.com/?repos=shanyang242%2FKomari-Theme-LuminaPlus&type=timeline&legend=bottom-right">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=shanyang242/Komari-Theme-LuminaPlus&type=timeline&theme=dark&legend=bottom-right" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=shanyang242/Komari-Theme-LuminaPlus&type=timeline&legend=bottom-right" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=shanyang242/Komari-Theme-LuminaPlus&type=timeline&legend=bottom-right" />
 </picture>
</a>

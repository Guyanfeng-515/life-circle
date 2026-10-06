# 生活圈 · 周边搜索

基于高德开放平台 Web API 的周边购物搜索应用。网页托管在 GitHub Pages（公网 https，微信可直接打开），数据每天 0 点和 12 点由**本机定时任务**自动抓取并推送到 GitHub，GitHub 自动部署更新。

## 功能

- 位置栏：12 个预设位置（重庆 7 个 + 全国热门地标 5 个），城市分组多层展开
- 周边列表：1000 米内店铺，按距离排序，点击卡片直达高德店铺详情并可导航
- 商品搜索：输入"要买什么"，给出"大概可能买到的地方" + 网上/视频情报
- 语音输入：位置栏和搜索框均可语音
- 数据自动更新：每天 0:00 / 12:00 本机抓取高德最新数据 → 推送 data.json → GitHub Pages 自动发布

## 架构说明

```
本机（中国境内）                  GitHub（境外）
┌────────────────────┐          ┌──────────────────────────┐
│ 定时任务(每天0/12点)│          │ 仓库 Guyanfeng-515/      │
│  fetch_data.mjs    │          │   life-circle            │
│   抓取高德12×16类  │          │  .github/workflows/      │
│   写入 data.json   │  push    │   shenghuoquan.yml       │
│  push_data.mjs     │ ───────► │   （监听 push，自动部署） │
│   上传 data.json   │          │ GitHub Pages 公网网址    │
└────────────────────┘          └──────────────────────────┘
```

> 为什么不在 GitHub Actions 上直接抓取：高德服务端接口禁止中国大陆以外访问（2022-09-01 起），GitHub 运行机器在美国会超时失败。故抓取放本机（国内），GitHub 只做托管与自动部署。

## 一键部署步骤

### 1. 获取高德 Key（免费）
1. 打开 https://lbs.amap.com 注册登录（可用支付宝/手机号）
2. 控制台 → 应用管理 → 创建应用 → 添加 Key，服务平台选「**Web服务**」
3. 复制 Key

### 2. 创建 GitHub 仓库并上传
1. 登录 https://github.com，新建仓库（如 `life-circle`，Public 或 Private 均可）
2. 本目录文件上传到仓库：`index.html`、`sw.js`、`manifest.json`、`data.json`、`icons/icon.png`、`.github/workflows/shenghuoquan.yml`

### 3. 开启 GitHub Pages（GitHub Actions 自动部署）
仓库 → Settings → Pages → Source 选「**GitHub Actions**」→ Save

### 4. 本机配置自动抓取推送
1. 把高德 Key 写入本机环境（或 `fetch_data.mjs` 的 AMAP_KEY）
2. 把 GitHub 个人访问令牌（repo + workflow 权限）写入同目录 `.gh_token` 文件
3. 首次手动验证：
   ```
   node fetch_data.mjs   # 全量抓取，写 data.json
   node push_data.mjs    # 推送 data.json，触发自动部署
   ```
4. 网页地址：`https://<你的用户名>.github.io/<仓库名>/`

### 5. 每天自动执行
- 本机设置定时任务（Windows 任务计划 / cron），每天 0:00、12:00 运行：
  `fetch_data.mjs` → `push_data.mjs`
- 电脑关机时段会漏抓，开机后补一次即可

## 之后

- 每天 0:00、12:00 自动抓取 + 自动推送 + 自动发布，网页永远最新
- 想立刻更新：手动跑一次 `fetch_data.mjs` + `push_data.mjs`
- 改页面样式：改 `index.html` 后上传仓库即可（push 触发自动部署）

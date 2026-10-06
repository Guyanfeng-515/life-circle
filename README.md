# 生活圈 · 周边搜索（自动抓取版）

基于高德开放平台 Web API 的周边购物搜索应用。**完全脱离豆包独立运行**：网页托管在 GitHub Pages，每天 0 点和 12 点由 GitHub Actions 自动抓取 12 个预设位置 × 16 类关键词的周边店铺数据并自动更新。

## 功能

- 位置栏：12 个预设位置（重庆 7 个 + 全国热门地标 5 个），城市分组多层展开
- 周边列表：1000 米内店铺，按距离排序，点击卡片直达高德店铺详情并可导航
- 商品搜索：输入"要买什么"，给出"大概可能买到的地方"+ 网上/视频情报
- 语音输入：位置栏和搜索框均可语音
- 数据自动更新：每天 0:00 / 12:00 抓取高德最新数据（写 `data.json`，应用自动加载）

## 部署步骤（一次性，约 10 分钟）

### 1. 获取高德 key（免费）
1. 打开 https://lbs.amap.com 注册登录（可用支付宝/手机号）
2. 控制台 → 应用管理 → 我的应用 → 创建新应用（类型选"出行"）
3. 添加 Key：服务平台选「**Web服务**」，提交后复制 Key

### 2. 创建 GitHub 仓库并上传
1. 登录 https://github.com，新建仓库（名字随意，如 `life-circle`，Public 或 Private 均可）
2. 本目录全部文件上传到仓库根目录（index.html、sw.js、manifest.json、data.json、fetch_data.mjs、icons/、.github/）

### 3. 配置 secret（key 只存 GitHub，不泄露）
仓库 → Settings → Secrets and variables → Actions → New repository secret
- Name：`AMAP_KEY`
- Secret：粘贴高德 Key

### 4. 开启 GitHub Pages（用 Actions 自动部署）
仓库 → Settings → Pages → Source 选「**GitHub Actions**」→ Save

### 5. 手动跑一次验证
仓库 → Actions → 「生活圈自动抓取」→ Run workflow（手动触发一次）
跑完后会生成你的网页地址：`https://<你的用户名>.github.io/<仓库名>/`

## 之后

- 每天 0:00、12:00 自动抓取 + 自动部署，网页永远最新
- 想立刻更新：Actions 里手动 Run workflow
- 改页面样式：改 `index.html` 提交即可（Actions 部署流程会自动带上新页面）

## 本地预览

```bash
# 在项目目录启动静态服务
python -m http.server 8617
# 打开 http://localhost:8617/
```

## 文件说明

| 文件 | 作用 |
|---|---|
| `index.html` | 应用本体（内置兜底数据 + 启动时自动加载 data.json） |
| `data.json` | 周边店铺数据（定时抓取自动更新） |
| `fetch_data.mjs` | 高德抓取脚本（Actions 每天运行） |
| `.github/workflows/fetch.yml` | 定时任务：每天 0/12 点抓取并部署 |
| `sw.js` | Service Worker（离线缓存，改版本号强制刷新） |
| `manifest.json` / `icons/` | PWA 图标（手机可"添加到主屏幕"） |

## 抓取范围

12 位置 × 16 类关键词（超市、便利店、菜市场、水果店、商场、餐饮、奶茶、理发店、药店、快递驿站、五金店、充电站、停车场、健身房、银行、文具店），半径 1000 米，同类同名去重。

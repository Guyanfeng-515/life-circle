#!/usr/bin/env node
/* ============================================================
 * 生活圈 · 周边数据自动抓取脚本
 * 数据源：高德开放平台 Web 服务 API（需 AMAP_KEY 环境变量）
 * 用法：  AMAP_KEY=xxxxxxxx node fetch_data.mjs
 * 输出：  data.json（与 index.html 同目录，应用自动加载覆盖内置 AREAS）
 * 定时：  GitHub Actions 每天 0/12 点运行（见 .github/workflows/fetch.yml）
 * ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEY = process.env.AMAP_KEY;
if (!KEY) {
  console.error('缺少 AMAP_KEY 环境变量（高德开放平台 Web 服务 key）');
  process.exit(1);
}

/* 12 个预设位置：名称、经纬度（来自应用 PRESETS） */
const PLACES = [
  { name: '重庆城市科技学院永川校区', lng: 105.889131, lat: 29.393910 },
  { name: '西城佳园', lng: 106.476027, lat: 29.432472 },
  { name: '重庆来福士', lng: 106.587247, lat: 29.564813 },
  { name: '重庆洪崖洞', lng: 106.579027, lat: 29.562204 },
  { name: '重庆解放碑', lng: 106.575329, lat: 29.557253 },
  { name: '重庆磁器口', lng: 106.449705, lat: 29.581184 },
  { name: '重庆观音桥', lng: 106.533919, lat: 29.576104 },
  { name: '北京天安门', lng: 116.397463, lat: 39.909187 },
  { name: '北京故宫', lng: 116.397029, lat: 39.917839 },
  { name: '上海外滩', lng: 121.492127, lat: 31.233516 },
  { name: '成都春熙路', lng: 104.077774, lat: 30.655544 },
  { name: '广州塔', lng: 113.324521, lat: 23.106428 }
];

/* 16 类关键词 → 应用 cat 归类（奶茶并入餐饮，与应用现状一致） */
const KWS = [
  ['超市', '超市便利店'],
  ['便利店', '超市便利店'],
  ['菜市场', '菜市场'],
  ['水果店', '水果'],
  ['商场', '商场'],
  ['餐饮', '餐饮'],
  ['奶茶', '餐饮'],
  ['理发店', '理发'],
  ['药店', '药店'],
  ['快递驿站', '快递'],
  ['五金店', '五金'],
  ['充电站', '充电站'],
  ['停车场', '停车场'],
  ['健身房', '健身'],
  ['银行', '银行'],
  ['文具店', '文具']
];

const RADIUS = 1000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPoi(lng, lat, kw, page) {
  const url = 'https://restapi.amap.com/v3/place/around'
    + '?key=' + encodeURIComponent(KEY)
    + '&location=' + lng + ',' + lat
    + '&keywords=' + encodeURIComponent(kw)
    + '&radius=' + RADIUS
    + '&offset=25&page=' + page
    + '&extensions=base&sortrule=distance';
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

/* 抓一个位置的某一类关键词，返回 POI 数组 */
async function grabOne(lng, lat, kw) {
  const out = [];
  const first = await fetchPoi(lng, lat, kw, 1);
  if (first.status !== '1') {
    throw new Error((first.info || '接口失败') + ' | ' + (first.infocode || ''));
  }
  const total = Number(first.count || 0);
  const pages = Math.min(Math.ceil(total / 25), 4); // 最多 4 页 = 100 条
  for (let p = 1; p <= pages; p++) {
    const data = p === 1 ? first : await fetchPoi(lng, lat, kw, p);
    const pois = data.pois || [];
    for (const poi of pois) {
      const [plng, plat] = (poi.location || '').split(',');
      out.push({
        name: poi.name || '',
        loc: poi.address || '',
        dist: Math.round(Number(poi.distance) || 0),
        pid: poi.id || '',
        lng: plng || '',
        lat: plat || ''
      });
    }
    if (p < pages) await sleep(400);
  }
  return out;
}

async function main() {
  const areas = {};
  const failures = [];
  for (const place of PLACES) {
    const seen = new Map();
    const list = [];
    for (const [kw, cat] of KWS) {
      try {
        const pois = await grabOne(place.lng, place.lat, kw);
        for (const p of pois) {
          if (!p.name) continue;
          const key = p.name + '|' + (p.loc || '');
          if (seen.has(key)) continue; // 同位置同名去重
          seen.set(key, 1);
          list.push({ name: p.name, cat, dist: p.dist, loc: p.loc, pid: p.pid });
        }
        console.log(`[OK] ${place.name} / ${kw}: ${pois.length} 条`);
      } catch (e) {
        failures.push(`${place.name}/${kw}: ${e.message}`);
        console.warn(`[FAIL] ${place.name} / ${kw}: ${e.message}`);
      }
      await sleep(400); // 限速防触发 QPS 限制
    }
    list.sort((a, b) => a.dist - b.dist);
    areas[place.name] = list;
    console.log(`== ${place.name} 合计 ${list.length} 家`);
  }

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const updated = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const out = { updated, areas };
  const target = path.join(__dirname, 'data.json');
  fs.writeFileSync(target, JSON.stringify(out, null, 1), 'utf8');
  console.log(`\n已写入 ${target}（${updated}）`);
  if (failures.length) {
    console.log('\n失败项（已跳过，不影响已抓数据）：');
    failures.forEach((f) => console.log('  - ' + f));
    process.exitCode = 2;
  } else {
    console.log('全部成功，无失败项。');
  }
}

main().catch((e) => { console.error('脚本异常：', e); process.exit(1); });

# ZoomBird Vercel 部署指南

本项目已将 Cloudflare Workers API 迁移为 Vercel Serverless Functions，并使用 Vercel KV（Redis）存储排行榜数据。

## 已创建的文件

- `vercel.json`
- `api/leaderboard.js`
- `api/score.js`
- `api/check-name.js`
- `lib/vercel-api-shared.js`

## 数据结构

- Sorted Set Key: `leaderboard`
- `score`: 玩家分数
- `member`: 玩家名字

## API 与返回格式

与原 Cloudflare Workers 保持同一字段结构：

### GET `/api/leaderboard?limit=10`

返回前 N 名（默认 10，最大 100）：

```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "name": "player1",
      "score": 999,
      "timestamp": null
    }
  ]
}
```

### POST `/api/score`

请求体：

```json
{
  "name": "player1",
  "score": 999
}
```

同一玩家仅保留最高分。响应：

```json
{
  "success": true,
  "rank": 1,
  "isNewRecord": true,
  "data": {
    "id": "player1",
    "name": "player1",
    "score": 999,
    "rank": 1
  }
}
```

### POST `/api/check-name`

请求体：

```json
{
  "name": "player1"
}
```

响应：

```json
{
  "success": true,
  "exists": true
}
```

## CORS

所有 API 都支持：

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

## 部署步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 创建 Vercel 项目

```bash
npx vercel
```

首次执行会引导你绑定当前目录到一个 Vercel Project。

### 3. 创建并绑定 Vercel KV

1. 打开 Vercel Dashboard -> Storage -> Create Database -> KV
2. 将该 KV 连接到当前 Project（Production/Preview/Development 环境）
3. 确认环境变量已注入（通常由 Vercel 自动完成）：
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### 4. 生产部署

```bash
npx vercel --prod
```

部署成功后可得到线上域名，例如：

`https://your-project.vercel.app`

## 接口测试

```bash
curl "https://your-project.vercel.app/api/leaderboard?limit=10"
```

```bash
curl -X POST "https://your-project.vercel.app/api/score" \
  -H "Content-Type: application/json" \
  -d '{"name":"测试玩家","score":123}'
```

```bash
curl -X POST "https://your-project.vercel.app/api/check-name" \
  -H "Content-Type: application/json" \
  -d '{"name":"测试玩家"}'
```

## 本地开发（可选）

```bash
npx vercel dev
```

如果本地需要访问 KV，请确保本地环境已加载对应 KV 环境变量（可通过 Vercel CLI 拉取或在 `.env.local` 配置）。

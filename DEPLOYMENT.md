# ZoomBird 排行榜后端部署指南

## 前置要求

1. 安装 Node.js (v16+)
2. 安装 Wrangler CLI: `npm install -g wrangler`
3. 拥有 Cloudflare 账号

## 部署步骤

### 1. 登录 Cloudflare

```bash
wrangler login
```

### 2. 创建 D1 数据库

```bash
wrangler d1 create zoombird-leaderboard
```

这会返回一个 database_id，复制它并更新 `wrangler.toml` 文件中的 `database_id`。

### 3. 初始化数据库表结构

```bash
wrangler d1 execute zoombird-leaderboard --file=./schema.sql
```

### 4. 部署 Worker

```bash
wrangler deploy
```

部署成功后，你会得到一个 URL，类似：
`https://zoombird-api.YOUR_SUBDOMAIN.workers.dev`

### 5. 测试 API

#### 测试健康检查
```bash
curl https://zoombird-api.YOUR_SUBDOMAIN.workers.dev/
```

#### 获取排行榜
```bash
curl https://zoombird-api.YOUR_SUBDOMAIN.workers.dev/api/leaderboard?limit=10
```

#### 提交分数
```bash
curl -X POST https://zoombird-api.YOUR_SUBDOMAIN.workers.dev/api/score \
  -H "Content-Type: application/json" \
  -d '{"name":"测试玩家","score":150}'
```

## API 文档

### GET /api/leaderboard

获取排行榜

**参数：**
- `limit` (可选): 返回的记录数量，默认 10

**响应：**
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "name": "玩家名称",
      "score": 100,
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/score

提交分数

**请求体：**
```json
{
  "name": "玩家名称",
  "score": 100
}
```

**响应：**
```json
{
  "success": true,
  "rank": 5,
  "data": {
    "id": 123,
    "name": "玩家名称",
    "score": 100,
    "rank": 5
  }
}
```

## 本地开发

### 启动本地开发服务器

```bash
wrangler dev
```

这会在 `http://localhost:8787` 启动本地服务器。

### 本地数据库操作

```bash
# 查询本地数据库
wrangler d1 execute zoombird-leaderboard --local --command="SELECT * FROM leaderboard ORDER BY score DESC LIMIT 10"

# 插入测试数据
wrangler d1 execute zoombird-leaderboard --local --command="INSERT INTO leaderboard (name, score, created_at) VALUES ('本地测试', 999, datetime('now'))"
```

## 数据库管理

### 查看所有记录

```bash
wrangler d1 execute zoombird-leaderboard --command="SELECT * FROM leaderboard ORDER BY score DESC"
```

### 清空排行榜

```bash
wrangler d1 execute zoombird-leaderboard --command="DELETE FROM leaderboard"
```

### 删除低分记录（保留前100名）

```bash
wrangler d1 execute zoombird-leaderboard --command="DELETE FROM leaderboard WHERE id NOT IN (SELECT id FROM leaderboard ORDER BY score DESC LIMIT 100)"
```

## 更新前端配置

部署完成后，更新前端代码中的 API URL：

在 `zoombird.html` 和 `zoombird-mobile.html` 中：

```javascript
const API_BASE_URL = 'https://zoombird-api.YOUR_SUBDOMAIN.workers.dev';
```

替换为你的实际 Worker URL。

## 监控和日志

### 查看实时日志

```bash
wrangler tail
```

### 查看 Worker 统计信息

访问 Cloudflare Dashboard:
https://dash.cloudflare.com/ → Workers & Pages → zoombird-api

## 故障排查

### 问题：CORS 错误

确保 Worker 代码中包含正确的 CORS 头：
```javascript
'Access-Control-Allow-Origin': '*'
```

### 问题：数据库连接失败

检查 `wrangler.toml` 中的 `database_id` 是否正确。

### 问题：部署失败

1. 确保已登录：`wrangler whoami`
2. 检查 wrangler 版本：`wrangler --version`
3. 更新 wrangler：`npm install -g wrangler@latest`

## 安全建议

1. **限流**: 考虑添加请求限流，防止滥用
2. **验证**: 添加更严格的输入验证
3. **IP 记录**: 记录提交者的 IP 地址，防止作弊
4. **定期清理**: 定期清理旧数据或低分记录

## 成本估算

Cloudflare Workers 免费套餐：
- 每天 100,000 次请求
- D1 数据库：5GB 存储，每天 500 万次读取

对于小型游戏，免费套餐完全够用。

## 下一步优化

1. 添加用户认证
2. 实现反作弊机制
3. 添加地区排行榜
4. 实现实时排名更新（WebSocket）
5. 添加排行榜历史记录

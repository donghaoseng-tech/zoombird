# ZoomBird 排行榜 - 快速开始

## 🚀 5分钟快速部署

### 步骤 1: 安装依赖

```bash
cd "/Users/david/ 测试/zoombird"
npm install -g wrangler
```

### 步骤 2: 登录 Cloudflare

```bash
wrangler login
```

浏览器会打开，授权后返回终端。

### 步骤 3: 创建数据库

```bash
wrangler d1 create zoombird-leaderboard
```

**重要**: 复制返回的 `database_id`，例如：
```
database_id = "abc123-def456-ghi789"
```

### 步骤 4: 更新配置

编辑 `wrangler.toml`，将 `YOUR_DATABASE_ID_HERE` 替换为上一步的 database_id：

```toml
[[d1_databases]]
binding = "DB"
database_name = "zoombird-leaderboard"
database_id = "abc123-def456-ghi789"  # 替换这里
```

### 步骤 5: 初始化数据库

```bash
wrangler d1 execute zoombird-leaderboard --file=./schema.sql
```

### 步骤 6: 部署

```bash
wrangler deploy
```

部署成功后会显示 URL，例如：
```
https://zoombird-api.donghaoseng.workers.dev
```

### 步骤 7: 测试

```bash
# 测试健康检查
curl https://zoombird-api.donghaoseng.workers.dev/

# 测试获取排行榜
curl https://zoombird-api.donghaoseng.workers.dev/api/leaderboard

# 测试提交分数
curl -X POST https://zoombird-api.donghaoseng.workers.dev/api/score \
  -H "Content-Type: application/json" \
  -d '{"name":"测试玩家","score":100}'
```

### 步骤 8: 更新前端（如果需要）

如果你的 Worker URL 不是 `https://zoombird-api.donghaoseng.workers.dev`，需要更新前端代码。

在 `zoombird.html` 和 `zoombird-mobile.html` 中找到：

```javascript
const API_BASE_URL = 'https://zoombird-api.donghaoseng.workers.dev';
```

替换为你的实际 URL。

## ✅ 完成！

现在打开游戏，玩一局后就能看到排行榜了！

## 🔧 常用命令

```bash
# 本地开发
wrangler dev

# 查看日志
wrangler tail

# 查看排行榜数据
wrangler d1 execute zoombird-leaderboard --command="SELECT * FROM leaderboard ORDER BY score DESC LIMIT 10"

# 清空排行榜
wrangler d1 execute zoombird-leaderboard --command="DELETE FROM leaderboard"
```

## 📚 更多信息

查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 了解详细文档。

## ❓ 遇到问题？

1. 确保已登录：`wrangler whoami`
2. 检查配置：`cat wrangler.toml`
3. 查看日志：`wrangler tail`
4. 重新部署：`wrangler deploy --force`

# 🐦 ZoomBird Game

一个基于 Flappy Bird 的创意游戏，融合了中联重科的工业元素，支持全球排行榜功能。

## 🎮 在线游戏

**立即开始游戏**: [https://donghaoseng-tech.github.io/zoombird/](https://donghaoseng-tech.github.io/zoombird/)

## ✨ 特性

- 🌍 **全球排行榜**: 基于 Cloudflare Workers + D1 数据库
- 👤 **用户系统**: 注册昵称，自动保存最高分
- 🏆 **实时排名**: 显示前10名玩家
- 🌐 **多语言支持**: 中文、英文、西班牙语、俄语
- 📱 **响应式设计**: 支持桌面和移动设备
- 🎨 **双主题模式**: 深色工业风 / 门户办公风
- ⌨️ **键盘快捷键**: 空格飞行、P暂停、F全屏、D切换主题

## 🚀 快速开始

### 玩游戏

1. 访问游戏网址
2. 首次访问时输入昵称（昵称唯一，不可重复）
3. 点击屏幕或按空格键开始游戏
4. 游戏结束后自动提交最高分到排行榜

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/donghaoseng-tech/zoombird.git
cd zoombird

# 直接打开 index.html 或使用本地服务器
python3 -m http.server 8000
# 访问 http://localhost:8000
```

## 🔧 后端部署（可选）

如果你想部署自己的排行榜后端：

### 1. 安装 Wrangler

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

### 3. 创建 D1 数据库

```bash
wrangler d1 create zoombird-leaderboard
```

复制返回的 `database_id`。

### 4. 更新配置

编辑 `wrangler.toml`，替换 `database_id`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "zoombird-leaderboard"
database_id = "你的-database-id"
```

### 5. 初始化数据库

```bash
# 本地
wrangler d1 execute zoombird-leaderboard --file=./schema.sql

# 远程
wrangler d1 execute zoombird-leaderboard --remote --file=./schema.sql
```

### 6. 部署 Worker

```bash
wrangler deploy
```

### 7. 更新前端 API 地址

在 `zoombird.html` 和 `zoombird-mobile.html` 中更新：

```javascript
const API_BASE_URL = 'https://你的-worker.workers.dev';
```

## 📊 API 接口

### 获取排行榜

```bash
GET /api/leaderboard?limit=10
```

### 提交分数

```bash
POST /api/score
Content-Type: application/json

{
  "name": "玩家昵称",
  "score": 100
}
```

### 检查昵称

```bash
POST /api/check-name
Content-Type: application/json

{
  "name": "玩家昵称"
}
```

## 🎯 游戏规则

- 点击屏幕或按空格键让小鸟上升
- 避开柱子和地面
- 通过柱子获得分数
- 速度会随着分数增加而加快
- 每个玩家只保留最高分记录

## ⌨️ 键盘快捷键

- `空格` - 飞行 / 开始游戏 / 恢复暂停
- `P` - 暂停/继续
- `F` - 全屏/退出全屏
- `T` - 切换主题
- `D` - 进入门户模式
- `Y` - 退出门户模式
- `M` - 游戏结束后重新开始

## 🛠️ 技术栈

### 前端
- 原生 JavaScript + Canvas
- 响应式设计
- LocalStorage 用户数据持久化

### 后端
- Cloudflare Workers (Serverless)
- Cloudflare D1 (SQLite 数据库)
- RESTful API

## 📝 开发日志

### v2.0.0 (2026-03-02)
- ✅ 添加全球排行榜功能
- ✅ 实现用户注册系统（昵称唯一性检查）
- ✅ 自动提交最高分
- ✅ 修复暂停后空格恢复游戏
- ✅ 添加排行榜多语言支持
- ✅ 修复切换主题后图片缺失问题
- ✅ 清空历史排行榜数据

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- 原始 Flappy Bird 游戏灵感
- 中联重科提供的工业元素
- Cloudflare 提供的免费 Workers 和 D1 服务

---

**享受游戏！🎮**

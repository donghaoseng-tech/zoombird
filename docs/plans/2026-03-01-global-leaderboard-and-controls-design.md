# ZoomBird 全球排行榜与控制优化设计文档

**日期：** 2026-03-01
**状态：** 已批准
**作者：** Claude

## 概述

本设计文档涵盖三个主要改进：
1. 优化游戏控制说明，使其更清晰易懂
2. 暂停后支持空格键恢复游戏
3. 实现全球排行榜系统，支持昵称和实时排名

## 需求背景

### 当前问题
- 暂停后只能按 P 键恢复，不够直观
- 右侧控制说明不够清晰，未说明 D/Y/T 键功能
- 只有本地排行榜，缺乏全球竞争性

### 目标
- 提升用户体验，降低操作门槛
- 增加游戏社交性和竞争性
- 保持国内访问稳定性

## 设计方案

### 1. 控制说明优化

#### 1.1 暂停恢复逻辑改进

**改动：**
- 暂停状态下，空格键和 P 键都可以恢复游戏
- 修改 `desktop.html` 中的 `keydown` 事件处理逻辑

**实现：**
```javascript
if (c === 'Space' || k === ' ') {
  e.preventDefault();
  if (state.status === 'paused') {
    togglePause();
    return;
  }
  flap();
}
```

#### 1.2 控制说明文案重写

**位置：** 游戏界面右侧

**新文案：**
```
基本操作
• 空格/点击屏幕：控制飞鸟上升
• P 键：暂停/继续游戏
• M 键：游戏结束后重新开始

视图模式
• T 键：切换主题（深色/办公室）
• D 键：进入产品展示门户
• Y 键：从门户返回游戏
• F 键：全屏显示

游戏规则
撞到柱子或落地即失败，通过柱子数量计分，难度随分数递增。
```

**多语言支持：**
- 中文（默认）
- 英文
- 西班牙语
- 俄语

### 2. 全球排行榜系统

#### 2.1 技术架构

**后端：Cloudflare Workers + D1 + KV**

- **Cloudflare Workers：** 提供 API 端点
- **D1 数据库：** 存储排行榜数据（SQLite）
- **KV 存储：** 缓存排行榜和限流数据

**优势：**
- 完全免费（每天 100k 请求，10GB D1 存储）
- 国内访问速度快（Cloudflare CDN）
- 自动扩容，无需维护服务器

#### 2.2 数据库设计

**表结构：**
```sql
CREATE TABLE scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL,
  score INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,
  ip_hash TEXT,
  INDEX idx_score DESC
);
```

**字段说明：**
- `id`: 自增主键
- `nickname`: 玩家昵称（2-20字符）
- `score`: 游戏分数（1-999）
- `timestamp`: 提交时间戳（毫秒）
- `ip_hash`: IP 地址 SHA-256 哈希（用于限流）

#### 2.3 API 设计

**端点 1: GET /api/leaderboard**

获取全球 Top 100 排行榜。

**响应示例：**
```json
[
  { "rank": 1, "nickname": "玩家A", "score": 203 },
  { "rank": 2, "nickname": "玩家B", "score": 189 },
  ...
]
```

**缓存策略：**
- KV 缓存 5 分钟
- 键名：`leaderboard:top100`

---

**端点 2: POST /api/leaderboard**

提交新分数到排行榜。

**请求体：**
```json
{
  "nickname": "玩家昵称",
  "score": 42
}
```

**响应示例：**
```json
{
  "success": true,
  "rank": 23,
  "total": 1542
}
```

**错误响应：**
```json
{
  "success": false,
  "error": "提交过于频繁，请稍后再试"
}
```

#### 2.4 防刷机制

**IP 限流：**
- 同一 IP 每分钟最多提交 3 次
- 使用 KV 存储：`leaderboard:ratelimit:{ip_hash}`
- TTL: 60 秒

**分数合理性校验：**
- 分数范围：1-999（游戏物理上限）
- 拒绝异常高分

**昵称验证：**
- 长度：2-20 字符
- 允许：中文��英文、数字、下划线
- 过滤：特殊字符、emoji

#### 2.5 前端实现

**昵称管理：**

1. **首次设置：**
   - 游戏启动时检查 `localStorage.getItem('zoombird_nickname')`
   - 如果为空，显示模态框要求输入昵称
   - 验证通过后保存到 localStorage

2. **修改昵称：**
   - 右上角添加"设置"按钮（齿轮图标）
   - 点击弹出设置面板，可修改昵称
   - 修改后更新 localStorage

**排行榜显示位置：**

1. **右侧排名区域（实时显示）：**
   ```
   ┌─────────────────────┐
   │ 排行榜              │
   ├─────────────────────┤
   │ 你的最高分: 156     │
   │ 世界排名: #23       │
   ├─────────────────────┤
   │ 全球 Top 10         │
   │ 1. 玩家A .... 203   │
   │ 2. 玩家B .... 189   │
   │ 3. 玩家C .... 178   │
   │ ...                 │
   │ 10. 玩家J ... 142   │
   └─────────────────────┘
   ```

2. **死亡遮罩（深色主题）：**
   ```
   ┌─────────────────────────────┐
   │   你的小鸟坠机了            │
   │   得分: 42                  │
   │   [提交到排行榜]            │
   │                             │
   │   全球排行榜 Top 10         │
   │   1. 玩家A .......... 203   │
   │   2. 玩家B .......... 189   │
   │   3. 你 .............. 42   │ ← 高亮
   │   ...                       │
   │                             │
   │   按 M 键重新开始           │
   └─────────────────────────────┘
   ```

**加载逻辑：**

1. **游戏启动时：**
   - 调用 `GET /api/leaderboard` 获取 Top 100
   - 查找玩家昵称的最高分和排名
   - 更新右侧排名区域

2. **游戏结束时（深色主题）：**
   - 显示死亡遮罩
   - 加载全球 Top 10
   - 高亮显示玩家当前分数的排名

3. **提交分数后：**
   - 调用 `POST /api/leaderboard`
   - 刷新排行榜
   - 更新右侧排名区域

**错误处理：**
- API 请求失败时，显示"排行榜加载失败"
- 网络超时：5 秒
- 降级方案：只显示本地历史最高分

#### 2.6 后端实现（Cloudflare Workers）

**项目结构：**
```
workers/
├── wrangler.toml          # Cloudflare 配置
├── schema.sql             # D1 数据库表结构
└── src/
    └── index.js           # Worker 代码
```

**GET /api/leaderboard 实现：**

1. 检查 KV 缓存：`leaderboard:top100`
2. 命中则直接返回
3. 未命中则查询 D1：
   ```sql
   SELECT nickname, score
   FROM scores
   ORDER BY score DESC
   LIMIT 100
   ```
4. 添加排名字段（rank: 1-100）
5. 写入 KV 缓存（TTL: 300 秒）
6. 返回 JSON

**POST /api/leaderboard 实现：**

1. 提取请求 IP，计算 SHA-256 哈希
2. 检查 KV 限流：`leaderboard:ratelimit:{ip_hash}`
   - 如果 1 分钟内超过 3 次，返回 429 错误
3. 验证请求体：
   - `nickname`: 2-20 字符，正则 `/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/`
   - `score`: 1-999 整数
4. 插入 D1：
   ```sql
   INSERT INTO scores (nickname, score, timestamp, ip_hash)
   VALUES (?, ?, ?, ?)
   ```
5. 查询玩家排名：
   ```sql
   SELECT COUNT(*) + 1 AS rank
   FROM scores
   WHERE score > ?
   ```
6. 查询总记录数：
   ```sql
   SELECT COUNT(*) AS total FROM scores
   ```
7. 如果排名 <= 100，清除 KV 缓存
8. 更新限流计数器（KV TTL: 60 秒）
9. 返回 JSON：`{ success: true, rank, total }`

**部署步骤：**

1. 安装 wrangler CLI：
   ```bash
   npm install -g wrangler
   ```

2. 登录 Cloudflare：
   ```bash
   wrangler login
   ```

3. 创建 D1 数据库：
   ```bash
   wrangler d1 create zoombird-leaderboard
   ```

4. 初始化表结构：
   ```bash
   wrangler d1 execute zoombird-leaderboard --file=schema.sql
   ```

5. 部署 Worker：
   ```bash
   wrangler deploy
   ```

6. 获取 Worker URL（如 `https://zoombird-api.your-subdomain.workers.dev`）

7. 更新前端 API 端点配置

### 3. 移动端适配

**手机版（mobile.html）：**
- 不显示右侧排名区域（屏幕太小）
- 死亡对话框显示排行榜
- 其他逻辑与桌面版一致

## 实现优先级

### P0（核心功能）
1. 控制说明文案优化
2. 暂停后空格恢复
3. Cloudflare Workers API 实现
4. D1 数据库创建和初始化
5. 前端昵称管理
6. 前端排行榜显示（右侧 + 死亡遮罩）

### P1（增强功能）
1. IP 限流防刷
2. 分数合理性校验
3. 错误处理和降级方案

### P2（可选功能）
1. 排行榜分页（显示 Top 100）
2. 玩家历史分数曲线图
3. 每日/每周排行榜

## 测试计划

### 单元测试
- 昵称验证逻辑
- 分数合理性校验
- IP 限流逻辑

### 集成测试
- API 端点功能测试
- 前后端联调测试
- 错误场景测试（网络失败、超时）

### 性能测试
- 并发提交测试（100 QPS）
- KV 缓存命中率测试
- D1 查询性能测试

### 兼容性测试
- 桌面浏览器：Chrome, Firefox, Safari, Edge
- 移动浏览器：iOS Safari, Android Chrome
- 国内网络环境测试

## 风险和缓解

### 风险 1：Cloudflare 在国内访问不稳定
**缓解：**
- Cloudflare CDN 在国内有节点，访问速度较快
- 提供降级方案：API 失败时只显示本地排行榜

### 风险 2：恶意刷榜
**缓解：**
- IP 限流（每分钟 3 次）
- 分数合理性校验（1-999）
- 后续可添加验证码或设备指纹

### 风险 3：D1 数据库性能瓶颈
**缓解：**
- KV 缓存减少数据库查询
- D1 免费额度：每天 500 万次读取，10 万次写入（足够使用）
- 索引优化（`idx_score DESC`）

## 后续扩展

### 短期（1-2 周）
- 添加排行榜筛选（今日/本周/全部）
- 玩家个人主页（历史分数、成就）

### 中期（1-2 月）
- 好友系统和好友排行榜
- 分享功能（分享到社交媒体）

### 长期（3+ 月）
- 赛季排行榜和奖励
- 多人对战模式

## 总结

本设计通过优化控制说明和实现全球排行榜系统，显著提升了 ZoomBird 的用户体验和社交竞争性。采用 Cloudflare Workers + D1 架构，确保了国内访问稳定性和零成本运营。实现方案清晰可行，风险可控。

# Apple Watch Tap 控制 ZOOMBIRD（电脑端）

这个方案实现：
- Apple Watch 点一下 -> 发一个 `tap` 请求
- 电脑上的 ZOOMBIRD 页面收到事件 -> 执行一次起跳

## 1) 在电脑启动桥接服务

在项目目录执行：

```bash
cd '/Users/david/ 测试/zoombird'
node watch-bridge-server.js --port 8765 --token your_secret_token
```

启动后会看到：
- `events URL`
- `tap URL`

## 2) 打开游戏时带上桥接参数

你当前线上链接：
- `https://donghaoseng-tech.github.io/zoombird/zoombird.html`

需要加两个参数：
- `watchBridgeUrl`：桥接服务地址（必须是浏览器能访问的 HTTPS/HTTP 地址）
- `watchToken`：和服务启动时一致

例如：

```text
https://donghaoseng-tech.github.io/zoombird/zoombird.html?watchBridgeUrl=https%3A%2F%2Fexample-bridge-url&watchToken=your_secret_token
```

## 3) Apple Watch 上配置点击动作（快捷指令）

在 iPhone 的「快捷指令」里新建快捷指令：
1. 动作：`获取 URL 内容`
2. URL 填：

```text
https://example-bridge-url/tap?token=your_secret_token
```

3. 把该快捷指令勾选到 Apple Watch
4. 可加到表盘复杂功能，点一下就发送 tap

## 4) 重要：你这个 GitHub Pages 链接是 HTTPS

浏览器安全策略下：
- HTTPS 页面通常不能直接连 `http://127.0.0.1:8765`

所以推荐两种方式：

### 方案 A（推荐）：用 Cloudflare Tunnel 暴露本地桥接为 HTTPS

```bash
# 安装（macOS）
brew install cloudflared

# 把本地 8765 暴露成 https://xxxx.trycloudflare.com
cloudflared tunnel --url http://127.0.0.1:8765
```

然后：
- `watchBridgeUrl` 用 `https://xxxx.trycloudflare.com`
- Apple Watch 快捷指令 URL 也用该域名

### 方案 B：本地 HTTP 打开游戏页面

把游戏在本地 `http://` 环境打开（不是 https），这样可以直接用本地桥接地址。

## 5) 已支持的页面

桥接监听已接入：
- `zoombird.html`
- `zoombird-mobile.html`

只要 URL 带了 `watchBridgeUrl + watchToken`，就会自动连接。

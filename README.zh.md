# lexmount-js-sdk-quickstart

> [English](./README.md)

Lexmount Node.js SDK 的快速开始示例项目。

---

## 示例说明

### `demo.ts` - 基础示例
- 访问 Lexmount 官网
- 校验页面标题
- 保存截图

### `light-demo.ts` - 轻量浏览器示例
- 使用 `light` 浏览器模式
- 访问新浪新闻
- 提取所有链接并保存到 `links.txt`

### `session-list.ts` - 会话管理示例
- 创建测试会话
- 列出带分页信息的会话
- 按状态过滤会话
- 清理会话

### `context-basic.ts` - 基础 context 示例
- 创建 context
- 使用该 context 启动 `readWrite` 会话

### `context-list-get.ts` - context 列表与详情示例
- 创建多个 context
- 列出 context
- 获取指定 context 详情
- 清理示例创建的 context

### `context-fork.ts` - context fork 示例
- 传入一个已有的 source `context_id`
- 基于 source fork 出新的 context
- 打印 fork 后的新 id

### `extension-basic.ts` - Extension 示例
- 上传浏览器扩展压缩包
- 列出已上传扩展
- 使用 `extensionIds` 创建会话

### `proxy-demo.ts` - 代理示例
- 使用 `proxy` 创建会话
- 验证远程浏览器可以通过上游代理访问页面

### `inspect-url-demo.ts` - Inspect URL 示例
- 创建浏览器会话
- 打印 `inspectUrl` 供手动打开检查
- 等待用户输入后再关闭会话

### `session-targets.ts` - 会话 targets 示例
- 创建浏览器会话
- 通过 SDK 查询 `/json` target 列表
- 打印每个 target 的 `inspectUrl`、页面 URL 和 websocket URL

### `session-downloads.ts` - 会话下载示例
- 触发远程文件下载
- 通过 SDK 查询会话下载列表
- 将会话下载打包保存为本地 zip

---

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 基于模板创建 .env
cp .env.example .env
# 编辑 .env，填入你的 API key 和 project ID

# 3. 运行示例
npm run demo
npm run light-demo
npm run session-list
npm run context-basic
npm run context-list-get
npm run context-fork -- <context_id>
npm run extension-basic
npm run proxy-demo
npm run inspect-url-demo
npm run session-targets
npm run session-downloads
```

`.env` 内容示例：

```bash
LEXMOUNT_API_KEY=your_api_key_here
LEXMOUNT_PROJECT_ID=your_project_id_here
LEXMOUNT_BASE_URL=https://api.lexmount.cn
LEXMOUNT_EXTENSION_PATH=/absolute/path/to/extension.zip
LEXMOUNT_PROXY_SERVER=http://host:port
LEXMOUNT_PROXY_USERNAME=
LEXMOUNT_PROXY_PASSWORD=
```

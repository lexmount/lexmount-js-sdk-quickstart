# lexmount-js-sdk-quickstart

> [English](./README.md)

Lexmount Node.js SDK 的快速开始示例项目。

---

## 示例说明

### `demo.ts` - 基础示例
- 访问 Lexmount 官网
- 校验页面标题
- 保存截图

### `catalog-info.ts` - Catalog 信息示例
- 通过 `client.catalogInfo()` 查询公开 endpoint catalog
- 打印可用 region 和 host

### `connection-demo.ts` - 直连示例
- 基于 `LEXMOUNT_BASE_URL` 构造 websocket 直连地址
- 通过 `/connection?project_id=...&api_key=...` 连接
- 访问 `https://example.com` 并保存 `connection_demo.png`

### `custom-image-demo.ts` - 自定义镜像示例
- 使用 `customImageId` 创建浏览器会话
- 支持从命令行传入 `--custom_image_id`
- 连接会话并验证浏览器可以打开页面

### `window-size-demo.ts` - 窗口尺寸示例
- 使用 `windowSize` 创建浏览器会话
- 支持从命令行传入 `--window_size`（也兼容 `--window-size` 或 `--window size`），默认 `1920,1080`
- 连接会话并打印真实的初始 viewport

### `light-demo.ts` - 轻量浏览器示例
- 使用 `light` 浏览器模式
- 显式开启 LightMount layout，并展示单会话 `enableLightmountResource` 开关
- 访问新浪新闻
- 提取所有链接并保存到 `links.txt`

### `session-list.ts` - 会话管理示例
- 创建测试会话
- 列出带分页信息的会话
- 按状态过滤会话
- 清理会话

### `context-basic.ts` - 基础 context 示例
- 创建带 `description` 的 context
- 使用该 context 启动 `readWrite` 会话

### `context-list-get.ts` - context 列表与详情示例
- 创建多个带描述的 context
- 列出 context 并打印展示名称
- 获取指定 context 详情和展示名称
- 清理示例创建的 context

### `context-fork.ts` - context fork 示例
- 传入一个已有的 source `context_id`
- 基于 source fork 出新的 context
- 打印 fork 后的新 id

### `context-lock-handling.ts` - context 锁处理示例
- 创建 read-write context 会话
- 演示通过 `ContextLockedError` 处理锁冲突

### `context-modes.ts` - context 模式示例
- 创建 context
- 运行一个 `readWrite` 会话和两个并发 `readOnly` 会话

### `extension-basic.ts` - Extension 示例
- 上传浏览器扩展压缩包
- 列出已上传扩展
- 使用 `extensionIds` 创建会话

### `extension-list-get.ts` - Extension list/get 示例
- 列出已上传扩展
- 获取一个扩展的详情
- 当设置 `LEXMOUNT_EXTENSION_PATH` 时，额外演示上传和删除扩展

### `proxy-demo.ts` - 代理示例
- 使用 `proxy` 创建会话
- 验证远程浏览器可以通过上游代理访问页面

### `local-proxy-demo.ts` - 本地网络代理示例
- 通过 SDK 所在机器的网络和 DNS 访问内网页面
- 打开隧道、访问并截图，结束或失败时清理会话和隧道

### `official-proxy-demo.ts` - 官方代理示例
- 使用 `officialProxy: true` 创建会话
- 验证远程浏览器可以通过 Lexmount 官方代理池访问页面

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

以下 `npm run` 命令通过 `tsx` 执行，需要 Node.js 18.17 或更新版本。
使用 Node.js 22.18+ 或 24+ 时，也可直接执行 `node demo.ts`，所有 demo 都支持此方式。参见 [Node.js TypeScript 支持说明](https://nodejs.org/api/typescript.html)。

```bash
# 1. 安装依赖
npm install

# 2. 基于模板创建 .env
cp .env.example .env
# 本地 macOS/Windows 终端缺少凭据时会自动打开浏览器登录。

# 3. 运行示例
npm run demo
npm run catalog-info
npm run connection-demo
npm run custom-image-demo -- --custom_image_id code.lexmount.net/neng/chrome:tag
npm run window-size-demo -- --window_size 800,600
npm run light-demo
npm run session-list
npm run context-basic
npm run context-list-get
npm run context-fork -- <context_id>
npm run context-lock-handling
npm run context-modes
npm run extension-basic
npm run extension-list-get
npm run proxy-demo
npm run local-proxy-demo -- --url http://oa.company.internal/
npm run official-proxy-demo
npm run inspect-url-demo
npm run session-targets
npm run session-downloads
```

`.env` 内容示例：

```bash
LEXMOUNT_API_KEY=your_api_key_here
LEXMOUNT_PROJECT_ID=your_project_id_here
LEXMOUNT_BASE_URL=https://api.lexmount.com
LEXMOUNT_EXTENSION_PATH=/absolute/path/to/extension.zip
LEXMOUNT_PROXY_SERVER=http://host:port
LEXMOUNT_PROXY_USERNAME=
LEXMOUNT_PROXY_PASSWORD=
LEXMOUNT_CUSTOM_IMAGE_ID=code.lexmount.net/neng/chrome:tag
LEXMOUNT_WINDOW_SIZE=1920,1080
```


## 凭据检查与浏览器登录

所有 demo 都会在调用 API 前检查 `LEXMOUNT_PROJECT_ID` 和 `LEXMOUNT_API_KEY`。读取的是**当前工作目录**的 `.env`，其中的值优先于已导出的环境变量；空值及模板占位值视为未配置。已有完整凭据时直接运行，不打开浏览器。

- 默认 API 为 `https://api.lexmount.com`，对应官网为 `https://browser.lexmount.com`。
- 在本地 **macOS / Windows 交互式终端**中缺少凭据时，自动打开系统浏览器登录并授权。批准后返回终端，demo 自动继续。
- 使用临时 `127.0.0.1` 回调和 PKCE，通过 HTTPS 用一次性 code 换取凭据。Project ID、API Key 和匹配的 API 地址成对写入 `.env`，保留其他配置。POSIX 下新写入文件仅当前用户可读写；Windows 下请用当前用户的目录访问权限保护项目。
- Linux、SSH、CI、非交互终端、无法打开浏览器或授权超时（3 分钟）时，程序退出并提示官网和手动配置方法；填写两个值后重跑。CI 也可直接设置两个环境变量而不创建 `.env`。
- 显式设置 `https://api.lexmount.cn` 时，授权使用 `https://browser.lexmount.cn`。其他自定义 API 地址保持不变，请从对应环境手动获取凭据，不会自动切换到 `.com`。
- 交换失败时不写入凭据；若授权期间修改了 `.env`，请重跑以免覆盖改动。不要提交 `.env`。

请在仓库目录执行各 demo，让它们共用同一个 `.env`。

## 通过本地代理访问公司内网

`local-proxy-demo.ts` 使用 SDK **0.6.0**，先打开独立的本地网络隧道，再创建使用该隧道的 normal 云浏览器。请在已接入公司网络或 VPN 的机器上运行；目标域名解析和 TCP 连接由这台机器完成。API 环境和所选区域需要部署本地代理网关，项目需要启用 `custom_proxy`。

安装依赖并配置凭据后运行：

```bash
npm run local-proxy-demo -- --url http://oa.company.internal/
# 可选：指定 LEXMOUNT_BASE_URL 对应目录中的区域
npm run local-proxy-demo -- --url http://oa.company.internal/ --region <region-id>
```

目标网址必须通过 `--url` 指定。可在 `.env` 中设置 `LEXMOUNT_REGION`，`--region` 优先。`--help` 无需凭据，也不会访问 API。

demo 输出页面标题、保存 `local_proxy_demo.png`，随后等待用户按任意键，再关闭浏览器、云端会话、隧道和客户端。等待期间浏览器和本地隧道保持可用；Ctrl+C 也会触发清理。非交互运行遇到输入结束时直接清理。导航失败时也会清理会话与隧道。整个流程使用同一个客户端，保持 Project ID、API Key 和区域一致。

目标请使用内网域名或局域网 IP。Chrome 对 localhost、回环及链路本地地址有[默认绕过代理规则](https://chromium.googlesource.com/chromium/src/+/HEAD/net/docs/proxy.md#implicit-bypass-rules)，因此不要用 `127.0.0.1` 作为本示例的目标地址。网站登录状态和证书信任仍由云浏览器自行处理。

声明的 SDK 0.6.0 需要先发布到 npm，标准依赖安装命令才能成功。

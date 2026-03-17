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
```

`.env` 内容示例：

```bash
LEXMOUNT_API_KEY=your_api_key_here
LEXMOUNT_PROJECT_ID=your_project_id_here
LEXMOUNT_BASE_URL=https://api.lexmount.cn
```

# lexmount-js-sdk-quickstart

> 🇬🇧 [English](./README.md)

快速开始使用 Lexmount JavaScript/TypeScript SDK 的示例项目。

---

## 📋 示例说明

### demo.ts - 基础演示
- 访问 Lexmount 官网
- 验证页面标题
- 截图保存

### light-demo.ts - 轻量浏览器演示
- 使用 `chrome-light-docker` 模式
- 访问新浪新闻
- 提取所有链接并保存到 `links.txt`

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 安装 Playwright 浏览器

```bash
npx playwright install chromium
```

### 3. 配置环境变量

在项目根目录创建 `.env` 文件：

```bash
# .env
LEXMOUNT_API_KEY=your_api_key_here
LEXMOUNT_PROJECT_ID=your_project_id_here
```

> 在这里获取你的凭证：https://dev.lexmount.net/

### 4. 运行示例

```bash
# 基础演示
npm run demo

# 轻量浏览器演示
npm run light-demo
```

---

## 📦 依赖说明

- **lexmount** - Lexmount JavaScript SDK
- **playwright** - 浏览器自动化库
- **dotenv** - 环境变量管理
- **typescript** - TypeScript 支持
- **ts-node** - TypeScript 运行环境

---

## 📖 文档资源

- [Lexmount SDK 文档](https://dev.lexmount.net/docs)
- [Playwright 文档](https://playwright.dev/)

---

## 📝 许可证

MIT


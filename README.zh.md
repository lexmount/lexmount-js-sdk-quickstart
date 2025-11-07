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

### 2. 配置环境变量

在项目根目录创建 `.env` 文件：

```bash
# .env
LEXMOUNT_API_KEY=your_api_key_here
LEXMOUNT_PROJECT_ID=your_project_id_here
```

> 在这里获取你的凭证：https://dev.lexmount.net/

### 3. 运行示例

```bash
# 基础演示
npm run demo

# 轻量浏览器演示
npm run light-demo
```

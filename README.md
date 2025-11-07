# lexmount-js-sdk-quickstart

> 🇨🇳 [中文版](./README.zh.md)

Quick start examples for Lexmount JavaScript/TypeScript SDK.

---

## 📋 Examples

### demo.ts - Basic Demo
- Visit Lexmount website
- Verify page title
- Take screenshot

### light-demo.ts - Light Browser Demo
- Use `chrome-light-docker` mode
- Visit Sina News
- Extract all links and save to `links.txt`

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# .env
LEXMOUNT_API_KEY=your_api_key_here
LEXMOUNT_PROJECT_ID=your_project_id_here
```

> Get your credentials from: https://dev.lexmount.net/

### 3. Run Examples

```bash
# Basic demo
npm run demo

# Light browser demo
npm run light-demo
```

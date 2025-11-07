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

### 2. Install Playwright Browsers

```bash
npx playwright install chromium
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# .env
LEXMOUNT_API_KEY=your_api_key_here
LEXMOUNT_PROJECT_ID=your_project_id_here
```

> Get your credentials from: https://dev.lexmount.net/

### 4. Run Examples

```bash
# Basic demo
npm run demo

# Light browser demo
npm run light-demo
```

---

## 📦 Dependencies

- **lexmount** - Lexmount JavaScript SDK
- **playwright** - Browser automation library
- **dotenv** - Environment variable management
- **typescript** - TypeScript support
- **ts-node** - TypeScript execution environment

---

## 📖 Documentation

- [Lexmount SDK Documentation](https://dev.lexmount.net/docs)
- [Playwright Documentation](https://playwright.dev/)

---

## 📝 License

MIT

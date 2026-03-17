# lexmount-js-sdk-quickstart

> [中文](./README.zh.md)

Quick start examples for the Lexmount Node.js SDK.

---

## Examples

### `demo.ts` - Basic demo
- Visit the Lexmount website
- Verify the page title
- Take a screenshot

### `light-demo.ts` - Light browser demo
- Use `light` browser mode
- Visit Sina News
- Extract all links and save them to `links.txt`

### `session-list.ts` - Session management demo
- Create test sessions
- List sessions with pagination information
- Filter sessions by status
- Clean up sessions

### `context-basic.ts` - Basic context demo
- Create a context
- Start a `readWrite` session with that context

### `context-list-get.ts` - Context list/get demo
- Create contexts
- List contexts
- Get details for a specific context
- Clean up created contexts

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env from the template
cp .env.example .env
# Edit .env and fill in your API key and project ID

# 3. Run examples
npm run demo
npm run light-demo
npm run session-list
npm run context-basic
npm run context-list-get
```

The `.env` file should contain:

```bash
LEXMOUNT_API_KEY=your_api_key_here
LEXMOUNT_PROJECT_ID=your_project_id_here
LEXMOUNT_BASE_URL=https://api.lexmount.cn
```

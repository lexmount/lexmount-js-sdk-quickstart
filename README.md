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

### `context-fork.ts` - Context fork demo
- Accept an existing source `context_id`
- Fork it into a new context
- Print the forked context id

### `extension-basic.ts` - Extension demo
- Upload a browser extension archive
- List uploaded extensions
- Create a session with `extensionIds`

### `proxy-demo.ts` - Proxy demo
- Create a session with `proxy`
- Verify the remote browser can access pages through the upstream proxy

### `inspect-url-demo.ts` - Inspect URL demo
- Create a browser session
- Print the `inspectUrl` for manual inspection
- Wait for user input before closing the session

### `session-downloads.ts` - Session downloads demo
- Trigger a remote file download
- Query session downloads through the SDK
- Archive session downloads to a local zip file

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
npm run context-fork -- <context_id>
npm run extension-basic
npm run proxy-demo
npm run inspect-url-demo
npm run session-downloads
```

The `.env` file should contain:

```bash
LEXMOUNT_API_KEY=your_api_key_here
LEXMOUNT_PROJECT_ID=your_project_id_here
LEXMOUNT_BASE_URL=https://api.lexmount.cn
LEXMOUNT_EXTENSION_PATH=/absolute/path/to/extension.zip
LEXMOUNT_PROXY_SERVER=http://host:port
LEXMOUNT_PROXY_USERNAME=
LEXMOUNT_PROXY_PASSWORD=
```

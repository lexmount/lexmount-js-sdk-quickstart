# lexmount-js-sdk-quickstart

> [中文](./README.zh.md)

Quick start examples for the Lexmount Node.js SDK.

---

## Examples

### `demo.ts` - Basic demo
- Visit the Lexmount website
- Verify the page title
- Take a screenshot

### `catalog-info.ts` - Catalog info demo
- Query the public endpoint catalog through `client.catalogInfo()`
- Print available regions and hosts

### `connection-demo.ts` - Direct connection demo
- Build a direct websocket URL from `LEXMOUNT_BASE_URL`
- Connect through `/connection?project_id=...&api_key=...`
- Visit `https://example.com` and save `connection_demo.png`

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

### `context-lock-handling.ts` - Context lock handling demo
- Create a read-write context session
- Demonstrate lock conflict handling through `ContextLockedError`

### `context-modes.ts` - Context modes demo
- Create a context
- Run one `readWrite` session and two concurrent `readOnly` sessions

### `extension-basic.ts` - Extension demo
- Upload a browser extension archive
- List uploaded extensions
- Create a session with `extensionIds`

### `extension-list-get.ts` - Extension list/get demo
- List uploaded extensions
- Get details for one extension
- Optionally upload and delete an extension when `LEXMOUNT_EXTENSION_PATH` is set

### `proxy-demo.ts` - Proxy demo
- Create a session with `proxy`
- Verify the remote browser can access pages through the upstream proxy

### `inspect-url-demo.ts` - Inspect URL demo
- Create a browser session
- Print the `inspectUrl` for manual inspection
- Wait for user input before closing the session

### `session-targets.ts` - Session targets demo
- Create a browser session
- Query `/json` targets through the SDK
- Print each target's `inspectUrl`, page URL, and websocket URL

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
npm run catalog-info
npm run connection-demo
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
npm run inspect-url-demo
npm run session-targets
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

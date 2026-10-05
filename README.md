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

### `custom-image-demo.ts` - Custom image demo
- Create a browser session with `customImageId`
- Accept `--custom_image_id` from the command line
- Connect to the session and verify the browser can open a page

### `window-size-demo.ts` - Window size demo
- Create a browser session with `windowSize`
- Accept `--window_size` (also `--window-size` or `--window size`), defaulting to `1920,1080`
- Connect to the session and print the live initial viewport

### `light-demo.ts` - Light browser demo
- Use `light` browser mode
- Enable LightMount layout and show its per-session `enableLightmountResource` switch
- Visit Sina News
- Extract all links and save them to `links.txt`

### `session-list.ts` - Session management demo
- Create test sessions
- List sessions with pagination information
- Filter sessions by status
- Clean up sessions

### `context-basic.ts` - Basic context demo
- Create a context with `description`
- Start a `readWrite` session with that context

### `context-list-get.ts` - Context list/get demo
- Create contexts with descriptions
- List contexts and print display names
- Get details for a specific context, including its display name
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

### `official-proxy-demo.ts` - Official proxy demo
- Create a session with `officialProxy: true`
- Verify the remote browser can access pages through the Lexmount official proxy pool

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

Requires Node.js 18.17 or newer.

```bash
# 1. Install dependencies
npm install

# 2. Create .env from the template
cp .env.example .env
# On a local macOS/Windows terminal, missing credentials trigger browser sign-in.

# 3. Run examples
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
npm run official-proxy-demo
npm run inspect-url-demo
npm run session-targets
npm run session-downloads
```

The `.env` file should contain:

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


## Credentials and browser sign-in

Every demo checks `LEXMOUNT_PROJECT_ID` and `LEXMOUNT_API_KEY` before making API requests. It loads `.env` from the **current working directory**, with `.env` taking precedence over exported environment variables. Empty values and the example placeholders count as missing. Existing complete credentials are used without opening a browser.

- Default API: `https://api.lexmount.com`; website: `https://browser.lexmount.com`.
- With missing credentials, an interactive local **macOS or Windows** terminal opens the system browser for sign-in and authorization. Return to the terminal after approving; the demo continues automatically.
- The PKCE flow uses a temporary `127.0.0.1` callback and exchanges a one-time code over HTTPS. Both credentials and the matching API base URL are saved together to `.env`, preserving unrelated settings. Newly written files have owner-only permissions on POSIX systems; on Windows protect the project directory with your user account's ACLs.
- On Linux, SSH, CI, non-interactive terminals, or when browser authorization fails/times out (3 minutes), the demo exits with website/manual setup instructions. Fill in the two values and rerun. You can also set both environment variables without an `.env` file in CI.
- Explicit `https://api.lexmount.cn` uses `https://browser.lexmount.cn` for authorization. Other custom API URLs are preserved and require manual credentials from their matching environment; they never silently log in to `.com`.
- No credentials are saved on an unsuccessful exchange. If `.env` is changed while signing in, rerun the demo to avoid overwriting those edits. Do not commit `.env`.

Run examples from this repository directory so they share the same `.env`.

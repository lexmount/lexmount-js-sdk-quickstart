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

### `local-proxy-demo.ts` - Local network proxy demo
- Access an internal page using the SDK machine's network and DNS
- Open a tunnel, navigate and screenshot, then clean up the session and tunnel

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

Requires Node.js 18.17 or newer for the `npm run` commands below (which use `tsx`).
You can also run `node demo.ts` directly with Node.js 22.18+ or 24+; the same applies to every demo. See [Node.js TypeScript support](https://nodejs.org/api/typescript.html).

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
npm run local-proxy-demo -- --url http://oa.company.internal/
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

## Access your company network with the local proxy

`local-proxy-demo.ts` uses SDK **0.7.0**, opens a separate local-network tunnel, then creates a normal cloud browser with that tunnel. Run it on the machine connected to your company network or VPN. Target DNS and TCP connections use this machine's network. The API environment and selected region must have the local proxy gateway deployed, and the project must have `custom_proxy` enabled.

After installing dependencies and setting credentials, run:

```bash
npm run local-proxy-demo -- --url http://oa.company.internal/
# Optional: select a catalog region available at LEXMOUNT_BASE_URL
npm run local-proxy-demo -- --url http://oa.company.internal/ --region <region-id>
```

The target URL is required via `--url`. You can set optional `LEXMOUNT_REGION` in `.env`; `--region` takes precedence. `--help` works without credentials or API access.

The demo prints the page title, saves `local_proxy_demo.png`, then waits for any key before closing the browser, cloud session, tunnel and client. The browser and local connector stay available while waiting; Ctrl+C also triggers cleanup. End-of-input allows noninteractive runs to finish. Sessions and tunnels are also closed when navigation fails. One client keeps the project, API key and region consistent.

Use an internal hostname or LAN IP for the target. Chrome has [implicit proxy bypass rules](https://chromium.googlesource.com/chromium/src/+/HEAD/net/docs/proxy.md#implicit-bypass-rules) for localhost/loopback and link-local addresses, so `127.0.0.1` is not a reliable address for this demo. The cloud browser still needs its own website login and certificate trust.

## Browser Agent API

This repository pins **Lexmount SDK 0.7.0**, published on npm. Run `npm install` to install it; a sibling SDK checkout is not required. The server must still have its public Browser Agent API enabled and the project configured for access.

All new examples use the credential setup described above: existing credentials are reused; on local macOS/Windows terminals, missing credentials start browser sign-in and authorization, then save the returned Project ID and API key.

```bash
# Use the automatic sign-in flow above, or configure .env beforehand.
export LEXMOUNT_BASE_URL='https://api.lexmount.com'
npm run browser-agent
npm run browser-agent-advanced
npm run browser-agent-recovery
```

- `browser-agent.ts`: create a standard Run, then wait; 201 means accepted. Task failure is a normal Run result.
- `browser-agent-advanced.ts`: save an Agent with a JSON Schema and `{{topic}}` variable; read native object output and usage. The saved Agent remains available for reuse.
- `browser-agent-recovery.ts`: persist a business ID, exact request, idempotency key and Run ID in a local file before/after POST. Rerun the same file to recover. A lost response uses the original key; a known Run uses GET/wait. Do not use an unknown receipt's key beyond 7 days without reconciliation.

Set `RUN_IDEMPOTENCY_KEY` to reuse a Run create across retries, and a separate `AGENT_IDEMPOTENCY_KEY` for Agent creation. Repeating the advanced example requires both keys so the Agent ID in the Run request stays unchanged. Prefer the recovery example for process restarts. Separate independent creates need separate keys. SDK retries within one method call reuse its key.

`RunWaitTimeout` only stops local waiting; it does not cancel or recreate the Run. Resume GET/wait with the saved ID. Keep API keys out of URLs, logs and public browser code. `usage.credits=null` means unconfirmed metering; browser time is billed separately. The SDK and these examples default to `https://api.lexmount.com`; an explicit `LEXMOUNT_BASE_URL` still selects CN or a custom environment.

These examples use the existing credential setup flow described above.


### Browser Agent installation and regression checks

Run `bash scripts/test-browser-agent.sh` in a clean checkout. It installs the declared `0.7.0` package from npm and checks credential setup, recovery and TypeScript types without a sibling SDK checkout. These checks use local mocks and do not create real Agents or Runs.

Recovery files bind the original Project ID and API origin, with no API key saved. Reusing a file in another project/service, using an old unscoped file or losing its idempotency key is rejected before any Run request. Reconcile the original task instead of deleting the file and rerunning. On POSIX, file contents and directory entries are synced before POST and after the receipt rename. A known Run ID uses GET/wait even after the seven-day create-key window.

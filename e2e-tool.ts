import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { config } from 'dotenv';

config({ override: true });

type DemoStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

interface DemoDefinition {
  id: string;
  label: string;
  script: string;
  args?: string[];
  description: string;
  defaultSelected?: boolean;
}

interface DemoResult {
  id: string;
  label: string;
  status: DemoStatus;
  startedAt?: string;
  finishedAt?: string;
  exitCode?: number | null;
  durationMs?: number;
  logs: string[];
}

interface TaskState {
  id: string;
  status: 'running' | 'passed' | 'failed';
  startedAt: string;
  finishedAt?: string;
  total: number;
  completed: number;
  selectedDemoIds: string[];
  results: DemoResult[];
  logs: string[];
  summaryPath?: string;
}

const PORT = Number(process.env.E2E_TOOL_PORT ?? 3000);
const OUTPUT_DIR = process.env.E2E_TOOL_OUTPUT_DIR ?? join(process.cwd(), 'e2e-results');

const DEMOS: DemoDefinition[] = [
  {
    id: 'catalog-info',
    label: 'Catalog Info',
    script: 'catalog-info',
    description: 'Query public endpoint catalog.',
    defaultSelected: true,
  },
  {
    id: 'demo',
    label: 'Basic Demo',
    script: 'demo',
    description: 'Open Lexmount homepage and save screenshot.',
    defaultSelected: true,
  },
  {
    id: 'light-demo',
    label: 'Light Browser Demo',
    script: 'light-demo',
    description: 'Run light browser and extract links.',
    defaultSelected: true,
  },
  {
    id: 'session-list',
    label: 'Session List',
    script: 'session-list',
    description: 'Create, list, filter, and clean up sessions.',
    defaultSelected: true,
  },
  {
    id: 'context-basic',
    label: 'Context Basic',
    script: 'context-basic',
    description: 'Create context and run read-write session.',
    defaultSelected: true,
  },
  {
    id: 'context-list-get',
    label: 'Context List/Get',
    script: 'context-list-get',
    description: 'Create, list, get, and clean up contexts.',
    defaultSelected: true,
  },
  {
    id: 'context-lock-handling',
    label: 'Context Lock Handling',
    script: 'context-lock-handling',
    description: 'Exercise context lock conflict handling.',
  },
  {
    id: 'context-modes',
    label: 'Context Modes',
    script: 'context-modes',
    description: 'Exercise readWrite and readOnly context modes.',
  },
  {
    id: 'extension-basic',
    label: 'Extension Basic',
    script: 'extension-basic',
    description: 'Upload extension and create session with extensionIds.',
  },
  {
    id: 'extension-list-get',
    label: 'Extension List/Get',
    script: 'extension-list-get',
    description: 'List and get uploaded extension details.',
  },
  {
    id: 'proxy-demo',
    label: 'Proxy Demo',
    script: 'proxy-demo',
    description: 'Create a session with upstream proxy.',
  },
  {
    id: 'inspect-url-demo',
    label: 'Inspect URL Demo',
    script: 'inspect-url-demo',
    description: 'Create a session and print inspect URL.',
    defaultSelected: true,
  },
  {
    id: 'session-targets',
    label: 'Session Targets',
    script: 'session-targets',
    description: 'List /json targets and inspect URLs.',
    defaultSelected: true,
  },
  {
    id: 'session-downloads',
    label: 'Session Downloads',
    script: 'session-downloads',
    description: 'Trigger download and archive session downloads.',
  },
  {
    id: 'connection-demo',
    label: 'Direct Connection',
    script: 'connection-demo',
    description: 'Connect through /connection websocket endpoint.',
  },
  {
    id: 'new-page-repro',
    label: 'New Page Repro',
    script: 'new-page-repro',
    args: ['--', '--browser-mode', 'normal'],
    description: 'Create multiple pages through Playwright CDP.',
    defaultSelected: true,
  },
];

const tasks = new Map<string, TaskState>();

function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload, null, 2));
}

function readJson(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function appendLog(task: TaskState, line: string): void {
  const stamped = `${new Date().toISOString()} ${line}`;
  task.logs.push(stamped);
}

function runDemo(task: TaskState, demo: DemoDefinition): Promise<DemoResult> {
  return new Promise((resolve) => {
    const started = Date.now();
    const result: DemoResult = {
      id: demo.id,
      label: demo.label,
      status: 'running',
      startedAt: new Date(started).toISOString(),
      logs: [],
    };
    task.results.push(result);
    appendLog(task, `[${demo.id}] started`);

    const child = spawn('npm', ['run', demo.script, ...(demo.args ?? [])], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        LEXMOUNT_QUICKSTART_NON_INTERACTIVE: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const addOutput = (source: 'stdout' | 'stderr', chunk: Buffer): void => {
      for (const line of chunk.toString('utf8').split(/\r?\n/)) {
        if (!line) {
          continue;
        }
        const formatted = `[${demo.id}][${source}] ${line}`;
        result.logs.push(formatted);
        appendLog(task, formatted);
      }
    };

    child.stdout.on('data', (chunk: Buffer) => addOutput('stdout', chunk));
    child.stderr.on('data', (chunk: Buffer) => addOutput('stderr', chunk));
    child.on('error', (error) => {
      result.status = 'failed';
      result.logs.push(`[${demo.id}][error] ${error.message}`);
    });
    child.on('close', (code) => {
      const finished = Date.now();
      result.exitCode = code;
      result.finishedAt = new Date(finished).toISOString();
      result.durationMs = finished - started;
      result.status = code === 0 ? 'passed' : 'failed';
      task.completed += 1;
      appendLog(task, `[${demo.id}] ${result.status} exitCode=${code}`);
      resolve(result);
    });
  });
}

async function runTask(task: TaskState, demos: DemoDefinition[]): Promise<void> {
  mkdirSync(join(OUTPUT_DIR, task.id), { recursive: true });

  for (const demo of demos) {
    await runDemo(task, demo);
  }

  task.status = task.results.every((result) => result.status === 'passed') ? 'passed' : 'failed';
  task.finishedAt = new Date().toISOString();
  task.summaryPath = join(OUTPUT_DIR, task.id, 'summary.json');
  writeFileSync(task.summaryPath, JSON.stringify(task, null, 2), 'utf8');
  appendLog(task, `summary written: ${task.summaryPath}`);
}

function renderPage(): string {
  const demosJson = JSON.stringify(DEMOS).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Lexmount Quickstart E2E</title>
  <style>
    :root { color-scheme: light; --bg: #f5f1e8; --card: #fffaf0; --text: #202018; --muted: #6b665d; --line: #ded4c2; --accent: #0f766e; --bad: #b91c1c; --ok: #15803d; }
    body { margin: 0; font-family: ui-serif, Georgia, 'Times New Roman', serif; background: radial-gradient(circle at top left, #fff7d6, var(--bg) 42%, #e7f0ec); color: var(--text); }
    main { max-width: 1180px; margin: 0 auto; padding: 36px 20px 54px; }
    header { display: flex; justify-content: space-between; gap: 20px; align-items: end; margin-bottom: 24px; }
    h1 { margin: 0; font-size: clamp(32px, 5vw, 64px); letter-spacing: -0.04em; }
    p { color: var(--muted); }
    button { border: 0; background: var(--accent); color: white; padding: 11px 16px; border-radius: 999px; cursor: pointer; font-weight: 700; }
    button.secondary { background: #2d2a23; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }
    .demo { background: rgba(255,250,240,0.84); border: 1px solid var(--line); border-radius: 18px; padding: 14px; box-shadow: 0 12px 28px rgba(68, 54, 27, 0.08); }
    .demo label { display: flex; gap: 10px; align-items: start; cursor: pointer; }
    .demo strong { display: block; }
    .controls { display: flex; gap: 10px; flex-wrap: wrap; margin: 18px 0 24px; }
    .panel { background: rgba(255,250,240,0.9); border: 1px solid var(--line); border-radius: 22px; padding: 18px; margin-top: 18px; }
    .bar { height: 12px; background: #e5dfd2; border-radius: 999px; overflow: hidden; }
    .bar span { display: block; height: 100%; width: 0%; background: linear-gradient(90deg, #0f766e, #84cc16); transition: width 240ms ease; }
    .results { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
    .result { border: 1px solid var(--line); border-radius: 14px; padding: 10px; background: #fffdf7; }
    .passed { color: var(--ok); }
    .failed { color: var(--bad); }
    pre { white-space: pre-wrap; max-height: 420px; overflow: auto; background: #1f2933; color: #e5e7eb; border-radius: 16px; padding: 14px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>Lexmount Quickstart E2E</h1>
        <p>Select quickstart demos, run them sequentially, and inspect progress and logs.</p>
      </div>
      <button id="runBtn">Run Selected</button>
    </header>
    <div class="controls">
      <button class="secondary" id="selectAll">Select All</button>
      <button class="secondary" id="selectDefault">Select Default</button>
      <button class="secondary" id="clearAll">Clear</button>
    </div>
    <section class="grid" id="demoGrid"></section>
    <section class="panel">
      <h2>Progress</h2>
      <p id="status">idle</p>
      <div class="bar"><span id="progressBar"></span></div>
    </section>
    <section class="panel">
      <h2>Results</h2>
      <div class="results" id="results"></div>
    </section>
    <section class="panel">
      <h2>Logs</h2>
      <pre id="logs"></pre>
    </section>
  </main>
  <script>
    const demos = ${demosJson};
    let currentTaskId = null;
    const demoGrid = document.getElementById('demoGrid');
    const statusEl = document.getElementById('status');
    const progressBar = document.getElementById('progressBar');
    const logsEl = document.getElementById('logs');
    const resultsEl = document.getElementById('results');

    function renderDemos() {
      demoGrid.innerHTML = demos.map((demo) => '<div class="demo"><label><input type="checkbox" value="' + demo.id + '" ' + (demo.defaultSelected ? 'checked' : '') + '><span><strong>' + demo.label + '</strong><small>' + demo.description + '</small></span></label></div>').join('');
    }
    function selectedIds() {
      return Array.from(demoGrid.querySelectorAll('input:checked')).map((item) => item.value);
    }
    async function runSelected() {
      const response = await fetch('/api/run', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ demoIds: selectedIds() }) });
      const payload = await response.json();
      currentTaskId = payload.taskId;
      poll();
    }
    async function poll() {
      if (!currentTaskId) return;
      const response = await fetch('/api/tasks/' + currentTaskId);
      const task = await response.json();
      statusEl.textContent = task.status + ' ' + task.completed + '/' + task.total + (task.summaryPath ? ' summary=' + task.summaryPath : '');
      progressBar.style.width = (task.total ? Math.round(task.completed * 100 / task.total) : 0) + '%';
      logsEl.textContent = (task.logs || []).join('\\n');
      resultsEl.innerHTML = (task.results || []).map((result) => '<div class="result"><strong>' + result.label + '</strong><p class="' + result.status + '">' + result.status + '</p><small>' + (result.durationMs || 0) + 'ms</small></div>').join('');
      if (task.status === 'running') setTimeout(poll, 1200);
    }
    document.getElementById('runBtn').onclick = runSelected;
    document.getElementById('selectAll').onclick = () => demoGrid.querySelectorAll('input').forEach((item) => item.checked = true);
    document.getElementById('clearAll').onclick = () => demoGrid.querySelectorAll('input').forEach((item) => item.checked = false);
    document.getElementById('selectDefault').onclick = () => demoGrid.querySelectorAll('input').forEach((item) => item.checked = demos.find((demo) => demo.id === item.value).defaultSelected === true);
    renderDemos();
  </script>
</body>
</html>`;
}

async function handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

  if (request.method === 'GET' && url.pathname === '/') {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(renderPage());
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/demos') {
    sendJson(response, 200, { demos: DEMOS });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/run') {
    const body = (await readJson(request)) as { demoIds?: string[] };
    const selectedIds = Array.isArray(body.demoIds) ? body.demoIds : [];
    const demos = DEMOS.filter((demo) => selectedIds.includes(demo.id));
    if (demos.length === 0) {
      sendJson(response, 400, { error: 'No demos selected' });
      return;
    }

    const task: TaskState = {
      id: randomUUID(),
      status: 'running',
      startedAt: new Date().toISOString(),
      total: demos.length,
      completed: 0,
      selectedDemoIds: demos.map((demo) => demo.id),
      results: [],
      logs: [],
    };
    tasks.set(task.id, task);
    void runTask(task, demos);
    sendJson(response, 202, { taskId: task.id });
    return;
  }

  const taskMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)$/);
  if (request.method === 'GET' && taskMatch) {
    const task = tasks.get(taskMatch[1]);
    if (!task) {
      sendJson(response, 404, { error: 'Task not found' });
      return;
    }
    sendJson(response, 200, task);
    return;
  }

  sendJson(response, 404, { error: 'Not found' });
}

createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    sendJson(response, 500, { error: error instanceof Error ? error.message : String(error) });
  });
}).listen(PORT, () => {
  console.log(`Lexmount quickstart E2E tool listening on http://localhost:${PORT}`);
});

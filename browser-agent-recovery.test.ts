import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main } from "./browser-agent-recovery.ts";
import type { client } from "./browser-agent-client.ts";

test("durable recovery binds project/origin and never replaces a missing key", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "agent-recovery-"));
  const path = join(dir, "job.json");
  const previous = process.env.BROWSER_AGENT_JOB_FILE;
  process.env.BROWSER_AGENT_JOB_FILE = path;
  t.after(async () => {
    if (previous === undefined) delete process.env.BROWSER_AGENT_JOB_FILE;
    else process.env.BROWSER_AGENT_JOB_FILE = previous;
    await rm(dir, { recursive: true, force: true });
  });
  let creates = 0;
  let reads = 0;
  let project = "project-a";
  let base = "https://api.example.test";
  const make = async () =>
    ({
      projectId: project,
      baseUrl: base,
      browserAgent: {
        runs: {
          async create(request: unknown, options: { idempotencyKey: string }) {
            creates++;
            const disk = JSON.parse(await readFile(path, "utf8"));
            assert.equal(disk.run_id, null);
            assert.deepEqual(disk.request, request);
            assert.equal(disk.idempotency_key, options.idempotencyKey);
            return { id: "run-1" };
          },
          async wait(id: string) {
            reads++;
            assert.equal(id, "run-1");
            return { id, status: "succeeded", usage: { credits: 0 } };
          },
        },
      },
    }) as unknown as Awaited<ReturnType<typeof client>>;
  await main(make);
  const saved = JSON.parse(await readFile(path, "utf8"));
  await main(make);
  assert.equal(creates, 1);
  assert.equal(reads, 2);
  for (const known of [null, "run-1"]) {
    await writeFile(path, JSON.stringify({ ...saved, run_id: known }));
    project = "project-b";
    await assert.rejects(main(make), /matching Project/);
    project = "project-a";
    base = "https://other.example.test";
    await assert.rejects(main(make), /matching Project/);
    base = "https://api.example.test";
  }
  for (const changes of [
    { idempotency_key: undefined },
    { api_origin: undefined },
    { created_at: "invalid" },
    { created_at: new Date(Date.now() + 60000).toISOString() },
    { created_at: "2020-01-01" },
  ]) {
    await writeFile(
      path,
      JSON.stringify({ ...saved, run_id: null, ...changes }),
    );
    await assert.rejects(main(make), /recovery|Recovery/);
  }
  assert.equal(creates, 1);
  assert.equal(reads, 2);
});

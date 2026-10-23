import { randomUUID } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import { client, failure, report } from "./browser-agent-client.ts";
import type { RunCreateParams } from "lexmount";

type Job = {
  business_id: string;
  idempotency_key: string;
  created_at: string;
  request: RunCreateParams;
  run_id: string | null;
};
async function main() {
  const path = process.env.BROWSER_AGENT_JOB_FILE ?? "browser-agent-job.json";
  let job: Job;
  try {
    job = JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const id = randomUUID();
    job = {
      business_id: id,
      idempotency_key: `browser-agent:${id}`,
      created_at: new Date().toISOString(),
      request: {
        query: "Read the page title.",
        start_url: "https://example.com/",
        metadata: { business_id: id },
      },
      run_id: null,
    };
    // Persist BEFORE POST. A lost response can only be retried with this same key/body.
    await writeFile(path, JSON.stringify(job, null, 2), {
      flag: "wx",
      mode: 0o600,
    });
  }
  const api = (await client()).browserAgent;
  if (!job.run_id) {
    const age = Date.now() - Date.parse(job.created_at);
    if (!Number.isFinite(age) || age >= 7 * 86400000)
      throw new Error(
        "The recovery key is outside its 7-day window. Reconcile the original request before creating another task.",
      );
    const receipt = await api.runs.create(job.request, {
      idempotencyKey: job.idempotency_key,
    });
    job.run_id = receipt.id;
    const temporary = `${path}.${randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify(job, null, 2), { mode: 0o600 });
    await rename(temporary, path);
  }
  // A known Run is only queried; restarting this example never creates it again.
  console.log("Business job:", job.business_id, "Run:", job.run_id);
  report(await api.runs.wait(job.run_id));
}
main().catch(failure);

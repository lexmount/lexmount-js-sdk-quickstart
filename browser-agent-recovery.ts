import { randomUUID } from "node:crypto";
import { open, readFile, rename } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { client, failure, report } from "./browser-agent-client.ts";
import type { RunCreateParams } from "lexmount";

type Job = {
  business_id: string;
  idempotency_key: string;
  created_at: string;
  project_id: string;
  api_origin: string;
  request: RunCreateParams;
  run_id: string | null;
};
async function persist(path: string, job: Job) {
  const file = await open(path, "wx", 0o600);
  try {
    await file.writeFile(JSON.stringify(job, null, 2));
    await file.sync();
  } finally {
    await file.close();
  }
}
async function syncDirectory(path: string) {
  // Windows does not support opening directories for fsync.
  if (process.platform === "win32") return;
  const directory = await open(dirname(resolve(path)), "r");
  try {
    await directory.sync();
  } finally {
    await directory.close();
  }
}
export async function main(createClient = client) {
  const sdk = await createClient();
  const scope = {
    project_id: sdk.projectId,
    api_origin: new URL(sdk.baseUrl).origin,
  };
  const path = process.env.BROWSER_AGENT_JOB_FILE ?? "browser-agent-job.json";
  let job: Job;
  try {
    job = JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const id = randomUUID();
    job = {
      ...scope,
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
    // Persist and sync BEFORE POST, including the tenant and service that own the key.
    await persist(path, job);
    await syncDirectory(path);
  }
  if (
    !job ||
    job.project_id !== scope.project_id ||
    job.api_origin !== scope.api_origin
  )
    throw new Error(
      "Recovery record has no matching Project ID/API origin. Reconcile it in its original project and service; do not reuse it here.",
    );
  if (
    typeof job.business_id !== "string" ||
    !job.business_id ||
    typeof job.idempotency_key !== "string" ||
    !/^[\x21-\x7e]{1,128}$/.test(job.idempotency_key) ||
    !job.request ||
    typeof job.request !== "object" ||
    Array.isArray(job.request) ||
    (job.run_id !== null &&
      (typeof job.run_id !== "string" || !job.run_id.trim()))
  )
    throw new Error(
      "Invalid recovery record. Reconcile the original request before creating another task.",
    );
  const api = sdk.browserAgent;
  if (!job.run_id) {
    const age =
      typeof job.created_at === "string"
        ? Date.now() - Date.parse(job.created_at)
        : NaN;
    if (!Number.isFinite(age) || age < 0 || age >= 7 * 86400000)
      throw new Error(
        "The recovery key is outside its 7-day window. Reconcile the original request before creating another task.",
      );
    const receipt = await api.runs.create(job.request, {
      idempotencyKey: job.idempotency_key,
    });
    job.run_id = receipt.id;
    const temporary = `${path}.${randomUUID()}.tmp`;
    await persist(temporary, job);
    await rename(temporary, path);
    await syncDirectory(path);
  }
  // A known Run is only queried; restarting this example never creates it again.
  console.log("Business job:", job.business_id, "Run:", job.run_id);
  report(await api.runs.wait(job.run_id));
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  main().catch(failure);

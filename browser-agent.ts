import { randomUUID } from "node:crypto";
import { client, failure, report } from "./browser-agent-client.ts";

async function main() {
  const api = (await client()).browserAgent;
  const receipt = await api.runs.create(
    {
      query:
        process.env.BROWSER_AGENT_QUERY ??
        "Read the page title and summarize the page.",
      start_url: process.env.BROWSER_AGENT_START_URL ?? "https://example.com/",
    },
    { idempotencyKey: process.env.RUN_IDEMPOTENCY_KEY ?? randomUUID() },
  );
  console.log("Accepted (not yet completed):", receipt.id);
  report(await api.runs.wait(receipt.id));
}
main().catch(failure);

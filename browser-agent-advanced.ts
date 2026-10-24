import { randomUUID } from "node:crypto";
import { client, failure, report } from "./browser-agent-client.ts";

async function main() {
  const api = (await client()).browserAgent;
  const agent = await api.agents.create(
    {
      name: "Page summary",
      instruction: "Read the page and summarize its {{topic}}.",
      start_url: "https://example.com/",
      output_schema: {
        type: "object",
        properties: { title: { type: "string" }, summary: { type: "string" } },
        required: ["title", "summary"],
        additionalProperties: false,
      },
    },
    { idempotencyKey: process.env.AGENT_IDEMPOTENCY_KEY ?? randomUUID() },
  );
  console.log("Saved Agent:", agent.id, "revision:", agent.revision);
  const receipt = await api.runs.create(
    {
      agent_id: agent.id,
      variables: { topic: "main purpose" },
      metadata: { example: "structured-summary" },
    },
    { idempotencyKey: process.env.RUN_IDEMPOTENCY_KEY ?? randomUUID() },
  );
  const run = await api.runs.wait(receipt.id);
  report(run); // Structured output is already an object; do not JSON.parse it.
  if (
    run.status === "succeeded" &&
    run.output &&
    typeof run.output === "object"
  )
    console.log("Title:", run.output.title);
}
main().catch(failure);

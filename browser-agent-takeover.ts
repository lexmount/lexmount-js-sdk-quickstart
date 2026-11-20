import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { setTimeout as sleep } from "node:timers/promises";
import { client, failure } from "./browser-agent-client.ts";

async function main() {
  const runs = (await client()).browserAgent.v2.runs;
  const id = process.env.RUN_ID?.trim();
  if (!id) throw new Error("Set RUN_ID to an existing Browser Agent v2 run.");
  if (!stdin.isTTY || !stdout.isTTY) throw new Error("Run this example in a private terminal.");

  let run = await runs.get(id);
  if (run.status === "running") run = await runs.pause(id);
  for (let i = 0; i < 30 && (run.status === "pausing" || run.status === "running"); i++) {
    await sleep(1000);
    run = await runs.get(id);
  }

  const terminal = createInterface({ input: stdin, output: stdout });
  try {
    if (run.status === "paused" && run.pause && run.preview_url) {
      await terminal.question(`Open ${run.preview_url} and press Enter after finishing: `);
      run = await runs.resume(id, run.pause.id);
    } else if (run.status === "waiting_for_human" && run.intervention) {
      const help = run.intervention;
      console.log(help.instructions);
      if (help.url) console.log(help.url);
      const outcome = (await terminal.question("Enter resolved or unresolved: ")).trim();
      if (outcome !== "resolved" && outcome !== "unresolved") throw new Error("Invalid outcome.");
      const response = help.response_required ? (await terminal.question("Brief response: ")).trim() : undefined;
      if (help.response_required && !response) throw new Error("A response is required.");
      run = await runs.completeIntervention(id, help.id, { outcome, response });
    } else {
      console.log(`No handoff available (status: ${run.status}).`);
      return;
    }
    console.log(`Run ${run.id}: ${run.status}`);
  } finally {
    terminal.close();
  }
}

main().catch(failure);

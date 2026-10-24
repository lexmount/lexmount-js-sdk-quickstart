import { ensureCredentials } from "./quickstart-auth.ts";
import { APIError, Lexmount, RunWaitTimeout } from "lexmount";
import type { Run } from "lexmount";

export async function client() {
  await ensureCredentials();
  return new Lexmount({
    apiKey: process.env.LEXMOUNT_API_KEY,
    projectId: process.env.LEXMOUNT_PROJECT_ID,
    baseURL: process.env.LEXMOUNT_BASE_URL ?? "https://api.lexmount.com",
  });
}
export function report(run: Run) {
  console.log({
    id: run.id,
    status: run.status,
    created_request_id: run.created_request_id,
  });
  if (run.status === "succeeded") console.log(run.output);
  else {
    console.error({
      stop_reason: run.stop_reason,
      error: run.error,
      partial_output: run.output,
    });
    process.exitCode = 1;
  }
  // null means metering is pending, not zero cost.
  console.log(run.usage);
}
export function failure(error: unknown) {
  if (error instanceof RunWaitTimeout) {
    console.error(
      `Stopped waiting for ${error.run_id}; the Run is still active. Resume with runs.get/wait.`,
      error.request_id,
    );
  } else if (error instanceof APIError) {
    console.error({
      status_code: error.status_code,
      code: error.code,
      request_id: error.request_id,
    });
  } else
    console.error(error instanceof Error ? error.message : "Request failed");
  process.exitCode = 1;
}

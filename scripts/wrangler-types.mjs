import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";

const openNextDir = ".open-next";
const workerEntry = `${openNextDir}/worker.js`;
const hadOpenNextDir = existsSync(openNextDir);
const hadWorkerEntry = existsSync(workerEntry);

// Wrangler includes GlobalProps.mainModule only when the configured entrypoint
// exists. Keep generated types deterministic in clean checkouts and after a
// production build by supplying a temporary ignored entrypoint when needed.
if (!hadWorkerEntry) {
  mkdirSync(openNextDir, { recursive: true });
  writeFileSync(workerEntry, "export default {};\n", "utf8");
}

try {
  const wrangler = process.platform === "win32" ? "wrangler.cmd" : "wrangler";
  const result = spawnSync(
    wrangler,
    ["types", "--env-interface", "CloudflareEnv", ...process.argv.slice(2)],
    { stdio: "inherit" },
  );

  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  if (!hadWorkerEntry) rmSync(workerEntry, { force: true });
  if (!hadOpenNextDir) rmSync(openNextDir, { recursive: true, force: true });
}

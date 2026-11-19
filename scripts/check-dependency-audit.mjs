import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";

const args = ["audit", "--json", "--package-lock-only", "--fetch-retries=1", "--fetch-timeout=15000"];
const options = { encoding: "utf8", maxBuffer: 4 * 1024 * 1024, timeout: 45000 };
const result = process.platform === "win32"
  ? spawnSync("cmd.exe", ["/d", "/c", "npm.cmd", ...args], options)
  : spawnSync("npm", args, options);

let report;
try {
  report = JSON.parse(result.stdout);
  if (result.error || ![0, 1].includes(result.status) || report.error
      || !report.vulnerabilities || Array.isArray(report.vulnerabilities)
      || typeof report.vulnerabilities !== "object"
      || !Number.isInteger(report.metadata?.vulnerabilities?.total)) {
    throw new Error("Invalid audit report");
  }
} catch {
  console.error("Dependency audit unavailable. Verification failed.");
  process.exit(1);
}

await fs.mkdir("tmp", { recursive: true });
await fs.writeFile("tmp/dependency-audit.json", JSON.stringify(report, null, 2));

const advisories = Object.entries(report.vulnerabilities).flatMap(([name, issue]) =>
  issue.via.filter((cause) => typeof cause !== "string")
    .map((cause) => `${name}: ${cause.url} (${cause.severity})`),
);

if (result.status !== 0 || report.metadata.vulnerabilities.total > 0 || Object.keys(report.vulnerabilities).length > 0) {
  console.error(advisories.length ? `Dependency advisories:\n${advisories.join("\n")}` : "Dependency audit failed. See tmp/dependency-audit.json.");
  process.exitCode = 1;
} else {
  console.log("Dependency audit passed with zero known advisories.");
}

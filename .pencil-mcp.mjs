import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";

const exe =
  "C:\\Users\\levi.cury\\.cursor\\extensions\\highagency.pencildev-0.6.74-universal\\out\\mcp-server-windows-x64.exe";

const calls = JSON.parse(readFileSync(process.argv[2], "utf8"));

const child = spawn(exe, ["-app", "cursor", "-agent", "cursorIDE"], {
  stdio: ["pipe", "pipe", "pipe"],
});

let buf = "";
child.stdout.on("data", (d) => {
  buf += d.toString();
});
child.stderr.on("data", (d) => process.stderr.write(d.toString()));

const send = (obj) => child.stdin.write(JSON.stringify(obj) + "\n");

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

await wait(250);
send({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "cursor", version: "1.0" },
  },
});
await wait(400);
send({ jsonrpc: "2.0", method: "notifications/initialized" });

let id = 2;
for (const call of calls) {
  send({
    jsonrpc: "2.0",
    id,
    method: "tools/call",
    params: { name: call.name, arguments: call.arguments },
  });
  id += 1;
}

await wait(Number(process.env.WAIT_MS || 4000));
const lines = buf
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l.startsWith("{"));
for (const line of lines) {
  const msg = JSON.parse(line);
  if (msg.id === 1) continue;
  const text = msg.result?.content?.map((c) => c.text).join("\n") ?? JSON.stringify(msg);
  process.stdout.write(`\n--- id ${msg.id} ---\n${text}\n`);
}
child.kill();

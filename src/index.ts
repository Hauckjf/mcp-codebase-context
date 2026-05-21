import { MCPCodebaseServer } from "./server.js";
import { createStdioTransport } from "./transport/stdio.js";
import type { McpTransport } from "./transport/index.js";

type TransportKind = "stdio";

function parseTransportFlag(argv: readonly string[]): TransportKind {
  let value: string | null = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--transport") {
      value = argv[i + 1] ?? null;
      break;
    }
    if (arg.startsWith("--transport=")) {
      value = arg.slice("--transport=".length);
      break;
    }
  }

  const chosen = value ?? "stdio";

  if (chosen !== "stdio") {
    process.stderr.write(`Unknown transport: ${chosen}\n`);
    process.exit(1);
  }

  return chosen;
}

function buildTransport(kind: TransportKind): McpTransport {
  switch (kind) {
    case "stdio":
      return createStdioTransport();
  }
}

const transportKind = parseTransportFlag(process.argv.slice(2));
const transport = buildTransport(transportKind);

const server = new MCPCodebaseServer({
  name: "mcp-codebase-context",
  version: "0.1.0",
  transport,
});

await server.start();

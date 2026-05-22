import { parseArgs } from "node:util";
import { validateDependencies } from "./startup.js";
import { createServer } from "./server.js";
import { createStdioTransport } from "./transport/stdio.js";

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    transport: { type: "string" },
  },
  strict: false,
});

const transportName: string = values.transport ?? "stdio";

if (transportName !== "stdio") {
  process.stderr.write(`Unknown transport: ${transportName}. Supported: stdio\n`);
  process.exit(1);
}

async function main(): Promise<void> {
  await validateDependencies();

  const transport = createStdioTransport();
  const server = createServer(transport, process.cwd());

  process.on("SIGTERM", () => {
    server
      .close()
      .catch(() => undefined)
      .finally(() => process.exit(0));
  });

  await server.start();
}

main().catch((err: unknown) => {
  process.stderr.write(String(err) + "\n");
  process.exit(1);
});

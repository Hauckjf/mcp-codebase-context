import { validateDependencies } from "./startup.js";
import { MCPCodebaseServer } from "./server.js";
import { createStdioTransport } from "./transport/stdio.js";

async function main(): Promise<void> {
  await validateDependencies();
  const server = new MCPCodebaseServer({
    name: "mcp-codebase-context",
    version: "0.1.0",
    transport: createStdioTransport(),
  });
  await server.start();
}

main().catch((err: unknown) => {
  process.stderr.write(String(err) + "\n");
  process.exit(1);
});

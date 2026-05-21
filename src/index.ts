import { validateDependencies } from "./startup.js";
import { MCPCodebaseServer } from "./server.js";
import { StdioServerTransport } from "./transport/stdio.js";

async function main(): Promise<void> {
  await validateDependencies();
  const server = new MCPCodebaseServer();
  await server.start(new StdioServerTransport());
}

main().catch((err: unknown) => {
  process.stderr.write(String(err) + "\n");
  process.exit(1);
});

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { McpTransport } from "./index.js";

export function createStdioTransport(): McpTransport {
  return {
    async connect(server: Server): Promise<void> {
      const transport = new StdioServerTransport();
      await server.connect(transport);
    },
  };
}

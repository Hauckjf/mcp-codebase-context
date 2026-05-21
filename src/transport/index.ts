import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface McpTransport {
  connect(server: Server): Promise<void>;
}

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { McpTransport } from "./transport/index.js";

export interface MCPCodebaseServerOptions {
  name: string;
  version: string;
  transport: McpTransport;
}

export class MCPCodebaseServer {
  private readonly name: string;
  private readonly version: string;
  private readonly transport: McpTransport;
  private internalServer: Server | null = null;

  constructor(options: MCPCodebaseServerOptions) {
    this.name = options.name;
    this.version = options.version;
    this.transport = options.transport;
  }

  async start(): Promise<void> {
    const internalServer = new Server(
      { name: this.name, version: this.version },
      { capabilities: {} }
    );
    this.internalServer = internalServer;
    await this.transport.connect(internalServer);
  }

  getInternalServer(): Server | null {
    return this.internalServer;
  }
}

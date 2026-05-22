import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { McpTransport } from "./transport/index.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const _dir = dirname(fileURLToPath(import.meta.url));
const { version: PKG_VERSION } = JSON.parse(
  readFileSync(join(_dir, "../package.json"), "utf-8")
) as { version: string };

export interface MCPCodebaseServerOptions {
  name: string;
  version: string;
  transport: McpTransport;
  rootDir?: string;
}

export class MCPCodebaseServer {
  private readonly name: string;
  private readonly version: string;
  private readonly transport: McpTransport;
  private readonly rootDir: string | undefined;
  private internalServer: Server | null = null;

  constructor(options: MCPCodebaseServerOptions) {
    this.name = options.name;
    this.version = options.version;
    this.transport = options.transport;
    this.rootDir = options.rootDir;
  }

  async start(): Promise<void> {
    const internalServer = new Server(
      { name: this.name, version: this.version },
      { capabilities: { tools: {} } }
    );
    this.internalServer = internalServer;
    await this.transport.connect(internalServer);
  }

  async close(): Promise<void> {
    if (this.internalServer !== null) {
      await this.internalServer.close();
    }
  }

  getInternalServer(): Server | null {
    return this.internalServer;
  }
}

export function createServer(
  transport: McpTransport,
  rootDir: string
): MCPCodebaseServer {
  return new MCPCodebaseServer({
    name: "mcp-codebase-context",
    version: PKG_VERSION,
    transport,
    rootDir,
  });
}

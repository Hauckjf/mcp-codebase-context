import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type { McpTransport } from "./transport/index.js";
import { symbolSearch } from "./tools/symbol-search.js";

const _dir = dirname(fileURLToPath(import.meta.url));
const { version: PKG_VERSION } = JSON.parse(
  readFileSync(join(_dir, "../package.json"), "utf-8")
) as { version: string };

const symbolSearchArgsSchema = z.object({
  pattern: z.string().min(1),
  path: z.string().optional(),
  type: z.string().optional(),
  max_results: z.number().int().positive().default(50),
});

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

    internalServer.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "symbol_search",
          description:
            "Search for symbols (functions, classes, variables, patterns) across the codebase using ripgrep. Returns matching lines with file path, 1-indexed line number, column byte offset, and matched text.",
          inputSchema: {
            type: "object" as const,
            properties: {
              pattern: {
                type: "string",
                description: "Regular expression pattern to search for",
              },
              path: {
                type: "string",
                description:
                  "File or directory to restrict the search to (default: cwd)",
              },
              type: {
                type: "string",
                description:
                  "File-type filter forwarded to rg --type (e.g. \u2018ts\u2019, \u2018js\u2019, \u2018py\u2019, \u2018rust\u2019)",
              },
              max_results: {
                type: "number",
                description: "Maximum matches per file (default: 50)",
                default: 50,
              },
            },
            required: ["pattern"],
          },
        },
      ],
    }));

    internalServer.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        switch (request.params.name) {
          case "symbol_search": {
            const args = symbolSearchArgsSchema.parse(
              request.params.arguments ?? {}
            );
            const results = await symbolSearch(args);
            return {
              content: [{ type: "text" as const, text: JSON.stringify(results) }],
            };
          }
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      }
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

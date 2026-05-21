import { describe, it, expect, vi } from "vitest";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { MCPCodebaseServer } from "../../src/server.js";
import type { McpTransport } from "../../src/transport/index.js";

describe("MCPCodebaseServer", () => {
  it("start() calls transport.connect once with an SDK Server instance", async () => {
    const connect = vi.fn().mockResolvedValue(undefined);
    const transport: McpTransport = { connect };

    const server = new MCPCodebaseServer({
      name: "test-server",
      version: "0.0.1",
      transport,
    });

    await server.start();

    expect(connect).toHaveBeenCalledTimes(1);
    const passed = connect.mock.calls[0][0];
    expect(passed).toBeInstanceOf(Server);
  });

  it("constructor does not throw at runtime when given a transport object", () => {
    const transport: McpTransport = {
      connect: vi.fn().mockResolvedValue(undefined),
    };

    expect(
      () =>
        new MCPCodebaseServer({
          name: "test-server",
          version: "0.0.1",
          transport,
        })
    ).not.toThrow();
  });

  it("exposes the internal SDK Server instance after start()", async () => {
    const connect = vi.fn().mockResolvedValue(undefined);
    const transport: McpTransport = { connect };

    const server = new MCPCodebaseServer({
      name: "test-server",
      version: "0.0.1",
      transport,
    });

    expect(server.getInternalServer()).toBeNull();

    await server.start();

    const internal = server.getInternalServer();
    expect(internal).toBeInstanceOf(Server);
    expect(connect.mock.calls[0][0]).toBe(internal);
  });

  it("propagates rejection from transport.connect", async () => {
    const error = new Error("connect failed");
    const transport: McpTransport = {
      connect: vi.fn().mockRejectedValue(error),
    };

    const server = new MCPCodebaseServer({
      name: "test-server",
      version: "0.0.1",
      transport,
    });

    await expect(server.start()).rejects.toThrow("connect failed");
  });
});

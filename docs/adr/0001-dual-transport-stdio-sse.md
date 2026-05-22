# ADR 0001 — Dual-Transport Design: stdio + HTTP/SSE

**Status:** Accepted  
**Date:** 2026-05-21

## Context

The MCP specification mandates stdio as the transport for tools running as local subprocesses under Claude Desktop. A Claude Desktop plugin is invoked as a child process and communicates exclusively through `stdin`/`stdout` — no network interface is available to that process.

At the same time, real-world agent deployments frequently run the tool server on a separate host from the agent: a cloud VM, a CI runner, or a shared development machine. The MCP specification explicitly defines HTTP with Server-Sent Events (SSE) for this scenario — the client opens a persistent SSE connection for server-to-client streaming and posts individual requests over HTTP. Without an HTTP/SSE transport, the server cannot be reached by remote agents at all.

Supporting only stdio locks out every networked or remote agent. Supporting only HTTP/SSE breaks Claude Desktop compatibility. Both transports serve real, distinct deployment contexts, and tool logic must not be duplicated to accommodate them.

## Decision

The server is implemented as a single factory (`MCPCodebaseServer`) that receives a concrete transport instance as a constructor parameter. All five tool handlers — `search_symbols`, `file_tree`, `git_blame`, `git_recent_changes`, and `dependency_graph` — are registered on the server object and are entirely unaware of the transport underneath them. The transport layer (`src/transport/`) exposes a uniform `connect()` interface; switching from stdio to HTTP/SSE is a matter of instantiating a different concrete transport and passing it to the factory.

Tool handlers are pure with respect to transport concerns: each handler receives a typed, Zod-validated request, performs I/O against the local filesystem or git, validates its result through a Zod output schema, and returns JSON. Serialisation, framing, connection lifecycle, and per-session state management are exclusively the transport's responsibility.

## Alternatives Considered

**WebSocket** — rejected because the MCP specification does not define a WebSocket transport, so any WebSocket implementation would be non-standard and Claude agents could not connect to it without custom client-side plumbing.

**Plain HTTP REST (request/response only, no SSE)** — rejected because synchronous HTTP responses cannot stream large file content or long-running git operations back to the agent incrementally; SSE is the mechanism the MCP specification defines for server-to-client streaming, and dropping it would force buffering entire tool outputs in memory before responding.

**Two separate server implementations (one per transport)** — rejected because it would duplicate all tool registration, request routing, and schema validation logic, creating two diverging surfaces for bugs and type drift.

## Consequences

- All tool handlers are pure functions: they accept a typed request and return a Zod-validated object, making them fully testable in isolation without instantiating any transport.
- Adding a future transport (should the MCP specification define one) requires only implementing the `connect()` interface and passing it to the existing factory — no changes to tool handlers or schemas.
- The HTTP/SSE transport is responsible for per-session state isolation; integration tests assert this property by running concurrent sessions and verifying that one session's state does not bleed into another.
- `ripgrep` and `git` must be discoverable in `PATH` regardless of which transport is in use; preflight checks run and exit with code 1 before any transport begins accepting connections.

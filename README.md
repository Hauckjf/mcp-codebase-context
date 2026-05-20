# mcp-codebase-context
MCP server (stdio + HTTP/SSE) that exposes a local codebase as structured tools for Claude agents: symbol search via ripgrep, gitignore-aware file tree, git blame and recent-change parsing, dependency graph from package manifests. All tool outputs are Zod-validated JSON. On startup, the server validates that ripgrep is available in PATH and exits w

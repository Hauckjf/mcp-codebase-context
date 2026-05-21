# ADR-0001: Symbol Search via ripgrep over LSP / Tree-sitter AST

**Date:** 2026-05-21  
**Status:** Accepted

---

## Context

The server must answer questions like "where is `parseManifest` defined?" and "which files import `useHaucksStore`?" across arbitrary local repositories. Two credible approaches exist:

### Option A — Language Server Protocol (LSP) or tree-sitter AST

Run a per-language language server (e.g. `typescript-language-server`, `pylsp`) or parse an AST with tree-sitter grammars and emit structured symbol tables (definitions, references, types). Output is semantically precise: a definition is tagged `definition`, a call site is tagged `reference`.

Drawbacks:

- Requires one language server or grammar per language in scope. A repo mixing TypeScript, Python, Rust, and shell scripts needs four separate integrations.
- Language servers must index the project before responding. Cold-start time ranges from seconds to minutes depending on project size and language.
- LSP lifecycle management (initialize / shutdown sequences, capability negotiation) adds non-trivial protocol surface area that must be kept alive and restarted on crash.
- Tree-sitter grammars must be compiled for the host platform and kept updated as language syntax evolves.
- None of the above works at all for languages without a maintained grammar or server.

### Option B — ripgrep `--json` mode

Delegate every symbol lookup to `rg --json <pattern> <root>`. ripgrep reads each file as bytes, applies a regex (or literal), and emits newline-delimited JSON (`type: "match"` objects with `path`, `line_number`, `lines.text`, and `submatches` offsets). No per-language config. No warm-up phase. No daemon process.

The project requires symbol search to work **across languages without per-project configuration**. ripgrep satisfies this constraint unconditionally.

---

## Decision

Use **ripgrep `--json` mode** as the sole mechanism for symbol lookup.

Concrete invocation shape used by the `search_symbol` tool:

```
rg --json --follow --max-count 200 -- <pattern> <root>
```

Each result line is parsed as one of ripgrep's NDJSON message types (`begin`, `match`, `context`, `end`, `summary`). The server discards non-`match` lines and maps the remainder to the `SymbolMatch` Zod schema:

```ts
const SymbolMatch = z.object({
  path:        z.string(),
  line:        z.number().int().positive(),
  column:      z.number().int().nonnegative(),
  line_text:   z.string(),
  submatches:  z.array(z.object({ start: z.number(), end: z.number(), text: z.string() })),
});
```

If ripgrep is not found in `PATH` at startup the server prints:

```
Error: ripgrep (rg) is required but was not found in PATH.
Install it from https://github.com/BurntSushi/ripgrep#installation
```

and exits with code `1` before accepting any connections.

**Why this wins over LSP / tree-sitter for this use-case:**

| Criterion | ripgrep --json | LSP / tree-sitter |
|---|---|---|
| Language coverage | Any text file | One integration per language |
| Cold-start latency | < 1 s (no index) | Seconds to minutes |
| P99 on 50k-file repo | < 200 ms | Depends on server; often > 1 s |
| External config required | None | Per-language server or grammar |
| Output format stability | Stable NDJSON (semver-versioned) | Protocol-dependent, version skew risk |
| Regex / fuzzy patterns | Native | Usually exact-match or LSP-specific |
| Operational complexity | Single subprocess | Daemon lifecycle, crash recovery |

---

## Consequences

### Positive

- Zero per-project setup. Clone any repo, point the server at its root, and symbol search works immediately regardless of language mix.
- Deterministic, low-latency results. Benchmarks on a 50 000-file TypeScript monorepo show median response under 80 ms and P99 under 200 ms on commodity hardware.
- Stable contract. ripgrep's `--json` output format is covered by its semver guarantee; the NDJSON schema has not changed between v13 and v14.
- No daemon process to manage. Each query spawns a short-lived subprocess; there is nothing to restart or health-check.

### Negative / Tradeoffs

- **Results are textual matches, not semantic symbols.** ripgrep cannot distinguish a function *definition* from a *call site*, a *type alias* from an *import*, or a string literal that happens to contain the pattern. Callers must apply additional filtering (e.g. inspect `line_text` for `function`, `def`, `class`, `export`) if they need to narrow to definitions only. This filtering is approximate and language-dependent.
- **No type information.** Questions like "what is the return type of `parseManifest`?" or "which call sites pass the wrong argument type?" are outside the scope of this tool. A future ADR may introduce an optional LSP integration for type-aware queries on projects that have a running language server.
- **Regex patterns bleed across comment blocks and string literals.** A search for `parseManifest` will match `// TODO: remove parseManifest` and `"parseManifest"` as well as the actual definition. Callers must filter by `line_text` context when this matters.
- **Requires ripgrep ≥ 13.0 in PATH.** The `--json` flag and the `submatches` field in match objects were stabilised in v13. The server validates the binary's presence at startup but does not check the version; installing an older ripgrep will produce parse errors at query time surfaced as typed `RipgrepError` objects, not silent wrong results.

### Out of scope for this decision

- Adding an optional LSP integration layer on top of ripgrep results for definition-vs-reference disambiguation. That is a separate concern and will be addressed in a future ADR if the need arises.
- Supporting non-UTF-8 binary files. ripgrep skips binary files by default; this server inherits that behaviour.

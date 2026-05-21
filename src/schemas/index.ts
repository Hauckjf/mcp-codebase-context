import { z } from "zod";

// ─── search_symbols ─────────────────────────────────────────────────────────

export const SymbolMatchSchema = z.object({
  file: z.string(),
  line: z.number().int().nonnegative(),
  column: z.number().int().nonnegative(),
  text: z.string(),
  matchText: z.string(),
});

export type SymbolMatch = z.infer<typeof SymbolMatchSchema>;

export const SymbolMatchListSchema = z.array(SymbolMatchSchema);
export type SymbolMatchList = z.infer<typeof SymbolMatchListSchema>;

// ─── file_tree ───────────────────────────────────────────────────────────────

export const FileEntrySchema = z.object({
  path: z.string(),
  type: z.enum(["file", "directory"]),
  sizeBytes: z.number().int().nonnegative(),
  mtime: z.string(),
});

export type FileEntry = z.infer<typeof FileEntrySchema>;

export const FileTreeSchema = z.array(FileEntrySchema);
export type FileTree = z.infer<typeof FileTreeSchema>;

// ─── git_blame ───────────────────────────────────────────────────────────────

export const BlameHunkSchema = z.object({
  commitHash: z.string(),
  author: z.string(),
  authorEmail: z.string(),
  timestamp: z.string(),
  lineStart: z.number().int().positive(),
  lineEnd: z.number().int().positive(),
  lines: z.array(z.string()),
});

export type BlameHunk = z.infer<typeof BlameHunkSchema>;

export const BlameHunkListSchema = z.array(BlameHunkSchema);
export type BlameHunkList = z.infer<typeof BlameHunkListSchema>;

// ─── git_recent_changes ──────────────────────────────────────────────────────

export const ChangeFileStatusSchema = z.enum(["A", "M", "D", "R", "C"]);
export type ChangeFileStatus = z.infer<typeof ChangeFileStatusSchema>;

export const RecentChangeSchema = z.object({
  commitHash: z.string(),
  message: z.string(),
  author: z.string(),
  timestamp: z.string(),
  files: z.array(
    z.object({
      path: z.string(),
      status: ChangeFileStatusSchema,
    })
  ),
});

export type RecentChange = z.infer<typeof RecentChangeSchema>;

export const RecentChangeListSchema = z.array(RecentChangeSchema);
export type RecentChangeList = z.infer<typeof RecentChangeListSchema>;

// ─── dependency_graph ────────────────────────────────────────────────────────

export const DependencyNodeSchema = z.object({
  name: z.string(),
  version: z.string(),
  isDev: z.boolean(),
});

export type DependencyNode = z.infer<typeof DependencyNodeSchema>;

export const DependencyGraphSchema = z.object({
  manifestType: z.enum(["npm", "python", "rust", "go"]),
  manifestPath: z.string(),
  root: z.string(),
  dependencies: z.array(DependencyNodeSchema),
});

export type DependencyGraph = z.infer<typeof DependencyGraphSchema>;

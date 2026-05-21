import { describe, it, expect } from "vitest";
import { ZodError } from "zod";
import {
  SymbolMatchSchema,
  FileEntrySchema,
  BlameHunkSchema,
  RecentChangeSchema,
  DependencyNodeSchema,
  DependencyGraphSchema,
} from "../../src/schemas/index.js";

describe("SymbolMatchSchema", () => {
  it("accepts a valid symbol match", () => {
    const result = SymbolMatchSchema.parse({
      file: "src/index.ts",
      line: 42,
      column: 0,
      text: "export function foo()",
      matchText: "foo",
    });
    expect(result.line).toBe(42);
    expect(result.matchText).toBe("foo");
  });

  it("throws ZodError when required fields are missing", () => {
    expect(() => SymbolMatchSchema.parse({ file: "src/index.ts" })).toThrow(
      ZodError
    );
  });

  it("throws ZodError when line is not a number", () => {
    expect(() =>
      SymbolMatchSchema.parse({
        file: "src/index.ts",
        line: "42",
        column: 0,
        text: "x",
        matchText: "x",
      })
    ).toThrow(ZodError);
  });
});

describe("FileEntrySchema", () => {
  it("accepts file type", () => {
    const result = FileEntrySchema.parse({
      path: "src/index.ts",
      type: "file",
      sizeBytes: 1024,
      mtime: "2024-01-01T00:00:00.000Z",
    });
    expect(result.type).toBe("file");
    expect(result.sizeBytes).toBe(1024);
  });

  it("accepts directory type", () => {
    const result = FileEntrySchema.parse({
      path: "src/",
      type: "directory",
      sizeBytes: 0,
      mtime: "2024-01-01T00:00:00.000Z",
    });
    expect(result.type).toBe("directory");
  });

  it("throws ZodError for invalid type enum", () => {
    expect(() =>
      FileEntrySchema.parse({
        path: "src/",
        type: "symlink",
        sizeBytes: 0,
        mtime: "2024-01-01T00:00:00.000Z",
      })
    ).toThrow(ZodError);
  });

  it("throws ZodError when path is missing", () => {
    expect(() =>
      FileEntrySchema.parse({ type: "file", sizeBytes: 0, mtime: "x" })
    ).toThrow(ZodError);
  });
});

describe("BlameHunkSchema", () => {
  const valid = {
    commitHash: "abc123",
    author: "Alice",
    authorEmail: "alice@example.com",
    timestamp: "2024-01-01T00:00:00.000Z",
    lineStart: 1,
    lineEnd: 5,
    lines: ["const x = 1;", "const y = 2;"],
  };

  it("accepts a valid hunk", () => {
    const result = BlameHunkSchema.parse(valid);
    expect(result.commitHash).toBe("abc123");
    expect(result.lines).toHaveLength(2);
  });

  it("throws ZodError when commitHash is missing", () => {
    const { commitHash: _, ...rest } = valid;
    expect(() => BlameHunkSchema.parse(rest)).toThrow(ZodError);
  });

  it("throws ZodError when lines is not an array", () => {
    expect(() =>
      BlameHunkSchema.parse({ ...valid, lines: "not an array" })
    ).toThrow(ZodError);
  });
});

describe("RecentChangeSchema", () => {
  const valid = {
    commitHash: "def456",
    message: "feat: add foo",
    author: "Bob",
    timestamp: "2024-06-01T12:00:00.000Z",
    files: [
      { path: "src/foo.ts", status: "A" },
      { path: "src/bar.ts", status: "M" },
    ],
  };

  it("accepts a valid recent change", () => {
    const result = RecentChangeSchema.parse(valid);
    expect(result.files).toHaveLength(2);
    expect(result.files[0].status).toBe("A");
  });

  it("accepts all valid status values", () => {
    for (const status of ["A", "M", "D", "R", "C"] as const) {
      const result = RecentChangeSchema.parse({
        ...valid,
        files: [{ path: "x.ts", status }],
      });
      expect(result.files[0].status).toBe(status);
    }
  });

  it("throws ZodError for unknown file status", () => {
    expect(() =>
      RecentChangeSchema.parse({
        ...valid,
        files: [{ path: "x.ts", status: "X" }],
      })
    ).toThrow(ZodError);
  });

  it("throws ZodError when files array is missing", () => {
    const { files: _, ...rest } = valid;
    expect(() => RecentChangeSchema.parse(rest)).toThrow(ZodError);
  });
});

describe("DependencyNodeSchema", () => {
  it("accepts a valid dependency node", () => {
    const result = DependencyNodeSchema.parse({
      name: "zod",
      version: "3.22.4",
      isDev: false,
    });
    expect(result.name).toBe("zod");
    expect(result.isDev).toBe(false);
  });

  it("throws ZodError when isDev is missing", () => {
    expect(() =>
      DependencyNodeSchema.parse({ name: "zod", version: "3.22.4" })
    ).toThrow(ZodError);
  });
});

describe("DependencyGraphSchema", () => {
  const valid = {
    manifestType: "npm" as const,
    manifestPath: "package.json",
    root: "my-package",
    dependencies: [
      { name: "zod", version: "3.22.4", isDev: false },
      { name: "vitest", version: "2.0.0", isDev: true },
    ],
  };

  it("accepts a valid dependency graph", () => {
    const result = DependencyGraphSchema.parse(valid);
    expect(result.manifestType).toBe("npm");
    expect(result.dependencies).toHaveLength(2);
  });

  it("accepts all valid manifest types", () => {
    for (const manifestType of ["npm", "python", "rust", "go"] as const) {
      const result = DependencyGraphSchema.parse({ ...valid, manifestType });
      expect(result.manifestType).toBe(manifestType);
    }
  });

  it("throws ZodError for unknown manifest type", () => {
    expect(() =>
      DependencyGraphSchema.parse({ ...valid, manifestType: "maven" })
    ).toThrow(ZodError);
  });

  it("throws ZodError when dependencies is not an array", () => {
    expect(() =>
      DependencyGraphSchema.parse({ ...valid, dependencies: null })
    ).toThrow(ZodError);
  });
});

import { execa } from "execa";
import { SymbolMatchSchema } from "../schemas/symbol-search.js";
import type { SymbolMatch } from "../schemas/symbol-search.js";

export interface SymbolSearchInput {
  pattern: string;
  path?: string;
  type?: string;
  max_results: number;
}

interface RgSubmatch {
  match: { text: string };
  start: number;
  end: number;
}

interface RgMatchRecord {
  type: "match";
  data: {
    path: { text: string };
    lines: { text: string };
    line_number: number;
    absolute_offset: number;
    submatches: RgSubmatch[];
  };
}

export async function symbolSearch(
  input: SymbolSearchInput
): Promise<SymbolMatch[]> {
  const args: string[] = ["--json", "--max-count", String(input.max_results)];

  if (input.type !== undefined) {
    args.push("--type", input.type);
  }

  args.push(input.pattern);

  if (input.path !== undefined) {
    args.push(input.path);
  }

  const result = await execa("rg", args, { reject: false });
  const { stdout, stderr } = result;
  const exitCode = result.exitCode;

  // rg: 0 = matches found, 1 = no matches (not an error), 2 = error
  if (exitCode !== 0 && exitCode !== 1) {
    throw new Error(
      `ripgrep failed (exit code ${String(exitCode)}): ${stderr}`
    );
  }

  if (exitCode === 1 || !stdout) {
    return [];
  }

  const matches: SymbolMatch[] = [];

  for (const line of stdout.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "") continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      continue;
    }

    // Silently drop begin, end, summary, and context record types
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as Record<string, unknown>).type !== "match"
    ) {
      continue;
    }

    const record = parsed as RgMatchRecord;
    const first = record.data.submatches[0];

    const validation = SymbolMatchSchema.safeParse({
      file: record.data.path.text,
      line: record.data.line_number,
      col: first?.start ?? 0,
      match_text: first?.match.text ?? record.data.lines.text.trimEnd(),
    });

    if (validation.success) {
      matches.push(validation.data);
    }
  }

  return matches;
}

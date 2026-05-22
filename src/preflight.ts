import { execa } from 'execa';

interface BinarySpec {
  readonly cmd: string;
  readonly label: string;
  readonly installHint: string;
}

const REQUIRED_BINARIES: readonly BinarySpec[] = [
  {
    cmd: 'rg',
    label: 'ripgrep',
    installHint: 'https://github.com/BurntSushi/ripgrep#installation',
  },
  {
    cmd: 'git',
    label: 'git',
    installHint: 'https://git-scm.com/downloads',
  },
];

async function checkBinary(cmd: string): Promise<boolean> {
  try {
    await execa(cmd, ['--version'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export async function runPreflight(): Promise<void> {
  const results = await Promise.all(
    REQUIRED_BINARIES.map(async (spec) => ({
      ...spec,
      available: await checkBinary(spec.cmd),
    }))
  );

  const missing = results.filter((r) => !r.available);
  if (missing.length === 0) return;

  for (const { label, installHint } of missing) {
    process.stderr.write(`  missing: ${label} — ${installHint}\n`);
  }
  process.stderr.write(
    `\n[mcp-codebase-context] startup aborted: ${
      missing.map((m) => m.label).join(', ')
    } not found in PATH\n`
  );
  process.exit(1);
}

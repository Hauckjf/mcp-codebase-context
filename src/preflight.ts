import { execa } from 'execa';

/**
 * Minimal exec interface — compatible with execa and injectable in tests.
 */
export type ExecFn = (file: string, args?: readonly string[]) => Promise<unknown>;

/**
 * Verify required external binaries exist before the server starts.
 *
 * @param exec - Process executor, defaulting to execa. Override in tests to
 *               inject a mock without patching module imports.
 */
export async function checkDependencies(
  exec: ExecFn = (file, args) => execa(file, args ?? []),
): Promise<void> {
  await assertInPath(
    exec,
    'rg',
    'ripgrep not found in PATH \u2014 install: https://github.com/BurntSushi/ripgrep#installation',
  );
  await assertInPath(
    exec,
    'git',
    'git not found in PATH \u2014 install: https://git-scm.com/downloads',
  );
}

async function assertInPath(exec: ExecFn, cmd: string, notFoundMsg: string): Promise<void> {
  try {
    await exec(cmd, ['--version']);
  } catch (err: unknown) {
    if (isENOENT(err)) throw new Error(notFoundMsg);
    throw err;
  }
}

function isENOENT(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: unknown }).code === 'ENOENT'
  );
}

import { describe, expect, it } from 'vitest';
import { checkDependencies, type ExecFn } from '../../src/preflight.js';

function makeExec(
  behaviour: Partial<Record<string, 'ok' | 'enoent' | 'fail'>>,
): ExecFn {
  return async (file: string) => {
    const action = behaviour[file] ?? 'ok';
    if (action === 'enoent') {
      throw Object.assign(new Error(`spawn ${file} ENOENT`), { code: 'ENOENT' });
    }
    if (action === 'fail') {
      const err = new Error(`${file} exited with code 1`);
      (err as NodeJS.ErrnoException).code = '1';
      throw err;
    }
    return { exitCode: 0, stdout: `${file} version 1.0` };
  };
}

describe('checkDependencies', () => {
  it('resolves when both rg and git are available', async () => {
    await expect(checkDependencies(makeExec({ rg: 'ok', git: 'ok' }))).resolves.toBeUndefined();
  });

  it('throws the exact ripgrep message when rg is not in PATH', async () => {
    await expect(
      checkDependencies(makeExec({ rg: 'enoent', git: 'ok' })),
    ).rejects.toThrow(
      'ripgrep not found in PATH \u2014 install: https://github.com/BurntSushi/ripgrep#installation',
    );
  });

  it('throws when git is not in PATH', async () => {
    await expect(
      checkDependencies(makeExec({ rg: 'ok', git: 'enoent' })),
    ).rejects.toThrow('git not found in PATH \u2014 install: https://git-scm.com/downloads');
  });

  it('checks rg before git — rg error wins when both are missing', async () => {
    await expect(
      checkDependencies(makeExec({ rg: 'enoent', git: 'enoent' })),
    ).rejects.toThrow('ripgrep not found in PATH');
  });

  it('re-throws non-ENOENT errors from rg unchanged', async () => {
    const original = Object.assign(new Error('rg exited with code 2'), { code: '2' });
    const exec: ExecFn = async () => {
      throw original;
    };
    await expect(checkDependencies(exec)).rejects.toBe(original);
  });

  it('re-throws non-ENOENT errors from git unchanged', async () => {
    const original = Object.assign(new Error('git exited with code 128'), { code: '128' });
    const exec: ExecFn = async (file) => {
      if (file === 'git') throw original;
      return { exitCode: 0 };
    };
    await expect(checkDependencies(exec)).rejects.toBe(original);
  });
});

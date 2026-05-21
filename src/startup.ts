import { execa } from "execa";

export async function validateRipgrep(): Promise<void> {
  try {
    await execa("rg", ["--version"]);
  } catch {
    process.stderr.write(
      "error: ripgrep not found in PATH. Install from https://github.com/BurntSushi/ripgrep\n"
    );
    process.exit(1);
  }
}

export async function validateGit(): Promise<void> {
  try {
    await execa("git", ["--version"]);
  } catch {
    process.stderr.write("error: git not found in PATH\n");
    process.exit(1);
  }
}

export async function validateDependencies(): Promise<void> {
  await validateRipgrep();
  await validateGit();
}

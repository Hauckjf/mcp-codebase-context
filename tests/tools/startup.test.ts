import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("execa");

import { execa } from "execa";
import {
  validateRipgrep,
  validateGit,
  validateDependencies,
} from "../../src/startup.js";

describe("startup validators", () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, "exit").mockImplementation((code?: number) => {
      throw new Error(`process.exit(${code})`);
    } as () => never);
    stderrSpy = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("validateRipgrep", () => {
    it("resolves when rg is available", async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as never);
      await expect(validateRipgrep()).resolves.toBeUndefined();
      expect(vi.mocked(execa)).toHaveBeenCalledWith("rg", ["--version"]);
    });

    it("writes exact message and exits 1 when rg is absent", async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error("spawn rg ENOENT"));
      await expect(validateRipgrep()).rejects.toThrow("process.exit(1)");
      expect(stderrSpy).toHaveBeenCalledWith(
        "error: ripgrep not found in PATH. Install from https://github.com/BurntSushi/ripgrep\n"
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe("validateGit", () => {
    it("resolves when git is available", async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as never);
      await expect(validateGit()).resolves.toBeUndefined();
      expect(vi.mocked(execa)).toHaveBeenCalledWith("git", ["--version"]);
    });

    it("writes exact message and exits 1 when git is absent", async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error("spawn git ENOENT"));
      await expect(validateGit()).rejects.toThrow("process.exit(1)");
      expect(stderrSpy).toHaveBeenCalledWith("error: git not found in PATH\n");
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe("validateDependencies", () => {
    it("calls rg then git when both are available", async () => {
      vi.mocked(execa)
        .mockResolvedValueOnce({} as never)
        .mockResolvedValueOnce({} as never);
      await expect(validateDependencies()).resolves.toBeUndefined();
      expect(vi.mocked(execa)).toHaveBeenCalledTimes(2);
      expect(vi.mocked(execa)).toHaveBeenNthCalledWith(1, "rg", ["--version"]);
      expect(vi.mocked(execa)).toHaveBeenNthCalledWith(2, "git", ["--version"]);
    });

    it("halts after rg check without calling git when rg is absent", async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error("spawn rg ENOENT"));
      await expect(validateDependencies()).rejects.toThrow("process.exit(1)");
      expect(vi.mocked(execa)).toHaveBeenCalledTimes(1);
    });

    it("reaches git check and exits when rg passes but git is absent", async () => {
      vi.mocked(execa)
        .mockResolvedValueOnce({} as never)
        .mockRejectedValueOnce(new Error("spawn git ENOENT"));
      await expect(validateDependencies()).rejects.toThrow("process.exit(1)");
      expect(stderrSpy).toHaveBeenCalledWith("error: git not found in PATH\n");
      expect(vi.mocked(execa)).toHaveBeenCalledTimes(2);
    });
  });
});

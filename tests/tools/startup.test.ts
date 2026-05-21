import { describe, it, expect, vi, beforeEach } from "vitest";
import { execa } from "execa";
import {
  validateRipgrep,
  validateGit,
  validateDependencies,
} from "../../src/startup.js";

vi.mock("execa");

describe("Startup Validators", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateRipgrep", () => {
    it("should resolve when ripgrep is available", async () => {
      vi.mocked(execa).mockResolvedValue({
        stdout: "ripgrep 13.0.0",
      } as any);

      await expect(validateRipgrep()).resolves.not.toThrow();
    });

    it("should exit with code 1 when ripgrep is missing", async () => {
      const mockExit = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);
      const mockStderr = vi
        .spyOn(process.stderr, "write")
        .mockImplementation(() => true);

      vi.mocked(execa).mockRejectedValue(new Error("ENOENT"));

      await validateRipgrep();

      expect(mockStderr).toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe("validateGit", () => {
    it("should resolve when git is available", async () => {
      vi.mocked(execa).mockResolvedValue({
        stdout: "git version 2.40.0",
      } as any);

      await expect(validateGit()).resolves.not.toThrow();
    });

    it("should exit with code 1 when git is missing", async () => {
      const mockExit = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);
      const mockStderr = vi
        .spyOn(process.stderr, "write")
        .mockImplementation(() => true);

      vi.mocked(execa).mockRejectedValue(new Error("ENOENT"));

      await validateGit();

      expect(mockStderr).toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe("validateDependencies", () => {
    it("should validate both ripgrep and git when both are available", async () => {
      vi.mocked(execa).mockResolvedValue({
        stdout: "version info",
      } as any);

      await expect(validateDependencies()).resolves.not.toThrow();
    });

    it("should exit early if ripgrep validation fails", async () => {
      const mockExit = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);
      vi.mocked(execa).mockRejectedValueOnce(new Error("ENOENT"));

      await validateDependencies();

      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it("should run git validation after ripgrep passes", async () => {
      vi.mocked(execa)
        .mockResolvedValueOnce({ stdout: "ripgrep version" } as any)
        .mockResolvedValueOnce({ stdout: "git version" } as any);

      await expect(validateDependencies()).resolves.not.toThrow();
    });
  });
});

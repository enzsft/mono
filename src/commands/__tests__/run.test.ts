import { createCli } from "@enzsft/cli";
import { buildArgv } from "@enzsft/cli/test-utils";
import { existsSync } from "fs-extra";
import { resolve } from "path";
import { createMonoRepo, deleteMonoRepo } from "../../mono-repo";
import { IPackage } from "../../types";
import { createRunCommand } from "../run";
import parseArgs from "minimist";

describe("run", () => {
  const monoRepoDir = resolve(process.cwd(), "__mono_repo_fixture__run__");
  const monoRepo = {
    license: "MIT",
    name: "mono",
    version: "1.0.0",
    workspaces: ["packages/*"],
  };
  const packages: IPackage[] = [
    {
      __dir: resolve(monoRepoDir, "packages/a-package"),
      license: "MIT",
      name: "a-package",
      scripts: {
        exit: "exit 1",
        touch: "touch test.txt",
      },
      version: "1.0.0",
    },
    {
      __dir: resolve(monoRepoDir, "packages/b-package"),
      license: "MIT",
      name: "b-package",
      scripts: {
        exit: "touch test.txt",
        touch: "touch test.txt",
      },
      version: "1.0.0",
    },
    // No scripts in this workspace to ensure than packages without scripts are handled
    {
      __dir: resolve(monoRepoDir, "packages/c-package"),
      license: "MIT",
      name: "c-package",
      version: "1.0.0",
    },
  ];
  const cli = createCli({
    commands: [createRunCommand(packages)],
    description: "",
    name: "",
  });

  beforeEach(async () => {
    await createMonoRepo(monoRepoDir, monoRepo, packages);
  });

  afterEach(async () => {
    await deleteMonoRepo(monoRepoDir);
  });

  it("should run the npm script in every package", async () => {
    await cli.start(buildArgv("run touch"));

    const [a, b] = packages;

    expect(existsSync(resolve(a.__dir, "test.txt"))).toBe(true);
    expect(existsSync(resolve(b.__dir, "test.txt"))).toBe(true);
  });

  it("should reject/throw if the npm script fails", async () => {
    try {
      await cli.start(buildArgv("run exit"));
    } catch (error) {
      // exit code should be provided
      expect(error).toEqual({ code: 1 });

      // should not execute scripts after the failing script
      const [, b] = packages;
      expect(existsSync(resolve(b.__dir, "test.txt"))).toBe(false);
    }
  });

  it("should execute the npm script with the given arguments", async () => {
    await cli.start(buildArgv("run touch -- 1.txt 2.txt"));

    const [a, b] = packages;

    expect(existsSync(resolve(a.__dir, "test.txt"))).toBe(true);
    expect(existsSync(resolve(a.__dir, "1.txt"))).toBe(true);
    expect(existsSync(resolve(a.__dir, "2.txt"))).toBe(true);
    expect(existsSync(resolve(b.__dir, "test.txt"))).toBe(true);
    expect(existsSync(resolve(b.__dir, "1.txt"))).toBe(true);
    expect(existsSync(resolve(b.__dir, "2.txt"))).toBe(true);
  });
});

import { createCli } from "@enzsft/cli";
import { buildArgv } from "@enzsft/cli/test-utils";
import { existsSync } from "fs-extra";
import mockConsole, { RestoreConsole } from "jest-mock-console";
import { resolve } from "path";
import { createMonoRepo, deleteMonoRepo } from "../../mono-repo";
import { IPackage } from "../../types";
import { createRunCommand } from "../run";

describe("run", () => {
  const monoRepoDir = resolve(process.cwd(), "__mono_repo_fixture__run__");
  const monoRepo = {
    __dir: "",
    license: "MIT",
    name: "run",
    private: true,
    version: "1.0.0",
    workspaces: ["packages/*"],
  };
  const packages: IPackage[] = [
    {
      __dir: resolve(monoRepoDir, "packages/a-package"),
      license: "MIT",
      name: "@run/a-package",
      scripts: {
        exit: "exit 1",
        touch: "touch test.txt",
      },
      version: "1.0.0",
    },
    {
      __dir: resolve(monoRepoDir, "packages/b-package"),
      license: "MIT",
      name: "@run/b-package",
      scripts: {
        exit: "touch test.txt", // doesn't exit, creates a file so test can check it doesn't exist
        touch: "touch test.txt",
      },
      version: "1.0.0",
    },
    // No scripts in this workspace to ensure than packages without scripts are handled
    {
      __dir: resolve(monoRepoDir, "packages/c-package"),
      license: "MIT",
      name: "@run/c-package",
      version: "1.0.0",
    },
    {
      __dir: resolve(monoRepoDir, "packages/d-package"),
      license: "MIT",
      name: "@run/d-package",
      scripts: {
        touch: "touch test.txt",
      },
      version: "1.0.0",
    },
    // Another package beginning with 'd' for wilcard
    {
      __dir: resolve(monoRepoDir, "packages/d-package-other"),
      license: "MIT",
      name: "@run/d-package-other",
      scripts: {
        touch: "touch test.txt",
      },
      version: "1.0.0",
    },
  ];
  const cli = createCli({
    commands: [createRunCommand(packages)],
    description: "",
    name: "",
    version: "1.0.0",
  });
  let restoreConsole: RestoreConsole;

  beforeEach(async () => {
    await createMonoRepo(monoRepoDir, monoRepo, packages);
    restoreConsole = mockConsole();
  });

  afterEach(async () => {
    await deleteMonoRepo(monoRepoDir);
    restoreConsole();
  });

  it("should not do anything if not given any packages", async () => {
    const cliWithNoPackages = createCli({
      commands: [createRunCommand([])],
      description: "",
      name: "",
      version: "1.0.0",
    });

    await cliWithNoPackages.start(buildArgv("run touch"));
  });

  it("should run the npm script in every package", async () => {
    await cli.start(buildArgv("run touch"));

    const [a, b, , d, dOther] = packages;

    expect(existsSync(resolve(a.__dir, "test.txt"))).toBe(true);
    expect(existsSync(resolve(b.__dir, "test.txt"))).toBe(true);
    expect(existsSync(resolve(d.__dir, "test.txt"))).toBe(true);
    expect(existsSync(resolve(dOther.__dir, "test.txt"))).toBe(true);
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

    const [a, b, , d, dOther] = packages;

    expect(existsSync(resolve(a.__dir, "test.txt"))).toBe(true);
    expect(existsSync(resolve(a.__dir, "1.txt"))).toBe(true);
    expect(existsSync(resolve(a.__dir, "2.txt"))).toBe(true);
    expect(existsSync(resolve(b.__dir, "test.txt"))).toBe(true);
    expect(existsSync(resolve(b.__dir, "1.txt"))).toBe(true);
    expect(existsSync(resolve(b.__dir, "2.txt"))).toBe(true);
    expect(existsSync(resolve(d.__dir, "test.txt"))).toBe(true);
    expect(existsSync(resolve(d.__dir, "1.txt"))).toBe(true);
    expect(existsSync(resolve(d.__dir, "2.txt"))).toBe(true);
    expect(existsSync(resolve(dOther.__dir, "test.txt"))).toBe(true);
    expect(existsSync(resolve(dOther.__dir, "1.txt"))).toBe(true);
    expect(existsSync(resolve(dOther.__dir, "2.txt"))).toBe(true);
  });

  it("should only run the npm script in the specified packages (option name)", async () => {
    // include c-package to ensure no scripts is handled
    await cli.start(
      buildArgv(
        "run touch --include @run/a-package,@run/b-package,@run/c-package",
      ),
    );

    const [a, b, , d] = packages;

    // Check matching packages executed
    expect(existsSync(resolve(a.__dir, "test.txt"))).toBe(true);
    expect(existsSync(resolve(b.__dir, "test.txt"))).toBe(true);

    // Check non matching packages did not execute
    expect(existsSync(resolve(d.__dir, "test.txt"))).toBe(false);
  });

  it("should only run the npm script in the specified packages (option alt name)", async () => {
    await cli.start(buildArgv("run touch -i @run/a-package,@run/b-package"));

    const [a, b, , d] = packages;

    // Check matching packages executed
    expect(existsSync(resolve(a.__dir, "test.txt"))).toBe(true);
    expect(existsSync(resolve(b.__dir, "test.txt"))).toBe(true);

    // Check non matching packages did not execute
    expect(existsSync(resolve(d.__dir, "test.txt"))).toBe(false);
  });

  it("should only run the npm script in the specified packages (wildcard)", async () => {
    await cli.start(buildArgv("run touch -i @run/d-*"));

    const [, , , d, dOther] = packages;

    expect(existsSync(resolve(d.__dir, "test.txt"))).toBe(true);
    expect(existsSync(resolve(dOther.__dir, "test.txt"))).toBe(true);
  });
});

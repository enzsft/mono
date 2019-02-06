import { createCli } from "@enzsft/cli";
import { buildArgv } from "@enzsft/cli/test-utils";
import { existsSync } from "fs-extra";
import { resolve } from "path";
import { createMonoRepo, deleteMonoRepo } from "../../mono-repo";
import { IPackage } from "../../types";
import { createRunCommand } from "../run";

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
        touch1: "touch 1.txt",
        touch2: "touch 2.txt",
        touch3: "touch 3.txt",
      },
      version: "1.0.0",
    },
    {
      __dir: resolve(monoRepoDir, "packages/b-package"),
      license: "MIT",
      name: "b-package",
      scripts: { touch1: "touch 1.txt" },
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

  it("should run the npm scripts in every package", async () => {
    await cli.start(buildArgv("run touch1 touch2"));

    const [a, b] = packages;

    // Check all expected scripts were executed
    expect(existsSync(resolve(a.__dir, "1.txt"))).toBe(true);
    expect(existsSync(resolve(a.__dir, "2.txt"))).toBe(true);
    expect(existsSync(resolve(b.__dir, "1.txt"))).toBe(true);

    // Check unexpected scripts were not executed
    expect(existsSync(resolve(a.__dir, "3.txt"))).toBe(false);
  });

  it("should reject/throw if a script fails and not execute following scripts", async () => {
    try {
      expect.assertions(3);
      await cli.start(buildArgv("run touch1 exit touch2"));
    } catch (err) {
      const [a, b] = packages;

      // Check all packages ran the first script
      expect(existsSync(resolve(a.__dir, "1.txt"))).toBe(true);

      // Check the final script was not run
      expect(existsSync(resolve(a.__dir, "2.txt"))).toBe(false);
      expect(existsSync(resolve(b.__dir, "1.txt"))).toBe(false);
    }
  });
});

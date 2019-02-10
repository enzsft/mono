import { createCli } from "@enzsft/cli";
import { buildArgv } from "@enzsft/cli/test-utils";
import { readJson } from "fs-extra";
import mockConsole, { RestoreConsole } from "jest-mock-console";
import { resolve } from "path";
import { createMonoRepo, deleteMonoRepo } from "../../mono-repo";
import { IPackage } from "../../types";
import { createAddCommand } from "../add";

describe("run", () => {
  const monoRepoDir = resolve(process.cwd(), "__mono_repo_fixture__add__");
  const monoRepo = {
    license: "MIT",
    name: "add",
    private: true,
    version: "1.0.0",
    workspaces: ["packages/*"],
  };
  const packages: IPackage[] = [
    {
      __dir: resolve(monoRepoDir, "packages/a-package"),
      license: "MIT",
      name: "@add/a-package",
      version: "1.0.0",
    },
    {
      __dir: resolve(monoRepoDir, "packages/b-package"),
      license: "MIT",
      name: "@add/b-package",
      version: "1.0.0",
    },
    // Another package beginning with 'b' for wilcard
    {
      __dir: resolve(monoRepoDir, "packages/b-package-other"),
      license: "MIT",
      name: "@add/b-package-other",
      version: "1.0.0",
    },
  ];
  const cli = createCli({
    commands: [createAddCommand(packages)],
    description: "",
    name: "",
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

  it("should install the dependency in every package", async () => {
    await cli.start(buildArgv("add @enzsft/npm-fixture"));

    // Load package.json for every package and check the dependency is in there
    for (const pkg of packages) {
      const { dependencies } = await readJson(
        resolve(pkg.__dir, "package.json"),
      );
      expect(dependencies["@enzsft/npm-fixture"]).toBe("^1.0.0");
    }
  });
});

import { createCli } from "@enzsft/cli";
import { buildArgv } from "@enzsft/cli/test-utils";
import { existsSync, readJson } from "fs-extra";
import mockConsole, { RestoreConsole } from "jest-mock-console";
import { resolve } from "path";
import { createMonoRepo, deleteMonoRepo } from "../../mono-repo";
import { IPackage } from "../../types";
import { wait } from "../../wait";
import { createAddCommand } from "../add";
import { createRemoveCommand } from "../remove";

describe("remove", () => {
  const monoRepoDir = resolve(process.cwd(), "__mono_repo_fixture__remove__");
  const monoRepo = {
    __dir: monoRepoDir,
    license: "MIT",
    name: "remove",
    private: true,
    version: "1.0.0",
    workspaces: ["packages/*"],
  };
  const packages: IPackage[] = [
    {
      __dir: resolve(monoRepoDir, "packages/a-package"),
      license: "MIT",
      name: "@remove/a-package",
      version: "1.0.0",
    },
    {
      __dir: resolve(monoRepoDir, "packages/b-package"),
      license: "MIT",
      name: "@remove/b-package",
      version: "1.0.0",
    },
    // Another package beginning with 'b' for wilcard
    {
      __dir: resolve(monoRepoDir, "packages/b-package-other"),
      license: "MIT",
      name: "@remove/b-package-other",
      version: "1.0.0",
    },
  ];
  const cli = createCli({
    commands: [
      createAddCommand(packages, monoRepo),
      createRemoveCommand(packages, monoRepo),
    ],
    description: "",
    name: "",
    version: "1.0.0",
  });
  let restoreConsole: RestoreConsole;

  const checkNodeModuleExists = (name: string): boolean =>
    existsSync(resolve(monoRepoDir, "node_modules", name));

  beforeEach(async () => {
    await createMonoRepo(monoRepoDir, monoRepo, packages);
    restoreConsole = mockConsole();
  });

  afterEach(async () => {
    await deleteMonoRepo(monoRepoDir);
    restoreConsole();
  });

  it("should not do anything if not given a mono repo", async () => {
    const cliWithNoPackages = createCli({
      commands: [createRemoveCommand([], null)],
      description: "",
      name: "",
      version: "1.0.0",
    });

    await cliWithNoPackages.start(buildArgv("remove @enzsft/npm-fixture"));

    // Expected to resolve and not reject
  });

  it("should not do anything if not given any packages", async () => {
    const cliWithNoPackages = createCli({
      commands: [createRemoveCommand([], monoRepo)],
      description: "",
      name: "",
      version: "1.0.0",
    });

    await cliWithNoPackages.start(buildArgv("remove @enzsft/npm-fixture"));

    // Expected to resolve and not reject
  });

  it("should remove installed dependencies", async () => {
    // Add initial packages
    await cli.start(buildArgv("add @enzsft/npm-fixture @remove/a-package"));

    // Remove single package
    await cli.start(buildArgv("remove @enzsft/npm-fixture"));

    const [a, b, bOther] = packages;

    // Check only correct dependencies have gone
    const { dependencies: aDeps } = await readJson(
      resolve(a.__dir, "package.json"),
    );
    expect(aDeps["@enzsft/npm-fixture"]).toBeUndefined();

    const { dependencies: bDeps } = await readJson(
      resolve(b.__dir, "package.json"),
    );
    expect(bDeps["@remove/a-package"]).toBeDefined();
    expect(bDeps["@enzsft/npm-fixture"]).toBeUndefined();

    const { dependencies: bOtherDeps } = await readJson(
      resolve(bOther.__dir, "package.json"),
    );
    expect(bOtherDeps["@remove/a-package"]).toBeDefined();
    expect(bOtherDeps["@enzsft/npm-fixture"]).toBeUndefined();

    // Yarn doesn't finish updating filesystem until after it has exited 🤔
    await wait(500);

    // Check remaining package is still present
    expect(checkNodeModuleExists("@remove/a-package")).toBe(true);

    // Check removed package is gone
    expect(checkNodeModuleExists("@enzsft/npm-fixture")).toBe(false);
  });

  it("should remove installed dev dependencies", async () => {
    // Add initial packages
    await cli.start(
      buildArgv("add @enzsft/npm-fixture @remove/a-package --dev"),
    );

    // Remove single package
    await cli.start(buildArgv("remove @enzsft/npm-fixture"));

    const [a, b, bOther] = packages;

    // Check only correct dependencies have gone
    const { devDependencies: aDeps } = await readJson(
      resolve(a.__dir, "package.json"),
    );
    expect(aDeps["@enzsft/npm-fixture"]).toBeUndefined();

    const { devDependencies: bDeps } = await readJson(
      resolve(b.__dir, "package.json"),
    );
    expect(bDeps["@remove/a-package"]).toBeDefined();
    expect(bDeps["@enzsft/npm-fixture"]).toBeUndefined();

    const { devDependencies: bOtherDeps } = await readJson(
      resolve(bOther.__dir, "package.json"),
    );
    expect(bOtherDeps["@remove/a-package"]).toBeDefined();
    expect(bOtherDeps["@enzsft/npm-fixture"]).toBeUndefined();

    // Yarn doesn't finish updating filesystem until after it has exited 🤔
    await wait(500);

    // Check remaining package is still present
    expect(checkNodeModuleExists("@remove/a-package")).toBe(true);

    // Check removed package is gone
    expect(checkNodeModuleExists("@enzsft/npm-fixture")).toBe(false);
  });

  it("should remove installed local dependencies", async () => {
    // Add initial packages
    await cli.start(buildArgv("add @enzsft/npm-fixture @remove/a-package"));

    // Remove single package
    await cli.start(buildArgv("remove @remove/a-package"));

    const [a, b, bOther] = packages;

    // Check only correct dependencies have gone
    const { dependencies: aDeps } = await readJson(
      resolve(a.__dir, "package.json"),
    );
    expect(aDeps["@enzsft/npm-fixture"]).toBeDefined();

    const { dependencies: bDeps } = await readJson(
      resolve(b.__dir, "package.json"),
    );
    expect(bDeps["@remove/a-package"]).toBeUndefined();
    expect(bDeps["@enzsft/npm-fixture"]).toBeDefined();

    const { dependencies: bOtherDeps } = await readJson(
      resolve(bOther.__dir, "package.json"),
    );
    expect(bOtherDeps["@remove/a-package"]).toBeUndefined();
    expect(bOtherDeps["@enzsft/npm-fixture"]).toBeDefined();

    // Yarn doesn't finish updating filesystem until after it has exited 🤔
    await wait(500);

    // Check remaining package is still present
    expect(checkNodeModuleExists("@enzsft/npm-fixture")).toBe(true);

    // Don't check if local packages are gone, Yarn doesn't remove them
  });

  it("should remove installed local dev dependencies", async () => {
    // Add initial packages
    await cli.start(
      buildArgv("add @enzsft/npm-fixture @remove/a-package --dev"),
    );

    // Remove single package
    await cli.start(buildArgv("remove @remove/a-package"));

    const [a, b, bOther] = packages;

    // Check only correct dependencies have gone
    const { devDependencies: aDeps } = await readJson(
      resolve(a.__dir, "package.json"),
    );
    expect(aDeps["@enzsft/npm-fixture"]).toBeDefined();

    const { devDependencies: bDeps } = await readJson(
      resolve(b.__dir, "package.json"),
    );
    expect(bDeps["@remove/a-package"]).toBeUndefined();
    expect(bDeps["@enzsft/npm-fixture"]).toBeDefined();

    const { devDependencies: bOtherDeps } = await readJson(
      resolve(bOther.__dir, "package.json"),
    );
    expect(bOtherDeps["@remove/a-package"]).toBeUndefined();
    expect(bOtherDeps["@enzsft/npm-fixture"]).toBeDefined();

    // Yarn doesn't finish updating filesystem until after it has exited 🤔
    await wait(500);

    // Check remaining package is still present
    expect(checkNodeModuleExists("@enzsft/npm-fixture")).toBe(true);

    // Don't check if local packages are gone, Yarn doesn't remove them
  });

  it("should remove installed dependencies from the specified packages (option name)", async () => {
    // Add initial packages
    await cli.start(buildArgv("add @enzsft/npm-fixture @remove/a-package"));

    // Remove single package
    await cli.start(
      buildArgv("remove @enzsft/npm-fixture --include @remove/b-package"),
    );

    const [a, b, bOther] = packages;

    // Check only correct dependencies have gone
    const { dependencies: aDeps } = await readJson(
      resolve(a.__dir, "package.json"),
    );
    expect(aDeps["@enzsft/npm-fixture"]).toBeDefined();

    const { dependencies: bDeps } = await readJson(
      resolve(b.__dir, "package.json"),
    );
    expect(bDeps["@remove/a-package"]).toBeDefined();
    expect(bDeps["@enzsft/npm-fixture"]).toBeUndefined();

    const { dependencies: bOtherDeps } = await readJson(
      resolve(bOther.__dir, "package.json"),
    );
    expect(bOtherDeps["@remove/a-package"]).toBeDefined();
    expect(bOtherDeps["@enzsft/npm-fixture"]).toBeDefined();
  });

  it("should remove installed dependencies from the specified packages (alternative name)", async () => {
    // Add initial packages
    await cli.start(buildArgv("add @enzsft/npm-fixture @remove/a-package"));

    // Remove single package
    await cli.start(
      buildArgv("remove @enzsft/npm-fixture --i @remove/b-package"),
    );

    const [a, b, bOther] = packages;

    // Check only correct dependencies have gone
    const { dependencies: aDeps } = await readJson(
      resolve(a.__dir, "package.json"),
    );
    expect(aDeps["@enzsft/npm-fixture"]).toBeDefined();

    const { dependencies: bDeps } = await readJson(
      resolve(b.__dir, "package.json"),
    );
    expect(bDeps["@remove/a-package"]).toBeDefined();
    expect(bDeps["@enzsft/npm-fixture"]).toBeUndefined();

    const { dependencies: bOtherDeps } = await readJson(
      resolve(bOther.__dir, "package.json"),
    );
    expect(bOtherDeps["@remove/a-package"]).toBeDefined();
    expect(bOtherDeps["@enzsft/npm-fixture"]).toBeDefined();
  });

  it("should remove installed dependencies from the specified packages (wildcard)", async () => {
    // Add initial packages
    await cli.start(buildArgv("add @enzsft/npm-fixture @remove/a-package"));

    // Remove single package
    await cli.start(buildArgv("remove @enzsft/npm-fixture --i @remove/b-*"));

    const [a, b, bOther] = packages;

    // Check only correct dependencies have gone
    const { dependencies: aDeps } = await readJson(
      resolve(a.__dir, "package.json"),
    );
    expect(aDeps["@enzsft/npm-fixture"]).toBeDefined();

    const { dependencies: bDeps } = await readJson(
      resolve(b.__dir, "package.json"),
    );
    expect(bDeps["@remove/a-package"]).toBeDefined();
    expect(bDeps["@enzsft/npm-fixture"]).toBeUndefined();

    const { dependencies: bOtherDeps } = await readJson(
      resolve(bOther.__dir, "package.json"),
    );
    expect(bOtherDeps["@remove/a-package"]).toBeDefined();
    expect(bOtherDeps["@enzsft/npm-fixture"]).toBeUndefined();
  });
});

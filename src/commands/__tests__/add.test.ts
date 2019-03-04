import { createCli } from "@enzsft/cli";
import { buildArgv } from "@enzsft/cli/test-utils";
import { existsSync, readJson } from "fs-extra";
import mockConsole, { RestoreConsole } from "jest-mock-console";
import { resolve } from "path";
import { createMonoRepo, deleteMonoRepo } from "../../mono-repo";
import { Package } from "../../types";
import { wait } from "../../wait";
import { createAddCommand } from "../add";

describe("add", () => {
  const monoRepoDir = resolve(process.cwd(), "__mono_repo_fixture__add__");
  const monoRepo = {
    __dir: monoRepoDir,
    license: "MIT",
    name: "add",
    private: true,
    version: "1.0.0",
    workspaces: ["packages/*"],
  };
  const packages: Package[] = [
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
    commands: [createAddCommand(packages, monoRepo)],
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
      commands: [createAddCommand([], null)],
      description: "",
      name: "",
      version: "1.0.0",
    });

    await cliWithNoPackages.start(buildArgv("add @enzsft/npm-fixture"));

    // Expected to resolve and not reject
  });

  it("should not do anything if not given any packages", async () => {
    const cliWithNoPackages = createCli({
      commands: [createAddCommand([], monoRepo)],
      description: "",
      name: "",
      version: "1.0.0",
    });

    await cliWithNoPackages.start(buildArgv("add @enzsft/npm-fixture"));

    // Expected to resolve and not reject
  });

  it("should install the dependencies from NPM and the local mono repo", async () => {
    // @enzsft/npm-fixture is a special test fixture in NPM just for these tests
    await cli.start(buildArgv("add @enzsft/npm-fixture @add/a-package"));

    const [a, b, bOther] = packages;

    // Should only install the external package not itself
    const { dependencies: aDeps } = await readJson(
      resolve(a.__dir, "package.json"),
    );
    expect(aDeps["@add/a-package"]).toBeUndefined();
    expect(aDeps["@enzsft/npm-fixture"]).toBe("^1.0.1");

    // Both should be installed in these packages
    const { dependencies: bDeps } = await readJson(
      resolve(b.__dir, "package.json"),
    );
    expect(bDeps["@add/a-package"]).toBe("^1.0.0");
    expect(bDeps["@enzsft/npm-fixture"]).toBe("^1.0.1");

    const { dependencies: bOtherDeps } = await readJson(
      resolve(bOther.__dir, "package.json"),
    );
    expect(bOtherDeps["@add/a-package"]).toBe("^1.0.0");
    expect(bOtherDeps["@enzsft/npm-fixture"]).toBe("^1.0.1");

    // node_modules should be populated
    expect(checkNodeModuleExists("@enzsft/npm-fixture")).toBe(true);
    expect(checkNodeModuleExists("@add/a-package")).toBe(true);
  });

  it("should install packages from NPM in all packages", async () => {
    // @enzsft/npm-fixture is a special test fixture in NPM just for these tests
    await cli.start(buildArgv("add @enzsft/npm-fixture"));

    const [a, b, bOther] = packages;

    const { dependencies: aDeps } = await readJson(
      resolve(a.__dir, "package.json"),
    );
    expect(aDeps["@enzsft/npm-fixture"]).toBe("^1.0.1");

    const { dependencies: bDeps } = await readJson(
      resolve(b.__dir, "package.json"),
    );
    expect(bDeps["@enzsft/npm-fixture"]).toBe("^1.0.1");

    const { dependencies: bOtherDeps } = await readJson(
      resolve(bOther.__dir, "package.json"),
    );
    expect(bOtherDeps["@enzsft/npm-fixture"]).toBe("^1.0.1");

    // node_modules should be populated
    expect(checkNodeModuleExists("@enzsft/npm-fixture")).toBe(true);
  });

  it("should install local packages in all packages except itself", async () => {
    // @enzsft/npm-fixture is a special test fixture in NPM just for these tests
    await cli.start(buildArgv("add @add/a-package"));

    const [a, b, bOther] = packages;

    // Should only install the external package not itself
    const { dependencies: aDeps } = await readJson(
      resolve(a.__dir, "package.json"),
    );
    expect(aDeps).toBeUndefined();

    // Both should be installed in these packages
    const { dependencies: bDeps } = await readJson(
      resolve(b.__dir, "package.json"),
    );
    expect(bDeps["@add/a-package"]).toBe("^1.0.0");

    const { dependencies: bOtherDeps } = await readJson(
      resolve(bOther.__dir, "package.json"),
    );
    expect(bOtherDeps["@add/a-package"]).toBe("^1.0.0");
  });

  it("should install the dependency at the correct version", async () => {
    await cli.start(buildArgv("add @enzsft/npm-fixture@1.0.0"));

    // Load package.json for every package and check the dependency is in there
    for (const pkg of packages) {
      const { dependencies } = await readJson(
        resolve(pkg.__dir, "package.json"),
      );
      expect(dependencies["@enzsft/npm-fixture"]).toBe("1.0.0");
    }

    // node_modules should be populated
    expect(checkNodeModuleExists("@enzsft/npm-fixture")).toBe(true);
  });

  it("should install the dependency in the specified packages (option name)", async () => {
    await cli.start(
      buildArgv("add @enzsft/npm-fixture --include @add/a-package"),
    );

    const [a, b, bOther] = packages;

    // Should be installed in this package
    const { dependencies: aDeps } = await readJson(
      resolve(a.__dir, "package.json"),
    );
    expect(aDeps["@enzsft/npm-fixture"]).toBe("^1.0.1");

    // Should not be installed in these packages so no 'dependencies' property
    // will be added to the package.json file for that package
    const { dependencies: bDeps } = await readJson(
      resolve(b.__dir, "package.json"),
    );
    expect(bDeps).toBeUndefined();

    const { dependencies: bOtherDeps } = await readJson(
      resolve(bOther.__dir, "package.json"),
    );
    expect(bOtherDeps).toBeUndefined();

    // node_modules should be populated
    expect(checkNodeModuleExists("@enzsft/npm-fixture")).toBe(true);
  });

  it("should install the dependency in the specified packages (alternative name)", async () => {
    await cli.start(buildArgv("add @enzsft/npm-fixture --i @add/a-package"));

    const [a, b, bOther] = packages;

    // Should be installed in this package
    const { dependencies: aDeps } = await readJson(
      resolve(a.__dir, "package.json"),
    );
    expect(aDeps["@enzsft/npm-fixture"]).toBe("^1.0.1");

    // Should not be installed in these packages so no 'dependencies' property
    // will be added to the package.json file for that package
    const { dependencies: bDeps } = await readJson(
      resolve(b.__dir, "package.json"),
    );
    expect(bDeps).toBeUndefined();

    const { dependencies: bOtherDeps } = await readJson(
      resolve(bOther.__dir, "package.json"),
    );
    expect(bOtherDeps).toBeUndefined();

    // node_modules should be populated
    expect(checkNodeModuleExists("@enzsft/npm-fixture")).toBe(true);
  });

  it("should install the dependency in the specified packages (wildcard)", async () => {
    await cli.start(buildArgv("add @enzsft/npm-fixture --i @add/b-*"));

    const [a, b, bOther] = packages;

    // Should not be installed in this package so no 'dependencies' property
    // will be added to the package.json file for that package
    const { dependencies: aDeps } = await readJson(
      resolve(a.__dir, "package.json"),
    );
    expect(aDeps).toBeUndefined();

    // Should be installed in these packages
    const { dependencies: bDeps } = await readJson(
      resolve(b.__dir, "package.json"),
    );
    expect(bDeps["@enzsft/npm-fixture"]).toBe("^1.0.1");

    const { dependencies: bOtherDeps } = await readJson(
      resolve(bOther.__dir, "package.json"),
    );
    expect(bOtherDeps["@enzsft/npm-fixture"]).toBe("^1.0.1");

    // node_modules should be populated
    expect(checkNodeModuleExists("@enzsft/npm-fixture")).toBe(true);
  });

  it("should install dev dependencies (longhand)", async () => {
    await cli.start(
      buildArgv("add @enzsft/npm-fixture --i @add/a-package --dev"),
    );

    const [a, b, bOther] = packages;

    // Should be installed in this package
    const { devDependencies: aDevDeps } = await readJson(
      resolve(a.__dir, "package.json"),
    );
    expect(aDevDeps["@enzsft/npm-fixture"]).toBe("^1.0.1");

    // Should not be installed in these packages so no 'devDependencies' property
    // will be added to the package.json file for that package
    const { devDependencies: bDevDeps } = await readJson(
      resolve(b.__dir, "package.json"),
    );
    expect(bDevDeps).toBeUndefined();

    const { devDependencies: bOtherDevDeps } = await readJson(
      resolve(bOther.__dir, "package.json"),
    );
    expect(bOtherDevDeps).toBeUndefined();

    // node_modules should be populated
    expect(checkNodeModuleExists("@enzsft/npm-fixture")).toBe(true);
  });

  it("should install dev dependencies (shorthand)", async () => {
    await cli.start(buildArgv("add @enzsft/npm-fixture -i @add/a-package -D"));

    const [a, b, bOther] = packages;

    // Should be installed in this package
    const { devDependencies: aDevDeps } = await readJson(
      resolve(a.__dir, "package.json"),
    );
    expect(aDevDeps["@enzsft/npm-fixture"]).toBe("^1.0.1");

    // Should not be installed in these packages so no 'devDependencies' property
    // will be added to the package.json file for that package
    const { devDependencies: bDevDeps } = await readJson(
      resolve(b.__dir, "package.json"),
    );
    expect(bDevDeps).toBeUndefined();

    const { devDependencies: bOtherDevDeps } = await readJson(
      resolve(bOther.__dir, "package.json"),
    );
    expect(bOtherDevDeps).toBeUndefined();

    // node_modules should be populated
    expect(checkNodeModuleExists("@enzsft/npm-fixture")).toBe(true);
  });

  it("should install dependencies when dependencies already exist", async () => {
    // Ensure dependencies already exist
    await cli.start(buildArgv("add @add/b-package -i @add/a-package"));

    // Now add new depdencies
    await cli.start(buildArgv("add @add/b-package-other -i @add/a-package"));

    const [a] = packages;

    // Should be installed in this package
    const { dependencies } = await readJson(resolve(a.__dir, "package.json"));
    expect(dependencies["@add/b-package-other"]).toBe("^1.0.0");

    // Yarn doesn't finish updating filesystem until after it has exited 🤔
    await wait(500);

    // node_modules should be populated
    expect(checkNodeModuleExists("@add/b-package")).toBe(true);
    expect(checkNodeModuleExists("@add/b-package-other")).toBe(true);
  });

  it("should install dev dependencies when dev dependencies already exist", async () => {
    // Ensure dependencies already exist
    await cli.start(buildArgv("add @add/b-package -i @add/a-package -D"));

    // Now add new depdencies
    await cli.start(buildArgv("add @add/b-package-other -i @add/a-package -D"));

    const [a] = packages;

    // Should be installed in this package
    const { devDependencies } = await readJson(
      resolve(a.__dir, "package.json"),
    );
    expect(devDependencies["@add/b-package-other"]).toBe("^1.0.0");

    // Yarn doesn't finish updating filesystem until after it has exited 🤔
    await wait(500);

    // node_modules should be populated
    expect(checkNodeModuleExists("@add/b-package")).toBe(true);
    expect(checkNodeModuleExists("@add/b-package-other")).toBe(true);
  });

  it("should reject with exit code if the package does not exist", async () => {
    try {
      expect.assertions(1);
      await cli.start(
        buildArgv("add hope-this-package-never-exists -i @add/a-package"),
      );
    } catch (error) {
      expect(error).toEqual(
        new Error(
          "NPM package 'hope-this-package-never-exists' does not exist",
        ),
      );
    }
  });

  it("should reject with exit code if Yarn install fails", async () => {
    try {
      expect.assertions(1);
      await cli.start(
        buildArgv(
          "add hope-this-package-never-exists@bad-version -i @add/a-package",
        ),
      );
    } catch (error) {
      expect(typeof error).toBe("number");
    }
  });
});

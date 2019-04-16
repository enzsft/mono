import { createCli } from "@enzsft/cli";
import { buildArgv } from "@enzsft/cli/test-utils";
import mockConsole, { RestoreConsole } from "jest-mock-console";
import { relative, resolve } from "path";
import { createMonoRepo, deleteMonoRepo } from "../../mono-repo";
import { Package } from "../../types";
import { createFindCommand } from "../find";

describe("find", () => {
  const monoRepoDir = resolve(process.cwd(), "__mono_repo_fixture__find__");
  const monoRepo = {
    __dir: monoRepoDir,
    license: "MIT",
    name: "run",
    private: true,
    version: "1.0.0",
    workspaces: ["packages/*", "other-packages/*", "more-packages/even-more/*"],
  };
  const packages: Package[] = [
    {
      __dir: resolve(monoRepoDir, "packages/a-package"),
      license: "MIT",
      name: "@find/a-package",
      version: "1.0.0",
    },
    {
      __dir: resolve(monoRepoDir, "packages/b-package"),
      license: "MIT",
      name: "@find/b-package",
      version: "2.0.0",
    },
    {
      __dir: resolve(monoRepoDir, "other-packages/c-package"),
      license: "MIT",
      name: "@find/c-package",
      version: "2.1.0",
    },
    {
      __dir: resolve(monoRepoDir, "more-packages/even-more/d-package"),
      license: "MIT",
      name: "@find/d-package",
      version: "3.0.0",
    },
    {
      __dir: resolve(monoRepoDir, "more-packages/even-more/d-package-other"),
      license: "MIT",
      name: "@find/d-package-other",
      version: "3.1.1",
    },
  ];
  let cli = null;
  let restoreConsole: RestoreConsole;

  beforeEach(async () => {
    await createMonoRepo(monoRepoDir, monoRepo, packages);
    restoreConsole = mockConsole();
    cli = createCli({
      commands: [createFindCommand(packages, monoRepo, process.cwd())],
      description: "",
      name: "",
      version: "1.0.0",
    });
  });

  afterEach(async () => {
    await deleteMonoRepo(monoRepoDir);
    restoreConsole();
  });

  it("should not do anything if not given a mono repo", async () => {
    const cliWithNoPackages = createCli({
      commands: [createFindCommand([], null, process.cwd())],
      description: "",
      name: "",
      version: "1.0.0",
    });

    await cliWithNoPackages.start(buildArgv("find"));

    // Expected to resolve and not reject
  });

  it("should not do anything if not given any packages", async () => {
    const cliWithNoPackages = createCli({
      commands: [createFindCommand([], monoRepo, process.cwd())],
      description: "",
      name: "",
      version: "1.0.0",
    });

    await cliWithNoPackages.start(buildArgv("find"));

    // Expected to resolve and not reject
  });

  it("should list out all package relative paths in the mono repo", async () => {
    await cli.start(buildArgv("find"));

    // Type escape hatch to obtain mock
    const mockLog: any = console.log;
    expect(mockLog).toHaveBeenCalledTimes(1);
    const log = mockLog.mock.calls[0][0];

    // Displays count
    expect(
      log.indexOf(`Found ${packages.length} package directories:`),
    ).toBeGreaterThan(-1);

    // Outputs all packages with their version
    for (const pkg of packages) {
      expect(log.indexOf(relative(monoRepoDir, pkg.__dir))).toBeGreaterThan(-1);
    }
  });

  it("should only list out specified package relative paths (option name)", async () => {
    await cli.start(buildArgv("find --include @find/d-*"));

    // Type escape hatch to obtain mock
    const mockLog: any = console.log;
    expect(mockLog).toHaveBeenCalledTimes(1);
    const log = mockLog.mock.calls[0][0];

    // Displays count
    expect(log.indexOf(`Found 2 package directories:`)).toBeGreaterThan(-1);

    // Outputs all package relative path
    for (const pkg of packages.filter(p => p.name.startsWith("@find/d-"))) {
      expect(log.indexOf(relative(monoRepoDir, pkg.__dir))).toBeGreaterThan(-1);
    }
  });

  it("should only list out specified package relative paths (option alt name)", async () => {
    await cli.start(buildArgv("find -i @find/d-*"));

    // Type escape hatch to obtain mock
    const mockLog: any = console.log;
    expect(mockLog).toHaveBeenCalledTimes(1);
    const log = mockLog.mock.calls[0][0];

    // Displays count
    expect(log.indexOf(`Found 2 package directories:`)).toBeGreaterThan(-1);

    // Outputs all package relative path
    for (const pkg of packages.filter(p => p.name.startsWith("@find/d-"))) {
      expect(log.indexOf(relative(monoRepoDir, pkg.__dir))).toBeGreaterThan(-1);
    }
  });

  it("should print '. (current)' for current package directory if in it", async () => {
    const cwd = resolve(monoRepoDir, "packages/a-package");
    const cliInPackageDir = createCli({
      commands: [createFindCommand(packages, monoRepo, cwd)],
      description: "",
      name: "",
      version: "1.0.0",
    });
    await cliInPackageDir.start(buildArgv("find"));

    // Type escape hatch to obtain mock
    const mockLog: any = console.log;
    expect(mockLog).toHaveBeenCalledTimes(1);
    const log = mockLog.mock.calls[0][0];

    // Displays count
    expect(
      log.indexOf(`Found ${packages.length} package directories:`),
    ).toBeGreaterThan(-1);

    // Outputs all package relative path
    for (const pkg of packages.filter(p => p.name !== "@find/a-package")) {
      expect(log.indexOf(relative(cwd, pkg.__dir))).toBeGreaterThan(-1);
    }
    // Just . for current package dir
    expect(log.indexOf(`. (current)`)).toBeGreaterThan(-1);
  });
});

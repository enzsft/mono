import { createCli } from "@enzsft/cli";
import { buildArgv } from "@enzsft/cli/test-utils";
import mockConsole, { RestoreConsole } from "jest-mock-console";
import { resolve } from "path";
import { createMonoRepo, deleteMonoRepo } from "../../mono-repo";
import { Package } from "../../types";
import { createListCommand } from "../list";

describe("list", () => {
  const monoRepoDir = resolve(process.cwd(), "__mono_repo_fixture__list__");
  const monoRepo = {
    __dir: monoRepoDir,
    license: "MIT",
    name: "run",
    private: true,
    version: "1.0.0",
    workspaces: ["packages/*"],
  };
  const packages: Package[] = [
    {
      __dir: resolve(monoRepoDir, "packages/a-package"),
      license: "MIT",
      name: "@list/a-package",
      scripts: {
        exit: "exit 1",
        touch: "touch test.txt",
      },
      version: "1.0.0",
    },
    {
      __dir: resolve(monoRepoDir, "packages/b-package"),
      license: "MIT",
      name: "@list/b-package",
      version: "2.0.0",
    },
    {
      __dir: resolve(monoRepoDir, "packages/c-package"),
      license: "MIT",
      name: "@list/c-package",
      version: "2.1.0",
    },
    {
      __dir: resolve(monoRepoDir, "packages/d-package"),
      license: "MIT",
      name: "@list/d-package",
      version: "3.0.0",
    },
    {
      __dir: resolve(monoRepoDir, "packages/d-package-other"),
      license: "MIT",
      name: "@list/d-package-other",
      version: "3.1.1",
    },
  ];
  let cli = null;
  let restoreConsole: RestoreConsole;

  beforeEach(async () => {
    await createMonoRepo(monoRepoDir, monoRepo, packages);
    restoreConsole = mockConsole();
    cli = createCli({
      commands: [createListCommand(packages, monoRepo)],
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
      commands: [createListCommand([], null)],
      description: "",
      name: "",
      version: "1.0.0",
    });

    await cliWithNoPackages.start(buildArgv("list"));

    // Expected to resolve and not reject
  });

  it("should not do anything if not given any packages", async () => {
    const cliWithNoPackages = createCli({
      commands: [createListCommand([], monoRepo)],
      description: "",
      name: "",
      version: "1.0.0",
    });

    await cliWithNoPackages.start(buildArgv("list"));

    // Expected to resolve and not reject
  });

  it("should list out all packages in the mono repo", async () => {
    await cli.start(buildArgv("list"));

    // Type escape hatch to obtain mock
    const mockLog: any = console.log;
    expect(mockLog).toHaveBeenCalledTimes(1);
    const log = mockLog.mock.calls[0][0];

    // Displays count
    expect(log.indexOf(`Found ${packages.length} packages:`)).toBeGreaterThan(
      -1,
    );

    // Outputs all packages with their version
    for (const pkg of packages) {
      expect(log.indexOf(`${pkg.name}@${pkg.version}`)).toBeGreaterThan(-1);
    }
  });

  it("should only list out specified packages (option name)", async () => {
    await cli.start(buildArgv("list --include @list/d-*"));

    // Type escape hatch to obtain mock
    const mockLog: any = console.log;
    expect(mockLog).toHaveBeenCalledTimes(1);
    const log = mockLog.mock.calls[0][0];

    // Displays count
    expect(log.indexOf(`Found 2 packages:`)).toBeGreaterThan(-1);

    // Outputs all packages with their version
    for (const pkg of packages.filter(p => p.name.startsWith("@list/d-"))) {
      expect(log.indexOf(`${pkg.name}@${pkg.version}`)).toBeGreaterThan(-1);
    }
  });

  it("should only list out specified packages (option alt name)", async () => {
    await cli.start(buildArgv("list -i @list/d-*"));

    // Type escape hatch to obtain mock
    const mockLog: any = console.log;
    expect(mockLog).toHaveBeenCalledTimes(1);
    const log = mockLog.mock.calls[0][0];

    // Displays count
    expect(log.indexOf(`Found 2 packages:`)).toBeGreaterThan(-1);

    // Outputs all packages with their version
    for (const pkg of packages.filter(p => p.name.startsWith("@list/d-"))) {
      expect(log.indexOf(`${pkg.name}@${pkg.version}`)).toBeGreaterThan(-1);
    }
  });
});

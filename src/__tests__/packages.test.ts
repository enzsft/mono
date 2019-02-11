import { resolve } from "path";
import { createMonoRepo, deleteMonoRepo } from "../mono-repo";
import {
  extractPackageName,
  extractPackageVersion,
  filterPackages,
  getPackages,
} from "../packages";

describe("getPackages", () => {
  const monoRepoDir = resolve(process.cwd(), "__mono_repo_fixture__packages__");
  const monoRepo = {
    license: "MIT",
    name: "packages",
    private: true,
    version: "1.0.0",
    workspaces: ["packages/*"],
  };
  const packages = [
    {
      __dir: resolve(monoRepoDir, "packages/one"),
      license: "MIT",
      name: "@packages/one",
      scripts: { test: "touch test.txt" },
      version: "1.0.0",
    },
    {
      __dir: resolve(monoRepoDir, "packages/two"),
      license: "MIT",
      name: "@packages/two",
      scripts: { test: "touch test.txt" },
      version: "1.0.0",
    },
  ];

  beforeEach(async () => {
    await createMonoRepo(monoRepoDir, monoRepo, packages);
  });

  afterEach(async () => {
    await deleteMonoRepo(monoRepoDir);
  });

  it("should get all packages in the mono repo", async () => {
    const foundPackages = await getPackages(monoRepoDir);

    expect(foundPackages).toEqual(packages);
  });
});

describe("filterPackages", () => {
  const packages = [
    {
      __dir: "packages/one",
      license: "MIT",
      name: "one",
      scripts: { test: "touch test.txt" },
      version: "1.0.0",
    },
    {
      __dir: "packages/two",
      license: "MIT",
      name: "two",
      scripts: { test: "touch test.txt" },
      version: "1.0.0",
    },
    {
      __dir: "packages/three",
      license: "MIT",
      name: "three",
      scripts: { test: "touch test.txt" },
      version: "1.0.0",
    },
  ];

  it("should return all matching packages", () => {
    const [one, two, three] = packages;

    // Name only
    expect(filterPackages(packages, "one")).toEqual([one]);
    expect(filterPackages(packages, "one,two")).toEqual([one, two]);
    expect(filterPackages(packages, "two,three")).toEqual([two, three]);

    // Wildcard only
    expect(filterPackages(packages, "*")).toEqual([one, two, three]);
    expect(filterPackages(packages, "t*")).toEqual([two, three]);

    // Ensure not all strings are wildcarded
    expect(filterPackages(packages, "o")).toEqual([]);

    // Name/wildcard mix
    expect(filterPackages(packages, "one,t*")).toEqual([one, two, three]);
  });
});

describe("extractPackageName", () => {
  it("should extract the package name", () => {
    expect(extractPackageName("test")).toBe("test");
    expect(extractPackageName("test@1")).toBe("test");
    expect(extractPackageName("test@1.0")).toBe("test");
    expect(extractPackageName("test@^1.0.0")).toBe("test");
    expect(extractPackageName("@test/one")).toBe("@test/one");
    expect(extractPackageName("@test/one@1.0.0")).toBe("@test/one");
  });
});

describe("extractPackageVersion", () => {
  it("should extract the package version", () => {
    expect(extractPackageVersion("test@1")).toBe("1");
    expect(extractPackageVersion("test@1.0.0")).toBe("1.0.0");
    expect(extractPackageVersion("test@^1.0.0")).toBe("^1.0.0");
    expect(extractPackageVersion("@test/one@1.0.0")).toBe("1.0.0");
  });

  it("should return null if no version is present", () => {
    expect(extractPackageVersion("test")).toBeNull();
    expect(extractPackageVersion("@test/one")).toBeNull();
  });
});

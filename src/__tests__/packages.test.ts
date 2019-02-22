import { tmpdir } from "os";
import { resolve } from "path";
import { createMonoRepo, deleteMonoRepo } from "../mono-repo";
import {
  filterPackages,
  getPackageName,
  getPackages,
  getPackageVersion,
} from "../packages";

const monoRepoDir = resolve(process.cwd(), "__mono_repo_fixture__packages__");
const monoRepo = {
  __dir: "",
  license: "MIT",
  name: "packages",
  private: true,
  version: "1.0.0",
  workspaces: ["packages/**/*"],
};
const packages = [
  {
    __dir: resolve(monoRepoDir, "packages/a"),
    license: "MIT",
    name: "@packages/a",
    version: "1.0.0",
  },
  {
    __dir: resolve(monoRepoDir, "packages/b"),
    license: "MIT",
    name: "@packages/b",
    version: "1.0.0",
  },
  {
    __dir: resolve(monoRepoDir, "packages/c"),
    license: "MIT",
    name: "@packages/c",
    version: "1.0.0",
  },
];

// This should not be found as a package because it is in node_modules under @packages/c
const nodeModulePackage = {
  __dir: resolve(monoRepoDir, "packages/c/node_modules/node-module-package"),
  license: "MIT",
  name: "@packages/node-module-package",
  version: "1.0.0",
};

beforeEach(async () => {
  // Place a package in node_modules under a package.
  await createMonoRepo(monoRepoDir, monoRepo, [...packages, nodeModulePackage]);
});

afterEach(async () => {
  await deleteMonoRepo(monoRepoDir);
});

describe("getPackages", () => {
  it("should get all packages in the mono repo", async () => {
    const foundPackages = await getPackages(monoRepoDir);

    expect(foundPackages).toEqual(packages);
  });

  it("should traverse file tree up until it finds a mono repo package.json", async () => {
    // Start search inside a package in a mono repo
    const foundPackages = await getPackages(resolve(monoRepoDir, "packages/a"));

    // Should have walked the file tree up until it found the
    // mono repo config with the workspace globs
    expect(foundPackages).toEqual(packages);
  });

  it("should return an empty array if it can not find a mono repo", async () => {
    const foundPackages = await getPackages(tmpdir());

    expect(foundPackages).toEqual([]);
  });
});

describe("filterPackages", () => {
  it("should return all matching packages", () => {
    const [a, b, c] = packages;

    // Name only
    expect(filterPackages(packages, "@packages/a")).toEqual([a]);
    expect(filterPackages(packages, "@packages/a,@packages/c")).toEqual([a, c]);
    expect(filterPackages(packages, "@packages/b,@packages/c")).toEqual([b, c]);

    // Wildcard only
    expect(filterPackages(packages, "*")).toEqual([a, b, c]);
    expect(filterPackages(packages, "@packages/*")).toEqual([a, b, c]);

    // Ensure not all strings are wildcarded
    expect(filterPackages(packages, "@packages")).toEqual([]);

    // Name/wildcard mix
    expect(filterPackages(packages, "@packages/a,@packages*")).toEqual([
      a,
      b,
      c,
    ]);
  });
});

describe("getPackageName", () => {
  it("should extract the package name", () => {
    expect(getPackageName("test")).toBe("test");
    expect(getPackageName("test@1")).toBe("test");
    expect(getPackageName("test@1.0")).toBe("test");
    expect(getPackageName("test@^1.0.0")).toBe("test");
    expect(getPackageName("@test/one")).toBe("@test/one");
    expect(getPackageName("@test/one@1.0.0")).toBe("@test/one");
  });
});

describe("getPackageVersion", () => {
  it("should extract the package version", async () => {
    expect(await getPackageVersion("test@1", packages)).toEqual({
      modifier: "",
      version: "1",
    });
    expect(await getPackageVersion("test@1.0.0", packages)).toEqual({
      modifier: "",
      version: "1.0.0",
    });
    expect(await getPackageVersion("test@^1.0.0", packages)).toEqual({
      modifier: "^",
      version: "1.0.0",
    });
    expect(await getPackageVersion("@test/one@1.0.0", packages)).toEqual({
      modifier: "",
      version: "1.0.0",
    });
  });

  it("should return the latest from NPM if no version is present", async () => {
    expect(await getPackageVersion("@enzsft/npm-fixture", packages)).toEqual({
      modifier: "^",
      version: "1.0.1",
    });
  });

  it("should return the version of the package in the mono repo if no version is present", async () => {
    expect(await getPackageVersion("@packages/a", packages)).toEqual({
      modifier: "^",
      version: "1.0.0",
    });
  });

  it("should throw if the package does not exist", async () => {
    expect.assertions(1);
    try {
      await getPackageVersion("this-will-never-exist-surely", packages);
    } catch (error) {
      expect(error).toEqual(
        new Error("NPM package 'this-will-never-exist-surely' does not exist"),
      );
    }
  });
});

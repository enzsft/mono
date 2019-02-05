import { existsSync, readJson } from "fs-extra";
import { resolve } from "path";
import { createMonoRepo, deleteMonoRepo } from "../mono-repo";
import { getPackages } from "../packages";

const monoRepoDir = resolve(process.cwd(), "__mono_repo_fixture__mono-repo__");
const monoRepo = {
  license: "MIT",
  name: "mono",
  version: "1.0.0",
  workspaces: ["packages/*"],
};
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
];

describe("createMonoRepo", () => {
  it("should create a mono repo", async () => {
    await createMonoRepo(monoRepoDir, monoRepo, packages);
    const foundPackages = await getPackages(monoRepoDir);
    const monoRepoPackage = await readJson(
      resolve(monoRepoDir, "package.json"),
    );

    expect(foundPackages).toEqual(
      packages.map(x => ({
        ...x,
        __dir: resolve(monoRepoDir, x.__dir),
      })),
    );
    expect(monoRepoPackage).toEqual(monoRepo);

    await deleteMonoRepo(monoRepoDir);
  });
});

describe("deleteMonoRepo", () => {
  it("should delete a mono repo", async () => {
    await createMonoRepo(monoRepoDir, monoRepo, packages);
    await deleteMonoRepo(monoRepoDir);

    const monoRepoExists = existsSync(monoRepoDir);
    expect(monoRepoExists).toBe(false);
  });
});

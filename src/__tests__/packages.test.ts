import { resolve } from "path";
import { createMonoRepo, deleteMonoRepo } from "../mono-repo";
import { getPackages } from "../packages";

describe("getPackages", () => {
  const monoRepoDir = resolve(process.cwd(), "__mono_repo_fixture__packages__");
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

  beforeEach(async () => {
    await createMonoRepo(monoRepoDir, monoRepo, packages);
  });

  afterEach(async () => {
    await deleteMonoRepo(monoRepoDir);
  });

  it("should get all packages in the mono repo", async () => {
    const foundPackages = await getPackages(
      resolve(process.cwd(), monoRepoDir),
    );

    expect(foundPackages).toEqual(
      packages.map(x => ({
        ...x,
        __dir: resolve(resolve(process.cwd(), monoRepoDir), "packages", x.name),
      })),
    );
  });
});

import { ensureDir, remove, writeJson } from "fs-extra";
import { resolve } from "path";
import { IMonoRepo, IPackage } from "./types";

/**
 * Create a mono repo
 *
 * @param monoRepoDir
 * @param monoRepo
 * @param packages
 */
export const createMonoRepo = async (
  monoRepoDir: string,
  monoRepo: IMonoRepo,
  packages: IPackage[],
): Promise<void> => {
  // Ensure one doesn't already exist
  await deleteMonoRepo(monoRepoDir);

  // Create temp directory for mono repo
  await ensureDir(monoRepoDir);

  // Create mono repo package.json
  await writeJson(
    resolve(monoRepoDir, "package.json"),
    { ...monoRepo, private: true },
    {
      spaces: 2,
    },
  );

  // Create packages
  await Promise.all(
    packages.map(async x => {
      // Create package directory
      await ensureDir(x.__dir);

      // Create package.json
      await writeJson(resolve(x.__dir, "package.json"), x, { spaces: 2 });
    }),
  );
};

/**
 * Delete a mono repo
 *
 * @param monoRepoDir
 */
export const deleteMonoRepo = async (monoRepoDir: string): Promise<void> => {
  await remove(monoRepoDir);
};

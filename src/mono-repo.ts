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
  await writeJson(resolve(monoRepoDir, "package.json"), monoRepo, {
    spaces: 2,
  });

  // Create packages
  await Promise.all(
    packages.map(async x => {
      // Create package directory
      const packageDir = resolve(monoRepoDir, x.__dir);
      await ensureDir(packageDir);

      // Create package.json
      await writeJson(resolve(packageDir, "package.json"), x, { spaces: 2 });
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

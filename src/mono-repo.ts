import { ensureDir, existsSync, readJson, remove, writeJson } from "fs-extra";
import { resolve } from "path";
import { MonoRepo, Package } from "./types";

/**
 * Delete a mono repo
 *
 * @param {string} monoRepoDir The root directory of the mono repo
 * @returns {Promise} A promise
 */
export const deleteMonoRepo = async (monoRepoDir: string): Promise<void> => {
  await remove(monoRepoDir);
};

/**
 * Create a mono repo
 *
 * @param {string} monoRepoDir The root directory of the mono repo
 * @param {Object} monoRepo The mono repo descriptor object
 * @param {Object[]} packages All packages in the mono repo
 * @returns {Promise} A promise
 */
export const createMonoRepo = async (
  monoRepoDir: string,
  monoRepo: MonoRepo,
  packages: Package[],
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
 * Get mono repo config.
 * Walks the file tree up until it finds a valid package.json
 * with mono repo config in it.
 *
 * @param {string} currentDir The current directory to search
 * @returns {Promise} A promise that reolves with the mono repo descriptor object
 */
export const getMonoRepo = async (
  currentDir: string,
): Promise<MonoRepo | null> => {
  const packageJsonExists = existsSync(resolve(currentDir, "package.json"));

  // If a package.json exists at this level then check if it is valid mono repo
  // config and return it if it is
  if (packageJsonExists) {
    const packageJson = await readJson(resolve(currentDir, "package.json"));

    // Check if it has valid Yarn Workspaces config
    if (packageJson.private === true && Array.isArray(packageJson.workspaces)) {
      return { ...packageJson, __dir: currentDir };
    }
  }

  // Not valid mono repo config, so jump up a level and check there
  const directoryUp = resolve(currentDir, "..");

  // If we've reached the top then exit and return null
  if (directoryUp === currentDir) {
    return null;
  }

  return getMonoRepo(directoryUp);
};

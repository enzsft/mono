import { readJson } from "fs-extra";
import glob from "glob-promise";
import { resolve } from "path";
import { IMonoRepo, IPackage } from "./types";

/**
 * Get all packages in a mono repo
 * @param monoRepoDir
 */
export const getPackages = async (monoRepoDir: string): Promise<IPackage[]> => {
  // Load mono repo config
  const monoRepo: IMonoRepo = await readJson(
    resolve(monoRepoDir, "package.json"),
  );

  // Load all packages config

  // Build globs to packages package.json files
  const packageGlobs = monoRepo.workspaces.map(x =>
    resolve(monoRepoDir, x, "package.json"),
  );

  // Find all paths to package.jsons via globs
  const globResults = await Promise.all(packageGlobs.map(g => glob(g)));

  // Need to flatten glob results into a simple array of filepaths
  const workspaceFilePaths = globResults.reduce(
    (acc, next) => [...acc, ...next],
    [],
  );

  // Load all file contents into a JS object, it's JSON so serializes properly
  const packages = await Promise.all(
    workspaceFilePaths.map((x: string): Promise<IPackage> => readJson(x)),
  );

  // Apply package meta data on the way out
  return packages.map(
    (x, i): IPackage => ({
      ...x,
      __dir: workspaceFilePaths[i].replace("/package.json", ""),
    }),
  );
};

/**
 * Filter packages based on a filter string.
 * @param packages
 * @param filter Comma seperated package names
 */
export const filterPackages = (
  packages: IPackage[],
  filter: string,
): IPackage[] => {
  // Package names/wildcards can be comma seperated
  const filterParts = filter.split(",");

  // It is a package name unless it contains a '*', then it is a wildcard
  const packageNames = filterParts.filter(f => !f.includes("*"));
  const packageWildcards = filterParts.filter(f => f.includes("*"));

  // Include all packages if this wildcard exists
  if (packageWildcards.includes("*")) {
    return packages;
  }

  // Ensure final collection of packages has no duplicate packages by using Set()
  return Array.from(
    new Set([
      ...packages.filter(p => packageNames.includes(p.name)),
      // Wildcard only supports trailing '*' so strip it and use startsWith()
      ...packages.filter(p =>
        packageWildcards.find(w =>
          p.name.startsWith(w.substring(0, w.length - 1)),
        ),
      ),
    ]),
  );
};

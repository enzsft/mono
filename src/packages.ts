import { exec } from "child_process";
import { readJson } from "fs-extra";
import glob from "glob-promise";
import { resolve } from "path";
import { getMonoRepo } from "./mono-repo";
import { MonoRepo, Package, VersionSpec } from "./types";

/**
 * Get all packages in a mono repo
 *
 * @param {string} currentDir The directory to execute the search from
 * @returns {Promise<Object[]>} A promise that resolves with all packages
 */
export const getPackages = async (currentDir: string): Promise<Package[]> => {
  // Load mono repo config
  const monoRepo: MonoRepo | null = await getMonoRepo(currentDir);

  // If we can't find a mono repo then we can't find any packages
  if (!monoRepo) {
    return [];
  }

  // Load all packages config

  // Build globs to packages package.json files
  const packageGlobs = monoRepo.workspaces.map(x =>
    resolve(monoRepo.__dir, x, "package.json"),
  );

  // Find all paths to package.jsons via globs
  const globResults = await Promise.all(packageGlobs.map(g => glob(g)));

  // Need to flatten glob results into a simple array of filepaths
  const workspaceFilePaths = globResults
    .reduce((acc, next) => [...acc, ...next], [])
    .filter(x => !x.includes("node_modules"));

  // Load all file contents into a JS object, it's JSON so serializes properly
  const packages = await Promise.all(
    workspaceFilePaths.map((x: string): Promise<Package> => readJson(x)),
  );

  // Apply package meta data on the way out
  return packages.map(
    (x, i): Package => ({
      ...x,
      __dir: workspaceFilePaths[i].replace("/package.json", ""),
    }),
  );
};

/**
 * Filter packages based on a filter string.
 *
 * @param {Objectp[]} packages Packages to filter
 * @param {string} filter Comma seperated package names
 * @returns {Object[]} Filtered packages
 */
export const filterPackages = (
  packages: Package[],
  filter: string,
): Package[] => {
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

/**
 * Extract the name from the install package string.
 * For example "react@16.8.0" will return "react"
 *
 * @param {string} nameWithMaybeVersion Package name with optional version
 * @returns {string} The package name
 */
export const getPackageName = (nameWithMaybeVersion: string): string => {
  const isScoped = nameWithMaybeVersion.startsWith("@");
  const strippedScopeNameWithMaybeVersion = isScoped
    ? nameWithMaybeVersion.substring(1)
    : nameWithMaybeVersion;
  const [name] = strippedScopeNameWithMaybeVersion.split("@");

  // Need to restore scope prefix if it was stripped
  return isScoped ? `@${name}` : name;
};

/**
 * Extract the version from the install package string.
 * For example "react@16.8.0" will return "16.8.0".
 * If no version is present then the local packages and NPM
 * will be searched in that order.
 *
 * @param {string} nameWithMaybeVersion Package name with optional version
 * @param {Object[]} localPackages All local packages
 * @returns {Pbject} A package version spec
 */
export const getPackageVersion = async (
  nameWithMaybeVersion: string,
  localPackages: Package[],
): Promise<VersionSpec> => {
  const isScoped = nameWithMaybeVersion.startsWith("@");
  const strippedScopeNameWithMaybeVersion = isScoped
    ? nameWithMaybeVersion.substring(1)
    : nameWithMaybeVersion;
  const [, version] = strippedScopeNameWithMaybeVersion.split("@");

  // No version provided so determine it
  if (!version) {
    const packageName = getPackageName(nameWithMaybeVersion);

    // First check the local packages and use it if it exists
    const localPackage = localPackages.find(p => p.name === packageName);
    if (localPackage) {
      return Promise.resolve({
        modifier: "^",
        version: localPackage.version,
      });
    }

    // Now try and obtain the version from NPM
    const runner = exec(`npm show ${packageName} version`);

    return new Promise(
      (
        res: (value?: VersionSpec) => void,
        rej: (error: Error) => void,
      ): void => {
        runner.stdout.on("data", (out: string) => {
          res({ modifier: "^", version: out.trim() });
        });

        runner.on("exit", code => {
          if (code !== 0) {
            rej(new Error(`NPM package '${packageName}' does not exist`));
          }
        });
      },
    );
  }

  // Otherwise return the provided version, provide default modifier if it doesn't exist
  const match = /\d/.exec(version);
  const hasNoModifier = match && match.index === 0;
  return {
    modifier: hasNoModifier ? "" : version.substring(0, 1),
    version: hasNoModifier ? version : version.substring(1),
  };
};

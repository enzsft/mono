import { Command } from "@enzsft/cli";
import chalk from "chalk";
import { readJson, writeJson } from "fs-extra";
import { EOL } from "os";
import { resolve as resolvePath } from "path";
import { exec } from "../exec";
import { createConsoleLogger } from "../logger";
import { devOption } from "../options/dev";
import { includeOption } from "../options/include";
import { filterPackages, getPackageName, getPackageVersion } from "../packages";
import { AddCommandOptions, MonoRepo, Package } from "../types";

/**
 * Create the add command.
 * This command is used to add NPM packages to packages in the mono repo.
 * If the package name matches one in the mono repo then it is locally linked.
 *
 * @param {Object[]} packages All packages in the mono repo
 * @param {Object} monoRepo The mono repo
 * @returns {Object} The add command
 */
export const createAddCommand = (
  packages: Package[],
  monoRepo: MonoRepo | null,
): Command<AddCommandOptions> => ({
  description: "Install dependencies from NPM or your local mono repo.",
  handler: async (
    installPackageNames: string[],
    options: AddCommandOptions,
  ): Promise<void> => {
    const logger = createConsoleLogger();

    // Can't continue if not in a mono repo
    if (!monoRepo) {
      logger.warn("Unable to locate your mono repo 😰");
      return;
    }

    // Determine the target packages, must match filter
    const targetPackages = filterPackages(packages, options.include);

    if (targetPackages.length === 0) {
      logger.warn("No packages found 😰");
      return;
    }

    // Determine install package names that exist in the local mono repo
    const localInstallPackageNames = installPackageNames.filter(n =>
      packages.find(p => p.name === getPackageName(n)),
    );

    // Packages not deemed to be local to the mono repo are NPM packages
    const npmPackages: Package[] = await Promise.all(
      installPackageNames
        .filter(n => !localInstallPackageNames.includes(getPackageName(n)))
        .map(async n => {
          const versionSpec = await getPackageVersion(n, packages);
          return {
            __dir: "", // don't care about this for install
            license: "", // or this
            name: getPackageName(n),
            version: `${versionSpec.modifier}${versionSpec.version}`,
          };
        }),
    );

    // Filter out local mono repo packages
    const localPackages: Package[] = await Promise.all(
      installPackageNames
        .filter(n => localInstallPackageNames.includes(getPackageName(n)))
        .map(async n => {
          const versionSpec = await getPackageVersion(n, packages);
          return {
            __dir: "", // don't care about this for install
            license: "", // or this
            name: getPackageName(n),
            version: `${versionSpec.modifier}${versionSpec.version}`,
          };
        }),
    );

    // Final list of packages to install
    const installPackages = [...npmPackages, ...localPackages];

    // Log out all the target packages
    logger.log(
      `${chalk.greenBright("Target packages:")}${EOL}${chalk.cyanBright(
        targetPackages.map(p => p.name).join(EOL),
      )}`,
    );

    // Package.json key to write dependnecies into
    const dependencyKey = options.dev ? "devDependencies" : "dependencies";

    // Write the dependencies into all package.jsons
    for (const pkg of targetPackages) {
      // Need to filter out packages that match the target package.
      // We do not want to try and install the package in itself
      const filteredPackages = installPackages.filter(p => p.name !== pkg.name);

      // Only bother doing this install if there are packages
      if (filteredPackages.length > 0) {
        // Write packages to the package.json
        const packageJsonFilePath = resolvePath(pkg.__dir, "package.json");
        const packageJson = await readJson(packageJsonFilePath);

        // Need to ensure key exists to add to it
        if (packageJson[dependencyKey] === undefined) {
          packageJson[dependencyKey] = {};
        }

        // Now add packages to the key
        for (const installPackage of filteredPackages) {
          packageJson[dependencyKey][installPackage.name] = `${
            installPackage.version
          }`;
        }

        // Save the file
        await writeJson(packageJsonFilePath, packageJson, { spaces: 2 });
      }
    }

    // Running a Yarn install will install all packages from NPM and link local packages.
    // We don't simply run `yarn workspace add abc` for each package because it is slower
    // This way we only make yarn work once.
    await exec("yarn", [], { cwd: monoRepo.__dir });
  },
  name: "add",
  options: [devOption, includeOption],
});

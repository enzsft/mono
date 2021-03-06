import { Command } from "@enzsft/cli";
import chalk from "chalk";
import { readJson, writeJson } from "fs-extra";
import { EOL } from "os";
import { resolve } from "path";
import { exec } from "../exec";
import { createConsoleLogger } from "../logger";
import { includeOption } from "../options/include";
import { filterPackages } from "../packages";
import { MonoRepo, Package, RemoveCommandOptions } from "../types";

/**
 * Create the remove command.
 * This command is used to remove NPM packages to packages in the mono repo.
 *
 * @param {Object[]} packages All packages in the mono repo
 * @param {Object} monoRepo The mono repo
 * @returns {Object} The remove command
 */
export const createRemoveCommand = (
  packages: Package[],
  monoRepo: MonoRepo | null,
): Command<RemoveCommandOptions> => ({
  description: "Remove dependencies from packages in your local mono repo.",
  handler: async (
    removePackageNames: string[],
    options: RemoveCommandOptions,
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

    // Log out all the packages to be removed and from what packages
    logger.log(
      `${chalk.greenBright("Target packages:")}${EOL}${chalk.cyanBright(
        targetPackages.map(p => p.name).join(EOL),
      )}`,
    );

    // Remove the dependency from all target package.json files if they exist
    for (const pkg of targetPackages) {
      const packageJsonFilePath = resolve(pkg.__dir, "package.json");
      const packageJson = await readJson(packageJsonFilePath);

      for (const removePackageName of removePackageNames) {
        if (packageJson.dependencies) {
          delete packageJson.dependencies[removePackageName];
        }

        if (packageJson.devDependencies) {
          delete packageJson.devDependencies[removePackageName];
        }
      }

      await writeJson(packageJsonFilePath, packageJson, { spaces: 2 });
    }
    // Finally run Yarn so it can clean up any installed packages
    // This way we only make yarn work once
    await exec("yarn", [], { cwd: monoRepo.__dir });
  },
  name: "remove",
  options: [includeOption],
});

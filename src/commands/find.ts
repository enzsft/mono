import { Command } from "@enzsft/cli";
import chalk from "chalk";
import { EOL } from "os";
import { relative } from "path";
import { includeOption } from "../options/include";
import { filterPackages } from "../packages";
import { MonoRepo, Package, FindCommandOptions } from "../types";
import { createConsoleLogger } from "../logger";

/**
 * Create the list command.
 * This command is used to list packages in the mono repo.
 *
 * @param {Object[]} packages All packages in the mono repo
 * @param {Object} monoRepo The mono repo
 * @param {String} cwd The current working directory
 * @returns {Object} The list command
 */
export const createFindCommand = (
  packages: Package[],
  monoRepo: MonoRepo | null,
  cwd: string,
): Command<FindCommandOptions> => {
  return {
    description: "Find package relative directory paths",
    handler: async (
      values: string[],
      options: FindCommandOptions,
    ): Promise<void> => {
      const logger = createConsoleLogger();

      // Can't continue if not in a mono repo
      if (!monoRepo) {
        logger.warn("Unable to locate your mono repo 😰");
        return;
      }

      // Find all packages according to filter
      const foundPackages = filterPackages(packages, options.include);

      if (foundPackages.length === 0) {
        logger.warn("No packages found 😰");
        return;
      }

      // Construct the single log message
      const log = `${chalk.greenBright(
        `Found ${foundPackages.length} package directories:`,
      )}${EOL}${chalk.cyanBright(
        foundPackages
          .map(p => {
            const path = relative(cwd, p.__dir);
            return path.length === 0 ? ". (current)" : path;
          })
          .join(EOL),
      )}`;

      // Log it out
      logger.log(log);
    },
    name: "find",
    options: [includeOption],
  };
};

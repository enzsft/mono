import { Command } from "@enzsft/cli";
import chalk from "chalk";
import { EOL } from "os";
import { includeOption } from "../options/include";
import { filterPackages } from "../packages";
import { MonoRepo, Package, ListCommandOptions } from "../types";
import { createConsoleLogger } from "../logger";

/**
 * Create the list command.
 * This command is used to list packages in the mono repo.
 *
 * @param {Object[]} packages All packages in the mono repo
 * @param {Object} monoRepo The mono repo
 * @returns {Object} The list command
 */
export const createListCommand = (
  packages: Package[],
  monoRepo: MonoRepo | null,
): Command<ListCommandOptions> => {
  return {
    description: "List packages.",
    handler: async (
      values: string[],
      options: ListCommandOptions,
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
        `Found ${foundPackages.length} packages:`,
      )}${EOL}${chalk.cyanBright(
        foundPackages.map(p => `${p.name}@${p.version}`).join(EOL),
      )}`;

      // Log it out
      logger.log(log);
    },
    name: "list",
    options: [includeOption],
  };
};

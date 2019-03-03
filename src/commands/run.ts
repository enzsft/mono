import { Command } from "@enzsft/cli";
import chalk from "chalk";
import { exec } from "child_process";
import { EOL } from "os";
import { applyRandomColor } from "../colors";
import { createConsoleLogger } from "../logger";
import { includeOption } from "../options/include";
import { filterPackages } from "../packages";
import { IMonoRepo, IPackage, IRunCommandOptions } from "../types";

/**
 * Create the run command.
 * This command is used to run NPM scripts in packages in the mono repo.
 * @param packages
 */
export const createRunCommand = (
  packages: IPackage[],
  monoRepo: IMonoRepo | null,
): Command<IRunCommandOptions> => {
  return {
    description: "Run NPM scripts",
    handler: async (
      values: string[],
      options: IRunCommandOptions,
    ): Promise<void> => {
      const logger = createConsoleLogger();
      // Can't continue if not in a mono repo
      if (!monoRepo) {
        logger.warn("Unable to locate your mono repo 😰");
        return;
      }
      // The script to execute will always be the first value
      // All values after the script are arguments to forward onto the executing script
      const [script, ...forwardedArgs] = values;
      // Determine the target packages, must match filter and contain the script
      const targetPackages = filterPackages(packages, options.include).filter(
        p => p.scripts && Object.keys(p.scripts).includes(script),
      );
      if (targetPackages.length === 0) {
        logger.warn("No packages found 😰");
        return;
      }
      // Log out all packages that the NPM script will be run in
      logger.log(
        `${chalk.greenBright("Target packages:")}${EOL}${chalk.cyanBright(
          targetPackages.map(p => p.name).join(EOL),
        )}`,
      );
      // Build executor functions
      const executors = targetPackages
        // Filter packages that contain the script
        // Return seperate executors over immediate map() so we can execute them in sync
        .map(p => async (): Promise<void> => {
          // Run the script via yarn from the packages directory
          const runner = exec(`yarn run ${script} ${forwardedArgs.join(" ")}`, {
            cwd: p.__dir,
          });

          // Create logger prefixed for the executing package
          const packageLoger = createConsoleLogger({
            prefix: applyRandomColor(`[${p.name}]: `),
          });

          // Log stdout as normal logs
          runner.stdout.on("data", data => {
            packageLoger.log(data.toString());
          });

          // Log stderr as errors
          runner.stderr.on("data", data => {
            packageLoger.error(data.toString());
          });

          return new Promise(
            (resolve, reject): void => {
              runner.on("close", code => {
                // Reject if the code is non zero
                if (code !== 0) {
                  logger.error(
                    `Script ${chalk.greenBright(
                      script,
                    )} in package ${chalk.cyanBright(
                      p.name,
                    )} exited with code ${code} 🤕`,
                  );
                  return reject({ code });
                }
                // Resolve on successful code 0
                logger.log(
                  `Script ${chalk.greenBright(
                    script,
                  )} in package ${chalk.cyanBright(p.name)} is done 🎉`,
                );
                return resolve();
              });
            },
          );
        });
      // Execute all the executors one at a time
      for (const executor of executors) {
        await executor();
      }

      logger.log("All done ✌️");
    },
    name: "run",
    options: [includeOption],
  };
};

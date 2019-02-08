import { ICommand } from "@enzsft/cli";
import chalk from "chalk";
import { exec } from "child_process";
import { createConsoleLogger } from "../logger";
import { includeOption } from "../options/include";
import { filterPackages } from "../packages";
import { IPackage, IRunCommandOptions } from "../types";

/**
 * Create the run command.
 * This command is used to run NPM in packages in the mono repo.
 * @param packages
 */
export const createRunCommand = (
  packages: IPackage[],
): ICommand<IRunCommandOptions> => ({
  description: "Run NPM scripts",
  handler: async (
    values: string[],
    options: IRunCommandOptions,
  ): Promise<void> => {
    // The script to execute will always be the first value
    // All values after the script are arguments to forward onto the executing script
    const [script, ...forwardedArgs] = values;

    const toolLogger = createConsoleLogger();

    // Build executor functions
    const executors = filterPackages(packages, options.include)
      .filter(p => p)
      // Filter packages that contain the script
      .filter(p => p.scripts && Object.keys(p.scripts).includes(script))
      // Return seperate executors over immediate map() so we can execute them in sync
      .map(p => async (): Promise<void> => {
        // Run the script via yarn from the packages directory
        const runner = exec(`yarn run ${script} ${forwardedArgs.join(" ")}`, {
          cwd: p.__dir,
        });

        // Create logger prefixed for the executing package
        const scriptLogger = createConsoleLogger({ prefix: `[${p.name}]: ` });

        // Log stdout as normal logs
        runner.stdout.on("data", data => {
          scriptLogger.log(data.toString());
        });

        // Log stderr as errors
        runner.stderr.on("data", data => {
          scriptLogger.error(data.toString());
        });

        return new Promise(
          (resolve, reject): void => {
            runner.on("exit", code => {
              // Reject if the code is non zero
              if (code !== 0) {
                toolLogger.error(
                  `Script ${chalk.greenBright(script)} in ${chalk.blueBright(
                    p.name,
                  )} exited with error code ${code} 🤕`,
                );
                return reject({ code });
              }

              // Resolve on successful code 0
              toolLogger.log(
                `Script ${chalk.greenBright(script)} in ${chalk.blueBright(
                  p.name,
                )} is done 🎉`,
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
  },
  name: "run",
  options: [includeOption],
});

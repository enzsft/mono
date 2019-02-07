import { ICommand } from "@enzsft/cli";
import { exec } from "child_process";
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

        return new Promise(
          (resolve, reject): void => {
            // Resolve on a successful 0 exit code, else reject with the code
            runner.on("exit", code =>
              code === 0 ? resolve() : reject({ code }),
            );
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

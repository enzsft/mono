import { ICommand } from "@enzsft/cli";
import { exec } from "child_process";
import { IPackage } from "../types";

/**
 * Create the run command
 * @param packages
 */
export const createRunCommand = (packages: IPackage[]): ICommand<{}> => ({
  description: "Run NPM scripts",
  handler: async (scriptsToExecute: string[], options: {}): Promise<void> => {
    for (const pkg of packages) {
      if (pkg.scripts) {
        for (const script of scriptsToExecute) {
          // If this package contains this script then execute it
          if (Object.keys(pkg.scripts).includes(script)) {
            const runner = exec(`yarn run ${script}`, { cwd: pkg.__dir });

            await new Promise(
              (resolve, reject): void => {
                runner.on("exit", code => (code === 0 ? resolve() : reject()));
              },
            );
          }
        }
      }
    }
  },
  name: "run",
  options: [],
});

import { spawn, SpawnOptions } from "child_process";
import { createConsoleLogger } from "./logger";

/**
 * Exec a command and stream stdout/stderr to the console.
 *
 * @param command
 * @param options
 */
export const exec = (
  command: string,
  args: ReadonlyArray<string>,
  options: SpawnOptions,
): Promise<number> => {
  const runner = spawn(command, args, { ...options, stdio: "inherit" });

  return new Promise(
    (resolve, reject): void => {
      // Reject if error
      runner.on("error", err => {
        reject(err);
      });

      // Resolve if successful
      runner.on("close", code => {
        if (code !== 0) {
          reject(code);
        }

        const logger = createConsoleLogger();
        logger.log(`All done ✌️`);
        resolve(code);
      });
    },
  );
};

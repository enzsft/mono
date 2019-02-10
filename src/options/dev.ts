import { createBooleanOption } from "@enzsft/cli";

/**
 * Specify dependencies are dev dependencies
 */
export const devOption = createBooleanOption({
  altName: "D",
  defaultValue: false,
  description: "Install packages to devDependencies",
  name: "dev",
  required: false,
});

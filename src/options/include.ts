import { createStringOption } from "@enzsft/cli";

/**
 * Include option used to filter packages by name
 */
export const includeOption = createStringOption({
  altName: "i",
  defaultValue: "*",
  description:
    "Match packages with comma seperate names with optional trailing wildcard (*)",
  name: "include",
  required: false,
});

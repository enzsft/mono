import { createCli } from "@enzsft/cli";

const cli = createCli({
  commands: [],
  description: "Manage JavaScript mono repos with ease. 😲",
  name: "mono",
});

cli.start(process.argv).catch(() => process.exit(1));

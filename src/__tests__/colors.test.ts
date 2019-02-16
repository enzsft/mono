import chalk from "chalk";
import { applyRandomColor, chalkColors } from "../colors";

describe("applyRandomColor", () => {
  it("should cycle through chalk colors and apply them to the given string", () => {
    for (const color of chalkColors) {
      expect(applyRandomColor("test")).toBe((chalk as any)[color]("test"));
    }

    // Cycle through twice to make sure it loops back round
    for (const color of chalkColors) {
      expect(applyRandomColor("test")).toBe((chalk as any)[color]("test"));
    }
  });
});

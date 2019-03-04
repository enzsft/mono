import chalk from "chalk";

export const chalkColors = [
  // 'black', // most terminals are black
  // 'blue', // too dark
  "greenBright",
  "yellowBright",
  "magentaBright",
  "cyanBright",
  "whiteBright",
  "redBright",
  "blueBright",
  "green",
  "yellow",
  "magenta",
  "cyan",
  "white",
  "red",
  "redBright",
];

let currentColorIndex = 0;

/**
 * Get a random chalk compatible color name
 *
 * @param {string} str A string to color
 * @returns {string} String colored for console
 */
export const applyRandomColor = (str: string): string => {
  const randomColor: string = chalkColors[currentColorIndex];

  // Want to cycle through colors so they aren't repeated directly after
  //  one another so bump to next for next invocation
  currentColorIndex =
    currentColorIndex === chalkColors.length - 1 ? 0 : currentColorIndex + 1;

  return (chalk as any)[randomColor](str);
};

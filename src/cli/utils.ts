import chalk from "chalk";

export const yellow = "\x1b[43m";
export const blue = "\x1b[44m";
export const green = "\x1b[42m";
export const white = "\x1b[47";
export const reset = "\x1b[0m";
export function centerText(text: string): string {
  const terminalWidth = process.stdout.columns;
  const textLength = text.length;
  const padding = Math.max(0, Math.floor((terminalWidth - textLength) / 2));
  return " ".repeat(padding) + text;
}
export function log(emoji: string, message: string, color = yellow) {
  let marker;
  switch (color) {
    case yellow:
      marker = chalk.yellow(emoji);
      break;
    case blue:
      marker = chalk.blue(emoji);
      break;
    case green:
      marker = chalk.green(emoji);
      break;
    case white:
      marker = chalk.white(emoji);
      break;
    default:
      marker = chalk.yellow(emoji);
      break;
  }
  const text = chalk.bold(message);
  console.log(marker, text);
}

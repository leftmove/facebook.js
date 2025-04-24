// This file is used to read the success.html file and return it as a string.
// It's a backup in case the program is not using Bun, which natively supports HTML files.

import fs from "fs";

const successHTML = fs.readFileSync("./src/cli/success.html", "utf8");

export default successHTML;

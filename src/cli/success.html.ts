// This file is used to read the success.html file and return it as a string.
// It's a backup in case the program is not using Bun, which natively supports HTML files.

import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, "success-template.html");

const successHTML = fs.readFileSync(filePath, "utf8");

export default successHTML;

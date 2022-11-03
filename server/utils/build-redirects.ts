import { VALID_LOCALES } from "../../libs/constants";
import fs from "fs";
import path from "path";

const dirname = __dirname;
import dotenv from "dotenv";

const root = path.join(dirname, "..", "..", "..");
dotenv.config({
  path: path.join(root, process.env.ENV_FILE || ".env"),
});

function buildRedirectsMap() {
  const redirectMap = new Map();
  const label = "Building redirects";
  console.time(label);

  ["CONTENT_ROOT", "CONTENT_TRANSLATED_ROOT"].forEach((envvar) => {
    if (!process.env[envvar]) {
      console.error(`Missing ENV variable: ${envvar}`);
      return;
    }

    const base = process.env[envvar];
    console.log(`${envvar} = ${base}`);

    for (const locale of VALID_LOCALES.keys()) {
      const path = [
        // Absolute path.
        `${base}/${locale}/_redirects.txt`,
        `${base}/files/${locale}/_redirects.txt`,
        // Relative path.
        `${root}/${base}/${locale}/_redirects.txt`,
        `${root}/${base}/files/${locale}/_redirects.txt`,
      ].find((path) => fs.existsSync(path));

      if (path) {
        const content = fs.readFileSync(path, "utf-8");
        const lines = content.split("\n");
        const redirectLines = lines.filter(
          (line) => line.startsWith("/") && line.includes("\t")
        );
        for (const redirectLine of redirectLines) {
          const [source, target] = redirectLine.split("\t", 2);
          redirectMap.set(source.toLowerCase(), target);
        }
        console.log(`- ${path}: ${redirectLines.length} redirects`);
      }
    }
  });
  console.timeEnd(label);
  return redirectMap;
}

const redirectsMap = buildRedirectsMap();
export default redirectsMap;

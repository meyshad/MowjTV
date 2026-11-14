#!/usr/bin/env node
/*
 * Packages public/tv/ for ordinary shared hosting:
 *
 *   release/index.html   sends visitors of the domain root to tv/
 *   release/tv/          the site, with the license and third-party notices
 *   release/tv.zip       both of the above, ready to extract in public_html
 *
 * Folders get permission 755 and files 644, the values most shared hosts expect
 * (anything stricter is a common cause of "403 Forbidden").
 *
 * usage: node scripts/build-release.mjs   (needs the "zip" command)
 */
import { execFileSync } from "node:child_process";
import { chmod, copyFile, cp, readdir, rm, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const release = `${root}release`;

const REDIRECT = `<!doctype html>
<html lang="fa" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="0; url=tv/" />
    <title>موج — تلویزیون زنده</title>
    <style>
      body { margin: 0; padding: 3rem 1rem; background: #0b0f17; color: #eef2f7; font-family: Tahoma, Arial, sans-serif; text-align: center; }
      a { color: #2dd4bf; font-size: 1.4rem; }
    </style>
  </head>
  <body>
    <p><a href="tv/">ورود به موج — تلویزیون زنده</a></p>
    <script>location.replace("tv/");</script>
  </body>
</html>
`;

async function setModes(path) {
  const info = await stat(path);
  if (info.isDirectory()) {
    await chmod(path, 0o755);
    for (const name of await readdir(path)) await setModes(`${path}/${name}`);
  } else {
    await chmod(path, 0o644);
  }
}

await rm(`${release}/tv`, { recursive: true, force: true });
await rm(`${release}/tv.zip`, { force: true });
await cp(`${root}public/tv`, `${release}/tv`, {
  recursive: true,
  filter: (source) => !source.endsWith(".DS_Store"),
});
await copyFile(`${root}LICENSE`, `${release}/tv/LICENSE`);
await copyFile(`${root}THIRD_PARTY_NOTICES.md`, `${release}/tv/THIRD_PARTY_NOTICES.md`);
await writeFile(`${release}/index.html`, REDIRECT);
await setModes(`${release}/tv`);
await chmod(`${release}/index.html`, 0o644);

// -X: no extra file attributes, so the archive only changes when the files do.
execFileSync("zip", ["-qrX", "tv.zip", "index.html", "tv", "-x", "*.DS_Store"], { cwd: release, stdio: "inherit" });
const size = (await stat(`${release}/tv.zip`)).size;
console.log(`release/tv.zip: ${(size / 1048576).toFixed(1)} MB`);

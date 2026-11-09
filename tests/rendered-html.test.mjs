import assert from "node:assert/strict";
import { access, readdir, readFile, stat } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function renderRoot() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders a static launch page for the TV experience", async () => {
  const response = await renderRoot();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]+lang="fa"[^>]+dir="rtl"/i);
  assert.match(html, /<title>موج — تلویزیون زنده<\/title>/);
  assert.match(html, /http-equiv="refresh" content="0; url=\.\/tv\/"/i);
  assert.doesNotMatch(html, /SkeletonPreview|react-loading-skeleton/);
});

test("ships a small standalone TV folder with CDN playback", async () => {
  const [html, script, styles, scriptInfo, styleInfo] = await Promise.all([
    readFile(new URL("../public/tv/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/tv/assets/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/tv/assets/app.css", import.meta.url), "utf8"),
    stat(new URL("../public/tv/assets/app.js", import.meta.url)),
    stat(new URL("../public/tv/assets/app.css", import.meta.url)),
  ]);

  // Page structure
  assert.match(html, /<html lang="fa" dir="rtl">/i);
  assert.match(html, /hls\.js@1\.6\.16\/dist\/hls\.min\.js/);
  for (const id of [
    "cats", "search", "list", "player", "video", "status", "retryBtn", "skipBtn", "osd", "numpad",
    "playBtn", "prevBtn", "nextBtn", "muteBtn", "volUpBtn", "volDownBtn", "qualityBtn", "favBtn",
    "fullBtn", "qualityMenu", "helpModal", "sleepBtn", "clock", "scanBtn", "listFootText", "pager", "pagePrev", "pageNext", "pageInfo",
  ]) {
    assert.match(html, new RegExp(`id="${id}"`), `missing #${id}`);
  }
  assert.doesNotMatch(html, /<video[^>]+\scontrols(?:\s|>)/i);
  assert.doesNotMatch(html, /<video[^>]+\smuted/i);
  assert.doesNotMatch(html, /bootstrap-icons/, "icons are inline, no extra requests");

  // Old TV engines: plain ES5 syntax only.
  assert.doesNotMatch(script, /=>|\?\.|\?\?|`/);
  assert.doesNotMatch(script, /catch \{/, "optional catch binding breaks older TV browsers");
  assert.doesNotMatch(script, /^\s*(?:let|const)\s/m);

  // Channel sources
  assert.match(script, /languages\/fas\.m3u/);
  assert.match(script, /countries\/ir\.m3u/);
  assert.match(script, /countries\/tr\.m3u/);
  assert.match(script, /PROVINCIAL_NAMES/);
  for (const playlist of [
    "categories/music", "categories/movies", "categories/series", "regions/mideast", "regions/eas",
    "regions/eur", "regions/amer",
  ]) {
    assert.match(script, new RegExp(`${playlist}\\.m3u`), `missing ${playlist} playlist`);
  }
  assert.match(script, /CATEGORY_GROUPS = \{ topic: "موضوع", region: "منطقه" \}/);
  assert.match(script, /"GZT\.tr": \["https:\/\/gzttv-live\.lg\.mncdn\.com\/gzttv-live\/gzttv\/playlist\.m3u8"\]/);
  assert.match(script, /CORS_LOCKED_HOSTS = \["ncdn\.telewebion\.ir"\]/);
  assert.doesNotMatch(script, /api\/streams\.json/, "the 4 MB streams index must not be downloaded");

  // Data usage and quality
  assert.match(script, /AUTO_MAX_HEIGHT = 480/);
  assert.match(script, /quality: "auto"/);
  assert.match(script, /autoLevelCapping/);
  assert.match(script, /hls\.stopLoad\(\)/, "pausing must stop downloading");
  assert.match(script, /LIST_FRESH_MS = 12 \* 3600 \* 1000/);
  assert.doesNotMatch(script, /setInterval\([^)]*probe/i, "no periodic background probing");
  assert.match(script, /PROBE_DWELL_MS = 900/);

  // Playable-first ordering from this device's own results; checking a whole list is opt-in
  assert.match(script, /function rankOf\(id\)/);
  assert.match(script, /function orderChannels\(channels\)/);
  assert.match(script, /state\.channels = orderChannels\(channels\)/);
  assert.match(script, /\$\("scanBtn"\)\.addEventListener\("click", scan\.start\)/);
  assert.equal(script.match(/scan\.start\b/g).length, 1, "the list check only runs when the user asks");
  assert.match(script, /SCAN_CONCURRENCY = 2/);
  assert.match(styles, /\.row\.is-dim/);

  // TV browsers: no box to scroll; the list turns pages and the categories wrap
  assert.match(script, /function turnPage\(delta\)/);
  assert.doesNotMatch(script, /scrollTop/, "the channel list must not rely on scrolling");
  assert.match(styles, /\.list \{[^}]*overflow: hidden;/);
  assert.match(styles, /\.cats \{[^}]*flex-wrap: wrap;/);
  assert.match(styles, /@media \(hover: hover\) \{/, "hover hints for TV pointers too");

  // Self-hosted logos, with the original URL as a fallback
  assert.match(html, /<script defer src="\.\/assets\/logos\.js\?v=\d+"><\/script>\s*<script defer src="\.\/assets\/app\.js/);
  assert.match(script, /window\.MOWJ_LOGOS/);
  assert.match(script, /"logos\/" \+ base/);
  const logos = await readFile(new URL("../public/tv/assets/logos.js", import.meta.url), "utf8");
  const logoIds = logos.match(/ids: "([^"]*)"/)[1].split(" ");
  assert.ok(logoIds.length > 200, "the main lists should have local logos");
  for (const id of ["GZT.tr", "IranInternational.uk", "TehranTV.ir"]) {
    if (logoIds.includes(id)) await access(new URL(`../public/tv/logos/${id}.webp`, import.meta.url));
  }
  const logoFiles = (await readdir(new URL("../public/tv/logos/", import.meta.url))).filter((f) => f.endsWith(".webp"));
  assert.equal(logoFiles.length, logoIds.length, "every listed logo has a file and vice versa");

  // Retries are bounded
  assert.match(script, /RECONNECT_DELAYS = \[1000, 3000, 6000, 12000, 20000, 30000\]/);
  assert.match(script, /AUTO_RETRY_DELAYS = \[6000, 15000\]/);

  // Remote keys
  assert.match(script, /10009/);
  assert.match(script, /427/);
  assert.match(script, /428/);
  assert.match(script, /tvinputdevice/);
  assert.match(script, /history\.pushState/);

  // Styles: compatible with old engines and with a visible focus state
  assert.doesNotMatch(styles, /\bclamp\(|\bmin\(|aspect-ratio|:focus-visible/);
  assert.match(styles, /\.row:focus/);
  assert.match(styles, /\.is-full \.player/);
  assert.match(styles, /@media \(max-width: 820px\)/);

  assert.ok(scriptInfo.size < 120000, "TV JavaScript should stay lightweight");
  assert.ok(styleInfo.size < 40000, "TV stylesheet should stay lightweight");
});

test("copies the standalone folder into the static build", async () => {
  await Promise.all([
    access(new URL("../dist/client/tv/index.html", import.meta.url)),
    access(new URL("../dist/client/tv/assets/app.js", import.meta.url)),
    access(new URL("../dist/client/tv/assets/app.css", import.meta.url)),
  ]);

  const builtHtml = await readFile(
    new URL("../dist/client/tv/index.html", import.meta.url),
    "utf8",
  );
  assert.match(builtHtml, /<title>موج — تلویزیون زنده<\/title>/);
});

test("unused starter dependencies are fully removed", async () => {
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await access(projectRoot);
});

test("includes public repository documentation and licensing", async () => {
  const [readme, license, notices, security, deploy, proxy, packageJson] =
    await Promise.all([
      readFile(new URL("../README.md", import.meta.url), "utf8"),
      readFile(new URL("../LICENSE", import.meta.url), "utf8"),
      readFile(new URL("../THIRD_PARTY_NOTICES.md", import.meta.url), "utf8"),
      readFile(new URL("../SECURITY.md", import.meta.url), "utf8"),
      readFile(new URL("../DEPLOY.md", import.meta.url), "utf8"),
      readFile(new URL("../PROXY.md", import.meta.url), "utf8"),
      readFile(new URL("../package.json", import.meta.url), "utf8"),
    ]);

  assert.match(readme, /^# Mowj TV$/m);
  assert.match(readme, /^## Features$/m);
  assert.match(readme, /^## Quick Start$/m);
  assert.equal(
    readme.split("\n").filter((line) => /[\u0600-\u06ff]/.test(line)).length,
    1,
    "README should contain only the requested Persian introduction",
  );
  for (const document of [security, deploy, proxy, notices]) {
    assert.doesNotMatch(document, /[\u0600-\u06ff]/);
  }
  assert.match(deploy, /^# Static Hosting Deployment$/m);
  assert.match(proxy, /^# Streaming Proxy Guide$/m);
  assert.match(readme, /IPTV-ORG/);
  assert.doesNotMatch(readme, /vinext-starter/);
  assert.match(license, /^MIT License/);
  assert.match(notices, /hls\.js 1\.6\.16/);
  assert.match(security, /Report a vulnerability/);
  assert.equal(JSON.parse(packageJson).license, "MIT");
});

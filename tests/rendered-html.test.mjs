import assert from "node:assert/strict";
import { access, readdir, readFile, stat } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

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

test("ships a self-hosted TV folder", async () => {
  const [html, script, styles, scriptInfo, styleInfo] = await Promise.all([
    readFile(new URL("../public/tv/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/tv/assets/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/tv/assets/app.css", import.meta.url), "utf8"),
    stat(new URL("../public/tv/assets/app.js", import.meta.url)),
    stat(new URL("../public/tv/assets/app.css", import.meta.url)),
  ]);

  // Page structure
  assert.match(html, /<html lang="fa" dir="rtl">/i);
  assert.match(html, /<script defer src="\.\/assets\/vendor\/hls\.min\.js\?v=1\.6\.16"><\/script>/);
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

  // Channel sources: bundled lists, read with relative URLs
  assert.match(script, /var DATA = "data\/";/);
  assert.doesNotMatch(script, /PROVINCIAL_NAMES|provincialOnly/, "the empty provincial list is gone");
  const categoryKeys = [...script.matchAll(/\{ key: "(\w+)"/g)].map((m) => m[1]).filter((key) => key !== "fav");
  assert.ok(categoryKeys.length >= 12 && categoryKeys.length <= 16, "a short, tidy category list");
  assert.equal(categoryKeys[0], "fas", "Persian comes first");
  const buildScript = await readFile(new URL("../scripts/build-data.mjs", import.meta.url), "utf8");
  for (const key of categoryKeys) {
    assert.match(buildScript, new RegExp(`^  ${key}: \\[`, "m"), `the data build makes ${key}`);
  }
  for (const key of categoryKeys) {
    await access(new URL(`../public/tv/data/${key}.json`, import.meta.url));
  }
  assert.match(script, /CATEGORY_GROUPS = \{ persian: "فارسی", topic: "موضوع", region: "منطقه" \}/);
  assert.match(script, /"GZT\.tr": \["https:\/\/gzttv-live\.lg\.mncdn\.com\/gzttv-live\/gzttv\/playlist\.m3u8"\]/);
  assert.match(script, /CORS_LOCKED_HOSTS = \["ncdn\.telewebion\.ir"\]/);
  assert.doesNotMatch(script, /api\/streams\.json/, "the 4 MB streams index must not be downloaded");

  // Data usage and quality
  assert.match(script, /AUTO_MAX_HEIGHT = 480/);
  assert.match(script, /quality: "auto"/);
  assert.match(script, /autoLevelCapping/);
  assert.match(script, /hls\.stopLoad\(\)/, "pausing must stop downloading");
  // Data versioning, fetch fallback and a visible error with Retry
  assert.match(script, /DATA \+ "index\.json"/);
  assert.match(script, /cached\.v === index\.v/, "lists cached from another data version are not used");
  assert.match(script, /typeof fetch !== "function"\) return xhrText/);
  assert.match(script, /"فهرست شبکه‌ها باز نشد"/);
  assert.match(script, /console\.warn\("\[mowj\] could not load " \+ url/);
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
  // Category sidebar: headings with their categories, paged instead of scrolled
  assert.match(html, /<nav class="catbar" id="cats"/);
  for (const id of ["catList", "catPager", "catPrev", "catNext", "catPageInfo"]) {
    assert.match(html, new RegExp(`id="${id}"`), `missing #${id}`);
  }
  assert.match(styles, /\.cat-list \{[^}]*overflow: hidden;/);
  assert.match(script, /function paginate\(\)/);
  assert.match(script, /catbar\.step\(target/, "Up/Down walk the sidebar across its pages");
  assert.match(script, /Back from the list or the player goes to the category sidebar/);

  // Dark only, with glass as an enhancement and a lifted focus state
  assert.doesNotMatch(styles, /prefers-color-scheme|data-theme/, "there is no light theme");
  assert.match(styles, /@supports \(\(-webkit-backdrop-filter: blur\(1px\)\) or \(backdrop-filter: blur\(1px\)\)\)/);
  assert.match(styles, /\.row:focus \{[^}]*transform: scale\(/);
  assert.doesNotMatch(styles, /SF Pro|San Francisco/, "no bundled or named Apple fonts");
  assert.match(styles, /@media \(hover: hover\) \{/, "hover hints for TV pointers too");

  // Fully self-hosted: nothing but the video streams comes from another host
  assert.doesNotMatch(html, /https?:\/\//, "the page loads nothing from other hosts");
  assert.doesNotMatch(styles, /https?:\/\//, "fonts are bundled");
  assert.match(styles, /url\("fonts\/Vazirmatn-Regular\.woff2"\)/);
  const external = script.split("\n").filter((line) => /https?:\/\//.test(line) &&
    !/^\s*("[\w.]+": \["https:\/\/[^"]+\.m3u8"\],|\*|\/\/|var (XLINK|SVG_NS) = "http:\/\/www\.w3\.org\/[\w/]+";|var REMOTE_BASE = "https:\/\/iptv-org\.github\.io\/iptv\/";)/.test(line));
  assert.deepEqual(external, [], "only stream fixes and the optional online list source may name another host");
  assert.match(script, /return \/\^logos\\\/\[\\w\.-\]\+\\\.webp\$\/\.test\(url\)/, "only bundled logos are shown");
  await access(new URL("../public/tv/assets/vendor/hls.min.js", import.meta.url));
  await access(new URL("../public/tv/assets/fonts/Vazirmatn-Bold.woff2", import.meta.url));

  // Bundled lists (JSON, which every host serves correctly) hold only
  // browser-playable links and point at logos that exist
  const index = JSON.parse(await readFile(new URL("../public/tv/data/index.json", import.meta.url), "utf8"));
  assert.match(index.v, /^\d{8}-[0-9a-f]{8}$/);
  const fas = JSON.parse(await readFile(new URL("../public/tv/data/fas.json", import.meta.url), "utf8"));
  assert.equal(fas.v, index.v);
  assert.ok(fas.c.length > 100);
  for (const row of fas.c) {
    assert.equal(row.length, 7);
    for (const link of row[6]) assert.match(link, /^https:\/\//);
  }
  assert.doesNotMatch(JSON.stringify(fas), /ncdn\.telewebion\.ir/);
  for (const key of Object.keys(index.lists)) assert.ok(index.lists[key].n <= 1200, `${key} is capped for a TV`);
  const logoFiles = new Set(await readdir(new URL("../public/tv/logos/", import.meta.url)));
  const referenced = fas.c.map((row) => row[2]).filter(Boolean);
  assert.ok(referenced.length > 50, "most Persian channels have a logo");
  for (const file of referenced) assert.ok(logoFiles.has(file), `missing logo ${file}`);

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
  let dataBytes = 0;
  for (const file of await readdir(new URL("../public/tv/data/", import.meta.url))) {
    dataBytes += (await stat(new URL(`../public/tv/data/${file}`, import.meta.url))).size;
  }
  assert.ok(dataBytes < 3000000, "bundled channel lists should stay small");
  assert.ok(styleInfo.size < 40000, "TV stylesheet should stay lightweight");
});

async function loadIdle() {
  const source = await readFile(new URL("../public/tv/assets/idle.js", import.meta.url), "utf8");
  const sandbox = { setTimeout, clearTimeout };
  sandbox.window = sandbox;
  runInNewContext(source, sandbox);
  return sandbox.MowjIdle;
}

// Objects made inside the sandbox have their own prototypes; compare them as plain data.
const plain = (value) => JSON.parse(JSON.stringify(value));

async function loadLists() {
  const source = await readFile(new URL("../public/tv/assets/lists.js", import.meta.url), "utf8");
  const sandbox = { setTimeout, clearTimeout, Promise };
  sandbox.window = sandbox;
  runInNewContext(source, sandbox);
  return sandbox.MowjLists;
}

function fallbackJob(t, overrides) {
  const calls = { remote: 0, local: 0, marked: 0, cancelled: 0 };
  let down = false;
  const job = {
    remote: () => {
      calls.remote += 1;
      return Promise.resolve("online list");
    },
    local: () => {
      calls.local += 1;
      return Promise.resolve("bundled list");
    },
    isUnreachable: () => down,
    markUnreachable: () => {
      calls.marked += 1;
      down = true;
    },
    cancelRemote: () => {
      calls.cancelled += 1;
    },
    timeoutMs: 4500,
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
    ...overrides,
  };
  return { job, calls, setDown: (value) => (down = value) };
}

test("reads a list online first and keeps the bundled copy as the fallback", async (t) => {
  const { loadWithFallback } = await loadLists();
  t.mock.timers.enable({ apis: ["setTimeout"] });

  // 1. The online source answers: no local request at all
  let run = fallbackJob(t);
  assert.deepEqual(plain(await loadWithFallback(run.job)), { source: "remote", value: "online list" });
  assert.equal(run.calls.local, 0);

  // 2. The online source hangs: after 4.5 s the bundled copy is used and the try is remembered
  run = fallbackJob(t, { remote: () => new Promise(() => {}) });
  const pending = loadWithFallback(run.job);
  t.mock.timers.tick(4499);
  await Promise.resolve();
  assert.equal(run.calls.local, 0, "no fallback before the timeout");
  t.mock.timers.tick(1);
  assert.deepEqual(plain(await pending), { source: "local", value: "bundled list" });
  assert.equal(run.calls.cancelled, 1, "the slow download is stopped");
  assert.equal(run.calls.marked, 1);

  // A network error falls back at once as well
  run = fallbackJob(t, { remote: () => Promise.reject(new Error("network")) });
  assert.deepEqual(plain(await loadWithFallback(run.job)), { source: "local", value: "bundled list" });

  // 3. Remembered as unreachable: straight to the bundled copy, no waiting
  run = fallbackJob(t);
  run.setDown(true);
  assert.deepEqual(plain(await loadWithFallback(run.job)), { source: "local", value: "bundled list" });
  assert.equal(run.calls.remote, 0);

  // 4. Both fail: the caller gets the local error (shown with a Retry button)
  run = fallbackJob(t, {
    remote: () => Promise.reject(new Error("network")),
    local: () => Promise.reject(new Error("HTTP 404")),
  });
  await assert.rejects(loadWithFallback(run.job), /HTTP 404/);
});

test("filters and merges playlists the same way online and at build time", async () => {
  const lists = await loadLists();
  const m3u = [
    "#EXTM3U",
    '#EXTINF:-1 tvg-id="One.ir@SD" tvg-logo="https://x/1.png" group-title="News",One (720p) [Geo-blocked]',
    "https://a.example/one.m3u8",
    '#EXTINF:-1 tvg-id="One.ir@HD" group-title="News",One',
    "https://b.example/one-hd.m3u8",
    '#EXTINF:-1 tvg-id="Plain.ir" group-title="News",Plain',
    "http://insecure.example/plain.m3u8",
    '#EXTINF:-1 tvg-id="Head.ir" http-referrer="https://x" group-title="News",Head',
    "https://c.example/head.m3u8",
    '#EXTINF:-1 tvg-id="Locked.ir" group-title="News",Locked',
    "https://ncdn.telewebion.ir/x/live.m3u8",
  ].join("\n");
  const built = lists.buildRows(lists.parseM3u(m3u), {
    corsLockedHosts: ["ncdn.telewebion.ir"],
    logoFor: (base, url) => (url ? lists.logoName(base) : ""),
  });
  assert.equal(built.c.length, 2, "HTTP-only, header-needing and CORS-locked channels are dropped");
  assert.equal(built.hidden, 3);
  assert.deepEqual(plain(built.c[0]), ["One.ir@SD", "One", "One.ir.webp", "news", 720, 1, ["https://a.example/one.m3u8"]]);
  const build = await readFile(new URL("../scripts/build-data.mjs", import.meta.url), "utf8");
  assert.match(build, /runInNewContext\(await readFile\(new URL\("assets\/lists\.js", TV\)/, "the build uses the same parser");
});

test("reads online only the small categories, from the same playlists as the build", async () => {
  const [script, build, html] = await Promise.all([
    readFile(new URL("../public/tv/assets/app.js", import.meta.url), "utf8"),
    readFile(new URL("../scripts/build-data.mjs", import.meta.url), "utf8"),
    readFile(new URL("../public/tv/index.html", import.meta.url), "utf8"),
  ]);
  assert.match(html, /<script defer src="\.\/assets\/lists\.js\?v=\d+"><\/script>[\s\S]*<script defer src="\.\/assets\/app\.js/);
  const remote = script.match(/var REMOTE_SOURCES = \{([\s\S]*?)\n {2}\};/)[1];
  const keys = [...remote.matchAll(/^ {4}(\w+): (\[[^\]]*\])/gm)];
  assert.ok(keys.length >= 4);
  for (const [, key, paths] of keys) {
    assert.ok(!["all", "eur", "amer", "asia", "entertainment"].includes(key), `${key} is too big to read online`);
    const inBuild = build.match(new RegExp(`^  ${key}: (\\[[^\\]]*\\])`, "m"));
    assert.ok(inBuild, `${key} is built too`);
    assert.deepEqual(JSON.parse(paths), JSON.parse(inBuild[1]), `${key} reads the same playlists online and at build time`);
  }
  assert.match(script, /REMOTE_TIMEOUT_MS = 4500/);
  assert.match(script, /REMOTE_DOWN_MS = 24 \* 3600 \* 1000/);
  assert.match(script, /xhr\.timeout = REMOTE_TIMEOUT_MS/, "XHR timeout where AbortController is missing");
});

test("goes fullscreen after 30 idle seconds of playback, never sooner", async (t) => {
  const MowjIdle = await loadIdle();
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const state = { playing: true, fullscreen: false, menu: false };
  let fired = 0;
  const idle = MowjIdle({
    delay: 30000,
    eligible: () => state.playing && !state.fullscreen && !state.menu,
    fire: () => {
      fired += 1;
      state.fullscreen = true;
    },
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
  });

  // A full 30 seconds of no input
  idle.arm();
  t.mock.timers.tick(29999);
  assert.equal(fired, 0);
  t.mock.timers.tick(1);
  assert.equal(fired, 1);

  // Leaving fullscreen starts a fresh period instead of re-entering at once
  state.fullscreen = false;
  idle.arm();
  t.mock.timers.tick(29000);
  assert.equal(fired, 1);

  // Any input restarts the count
  idle.arm();
  t.mock.timers.tick(20000);
  idle.arm();
  t.mock.timers.tick(20000);
  assert.equal(fired, 1);
  t.mock.timers.tick(10000);
  assert.equal(fired, 2);

  // A menu opened meanwhile, a pause, or a failed stream stops it
  state.fullscreen = false;
  idle.arm();
  state.menu = true;
  t.mock.timers.tick(30000);
  assert.equal(fired, 2);
  state.menu = false;
  state.playing = false;
  idle.arm();
  assert.equal(idle.pending(), false, "no timer while nothing is playing");
  state.playing = true;
  idle.arm();
  idle.cancel();
  t.mock.timers.tick(60000);
  assert.equal(fired, 2);
});

test("wires the idle fullscreen to input, playback and visibility", async () => {
  const [script, html] = await Promise.all([
    readFile(new URL("../public/tv/assets/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/tv/index.html", import.meta.url), "utf8"),
  ]);
  assert.match(html, /<script defer src="\.\/assets\/idle\.js\?v=\d+"><\/script>\s*<script defer src="\.\/assets\/app\.js/);
  assert.match(script, /AUTO_FULLSCREEN_MS = 30000/);
  assert.match(script, /fire: function \(\) \{\s*fullscreen\.enter\(\);/, "same path as the fullscreen button");
  assert.match(script, /player\.isPlayingNow\(\) && !fullscreen\.active && !layers\.top\(\)/);
  for (const type of ["keydown", "mousedown", "click", "wheel", "touchstart", "focusin", "mousemove", "pointermove"]) {
    assert.match(script, new RegExp(`"${type}"`), `resets on ${type}`);
  }
  assert.match(script, /\["pause", "ended", "error", "emptied"\]/);
  assert.match(script, /if \(document\.visibilityState === "hidden"\) idle\.cancel\(\);/);
  assert.match(script, /autoFull\.arm\(\); \/\/ a new full idle period/);
});

test("packages a self-contained release with a root redirect", async () => {
  const redirect = await readFile(new URL("../release/index.html", import.meta.url), "utf8");
  assert.match(redirect, /url=tv\//);
  await access(new URL("../release/tv/index.html", import.meta.url));
  await access(new URL("../release/tv/data/fas.json", import.meta.url));
  await access(new URL("../release/tv/assets/vendor/hls.min.js", import.meta.url));
  await access(new URL("../release/tv.zip", import.meta.url));
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

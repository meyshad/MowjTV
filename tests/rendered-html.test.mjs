import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
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

  assert.match(html, /<html lang="fa" dir="rtl">/i);
  assert.match(html, /hls\.js@1\.6\.16\/dist\/hls\.min\.js/);
  assert.match(html, /assets\/app\.js\?v=20260804-2/);
  assert.match(html, /assets\/app\.css\?v=20260804-2/);
  assert.match(html, /id="searchInput"/);
  assert.match(html, /id="qualitySelect"/);
  assert.match(html, /id="fullscreenButton"/);
  assert.match(html, /id="previousChannelButton"/);
  assert.match(html, /id="nextChannelButton"/);
  assert.match(
    html,
    /id="previousChannelButton"[\s\S]*?id="playButton"[\s\S]*?id="nextChannelButton"/,
  );
  assert.match(html, /caret-up-fill\.svg/);
  assert.match(html, /caret-down-fill\.svg/);
  assert.match(html, /id="persianDate"/);
  assert.match(html, /id="persianWeekday"/);
  assert.match(html, /id="persianDay"/);
  assert.match(html, /id="sleepButton"/);
  assert.match(html, /id="sourceButton"/);
  assert.match(html, /id="sourceModal"/);
  assert.match(html, /data-source="all"/);
  assert.match(html, /data-source="tr"/);
  assert.match(html, /data-source="movies"/);
  assert.match(html, /data-source="provinces"/);
  assert.match(html, /همه شبکه‌ها/);
  assert.match(html, /شبکه‌های ترکیه/);
  assert.match(html, /فیلم و سینما/);
  assert.doesNotMatch(html, /شبکه‌های سراسری ایران/);
  assert.equal((html.match(/class="source-option focusable"/g) || []).length, 10);
  assert.match(html, /id="prevPageButton"/);
  assert.match(html, /id="nextPageButton"/);
  assert.match(html, /id="healthCheckButton"/);
  assert.match(html, /id="healthSummary"/);
  assert.match(html, /id="initialScanModal"/);
  assert.match(html, /id="initialScanKicker"/);
  assert.match(html, /id="initialScanNote"/);
  assert.match(html, /id="initialScanProgress"/);
  assert.match(html, /role="progressbar"/);
  assert.match(html, /id="skipInitialScanButton"/);
  assert.match(html, /id="finishInitialScanButton"/);
  assert.match(html, /این پرسش فقط برای انتخاب[\s\S]*?دستهٔ پیش‌فرض ورود است/);
  assert.match(html, /id="volumeUpButton"/);
  assert.match(html, /id="volumeDownButton"/);
  assert.match(html, /id="volumeRange"[\s\S]*?value="100"/);
  assert.match(html, /id="volumeValue"/);
  assert.match(html, /<\/div>\s*<div class="controls" id="controls"/);
  assert.doesNotMatch(html, /<video[^>]+\scontrols(?:\s|>)/i);
  assert.doesNotMatch(html, /سرویس اختصاصی/);
  assert.doesNotMatch(html, /class="service-label"/);
  assert.doesNotMatch(html, /id="filterTabs"/);
  assert.doesNotMatch(html, /data-filter="(?:all|favorites|recent)"/);
  assert.match(html, /bootstrap-icons@1\.13\.1\/icons\/star\.svg/);
  assert.match(html, /bootstrap-icons@1\.13\.1\/icons\/arrow-clockwise\.svg/);
  assert.match(html, /id="prevPageButton"[\s\S]*?‹[\s\S]*?قبلی/);
  assert.match(html, /id="nextPageButton"[\s\S]*?بعدی[\s\S]*?›/);
  assert.doesNotMatch(html, /چه چیزی ببینیم/);
  assert.doesNotMatch(html, /داده‌ها:\s*IPTV-ORG/);
  assert.doesNotMatch(html, /چند شبکهٔ ابتدایی/);

  assert.match(script, /countries\/ir\.m3u/);
  assert.match(script, /iptv\/index\.m3u/);
  assert.match(script, /countries\/tr\.m3u/);
  assert.match(script, /categories\/movies\.m3u/);
  assert.match(script, /languages\/fas\.m3u/);
  assert.match(script, /api\/streams\.json/);
  assert.match(script, /autoLevelCapping/);
  assert.match(script, /level\.height <= 480/);
  assert.match(script, /keyCode === 10009/);
  assert.match(script, /history\.pushState/);
  assert.match(script, /previousChannelButton:\s*byId\("previousChannelButton"\)/);
  assert.match(script, /nextChannelButton:\s*byId\("nextChannelButton"\)/);
  assert.match(
    script,
    /previousChannelButton\.addEventListener\("click"[\s\S]*?switchChannel\(-1\)/,
  );
  assert.match(
    script,
    /nextChannelButton\.addEventListener\("click"[\s\S]*?switchChannel\(1\)/,
  );
  assert.match(
    script,
    /function switchChannel\(direction\)[\s\S]*?nextIndex < 0[\s\S]*?state\.filtered\.length - 1[\s\S]*?nextIndex >= state\.filtered\.length[\s\S]*?nextIndex = 0[\s\S]*?playChannel\(channel\)/,
  );
  assert.match(
    script,
    /function exitFullscreen\(fromHistory\)[\s\S]*?clearTimeout\(state\.controlsTimer\)[\s\S]*?classList\.remove\("controls-hidden"\)/,
  );
  assert.match(
    script,
    /function showControlsTemporarily\(\)[\s\S]*?clearTimeout\(state\.controlsTimer\)[\s\S]*?!state\.fullActive[\s\S]*?ui\.playerShell\.focus\(\)[\s\S]*?classList\.add\("controls-hidden"\)[\s\S]*?4200/,
  );
  assert.match(
    script,
    /full && keyCode === 427[\s\S]*?switchChannel\(-1\)[\s\S]*?full && keyCode === 428[\s\S]*?switchChannel\(1\)[\s\S]*?isTextControl\(event\.target\)/,
  );
  assert.match(
    script,
    /function updateFullscreenControls\(active\)[\s\S]*?setHidden\(ui\.previousChannelButton, !active\)[\s\S]*?setHidden\(ui\.nextChannelButton, !active\)/,
  );
  assert.match(script, /localStorage/);
  assert.match(script, /PROVINCIAL_NAMES/);
  assert.match(script, /"KaroonTV\.ir"/);
  assert.match(script, /function changePage/);
  assert.match(script, /alternativesLoaded/);
  assert.match(script, /function startHealthScan/);
  assert.match(script, /function fetchHealthManifest/);
  assert.match(script, /channel\.healthStatus === "confirmed"/);
  assert.match(script, /state\.healthScanning \? state\.healthAvailable/);
  assert.match(script, /state\.healthAvailable \+= 1/);
  assert.match(script, /HEALTH_WORKERS = 2/);
  assert.doesNotMatch(script, /scanPageOnly/);
  assert.match(script, /requestTimeout:\s*40000/);
  assert.match(script, /state\.filtered\.slice\(pageStart, pageStart \+ state\.pageSize\)/);
  assert.match(script, /credentials: "omit"/);
  assert.match(script, /HEALTH_PREFIX/);
  assert.match(script, /setLocalCacheItem\([\s\S]*HEALTH_PREFIX/);
  assert.match(script, /" نیاز به تست"/);
  assert.doesNotMatch(script, /scheduleHealthScan/);
  assert.doesNotMatch(script, /healthTtl/);
  assert.match(script, /defaultSource:\s*"all"/);
  assert.match(script, /onboardingVersion:\s*0/);
  assert.match(script, /initialScanDone:\s*false/);
  assert.match(script, /sourceScanState:\s*\{\}/);
  assert.match(script, /volume:\s*1/);
  assert.match(script, /function syncVolumeControls/);
  assert.match(script, /function adjustVolume/);
  assert.match(script, /HEALTH_FULL_SCAN_LIMIT = 300/);
  assert.match(script, /HEALTH_SAMPLE_SIZE = 40/);
  assert.match(script, /HEALTH_SAMPLE_BUDGET = 120000/);
  assert.match(script, /HEALTH_FULL_BUDGET = 180000/);
  assert.match(script, /function buildHealthScanPool/);
  assert.match(script, /return state\.channels\.slice\(\)/);
  assert.match(script, /var untested = state\.filtered\.filter/);
  assert.match(script, /Math\.random\(\)/);
  assert.match(script, /function showLargeScanSkipped/);
  assert.match(script, /function continueInitialHealthScan/);
  assert.match(script, /completeInitialScan\(true\)/);
  assert.match(script, /state\.healthTotal = scanPool\.length/);
  assert.match(script, /state\.healthScanCoversAll \? "done" : "sampled"/);
  assert.doesNotMatch(script, /state\.filtered\.slice\(0,\s*12\)/);
  assert.match(script, /startHealthScan\(false, "onboarding"\)/);
  assert.match(script, /function stopPlaybackForHealthScan/);
  assert.match(script, /function startManualHealthScan/);
  assert.match(
    script,
    /function startManualHealthScan\(\)[\s\S]*navigator\.onLine === false[\s\S]*!state\.channels\.length[\s\S]*stopPlaybackForHealthScan\(\)/,
  );
  assert.match(script, /function startCategoryHealthScan/);
  assert.match(
    script,
    /function startCategoryHealthScan\(sourceKey\)[\s\S]*setSourceScanState\("automatic"\)[\s\S]*scheduleAutoHealthScan\(5000\)/,
  );
  assert.match(script, /state\.playbackToken \+= 1;\s*cleanupMedia\(\)/);
  assert.match(
    script,
    /prepareInitialScanModal\("manual-modal"\);\s*startHealthScan\(true, "manual-modal"\)/,
  );
  assert.doesNotMatch(
    script,
    /function startCategoryHealthScan\(sourceKey\)[\s\S]{0,900}stopPlaybackForHealthScan\(\)/,
  );
  assert.match(script, /prefs\.sourceScanState\[state\.activeSource\] = status/);
  assert.match(script, /loadPlaylist\(sourceKey, false\)\.then/);
  assert.match(script, /HEALTH_CACHE_LIMIT = 600/);
  assert.match(script, /CACHE_DB_NAME = "mowj-tv-cache-v2"/);
  assert.match(script, /CACHE_DB_LIMIT = 6/);
  assert.match(script, /CACHE_DB_TEXT_LIMIT = 12000000/);
  assert.match(script, /LOCAL_PLAYLIST_CACHE_LIMIT = 600000/);
  assert.match(script, /function openCacheDatabase/);
  assert.match(script, /window\.indexedDB\.open/);
  assert.match(script, /function writePlaylistDatabase/);
  assert.match(script, /function readPlaylistDatabase/);
  assert.match(script, /function prunePlaylistDatabase/);
  assert.match(script, /function evictOldestPlaylistDatabase/);
  assert.match(script, /attemptWrite\(true\)/);
  assert.match(script, /function evictOldestLocalCache/);
  assert.match(script, /function requestPersistentStorage/);
  assert.match(script, /cachePlaylist\(sourceKey, text, channels\)/);
  assert.doesNotMatch(script, /if \(channels\.length > 900\) return/);
  assert.match(script, /AUTO_SCAN_INTERVAL = 15000/);
  assert.match(script, /AUTO_SCAN_SESSION_LIMIT = 40/);
  assert.match(script, /AUTO_SCAN_TIMEOUT = 4000/);
  assert.match(script, /function getBufferedAhead/);
  assert.match(script, /function connectionAllowsAutoHealth/);
  assert.match(script, /navigator\.connection/);
  assert.match(script, /connection\.saveData/);
  assert.match(script, /function getAutoHealthSessionLimit/);
  assert.match(script, /function getAutoHealthInterval/);
  assert.match(script, /function canRunAutoHealthScan/);
  assert.match(script, /getBufferedAhead\(\) < 10/);
  assert.match(script, /function scheduleAutoHealthScan/);
  assert.match(script, /function stopAutoHealthScan/);
  assert.match(script, /function runAutoHealthScan/);
  assert.match(script, /function probeChannelHealth\(channel, automatic, scanToken\)/);
  assert.match(script, /status: "cancelled"/);
  assert.match(script, /state\.autoHealthControllers/);
  assert.match(script, /document\.addEventListener\("visibilitychange"/);
  assert.match(script, /function scheduleAutoReconnect/);
  assert.match(script, /function cancelPlaybackRecovery/);
  assert.match(script, /mediaAttemptToken/);
  assert.match(script, /errorName === "NotAllowedError"/);
  assert.match(script, /errorName === "AbortError"/);
  assert.match(script, /AUTO_RETRY_DELAYS/);
  assert.match(script, /PLAYBACK_START_TIMEOUT = 15000/);
  assert.match(script, /function schedulePlaybackWatchdog/);
  assert.match(script, /function handlePlaybackStall/);
  assert.match(script, /function lowerAutomaticQuality/);
  assert.match(script, /state\.autoQualityCeiling > 360/);
  assert.match(script, /state\.autoQualityCeiling > 240/);
  assert.match(script, /addEventListener\("stalled"/);
  assert.match(script, /addEventListener\("timeupdate"/);
  assert.match(script, /addEventListener\("ended"/);
  assert.match(script, /addEventListener\("seeking"/);
  assert.match(script, /state\.userPaused = true/);
  assert.doesNotMatch(script, /speedtest/i);
  assert.match(
    script,
    /innerHeight >= 900[\s\S]*?rows: 5, size: 10/,
  );
  assert.match(
    script,
    /innerHeight < 700[\s\S]*?rows: 3, size: 6/,
  );
  assert.match(script, /return \{ columns: 2, rows: 4, size: 8 \}/);
  assert.match(script, /state\.gridRows === 5[\s\S]*?classList\.add\("grid-tall"\)/);
  assert.match(script, /state\.gridRows === 3[\s\S]*?classList\.add\("grid-compact"\)/);
  assert.match(script, /var favoriteOrder = Object\.create\(null\)/);
  assert.match(
    script,
    /aFavoriteOrder = favoriteOrder\[a\.id\][\s\S]*?bFavoriteOrder = favoriteOrder\[b\.id\][\s\S]*?if \(!aFavoriteOrder\) return 1;[\s\S]*?if \(!bFavoriteOrder\) return -1;[\s\S]*?var healthDifference/,
  );
  assert.match(
    script,
    /function toggleFavorite\(\)[\s\S]*?state\.pageIndex = 0;\s*applyFilters\(false\)/,
  );
  assert.match(
    script,
    /function onChannelKeydown\(event\)[\s\S]*?nextIndex < 0[\s\S]*?ui\.searchInput\.focus\(\)/,
  );
  assert.doesNotMatch(script, /\bfilterTabs\b|\bactiveFilter\b|function isRecent\b/);
  assert.match(script, /star-fill\.svg/);
  assert.doesNotMatch(script, /method:\s*"HEAD"/);
  assert.doesNotMatch(script, /mode:\s*"no-cors"/);
  assert.doesNotMatch(script, /scrollIntoView/);
  assert.doesNotMatch(script, /تمام[^\n]*فهرست جهانی[^\n]*سنجیده/);
  assert.doesNotMatch(script, /\?\.|\?\?|=>/);

  assert.match(styles, /\.player-shell\.is-fullscreen/);
  assert.match(styles, /outline:\s*3px solid var\(--focus\)/);
  assert.match(styles, /@media \(min-width: 1700px\)/);
  assert.match(styles, /\.channel-list\.grid-3/);
  assert.match(
    styles,
    /\.channel-list\.grid-2\s*\{[^}]*grid-template-rows:\s*repeat\(4,/,
  );
  assert.match(
    styles,
    /\.channel-list\.grid-compact\s*\{[^}]*grid-template-rows:\s*repeat\(3,/,
  );
  assert.match(
    styles,
    /\.channel-list\.grid-tall\s*\{[^}]*grid-template-rows:\s*repeat\(5,/,
  );
  assert.doesNotMatch(styles, /\.filter-tabs\b|\.filter-tab\b|\.service-label\b/);
  assert.match(styles, /\.player-shell:fullscreen \.player-shade/);
  assert.match(styles, /display:\s*none/);
  assert.match(
    styles,
    /\.player-shell\.is-fullscreen \.controls,[\s\S]{0,700}?position:\s*absolute;[\s\S]{0,300}?bottom:\s*24px;/,
  );
  assert.match(
    styles,
    /\.player-shell\.is-fullscreen\.controls-hidden \.controls,[\s\S]{0,500}?opacity:\s*0;[\s\S]{0,200}?pointer-events:\s*none;/,
  );
  assert.match(styles, /\.player-shell:-webkit-full-screen \.controls/);
  assert.match(styles, /\.pagination/);
  assert.match(styles, /\.placeholder-play::before/);
  assert.match(styles, /\.channel-card\.is-health-failed/);
  assert.match(styles, /\.controls\s*\{[^}]*position:\s*relative/);
  assert.match(styles, /\.volume-control/);
  assert.match(styles, /\.volume-control > \.volume-range\s*\{[^}]*margin-right:\s*8px/);
  assert.match(styles, /\.volume-range:focus\s*\{[^}]*outline:\s*0;[^}]*box-shadow:\s*none/);
  assert.match(styles, /\.volume-range::-webkit-slider-thumb\s*\{[^}]*box-shadow:\s*none/);
  assert.match(styles, /\.scan-progress/);
  assert.doesNotMatch(
    styles,
    /\.player-shell\.controls-hidden \.controls\s*\{/,
  );
  assert.match(styles, /\.brand\s*\{[^}]*grid-row:\s*1/);
  assert.match(styles, /\.date-clock\s*\{[^}]*grid-row:\s*1/);
  assert.match(styles, /\.header-actions\s*\{[^}]*grid-row:\s*1/);
  assert.ok(scriptInfo.size < 155000, "TV JavaScript should stay lightweight");
  assert.ok(styleInfo.size < 45000, "TV stylesheet should stay lightweight");
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
  assert.match(notices, /Bootstrap Icons 1\.13\.1/);
  assert.match(security, /Report a vulnerability/);
  assert.equal(JSON.parse(packageJson).license, "MIT");
});

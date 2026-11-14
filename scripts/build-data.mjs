#!/usr/bin/env node
/*
 * Builds the channel data that ships with Mowj TV, so the app reads nothing
 * from third-party hosts at runtime (only the video streams themselves).
 *
 *   public/tv/data/<category>.json  browser-playable channels of each category
 *   public/tv/data/index.json       data version and list sizes
 *   public/tv/logos/<channel>-<hash>.webp   64px logos of 1-2 KB
 *   scripts/logo-sources.json       which original logo each file came from
 *
 * Channels a browser on an HTTPS page can never play are dropped here:
 * HTTP-only links, links that need a custom Referer/User-Agent, DASH, and
 * hosts that only allow their own website (CORS). The number dropped is kept
 * in the playlist header so the app can explain an empty list.
 *
 * Logos are shrunk through the wsrv.nl image service; i.imgur.com refuses
 * many networks, including wsrv's, so those go through DuckDuckGo's image
 * proxy first. Only logos whose source changed, or that failed last time, are
 * fetched again.
 *
 * usage: node scripts/build-data.mjs [--no-logos] [--force-logos]
 *   --no-logos: fetch no new logos (unused ones are still removed)
 */
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";

const IPTV = "https://iptv-org.github.io/iptv/";
const TV = new URL("../public/tv/", import.meta.url);
const DATA_DIR = new URL("data/", TV);
const DATA_FORMAT = 2; // bump when the JSON layout changes
const LOGO_DIR = new URL("logos/", TV);
const LOGO_STATE = new URL("logo-sources.json", import.meta.url);
const LOGO_SIZE = 64;
const LOGO_CONCURRENCY = 3;
const LOGO_PAUSE_MS = 250;      // between requests of one worker: the image services block fast clients
const LOGO_MAX_PER_RUN = 1500;  // the weekly run fills in the rest gradually

// Category key (as used by the app) -> IPTV-ORG playlists. Order sets logo priority.
const SOURCES = {
  // Persian
  fas: ["languages/fas", "countries/af", "countries/tj"],
  // Topics: thin IPTV-ORG categories are folded into broader ones
  news: ["categories/news", "categories/business", "categories/legislative"],
  sports: ["categories/sports"],
  music: ["categories/music"],
  movies: ["categories/movies", "categories/series"],
  kids: ["categories/kids", "categories/animation"],
  documentary: ["categories/documentary", "categories/science", "categories/education"],
  entertainment: [
    "categories/entertainment", "categories/comedy", "categories/lifestyle", "categories/cooking",
    "categories/travel", "categories/outdoor", "categories/auto", "categories/classic", "categories/culture",
  ],
  // Regions
  tr: ["countries/tr"],
  mideast: ["regions/mideast", "regions/arab"],
  eur: ["regions/eur"],
  asia: ["regions/eas", "regions/sea", "regions/sas", "regions/cas"],
  amer: ["regions/noram", "regions/latam"],
  other: ["regions/afr", "regions/oce", "regions/cis"],
  all: ["index"],
};

// A TV list is browsed page by page; past this size it stops being useful.
// Bigger lists keep the channels most likely to work (24/7, not geo-blocked,
// with a logo) and are otherwise in playlist (alphabetical) order.
const MAX_CHANNELS = 1200;

const args = process.argv.slice(2);
const withLogos = !args.includes("--no-logos");
const forceLogos = args.includes("--force-logos");

const app = await readFile(new URL("assets/app.js", TV), "utf8");
// Same list as the app, read from it so the two never disagree.
const CORS_LOCKED_HOSTS = JSON.parse(app.match(/CORS_LOCKED_HOSTS = (\[[^\]]*\])/)[1]);

function playable(url, ref, ua) {
  if (!/^https:\/\//i.test(url)) return false; // HTTP is blocked on an HTTPS page
  if (ref || ua) return false; // browsers cannot send these headers
  if (/\.mpd(?:$|[?#])/i.test(url)) return false; // DASH is not supported
  const host = (url.split("/")[2] || "").toLowerCase();
  return !CORS_LOCKED_HOSTS.includes(host);
}

function attr(line, name) {
  const match = line.match(new RegExp(`${name}="([^"]*)"`));
  return match ? match[1] : "";
}

function parse(text) {
  const entries = [];
  let cur = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#EXTINF")) {
      const comma = line.lastIndexOf(",");
      cur = {
        id: attr(line, "tvg-id"),
        logo: attr(line, "tvg-logo"),
        group: attr(line, "group-title"),
        title: comma >= 0 ? line.slice(comma + 1).trim() : "",
        ref: attr(line, "http-referrer"),
        ua: attr(line, "http-user-agent"),
      };
      continue;
    }
    if (!cur) continue;
    if (line.startsWith("#EXTVLCOPT:http-referrer=")) cur.ref = line.slice(line.indexOf("=") + 1);
    else if (line.startsWith("#EXTVLCOPT:http-user-agent=")) cur.ua = line.slice(line.indexOf("=") + 1);
    else if (!line.startsWith("#")) {
      entries.push({ ...cur, url: line });
      cur = null;
    }
  }
  return entries;
}

const channelKey = (e) => e.id || `n:${e.title.toLowerCase()}`;
const baseId = (id) => id.split("@")[0];
const clean = (value) => String(value).replace(/["\r\n]/g, "").trim();
const logoFile = (base, url) =>
  `${base.replace(/[^A-Za-z0-9._-]/g, "_")}-${createHash("sha1").update(url).digest("hex").slice(0, 6)}.webp`;

async function getText(url) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      if (attempt >= 3) throw new Error(`${url}: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 3000 * attempt));
    }
  }
}

function wsrv(url) {
  const params = new URLSearchParams({
    url,
    w: String(LOGO_SIZE),
    h: String(LOGO_SIZE),
    fit: "inside",
    we: "", // never enlarge small logos
    output: "webp",
    q: "80",
  });
  return `https://wsrv.nl/?${params}`;
}

const viaDuckDuckGo = (url) => `https://external-content.duckduckgo.com/iu/?u=${encodeURIComponent(url)}`;

async function fetchImage(url) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (response.status === 429) {
        await new Promise((resolve) => setTimeout(resolve, 5000 * attempt));
        continue;
      }
      const type = response.headers.get("content-type") || "";
      if (!response.ok || !type.startsWith("image/")) return null;
      const bytes = Buffer.from(await response.arrayBuffer());
      return bytes.length > 64 ? bytes : null;
    } catch {
      if (attempt === 3) return null;
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

async function buildLogos(logoWanted) {
  await mkdir(LOGO_DIR, { recursive: true });
  let state = {};
  try {
    state = JSON.parse(await readFile(LOGO_STATE, "utf8"));
  } catch {
    state = {};
  }
  const existing = new Set(await readdir(LOGO_DIR));
  const jobs = [];
  for (const [base, url] of logoWanted) {
    const file = logoFile(base, url);
    if (!forceLogos && state[base] && state[base].file === file && existing.has(file)) continue;
    jobs.push({ base, url, file });
  }
  // New logos first, then earlier failures; at most LOGO_MAX_PER_RUN per run.
  jobs.sort((a, b) => Number(Boolean(state[a.base] && state[a.base].failed)) - Number(Boolean(state[b.base] && state[b.base].failed)));
  const pending = jobs.length;
  jobs.splice(withLogos ? LOGO_MAX_PER_RUN : 0); // --no-logos: only drop logos nobody uses
  console.log(`logos: ${logoWanted.size} wanted, ${pending} missing, fetching ${jobs.length} this run`);

  let done = 0;
  const imgur = (url) => /(^|\.)imgur\.com\//i.test(url.replace(/^https?:\/\//, ""));
  async function worker() {
    while (jobs.length) {
      const job = jobs.shift();
      const first = imgur(job.url) ? viaDuckDuckGo(job.url) : job.url;
      const second = imgur(job.url) ? job.url : viaDuckDuckGo(job.url);
      const image = (await fetchImage(wsrv(first))) || (await fetchImage(wsrv(second)));
      if (image) {
        await writeFile(new URL(job.file, LOGO_DIR), image);
        state[job.base] = { url: job.url, file: job.file };
      } else {
        state[job.base] = { url: job.url, failed: true };
      }
      done += 1;
      if (done % 250 === 0) console.log(`  ${done} logos processed`);
      await new Promise((resolve) => setTimeout(resolve, LOGO_PAUSE_MS));
    }
  }
  await Promise.all(Array.from({ length: LOGO_CONCURRENCY }, worker));

  for (const base of Object.keys(state)) {
    if (!logoWanted.has(base)) delete state[base];
  }
  const keep = new Set(Object.values(state).filter((s) => s.file).map((s) => s.file));
  for (const file of await readdir(LOGO_DIR)) {
    if (!keep.has(file)) await unlink(new URL(file, LOGO_DIR));
  }
  const sorted = Object.fromEntries(Object.keys(state).sort().map((base) => [base, state[base]]));
  await writeFile(LOGO_STATE, `${JSON.stringify(sorted, null, 1)}\n`);
  const failed = Object.values(state).filter((s) => s.failed).length;
  console.log(`logos: ${keep.size} available, ${failed} could not be fetched`);
  return state;
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true });
  const categories = {};
  const logoWanted = new Map();
  const text = {};

  for (const [key, paths] of Object.entries(SOURCES)) {
    const entries = [];
    for (const path of paths) {
      text[path] = text[path] || (await getText(`${IPTV}${path}.m3u`));
      entries.push(...parse(text[path]));
    }
    const channels = new Map();
    for (const entry of entries) {
      const ck = channelKey(entry);
      if (!channels.has(ck)) channels.set(ck, { head: entry, urls: [] });
      const channel = channels.get(ck);
      if (!channel.head.logo && entry.logo) channel.head.logo = entry.logo;
      if (playable(entry.url, entry.ref, entry.ua) && !channel.urls.some((u) => u.url === entry.url)) {
        channel.urls.push(entry);
      }
    }
    let kept = [...channels.values()].filter((c) => c.urls.length);
    const playableCount = kept.length;
    if (kept.length > MAX_CHANNELS) {
      const score = (c) => (/\[Geo-blocked\]/i.test(c.head.title) ? 0 : 4) +
        (/\[Not 24\/7\]/i.test(c.head.title) ? 0 : 2) + (c.head.logo ? 1 : 0);
      const order = new Map(kept.map((c, i) => [c, i]));
      const best = new Set([...kept].sort((a, b) => score(b) - score(a) || order.get(a) - order.get(b)).slice(0, MAX_CHANNELS));
      kept = kept.filter((c) => best.has(c));
    }
    for (const channel of kept) {
      const base = baseId(channel.head.id);
      if (base && /^https:\/\//i.test(channel.head.logo) && !logoWanted.has(base)) logoWanted.set(base, channel.head.logo);
    }
    categories[key] = { kept, hidden: channels.size - playableCount, playable: playableCount };
  }

  const logos = await buildLogos(logoWanted);

  // Compact JSON (any static host serves .json correctly, unlike .m3u):
  // [id, name, logo file, group, height, flags (1 geo-blocked, 2 not 24/7), [urls]]
  const lists = {};
  const bodies = {};
  for (const [key, { kept, hidden, playable: playableCount }] of Object.entries(categories)) {
    const rows = kept.map((channel) => {
      const base = baseId(channel.head.id);
      const title = channel.head.title || channel.urls[0].title || "";
      const quality = (title.match(/\((\d{3,4})[pi]\)/i) || [])[1];
      const flags = (/\[Geo-blocked\]/i.test(title) ? 1 : 0) | (/\[Not 24\/7\]/i.test(title) ? 2 : 0);
      const name = title.replace(/\s*\(\d{3,4}[pi]\)/gi, "").replace(/\s*\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim();
      return [
        clean(channel.head.id),
        clean(name),
        base && logos[base] && logos[base].file ? logos[base].file : "",
        clean(channel.head.group.split(";")[0]).toLowerCase(),
        quality ? Number(quality) : 0,
        flags,
        channel.urls.map((entry) => entry.url),
      ];
    });
    bodies[key] = { hidden, playable: playableCount, c: rows };
    console.log(`${key.padEnd(14)} ${String(rows.length).padStart(5)} channels (${playableCount} playable, ${hidden} hidden)`);
  }
  const version = `${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${createHash("sha1")
    .update(JSON.stringify(bodies)).digest("hex").slice(0, 8)}`;
  const written = new Set(["index.json"]);
  for (const [key, body] of Object.entries(bodies)) {
    const json = JSON.stringify({ format: DATA_FORMAT, v: version, ...body });
    await writeFile(new URL(`${key}.json`, DATA_DIR), `${json}\n`);
    written.add(`${key}.json`);
    lists[key] = { n: body.c.length, kb: Math.round(json.length / 1024) };
  }
  // Read first by the app (a few hundred bytes): when "v" changes, cached lists are dropped.
  await writeFile(new URL("index.json", DATA_DIR), `${JSON.stringify({ format: DATA_FORMAT, v: version, lists })}\n`);
  for (const file of await readdir(DATA_DIR)) {
    if (!written.has(file)) await unlink(new URL(file, DATA_DIR));
  }
  console.log(`data version ${version}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

/* Mowj TV — lightweight, remote-friendly live TV for TV browsers.
 * Plain ES5 on purpose: older Samsung/LG TV engines do not understand
 * arrow functions, optional catch bindings or optional chaining. */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ *
   * Configuration
   * ------------------------------------------------------------------ */

  var IPTV = "https://iptv-org.github.io/iptv/";

  /* Three short groups so the chip row stays easy to walk with a remote:
   * Persian first, then topics, then regions. "note" marks the big downloads
   * (IPTV-ORG serves the playlists uncompressed). */
  var CATEGORY_GROUPS = { topic: "موضوع", region: "منطقه" };

  var CATEGORIES = [
    { key: "fav", title: "محبوب‌ها", favorites: true },
    { key: "fas", title: "فارسی", url: IPTV + "languages/fas.m3u" },
    { key: "provinces", title: "استانی", url: IPTV + "countries/ir.m3u", provincialOnly: true },
    { key: "news", group: "topic", title: "خبری", url: IPTV + "categories/news.m3u" },
    { key: "sports", group: "topic", title: "ورزشی", url: IPTV + "categories/sports.m3u" },
    { key: "music", group: "topic", title: "موسیقی", url: IPTV + "categories/music.m3u" },
    { key: "documentary", group: "topic", title: "مستند", url: IPTV + "categories/documentary.m3u" },
    { key: "kids", group: "topic", title: "کودک", url: IPTV + "categories/kids.m3u" },
    {
      key: "movies", group: "topic", title: "فیلم و سریال", cacheKey: "movies+series",
      urls: [IPTV + "categories/movies.m3u", IPTV + "categories/series.m3u"],
    },
    { key: "tr", group: "region", title: "ترکیه", url: IPTV + "countries/tr.m3u" },
    { key: "mideast", group: "region", title: "خاورمیانه", url: IPTV + "regions/mideast.m3u" },
    { key: "eas", group: "region", title: "آسیای شرقی", url: IPTV + "regions/eas.m3u" },
    { key: "eur", group: "region", title: "اروپا", url: IPTV + "regions/eur.m3u", note: "۱MB", timeout: 60000 },
    { key: "amer", group: "region", title: "آمریکا", url: IPTV + "regions/amer.m3u", note: "۰٫۹MB", timeout: 60000 },
    { key: "all", group: "region", title: "همه", url: IPTV + "index.m3u", note: "۲٫۶MB", timeout: 60000 },
  ];

  var PROVINCIAL_NAMES = {
    "AbadanTV.ir": "شبکه آبادان",
    "AflakTV.ir": "شبکه افلاک · لرستان",
    "AftabTV.ir": "شبکه آفتاب · مرکزی",
    "AlborzTV.ir": "شبکه البرز",
    "AtrakTV.ir": "شبکه اترک · خراسان شمالی",
    "WestAzerbaijanTV.ir": "شبکه آذربایجان غربی",
    "BaranTV.ir": "شبکه باران · گیلان",
    "BoushehrTV.ir": "شبکه بوشهر",
    "DenaTV.ir": "شبکه دنا · کهگیلویه و بویراحمد",
    "EshraghNetwork.ir": "شبکه اشراق · زنجان",
    "FarsTV.ir": "شبکه فارس",
    "HamedanTV.ir": "شبکه همدان",
    "HamoonTV.ir": "شبکه هامون · سیستان و بلوچستان",
    "IlamTV.ir": "شبکه ایلام",
    "IsfahanTV.ir": "شبکه اصفهان",
    "JahanbinTV.ir": "شبکه جهان‌بین · چهارمحال و بختیاری",
    "KermanTV.ir": "شبکه کرمان",
    "KhalijeFarsTV.ir": "شبکه خلیج فارس · هرمزگان",
    "KaroonTV.ir": "شبکه کارون · خوزستان (محلی)",
    "KhavaranTV.ir": "شبکه خاوران · خراسان جنوبی",
    "KhorasanRazaviTV.ir": "شبکه خراسان رضوی",
    "KhozestanTV.ir": "شبکه خوزستان",
    "KishTV.ir": "شبکه کیش",
    "KordestanTV.ir": "شبکه کردستان",
    "MahabadTV.ir": "شبکه مهاباد",
    "NoorTV.ir": "شبکه نور · قم",
    "QazvinTV.ir": "شبکه قزوین",
    "SabalanTV.ir": "شبکه سبلان · اردبیل",
    "SabzTV.ir": "شبکه سبز · گلستان",
    "SahandTV.ir": "شبکه سهند · آذربایجان شرقی",
    "SemnanTV.ir": "شبکه سمنان",
    "TabarestanTV.ir": "شبکه تبرستان · مازندران",
    "TehranTV.ir": "شبکه تهران",
    "YazdTV.ir": "شبکه تابان · یزد",
    "ZagrosTV.ir": "شبکه زاگرس · کرمانشاه",
  };

  /* Upstream playlist URLs that have moved. Each replacement was taken from
   * the broadcaster's own live page and verified to answer with CORS. The
   * playlist URL stays as a fallback in case the fix itself goes stale. */
  var STREAM_FIXES = {
    "GZT.tr": ["https://gzttv-live.lg.mncdn.com/gzttv-live/gzttv/playlist.m3u8"],
    "TVNET.tr": ["https://tvnet-live.lg.mncdn.com/tvnet-live/tvnet/playlist.m3u8"],
  };

  /* Hosts that only allow their own website to read the stream (CORS locked to
   * one origin). No static site can play them, so they are hidden like HTTP links.
   * ncdn.telewebion.ir answers with "Access-Control-Allow-Origin: https://telewebion.ir". */
  var CORS_LOCKED_HOSTS = ["ncdn.telewebion.ir"];

  var GROUPS = {
    animation: "انیمیشن", auto: "خودرو", business: "اقتصادی", classic: "کلاسیک",
    comedy: "کمدی", cooking: "آشپزی", culture: "فرهنگی", documentary: "مستند",
    education: "آموزشی", entertainment: "سرگرمی", family: "خانواده", general: "عمومی",
    kids: "کودک", legislative: "پارلمانی", lifestyle: "سبک زندگی", movies: "فیلم",
    music: "موسیقی", news: "خبری", outdoor: "طبیعت", public: "عمومی", relax: "آرامش",
    religious: "مذهبی", science: "علمی", series: "سریال", shop: "خرید", sports: "ورزشی",
    travel: "گردشگری", weather: "هواشناسی",
  };

  var PREFS_KEY = "mowj-tv-prefs-v2";
  var STATUS_KEY = "mowj-tv-status-v2";
  var LIST_FRESH_MS = 12 * 3600 * 1000;      // reuse a cached playlist for 12h without any network
  var STATUS_OK_TTL = 12 * 3600 * 1000;
  var STATUS_BAD_TTL = 3 * 3600 * 1000;
  var STATUS_UNREACHABLE_TTL = 20 * 60 * 1000;
  var PROBE_DWELL_MS = 900;                  // only probe a channel the user rests on
  var PROBE_TIMEOUT_MS = 6000;
  var PROBE_SESSION_LIMIT = 60;
  var RANK_OK_MS = 14 * 24 * 3600 * 1000;    // a channel that played stays near the top for two weeks
  var RANK_BAD_MS = 7 * 24 * 3600 * 1000;    // a hard failure (HTTP error) sinks it for a week
  var RANK_REPEAT_FAIL_MS = 3 * 24 * 3600 * 1000; // repeated "no answer" sinks it for three days
  var RANK_ONE_FAIL_MS = 6 * 3600 * 1000;    // a single "no answer" only for a few hours
  var STATUS_MAX_ENTRIES = 1500;
  var SCAN_CONCURRENCY = 2;
  var SCAN_LIMIT = 200;                      // one "check" press probes at most this many channels
  var START_TIMEOUT_MS = 20000;              // per source, before trying the next one
  var RECONNECT_DELAYS = [1000, 3000, 6000, 12000, 20000, 30000];
  var AUTO_RETRY_DELAYS = [6000, 15000];     // after every source failed with a transient error
  var STALL_SPINNER_MS = 3000;
  var STALL_LOWER_MS = 7000;
  var STALL_RECONNECT_MS = 25000;
  var AUTO_MAX_HEIGHT = 480;
  var HLS_FALLBACK_URL = "https://unpkg.com/hls.js@1.6.16/dist/hls.min.js";
  var XLINK = "http://www.w3.org/1999/xlink";

  /* ------------------------------------------------------------------ *
   * Small helpers
   * ------------------------------------------------------------------ */

  function $(id) {
    return document.getElementById(id);
  }

  function now() {
    return Date.now();
  }

  function fa(value) {
    return String(value).replace(/[0-9]/g, function (d) {
      return "۰۱۲۳۴۵۶۷۸۹".charAt(Number(d));
    });
  }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[يى]/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/[ۀة]/g, "ه")
      .replace(/[إأٱآ]/g, "ا")
      .replace(/[ً-ٰٟ‌]/g, "")
      .replace(/[۰-۹]/g, function (d) {
        return String("۰۱۲۳۴۵۶۷۸۹".indexOf(d));
      })
      .replace(/\s+/g, " ")
      .trim();
  }

  function setHidden(el, hidden) {
    if (el) el.classList[hidden ? "add" : "remove"]("is-hidden");
  }

  function setIcon(useEl, name) {
    useEl.setAttributeNS(XLINK, "xlink:href", "#" + name);
  }

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function removeKey(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      /* best effort */
    }
  }

  function isVisible(el) {
    return Boolean(el && el.getClientRects().length && !el.disabled);
  }

  var toastTimer = null;
  function toast(message, ms) {
    var el = $("toast");
    clearTimeout(toastTimer);
    el.textContent = message;
    setHidden(el, false);
    toastTimer = setTimeout(function () {
      setHidden(el, true);
    }, ms || 3000);
  }

  /* ------------------------------------------------------------------ *
   * Preferences (with migration from the first release)
   * ------------------------------------------------------------------ */

  var prefs = (function () {
    var p = readJson(PREFS_KEY, null);
    var defaults = {
      cat: "fas",
      quality: "auto",
      volume: 1,
      muted: false,
      favorites: [],
      pendingFavoriteIds: [],
      lastId: "",
      sleepUntil: 0,
    };
    if (!p || typeof p !== "object") {
      var old = readJson("mowj-tv-preferences-v1", null);
      p = {};
      if (old && typeof old === "object") {
        if (typeof old.volume === "number") p.volume = old.volume;
        p.muted = Boolean(old.muted);
        if (Array.isArray(old.favorites)) p.pendingFavoriteIds = old.favorites.slice(0, 200);
        if (old.lastChannel) p.lastId = String(old.lastChannel);
        if (old.lastSource && old.lastSource !== "all") p.cat = old.lastSource;
      }
    }
    Object.keys(defaults).forEach(function (key) {
      if (typeof p[key] === "undefined") p[key] = defaults[key];
    });
    if (!Array.isArray(p.favorites)) p.favorites = [];
    if (!Array.isArray(p.pendingFavoriteIds)) p.pendingFavoriteIds = [];
    if (p.quality !== "auto" && !(Number(p.quality) > 0)) p.quality = "auto";
    p.volume = Math.max(0, Math.min(1, Number(p.volume)));
    if (!isFinite(p.volume)) p.volume = 1;
    return p;
  })();

  function savePrefs() {
    writeJson(PREFS_KEY, prefs);
  }

  function cleanupOldStorage() {
    try {
      var stale = [];
      for (var i = 0; i < localStorage.length; i += 1) {
        var key = localStorage.key(i);
        if (key && (key.indexOf("mowj-tv-playlist-v1-") === 0 || key.indexOf("mowj-tv-health-v1-") === 0)) {
          stale.push(key);
        }
      }
      stale.forEach(removeKey);
      removeKey("mowj-tv-preferences-v1");
      if (window.indexedDB && indexedDB.deleteDatabase) indexedDB.deleteDatabase("mowj-tv-cache-v2");
    } catch (e) {
      /* best effort */
    }
  }

  /* ------------------------------------------------------------------ *
   * Channel status (results of real playback and of lazy probes)
   * code: 1 = works, 2 = broken (HTTP error), 3 = unreachable (maybe temporary)
   * Stored per device as [code, time, consecutive failures, last success].
   * ------------------------------------------------------------------ */

  var statusMap = readJson(STATUS_KEY, {}) || {};

  /* Short-lived status: drives the dot and the row text, and decides when a
   * channel may be probed again. */
  function getStatus(id) {
    var rec = statusMap[id];
    if (!rec) return 0;
    var ttl = rec[0] === 1 ? STATUS_OK_TTL : rec[0] === 2 ? STATUS_BAD_TTL : STATUS_UNREACHABLE_TTL;
    if (now() - rec[1] > ttl) return 0;
    return rec[0];
  }

  /* Long-lived rank for ordering the list on this connection:
   * 0 = played here recently, 1 = unknown, 2 = usually fails here (dimmed, sorted last). */
  function rankOf(id) {
    var rec = statusMap[id];
    if (!rec) return 1;
    var age = now() - rec[1];
    var fails = rec[2] || 1;
    var okAt = rec[3] || (rec[0] === 1 ? rec[1] : 0);
    if (rec[0] === 1) return age < RANK_OK_MS ? 0 : 1;
    if (rec[0] === 2) return age < RANK_BAD_MS ? 2 : 1;
    if (fails >= 2) return age < RANK_REPEAT_FAIL_MS ? 2 : 1;
    // One "no answer" after recent successes is probably a hiccup, not a dead channel.
    if (okAt && now() - okAt < RANK_OK_MS) return 1;
    return age < RANK_ONE_FAIL_MS ? 2 : 1;
  }

  var statusSaveTimer = null;
  function setStatus(id, code) {
    if (!id) return;
    var old = statusMap[id] || [0, 0, 0, 0];
    var okAt = old[3] || (old[0] === 1 ? old[1] : 0);
    var fails = code === 1 ? 0 : old[0] && old[0] !== 1 ? (old[2] || 1) + 1 : 1;
    statusMap[id] = [code, now(), fails, code === 1 ? now() : okAt];
    clearTimeout(statusSaveTimer);
    statusSaveTimer = setTimeout(function () {
      var keys = Object.keys(statusMap);
      if (keys.length > STATUS_MAX_ENTRIES) {
        keys.sort(function (a, b) {
          return statusMap[a][1] - statusMap[b][1];
        });
        keys.slice(0, keys.length - STATUS_MAX_ENTRIES).forEach(function (key) {
          delete statusMap[key];
        });
      }
      writeJson(STATUS_KEY, statusMap);
    }, 800);
    list.refreshRow(id);
  }

  /* Playable first, "usually fails here" last. Stable, so the playlist's own
   * order is kept inside each group. Numbers follow the order on screen. */
  function orderChannels(channels) {
    var ranked = channels.map(function (channel, index) {
      return { c: channel, r: rankOf(channel.id), i: index };
    });
    ranked.sort(function (a, b) {
      return a.r - b.r || a.i - b.i;
    });
    return ranked.map(function (item, index) {
      item.c.num = index + 1;
      return item.c;
    });
  }

  /* ------------------------------------------------------------------ *
   * Playlist cache (IndexedDB, falling back to localStorage for small lists)
   * ------------------------------------------------------------------ */

  var dbPromise = null;
  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve) {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      var done = false;
      function finish(db) {
        if (done) return;
        done = true;
        resolve(db);
      }
      setTimeout(function () {
        finish(null);
      }, 4000);
      try {
        var req = indexedDB.open("mowj-tv", 1);
        req.onupgradeneeded = function () {
          req.result.createObjectStore("lists", { keyPath: "k" });
        };
        req.onsuccess = function () {
          finish(req.result);
        };
        req.onerror = function () {
          finish(null);
        };
        req.onblocked = req.onerror;
      } catch (e) {
        finish(null);
      }
    });
    return dbPromise;
  }

  function cacheGet(key) {
    return openDb().then(function (db) {
      var local = readJson("mowj-tv-list-" + key, null);
      if (!db) return local;
      return new Promise(function (resolve) {
        try {
          var req = db.transaction("lists", "readonly").objectStore("lists").get(key);
          req.onsuccess = function () {
            resolve(req.result || local);
          };
          req.onerror = function () {
            resolve(local);
          };
        } catch (e) {
          resolve(local);
        }
      });
    });
  }

  function cachePut(key, text) {
    var record = { k: key, t: now(), text: text };
    openDb().then(function (db) {
      if (db) {
        try {
          db.transaction("lists", "readwrite").objectStore("lists").put(record);
          return;
        } catch (e) {
          /* fall through to localStorage */
        }
      }
      if (text.length < 1500000) writeJson("mowj-tv-list-" + key, record);
    });
  }

  function fetchText(url, timeoutMs, reload) {
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (controller) controller.abort();
    }, timeoutMs);
    var options = { credentials: "omit", cache: reload ? "reload" : "default" };
    if (controller) options.signal = controller.signal;
    return fetch(url, options).then(function (response) {
      clearTimeout(timer);
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.text();
    }, function (error) {
      clearTimeout(timer);
      throw error;
    });
  }

  // A category may combine several playlists (e.g. movies + series); duplicates merge by tvg-id.
  function fetchCategory(cat, reload) {
    var urls = cat.urls || [cat.url];
    return Promise.all(urls.map(function (url) {
      return fetchText(url, cat.timeout || 25000, reload);
    })).then(function (texts) {
      return texts.join("\n");
    });
  }

  /* ------------------------------------------------------------------ *
   * M3U parsing
   * ------------------------------------------------------------------ */

  // "?strict=1" lets a local http:// preview behave like the HTTPS site.
  var pageIsHttps = location.protocol === "https:" || /[?&]strict=1/.test(location.search);
  var hiddenCount = 0;

  function sourcePlayable(source) {
    if (!/^https?:\/\//i.test(source.url)) return false;
    if (pageIsHttps && /^http:\/\//i.test(source.url)) return false; // mixed content is always blocked
    if (source.ref || source.ua) return false; // browsers cannot send a custom Referer/User-Agent
    if (/\.mpd(?:$|[?#])/i.test(source.url)) return false; // DASH is not supported here
    var host = (source.url.split("/")[2] || "").toLowerCase();
    if (CORS_LOCKED_HOSTS.indexOf(host) !== -1) return false;
    return true;
  }

  function cleanTitle(title) {
    return String(title || "")
      .replace(/\s*\(\d{3,4}[pi]\)/gi, "")
      .replace(/\s*\[[^\]]*\]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function smallLogo(url) {
    if (!url) return "";
    // Wikimedia serves ready-made thumbnails; a 120px logo is a fraction of a 960px one.
    if (/upload\.wikimedia\.org\/.*\/thumb\//.test(url)) return url.replace(/\/\d+px-([^/]+)$/, "/120px-$1");
    return url;
  }

  function groupLabel(group) {
    var first = String(group || "").split(";")[0].trim().toLowerCase();
    return GROUPS[first] || "";
  }

  function parseM3u(text, category) {
    var lines = String(text || "").split(/\r?\n/);
    var channels = [];
    var byKey = Object.create(null);
    var pending = null;
    hiddenCount = 0;

    for (var i = 0; i < lines.length; i += 1) {
      var line = lines[i].trim();
      if (!line) continue;
      if (line.indexOf("#EXTINF") === 0) {
        var comma = line.lastIndexOf(",");
        var meta = comma >= 0 ? line.slice(0, comma) : line;
        var title = comma >= 0 ? line.slice(comma + 1).trim() : "";
        var attrs = {};
        meta.replace(/([\w-]+)="([^"]*)"/g, function (m, k, v) {
          attrs[k.toLowerCase()] = v;
          return m;
        });
        var q = title.match(/\((\d{3,4})[pi]\)/i);
        pending = {
          tvgId: attrs["tvg-id"] || "",
          name: cleanTitle(title) || "بدون نام",
          logo: smallLogo(attrs["tvg-logo"] || ""),
          group: attrs["group-title"] || "",
          quality: q ? Number(q[1]) : 0,
          geo: /\[Geo-blocked\]/i.test(title),
          part: /\[Not 24\/7\]/i.test(title),
          ref: attrs["http-referrer"] || "",
          ua: attrs["http-user-agent"] || "",
        };
        continue;
      }
      if (!pending) continue;
      if (line.indexOf("#EXTVLCOPT:http-referrer=") === 0) {
        pending.ref = line.slice(line.indexOf("=") + 1);
        continue;
      }
      if (line.indexOf("#EXTVLCOPT:http-user-agent=") === 0) {
        pending.ua = line.slice(line.indexOf("=") + 1);
        continue;
      }
      if (line.charAt(0) === "#") continue;

      var entry = pending;
      pending = null;
      var base = entry.tvgId.split("@")[0];
      if (category.provincialOnly) {
        if (!PROVINCIAL_NAMES[base]) continue;
        entry.name = PROVINCIAL_NAMES[base];
        entry.group = "";
      }
      var source = { url: line, ref: entry.ref, ua: entry.ua };
      var key = entry.tvgId || "n:" + normalize(entry.name);
      var channel = byKey[key];
      if (!channel) {
        channel = {
          id: key,
          base: base,
          name: entry.name,
          logo: entry.logo,
          group: groupLabel(entry.group),
          quality: entry.quality,
          geo: entry.geo,
          part: entry.part,
          sources: [],
          rejected: 0,
        };
        byKey[key] = channel;
        channels.push(channel);
      }
      if (!channel.logo && entry.logo) channel.logo = entry.logo;
      if (sourcePlayable(source)) {
        var dup = false;
        for (var s = 0; s < channel.sources.length; s += 1) {
          if (channel.sources[s].url === source.url) dup = true;
        }
        if (!dup) channel.sources.push({ url: source.url });
      } else {
        channel.rejected += 1;
      }
    }

    var playable = [];
    channels.forEach(function (channel) {
      var fixes = STREAM_FIXES[channel.base];
      if (fixes) {
        channel.sources = fixes.map(function (url) {
          return { url: url };
        }).concat(channel.sources.filter(function (src) {
          return fixes.indexOf(src.url) === -1;
        }));
      }
      if (channel.sources.length) playable.push(channel);
      else hiddenCount += 1;
    });
    if (category.provincialOnly) {
      playable.sort(function (a, b) {
        return a.name.localeCompare(b.name, "fa");
      });
    }
    return playable;
  }

  /* ------------------------------------------------------------------ *
   * App state
   * ------------------------------------------------------------------ */

  var state = {
    cat: null,
    channels: [],
    view: [],
    query: "",
    loadToken: 0,
    savedAt: 0,
    current: null,
  };

  function categoryByKey(key) {
    for (var i = 0; i < CATEGORIES.length; i += 1) {
      if (CATEGORIES[i].key === key) return CATEGORIES[i];
    }
    return null;
  }

  function isFavorite(id) {
    for (var i = 0; i < prefs.favorites.length; i += 1) {
      if (prefs.favorites[i].id === id) return true;
    }
    return false;
  }

  function favoriteRecord(channel) {
    return {
      id: channel.id,
      base: channel.base,
      name: channel.name,
      logo: channel.logo,
      group: channel.group,
      quality: channel.quality,
      sources: channel.sources.slice(0, 3),
    };
  }

  /* ------------------------------------------------------------------ *
   * Virtualised channel list
   * ------------------------------------------------------------------ */

  var list = (function () {
    var el = $("list");
    var rows = Object.create(null); // index -> element
    var rowHeight = 0;
    var focusIndex = 0;

    function measure() {
      var probe = document.createElement("div");
      probe.className = "row";
      probe.style.visibility = "hidden";
      el.appendChild(probe);
      rowHeight = probe.offsetHeight || 50;
      el.removeChild(probe);
    }

    function statusClass(channel) {
      var code = getStatus(channel.id);
      var dim = rankOf(channel.id) === 2 ? " is-dim" : "";
      if (probe.isChecking(channel.id)) return "s-checking" + dim;
      return (code === 1 ? "s-ok" : code ? "s-bad" : "") + dim;
    }

    function metaText(channel) {
      var code = getStatus(channel.id);
      if (code === 2) return "فعلاً پخش نمی‌شود";
      if (code === 3) return "پاسخ نداد · شاید موقت";
      if (rankOf(channel.id) === 2) return "معمولاً روی این اینترنت پخش نمی‌شود";
      var parts = [];
      if (channel.group) parts.push(channel.group);
      if (channel.part) parts.push("پخش غیرمداوم");
      if (channel.geo) parts.push("محدودیت منطقه‌ای");
      return parts.join(" · ");
    }

    function fillRow(row, channel) {
      row.className = "row " + statusClass(channel) +
        (state.current && state.current.id === channel.id ? " is-playing" : "");
      row.querySelector(".row-meta").textContent = metaText(channel);
      row.setAttribute("aria-selected", state.current && state.current.id === channel.id ? "true" : "false");
    }

    function buildRow(index) {
      var channel = state.view[index];
      var row = document.createElement("button");
      row.type = "button";
      row.tabIndex = -1;
      row.setAttribute("role", "option");
      row.setAttribute("data-i", String(index));

      var num = document.createElement("span");
      num.className = "row-num";
      num.textContent = fa(channel.num);
      var logo = document.createElement("span");
      logo.className = "logo";
      paintLogo(logo, channel);
      var copy = document.createElement("span");
      copy.className = "row-copy";
      var name = document.createElement("span");
      name.className = "row-name";
      name.textContent = channel.name;
      var meta = document.createElement("span");
      meta.className = "row-meta";
      copy.appendChild(name);
      copy.appendChild(meta);
      var tag = document.createElement("span");
      tag.className = "row-tag";
      tag.textContent = (isFavorite(channel.id) && state.cat && !state.cat.favorites ? "★ " : "") +
        (channel.quality ? channel.quality + "p" : "");
      var dot = document.createElement("span");
      dot.className = "dot";

      row.appendChild(num);
      row.appendChild(logo);
      row.appendChild(copy);
      row.appendChild(tag);
      row.appendChild(dot);
      fillRow(row, channel);
      row.setAttribute("aria-label", fa(channel.num) + " " + channel.name);
      return row;
    }

    /* Paged, not scrolled: TV browsers drive the page with a D-pad or a
     * remote-controlled pointer, and both make scrolling a box inside the page
     * hard. A page always shows whole rows; big buttons (and the mouse wheel)
     * turn it, and walking past the last row turns it too. */
    var page = 0;
    var perPage = 1;
    var pagePrev = $("pagePrev");
    var pageNext = $("pageNext");
    var pageInfo = $("pageInfo");
    var pagerEl = $("pager");

    function layout() {
      if (!rowHeight) measure();
      perPage = Math.max(1, Math.floor((el.clientHeight || rowHeight * 8) / rowHeight));
    }

    function pageCount() {
      return Math.max(1, Math.ceil(state.view.length / perPage));
    }

    function updatePager() {
      var pages = pageCount();
      setHidden(pagerEl, pages < 2 || el.classList.contains("is-hidden"));
      pagePrev.classList.toggle("is-off", page === 0);
      pageNext.classList.toggle("is-off", page >= pages - 1);
      pagePrev.setAttribute("aria-disabled", page === 0 ? "true" : "false");
      pageNext.setAttribute("aria-disabled", page >= pages - 1 ? "true" : "false");
      pageInfo.textContent = "صفحهٔ " + fa(page + 1) + " از " + fa(pages);
    }

    function render() {
      layout();
      var total = state.view.length;
      page = Math.max(0, Math.min(page, pageCount() - 1));
      var first = page * perPage;
      var last = Math.min(total, first + perPage) - 1;
      Object.keys(rows).forEach(function (key) {
        var i = Number(key);
        if (i < first || i > last || !state.view[i]) {
          el.removeChild(rows[key]);
          delete rows[key];
        }
      });
      for (var i = first; i <= last; i += 1) {
        if (!rows[i]) {
          rows[i] = buildRow(i);
          el.appendChild(rows[i]);
        }
        rows[i].style.top = (i - first) * rowHeight + "px";
      }
      updatePager();
    }

    function reset(keepIndex) {
      Object.keys(rows).forEach(function (key) {
        el.removeChild(rows[key]);
      });
      rows = Object.create(null);
      layout();
      focusIndex = Math.max(0, Math.min(keepIndex || 0, state.view.length - 1));
      page = Math.floor(focusIndex / perPage);
      render();
    }

    function focus(index) {
      if (!state.view.length) return false;
      focusIndex = Math.max(0, Math.min(index, state.view.length - 1));
      layout();
      page = Math.floor(focusIndex / perPage);
      render();
      var row = rows[focusIndex];
      if (row) {
        try {
          row.focus({ preventScroll: true });
        } catch (e) {
          row.focus();
        }
      }
      return true;
    }

    // Turn the page; the cursor keeps its slot when it was in the list.
    function turnPage(delta) {
      layout();
      var target = page + delta;
      if (target < 0 || target >= pageCount()) return false;
      var slot = Math.max(0, focusIndex - page * perPage);
      var inList = el.contains(document.activeElement);
      page = target;
      focusIndex = Math.min(state.view.length - 1, page * perPage + slot);
      if (inList) focus(focusIndex);
      else render();
      return true;
    }

    function refreshRow(id) {
      Object.keys(rows).forEach(function (key) {
        var channel = state.view[Number(key)];
        if (channel && (!id || channel.id === id)) fillRow(rows[key], channel);
      });
    }

    function indexOfId(id) {
      for (var i = 0; i < state.view.length; i += 1) {
        if (state.view[i].id === id) return i;
      }
      return -1;
    }

    pagePrev.addEventListener("click", function () {
      turnPage(-1);
    });
    pageNext.addEventListener("click", function () {
      turnPage(1);
    });

    var wheelAt = 0;
    el.addEventListener("wheel", function (event) {
      event.preventDefault();
      if (now() - wheelAt < 280 || !event.deltaY) return;
      wheelAt = now();
      turnPage(event.deltaY > 0 ? 1 : -1);
    }, { passive: false });

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var hadFocus = el.contains(document.activeElement);
        rowHeight = 0;
        if (hadFocus) focus(focusIndex);
        else reset(focusIndex);
      }, 150);
    });

    el.addEventListener("click", function (event) {
      var row = event.target.closest ? event.target.closest(".row") : null;
      if (!row) return;
      var index = Number(row.getAttribute("data-i"));
      focusIndex = index;
      activate(index);
    });

    el.addEventListener("focusin", function (event) {
      var row = event.target;
      if (!row.classList || !row.classList.contains("row")) return;
      focusIndex = Number(row.getAttribute("data-i"));
      probe.schedule(state.view[focusIndex]);
    });

    el.addEventListener("focusout", function () {
      probe.cancelDwell();
    });

    function activate(index) {
      var channel = state.view[index];
      if (!channel) return;
      if (state.current && state.current.id === channel.id && player.isActive()) {
        fullscreen.enter();
        return;
      }
      player.play(channel);
    }

    return {
      el: el,
      reset: reset,
      focus: focus,
      focusCurrent: function () {
        return focus(focusIndex);
      },
      refreshRow: refreshRow,
      refreshAll: function () {
        refreshRow(null);
      },
      indexOfId: indexOfId,
      getFocusIndex: function () {
        return focusIndex;
      },
      activate: activate,
      turnPage: turnPage,
      updatePager: function () {
        updatePager();
      },
      hasFocus: function () {
        return el.contains(document.activeElement);
      },
    };
  })();

  /* Small local copies of the main lists' logos (scripts/build-logos.mjs).
   * Many original logos sit on hosts that refuse or throttle viewers and weigh
   * 50-200 KB; the local ones are 1-3 KB and come from the same site. */
  var LOCAL_LOGOS = (function () {
    var data = window.MOWJ_LOGOS || {};
    var set = Object.create(null);
    String(data.ids || "").split(" ").forEach(function (id) {
      if (id) set[id] = true;
    });
    return { v: data.v || "", set: set };
  })();

  function localLogo(base) {
    if (!base || !LOCAL_LOGOS.set[base]) return "";
    return "logos/" + base.replace(/[^A-Za-z0-9._-]/g, "_") + ".webp?v=" + LOCAL_LOGOS.v;
  }

  function paintLogo(container, channel) {
    container.textContent = "";
    var initial = document.createElement("span");
    initial.textContent = (channel.name || "؟").charAt(0).toUpperCase();
    container.appendChild(initial);
    // Local copy first, then the original (older TVs without WebP still get a logo).
    var urls = [];
    var local = localLogo(channel.base);
    if (local) urls.push(local);
    if (channel.logo) urls.push(channel.logo);
    if (!urls.length) return;
    var img = document.createElement("img");
    img.alt = "";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    img.onerror = function () {
      urls.shift();
      if (urls.length) img.src = urls[0];
      else if (img.parentNode) img.parentNode.removeChild(img);
    };
    img.onload = function () {
      initial.style.visibility = "hidden";
    };
    img.src = urls[0];
    container.appendChild(img);
  }

  /* ------------------------------------------------------------------ *
   * Lazy health probe: a single small manifest request, only for the
   * channel the user is resting on, never while playback is struggling.
   * ------------------------------------------------------------------ */

  var probe = (function () {
    var dwellTimer = null;
    var count = 0;
    var checking = Object.create(null); // id -> AbortController
    var api = {};

    api.isChecking = function (id) {
      return Boolean(checking[id]);
    };

    api.busy = function () {
      return Object.keys(checking).length > 0;
    };

    api.canProbe = function (channel) {
      var url = channel && channel.sources[0] && channel.sources[0].url;
      return Boolean(url && /\.m3u8(?:$|[?#])/i.test(url) && typeof AbortController !== "undefined");
    };

    api.cancelDwell = function () {
      clearTimeout(dwellTimer);
      dwellTimer = null;
    };

    api.schedule = function (channel) {
      api.cancelDwell();
      if (!channel || api.busy() || count >= PROBE_SESSION_LIMIT) return;
      if (getStatus(channel.id) || navigator.onLine === false || !api.canProbe(channel)) return;
      dwellTimer = setTimeout(function () {
        dwellTimer = null;
        if (!player.allowsBackgroundTraffic()) return;
        count += 1;
        api.check(channel);
      }, PROBE_DWELL_MS);
    };

    api.abortAll = function () {
      Object.keys(checking).forEach(function (id) {
        checking[id].abort();
      });
    };

    /* One small request for the channel's playlist (a few KB). Resolves with
     * the stored code, or 0 when it was aborted. */
    api.check = function (channel) {
      if (!api.canProbe(channel) || checking[channel.id]) return Promise.resolve(0);
      var controller = new AbortController();
      var timedOut = false;
      checking[channel.id] = controller;
      list.refreshRow(channel.id);
      var timer = setTimeout(function () {
        timedOut = true;
        controller.abort();
      }, PROBE_TIMEOUT_MS);
      function done(code) {
        clearTimeout(timer);
        delete checking[channel.id];
        if (code) setStatus(channel.id, code);
        else list.refreshRow(channel.id);
        return code;
      }
      return fetch(channel.sources[0].url, { credentials: "omit", cache: "no-store", signal: controller.signal })
        .then(function (response) {
          // 408/429 mean "busy right now", not "gone"; they must not sink a channel for a week.
          var hard = response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429;
          if (!response.ok) return done(hard ? 2 : 3);
          return response.text().then(function (text) {
            return done(text.indexOf("#EXTM3U") !== -1 ? 1 : 2);
          });
        })
        .catch(function () {
          // CORS refusals and network failures look identical from a browser.
          // A cancelled check (category change, playback started) records nothing.
          return done(controller.signal.aborted && !timedOut ? 0 : 3);
        });
    };

    return api;
  })();

  /* ------------------------------------------------------------------ *
   * "Check this list": an opt-in pass over the channels with no recent
   * result, two small requests at a time, paused whenever playback needs
   * the bandwidth. The list is re-ordered once, at the end.
   * ------------------------------------------------------------------ */

  var scan = (function () {
    var queue = [];
    var running = 0;
    var active = false;
    var checked = 0;
    var total = 0;
    var waitTimer = null;

    function button() {
      return $("scanBtn");
    }

    function label() {
      var btn = button();
      if (active) {
        btn.textContent = "توقف بررسی " + fa(checked) + "/" + fa(total);
      } else {
        btn.textContent = "بررسی شبکه‌ها";
      }
      btn.classList.toggle("is-busy", active);
    }

    function candidates() {
      return state.channels.filter(function (channel) {
        return !getStatus(channel.id) && probe.canProbe(channel);
      }).slice(0, SCAN_LIMIT);
    }

    function pump() {
      if (!active) return;
      clearTimeout(waitTimer);
      if (navigator.onLine === false) {
        stop();
        return;
      }
      if (!player.allowsBackgroundTraffic()) {
        waitTimer = setTimeout(pump, 3000);
        return;
      }
      while (active && running < SCAN_CONCURRENCY && queue.length) {
        var channel = queue.shift();
        running += 1;
        probe.check(channel).then(function () {
          running -= 1;
          checked += 1;
          label();
          if (!queue.length && !running) finish();
          else pump();
        });
      }
    }

    function finish() {
      var ok = 0;
      var bad = 0;
      state.channels.forEach(function (channel) {
        var rank = rankOf(channel.id);
        if (rank === 0) ok += 1;
        else if (rank === 2) bad += 1;
      });
      active = false;
      label();
      resortKeepingFocus();
      toast(fa(ok) + " شبکه پاسخ داد · " + fa(bad) + " شبکه به انتهای فهرست رفت");
    }

    function stop() {
      if (!active) return;
      active = false;
      queue = [];
      clearTimeout(waitTimer);
      probe.abortAll();
      label();
    }

    function start() {
      if (active) {
        stop();
        resortKeepingFocus();
        return;
      }
      if (navigator.onLine === false) {
        toast("اینترنت وصل نیست");
        return;
      }
      queue = candidates();
      if (!queue.length) {
        toast("همهٔ شبکه‌های این فهرست به‌تازگی بررسی شده‌اند");
        return;
      }
      if (navigator.connection && navigator.connection.saveData) {
        toast("حالت صرفه‌جویی داده روشن است؛ بررسی انجام نشد");
        return;
      }
      active = true;
      checked = 0;
      running = 0;
      total = queue.length;
      label();
      // A playlist request is a few kilobytes; tell the user what this costs.
      toast("بررسی " + fa(total) + " شبکه · حدود " + fa(total * 3) + " کیلوبایت");
      pump();
    }

    return {
      start: start,
      stop: stop,
      active: function () {
        return active;
      },
      refresh: label,
    };
  })();

  // Re-order after the user asked for it, keeping the cursor on the same channel.
  function resortKeepingFocus() {
    var focusedId = state.view[list.getFocusIndex()] && state.view[list.getFocusIndex()].id;
    var hadFocus = list.hasFocus();
    state.channels = orderChannels(state.channels);
    applyView(false);
    var index = list.indexOfId(focusedId);
    if (index >= 0) {
      if (hadFocus) list.focus(index);
      else list.reset(index);
    }
    updateFoot(null);
  }

  /* ------------------------------------------------------------------ *
   * Player
   * ------------------------------------------------------------------ */

  var video = $("video");

  var player = (function () {
    var P = {
      token: 0,
      hls: null,
      channel: null,
      sources: [],
      si: 0,
      started: false,
      userPaused: false,
      pausedAt: 0,
      lastError: "",
      reconnects: 0,
      autoRetries: 0,
      mediaRecovered: false,
      levels: [],
      cap: -1,
      lastTime: 0,
      lastProgress: 0,
      smoothSince: 0,
      lowered: false,
      manifestOk: false,
      prompt: false,
      hiddenPause: false,
      timers: {},
    };

    if (/[?&]debug=1/.test(location.search)) window.mowjDebug = P; // inspect playback state on a TV

    function clearTimer(name) {
      if (P.timers[name]) {
        clearTimeout(P.timers[name]);
        P.timers[name] = null;
      }
    }

    function clearAllTimers() {
      Object.keys(P.timers).forEach(clearTimer);
    }

    function teardownMedia() {
      clearTimer("start");
      clearTimer("reconnect");
      if (P.hls) {
        try {
          P.hls.destroy();
        } catch (e) {
          /* ignore */
        }
        P.hls = null;
      }
      try {
        video.pause();
        video.removeAttribute("src");
        video.load();
      } catch (e) {
        /* some TV engines throw while a failed request is torn down */
      }
      P.levels = [];
      P.cap = -1;
      P.started = false;
      P.manifestOk = false;
      P.mediaRecovered = false;
    }

    /* ---------- status overlay ---------- */

    function showStatus(title, text, mode) {
      var box = $("status");
      $("statusTitle").textContent = title;
      $("statusText").textContent = text || "";
      box.classList.toggle("is-error", mode === "error");
      setHidden($("spinner"), mode === "error");
      setHidden($("statusActions"), mode !== "error" && mode !== "prompt");
      setHidden($("skipBtn"), mode === "prompt");
      $("retryBtn").querySelector("span").textContent = mode === "prompt" ? "پخش" : "تلاش دوباره";
      setHidden(box, false);
      setHidden($("idle"), true);
      if ((mode === "error" || mode === "prompt") && (fullscreen.active || document.activeElement === $("player"))) {
        $("retryBtn").focus();
      }
    }

    function hideStatus() {
      var hadFocus = $("status").contains(document.activeElement);
      setHidden($("status"), true);
      if (hadFocus) $("player").focus();
    }

    /* ---------- start / sources ---------- */

    function play(channel, isRetry) {
      P.token += 1;
      teardownMedia();
      clearAllTimers();
      P.channel = channel;
      state.current = channel;
      P.sources = channel.sources.slice(0, 4);
      P.si = 0;
      P.userPaused = false;
      P.prompt = false;
      P.lastError = "";
      P.reconnects = 0;
      P.lowered = false;
      if (!isRetry) P.autoRetries = 0;
      prefs.lastId = channel.id;
      savePrefs();
      ui.nowPlaying(channel);
      list.refreshAll();
      osd.show(channel, "در حال اتصال…");
      startSource();
    }

    function startSource() {
      var token = P.token;
      var source = P.sources[P.si];
      if (!source) {
        fail();
        return;
      }
      showStatus("در حال اتصال…", P.si ? "منبع جایگزین امتحان می‌شود" : P.channel.name, "busy");
      clearTimer("start");
      var armStart = function () {
        P.timers.start = setTimeout(function () {
          if (token !== P.token || P.started) return;
          // Browsers hold back media in hidden pages; that is not the stream's fault.
          if (document.visibilityState === "hidden") {
            armStart();
            return;
          }
          nextSource("timeout");
        }, START_TIMEOUT_MS);
      };
      armStart();

      hlsReady(function (Hls) {
        if (token !== P.token) return;
        if (Hls && Hls.isSupported()) startHls(Hls, source, token);
        else if (canPlayNative()) startNative(source, token);
        else nextSource("unsupported");
      });
    }

    function canPlayNative() {
      return Boolean(video.canPlayType("application/vnd.apple.mpegurl") || video.canPlayType("application/x-mpegURL"));
    }

    function hlsConfig() {
      var retry = function (n, delay, max) {
        return { maxNumRetry: n, retryDelayMs: delay, maxRetryDelayMs: max, backoff: "exponential" };
      };
      return {
        enableWorker: true,
        lowLatencyMode: false,
        startLevel: -1,
        capLevelToPlayerSize: false,
        capLevelOnFPSDrop: true,
        testBandwidth: true,
        abrEwmaDefaultEstimate: 500000,   // assume a slow link until measured
        abrBandWidthFactor: 0.8,
        abrBandWidthUpFactor: 0.6,        // climb quality cautiously
        maxBufferLength: 30,
        maxMaxBufferLength: 40,
        maxBufferSize: 30 * 1000 * 1000,
        backBufferLength: 10,
        liveSyncDurationCount: 4,         // a little further from the live edge = fewer stalls
        liveMaxLatencyDurationCount: 12,
        maxLiveSyncPlaybackRate: 1,
        manifestLoadPolicy: {
          default: {
            maxTimeToFirstByteMs: 10000,
            maxLoadTimeMs: 15000,
            timeoutRetry: retry(1, 0, 0),
            errorRetry: retry(1, 1500, 4000),
          },
        },
        playlistLoadPolicy: {
          default: {
            maxTimeToFirstByteMs: 10000,
            maxLoadTimeMs: 15000,
            timeoutRetry: retry(2, 1000, 8000),
            errorRetry: retry(2, 1000, 8000),
          },
        },
        fragLoadPolicy: {
          default: {
            maxTimeToFirstByteMs: 10000,
            maxLoadTimeMs: 40000,
            timeoutRetry: retry(4, 1000, 8000),
            errorRetry: retry(6, 1000, 8000),
          },
        },
      };
    }

    function startHls(Hls, source, token) {
      var hls = new Hls(hlsConfig());
      P.hls = hls;
      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        if (token !== P.token) return;
        P.manifestOk = true;
        setupLevels();
        requestPlay(token);
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, function (evt, data) {
        if (token !== P.token) return;
        ui.levelBadge(hls.levels[data.level]);
      });
      hls.on(Hls.Events.ERROR, function (evt, data) {
        if (token !== P.token) return;
        onHlsError(Hls, data, token);
      });
      hls.loadSource(source.url);
      hls.attachMedia(video);
    }

    function startNative(source, token) {
      P.levels = [];
      ui.qualityState(null);
      video.src = source.url;
      requestPlay(token);
    }

    function requestPlay(token) {
      var promise;
      try {
        promise = video.play();
      } catch (e) {
        promise = null;
      }
      if (promise && promise.catch) {
        promise.catch(function (error) {
          if (token !== P.token || P.userPaused) return;
          if (error && error.name === "NotAllowedError") {
            clearTimer("start");
            P.prompt = true;
            showStatus("برای شروع پخش OK را بزن", "مرورگر پخش خودکار صدا را متوقف کرد", "prompt");
          }
        });
      }
    }

    function errorKind(data) {
      var code = data.response && data.response.code;
      if (code >= 400) return "http-" + code;
      if (/TimeOut/i.test(data.details || "")) return "timeout";
      if (data.type === "mediaError") return "media";
      // The master playlist loaded but its variants could not be read: that is a CORS lock,
      // not a slow network, so retrying would only waste data.
      if (P.manifestOk && /levelLoad|fragLoad|keyLoad/i.test(data.details || "")) return "cors";
      return "network";
    }

    function onHlsError(Hls, data, token) {
      if (!data.fatal) return;
      var kind = errorKind(data);
      if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !P.mediaRecovered) {
        P.mediaRecovered = true;
        try {
          P.hls.recoverMediaError();
          return;
        } catch (e) {
          /* fall through */
        }
      }
      if (!P.started) {
        nextSource(kind);
        return;
      }
      reconnect(kind);
    }

    function nextSource(kind) {
      P.lastError = kind;
      teardownMedia();
      P.si += 1;
      if (P.si < P.sources.length) startSource();
      else fail();
    }

    function failureText(kind) {
      if (/^http-40[34]|^http-410/.test(kind) && kind !== "http-403") {
        return "لینک پخش در منبع حذف شده یا تغییر کرده است.";
      }
      if (kind === "http-401" || kind === "http-403") {
        return "سرور پخش اجازه نمی‌دهد؛ احتمالاً محدودیت منطقه‌ای یا نیاز به اشتراک.";
      }
      if (/^http-5/.test(kind)) return "سرور پخش موقتاً از کار افتاده است.";
      if (kind === "http-429") return "سرور پخش موقتاً درخواست‌ها را محدود کرده است.";
      if (kind === "timeout") return "پاسخ سرور خیلی کند بود.";
      if (kind === "cors") return "این شبکه پخش در سایت‌های دیگر را مسدود کرده است (CORS).";
      if (kind === "media" || kind === "unsupported") return "فرمت تصویر این شبکه با این مرورگر سازگار نیست.";
      return "سرور پاسخ نداد یا پخش در مرورگر را مجاز نکرده است.";
    }

    function fail() {
      var kind = P.lastError || "network";
      var transient = kind === "timeout" || kind === "network" || kind === "http-429" || /^http-5/.test(kind);
      clearAllTimers();
      teardownMedia();
      ui.setPlaying(false);
      if (navigator.onLine === false) {
        showStatus("اینترنت قطع است", "پس از وصل شدن، پخش خودکار ادامه پیدا می‌کند", "error");
        return;
      }
      setStatus(P.channel.id, transient ? 3 : 2);
      ui.nowStatus("پخش نشد", true);
      if (transient && P.autoRetries < AUTO_RETRY_DELAYS.length) {
        var delay = AUTO_RETRY_DELAYS[P.autoRetries];
        P.autoRetries += 1;
        var token = P.token;
        showStatus(
          "این شبکه الان پخش نمی‌شود",
          failureText(kind) + " تلاش خودکار تا " + fa(Math.round(delay / 1000)) + " ثانیه دیگر…",
          "error",
        );
        P.timers.autoRetry = setTimeout(function () {
          if (token === P.token && !P.userPaused) play(P.channel, true);
        }, delay);
        return;
      }
      showStatus("این شبکه الان پخش نمی‌شود", failureText(kind), "error");
    }

    function reconnect(kind) {
      if (P.timers.reconnect) return;
      if (P.reconnects >= RECONNECT_DELAYS.length) {
        P.lastError = kind;
        fail();
        return;
      }
      var delay = RECONNECT_DELAYS[P.reconnects];
      P.reconnects += 1;
      var token = P.token;
      showStatus("اتصال دوباره…", "ارتباط با سرور پخش قطع شد", "busy");
      teardownMedia();
      P.timers.reconnect = setTimeout(function () {
        P.timers.reconnect = null;
        if (token !== P.token || P.userPaused) return;
        startSource();
      }, delay);
    }

    /* ---------- quality ---------- */

    function levelScore(level) {
      return (level.height || 0) * 10000000 + (level.bitrate || 0);
    }

    function heightOf(level) {
      if (level.height) return level.height;
      // No RESOLUTION attribute: estimate from bitrate.
      var br = level.bitrate || 0;
      if (!br) return 0; // a bare media playlist: the real size is only known once video arrives
      return br <= 600000 ? 240 : br <= 1100000 ? 360 : br <= 1600000 ? 480 : br <= 3200000 ? 720 : 1080;
    }

    function pickCap(limit) {
      var best = -1;
      var lowest = -1;
      P.levels.forEach(function (level, index) {
        if (lowest < 0 || levelScore(level) < levelScore(P.levels[lowest])) lowest = index;
        if (heightOf(level) <= limit && (best < 0 || levelScore(level) > levelScore(P.levels[best]))) best = index;
      });
      return best >= 0 ? best : lowest;
    }

    function currentLimit() {
      return prefs.quality === "auto" ? AUTO_MAX_HEIGHT : Number(prefs.quality);
    }

    function setupLevels() {
      var hls = P.hls;
      P.levels = (hls.levels || []).slice();
      if (!P.levels.length) {
        ui.qualityState(null);
        return;
      }
      applyQuality(true);
    }

    function applyQuality(initial) {
      var hls = P.hls;
      if (!hls || !P.levels.length) return;
      var limit = currentLimit();
      var cap = pickCap(limit);
      var manual = prefs.quality !== "auto";
      P.cap = cap;
      P.lowered = false;
      if (P.levels.length > 1) {
        if (manual) {
          // An explicit choice is honoured as a fixed rendition, not just a ceiling.
          hls.autoLevelCapping = -1;
          if (initial) {
            hls.startLevel = cap;
            hls.loadLevel = cap;
          } else {
            hls.nextLevel = cap;
          }
        } else {
          hls.autoLevelCapping = cap;
          if (initial) {
            // Start one step lower on a fresh connection and let ABR climb to the cap.
            var start = cap;
            var lower = pickCap(360);
            if (lower >= 0 && levelScore(P.levels[lower]) < levelScore(P.levels[cap])) start = lower;
            hls.startLevel = start;
          } else {
            hls.nextLevel = -1; // back to automatic switching
            try {
              hls.nextAutoLevel = Math.min(cap, Math.max(0, hls.currentLevel));
            } catch (e) {
              /* older hls.js */
            }
          }
        }
      }
      var minHeight = heightOf(P.levels[pickCap(0)]);
      ui.qualityState({
        levels: P.levels,
        cap: cap,
        onlyHigh: minHeight > limit,
        minHeight: minHeight,
      });
    }

    function lowerQualityForStall() {
      if (prefs.quality !== "auto" || !P.hls || P.levels.length < 2 || P.cap < 0) return;
      var capScore = levelScore(P.levels[P.cap]);
      var next = -1;
      P.levels.forEach(function (level, index) {
        var score = levelScore(level);
        if (score < capScore && (next < 0 || score > levelScore(P.levels[next]))) next = index;
      });
      if (next < 0) return;
      P.cap = next;
      P.lowered = true;
      P.hls.autoLevelCapping = next;
      try {
        P.hls.nextAutoLevel = next;
      } catch (e) {
        /* ignore */
      }
      ui.qualityState({ levels: P.levels, cap: next, onlyHigh: false, lowered: true });
      toast("اینترنت کند است؛ کیفیت موقتاً به " + heightOf(P.levels[next]) + "p کاهش یافت", 3500);
    }

    /* ---------- watchdog (progress / stalls) ---------- */

    function watchdog() {
      if (!P.channel || P.userPaused || !P.started) return;
      var t = video.currentTime;
      if (Math.abs(t - P.lastTime) > 0.05) {
        P.lastTime = t;
        P.lastProgress = now();
        if (!P.smoothSince) P.smoothSince = now();
        if (now() - P.smoothSince > 60000) P.reconnects = 0;
        if (!$("status").classList.contains("is-hidden") && !P.timers.reconnect) hideStatus();
        return;
      }
      P.smoothSince = 0;
      var stuck = now() - P.lastProgress;
      if (video.paused && !video.ended && stuck > 2000) requestPlay(P.token);
      if (stuck > STALL_SPINNER_MS && !P.timers.reconnect) showStatus("در حال بارگیری…", "اینترنت کند است؛ کمی صبر کن", "busy");
      if (stuck > STALL_LOWER_MS && !P.lowered) lowerQualityForStall();
      if (stuck > STALL_RECONNECT_MS) reconnect("timeout");
    }

    setInterval(watchdog, 1000);

    video.addEventListener("playing", function () {
      if (!P.channel) return;
      clearTimer("start");
      clearTimer("autoRetry");
      P.prompt = false;
      if (!P.started) {
        P.started = true;
        P.autoRetries = 0;
        setStatus(P.channel.id, 1);
        osd.show(P.channel, ui.qualitySummary());
      }
      P.lastProgress = now();
      P.lastTime = video.currentTime;
      hideStatus();
      ui.setPlaying(true);
      ui.nowStatus("در حال پخش", false);
    });

    video.addEventListener("pause", function () {
      ui.setPlaying(false);
    });

    video.addEventListener("resize", function () {
      if (P.channel && video.videoHeight) ui.levelBadge(currentLevelObj());
    });

    video.addEventListener("error", function () {
      if (P.hls || !P.channel || !video.getAttribute("src")) return;
      // Native HLS path (no hls.js): move on to the next source.
      if (!P.started) nextSource("media");
      else reconnect("network");
    });

    function currentLevelObj() {
      return P.hls && P.hls.currentLevel >= 0 ? P.levels[P.hls.currentLevel] : null;
    }

    /* ---------- public controls ---------- */

    function togglePause() {
      if (!P.channel) {
        list.activate(list.getFocusIndex());
        return;
      }
      if (P.prompt) {
        P.prompt = false;
        requestPlay(P.token);
        return;
      }
      if (!P.started && !P.userPaused) {
        if (P.timers.start || P.timers.reconnect) return; // still connecting
        play(P.channel, true); // a failure is on screen: OK retries
        return;
      }
      if (P.userPaused) resume();
      else pause();
    }

    function pause() {
      if (!P.channel) return;
      P.userPaused = true;
      P.pausedAt = now();
      clearTimer("reconnect");
      video.pause();
      // Stop downloading while paused: this is live TV, the buffer would only go stale.
      if (P.hls) P.hls.stopLoad();
      ui.nowStatus("مکث", false);
    }

    function resume() {
      if (!P.channel) return;
      var pausedFor = now() - P.pausedAt;
      P.userPaused = false;
      if (!P.hls || pausedFor > 30000) {
        play(P.channel, true); // jump back to the live edge
        return;
      }
      P.hls.startLoad(-1);
      P.lastProgress = now();
      requestPlay(P.token);
    }

    function stop() {
      P.token += 1;
      clearAllTimers();
      teardownMedia();
      P.userPaused = true;
      ui.setPlaying(false);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") {
        if (P.channel && !P.userPaused) {
          P.hiddenPause = true;
          pause();
        }
      } else if (P.hiddenPause) {
        P.hiddenPause = false;
        resume();
      }
    });

    window.addEventListener("offline", function () {
      if (P.channel && !P.userPaused) showStatus("اینترنت قطع شد", "پس از وصل شدن، پخش خودکار ادامه پیدا می‌کند", "busy");
    });

    window.addEventListener("online", function () {
      if (P.channel && !P.userPaused) play(P.channel, true);
    });

    $("retryBtn").addEventListener("click", function () {
      if (!P.channel) return;
      if (P.prompt) {
        P.prompt = false;
        requestPlay(P.token);
      } else if (P.userPaused) {
        resume();
      } else {
        play(P.channel, true);
      }
    });

    $("skipBtn").addEventListener("click", function () {
      switchChannel(1);
    });

    return {
      play: play,
      stop: stop,
      togglePause: togglePause,
      isActive: function () {
        return Boolean(P.channel && (P.started || P.timers.start || P.timers.reconnect));
      },
      isPaused: function () {
        return P.userPaused;
      },
      setQuality: function (value) {
        prefs.quality = value;
        savePrefs();
        applyQuality(false);
        toast(value === "auto" ? "کیفیت خودکار (تا ۴۸۰p) — کم‌مصرف" : "کیفیت تا " + value + "p تنظیم و ذخیره شد");
      },
      levels: function () {
        return P.hls ? P.levels : [];
      },
      currentLevel: currentLevelObj,
      heightOf: heightOf,
      allowsBackgroundTraffic: function () {
        if (navigator.onLine === false) return false;
        var connection = navigator.connection;
        if (connection && connection.saveData) return false;
        if (!P.channel || P.userPaused) return true;
        if (!P.started) return false;
        // Only when playback has a comfortable buffer.
        try {
          var b = video.buffered;
          for (var i = 0; i < b.length; i += 1) {
            if (b.start(i) <= video.currentTime && b.end(i) >= video.currentTime) {
              return b.end(i) - video.currentTime > 10;
            }
          }
        } catch (e) {
          return false;
        }
        return false;
      },
    };
  })();

  var hlsWaiters = null;
  function hlsReady(callback) {
    if (window.Hls) {
      callback(window.Hls);
      return;
    }
    if (hlsWaiters) {
      hlsWaiters.push(callback);
      return;
    }
    hlsWaiters = [callback];
    var settled = false;
    function flush() {
      if (settled) return;
      settled = true;
      var waiters = hlsWaiters;
      hlsWaiters = null;
      waiters.forEach(function (fn) {
        fn(window.Hls || null);
      });
    }
    var script = document.createElement("script");
    script.src = HLS_FALLBACK_URL;
    script.onload = flush;
    script.onerror = flush;
    setTimeout(flush, 15000);
    document.head.appendChild(script);
  }

  /* ------------------------------------------------------------------ *
   * UI pieces: now playing, quality, OSD, fullscreen, menus
   * ------------------------------------------------------------------ */

  var ui = (function () {
    var qualityInfo = null;

    function shownHeight(level) {
      return (level && player.heightOf(level)) || video.videoHeight || 0;
    }

    function nowPlaying(channel) {
      $("nowName").textContent = channel.name;
      var meta = [fa(channel.num) + "", channel.group].filter(Boolean).join(" · ");
      $("nowMeta").textContent = meta || "زنده";
      paintLogo($("nowLogo"), channel);
      $("nowBadge").textContent = "";
      updateFavorite();
      nowStatus("در حال اتصال…", false);
    }

    function nowStatus(text, bad) {
      var channel = state.current;
      if (!channel) return;
      var parts = [text];
      if (channel.group) parts.push(channel.group);
      $("nowMeta").textContent = parts.join(" · ");
      $("nowMeta").style.color = bad ? "var(--bad)" : "";
    }

    function setPlaying(playing) {
      setIcon($("playUse"), playing ? "i-pause" : "i-play");
    }

    function updateFavorite() {
      var fav = state.current && isFavorite(state.current.id);
      setIcon($("favUse"), fav ? "i-star-fill" : "i-star");
      $("favBtn").classList.toggle("is-on", Boolean(fav));
      $("favBtn").setAttribute("aria-label", fav ? "حذف از محبوب‌ها" : "افزودن به محبوب‌ها");
    }

    function qualityState(info) {
      qualityInfo = info;
      var label = prefs.quality === "auto" ? "خودکار" : prefs.quality + "p";
      if (info && info.levels && info.levels.length === 1) {
        var single = shownHeight(info.levels[0]);
        label = single ? single + "p" : "ثابت";
      }
      $("qualityLabel").textContent = fa(label);
      var badge = $("nowBadge");
      badge.classList.toggle("is-warn", Boolean(info && info.onlyHigh));
      if (!info) {
        badge.textContent = "";
      } else if (info.onlyHigh) {
        badge.textContent = "فقط " + info.minHeight + "p · پرمصرف";
      }
    }

    function levelBadge(level) {
      if (qualityInfo && qualityInfo.onlyHigh) return;
      var height = shownHeight(level);
      if (!height) return;
      var mbps = level && level.bitrate ? " · " + (Math.round(level.bitrate / 100000) / 10) + "Mb" : "";
      var single = qualityInfo && qualityInfo.levels && qualityInfo.levels.length === 1;
      var badge = $("nowBadge");
      badge.classList.toggle("is-warn", Boolean(single && height > AUTO_MAX_HEIGHT));
      badge.textContent = single && height > AUTO_MAX_HEIGHT ? "فقط " + height + "p · پرمصرف" : height + "p" + mbps;
      if (single) $("qualityLabel").textContent = fa(height + "p");
    }

    function qualitySummary() {
      var height = shownHeight(player.currentLevel());
      return height ? height + "p · زنده" : "زنده";
    }

    return {
      nowPlaying: nowPlaying,
      nowStatus: nowStatus,
      setPlaying: setPlaying,
      updateFavorite: updateFavorite,
      qualityState: qualityState,
      levelBadge: levelBadge,
      qualitySummary: qualitySummary,
    };
  })();

  var osd = (function () {
    var timer = null;
    return {
      show: function (channel, meta) {
        clearTimeout(timer);
        $("osdNum").textContent = fa(channel.num || "");
        paintLogo($("osdLogo"), channel);
        $("osdName").textContent = channel.name;
        $("osdMeta").textContent = meta || "";
        setHidden($("osd"), false);
        if (fullscreen.active) fullscreen.showUi();
        timer = setTimeout(function () {
          setHidden($("osd"), true);
        }, 3500);
      },
    };
  })();

  /* ---------- Back-key layers (fullscreen, menus, dialogs) ---------- */

  var layers = (function () {
    var stack = [];
    var ignorePops = 0;

    function open(name, close) {
      stack.push({ name: name, close: close });
      try {
        history.pushState({ mowj: stack.length }, "");
      } catch (e) {
        /* history may be unavailable in some embedded browsers */
      }
    }

    function closeTop(fromPop) {
      var layer = stack.pop();
      if (!layer) return false;
      layer.close();
      if (!fromPop) {
        ignorePops += 1;
        try {
          history.back();
        } catch (e) {
          ignorePops -= 1;
        }
      }
      return true;
    }

    function close(name) {
      for (var i = stack.length - 1; i >= 0; i -= 1) {
        if (stack[i].name === name) {
          while (stack.length > i) closeTop(false);
          return true;
        }
      }
      return false;
    }

    window.addEventListener("popstate", function () {
      if (ignorePops > 0) {
        ignorePops -= 1;
        return;
      }
      closeTop(true);
    });

    return {
      open: open,
      close: close,
      closeTop: closeTop,
      top: function () {
        return stack.length ? stack[stack.length - 1].name : "";
      },
      has: function (name) {
        for (var i = 0; i < stack.length; i += 1) if (stack[i].name === name) return true;
        return false;
      },
    };
  })();

  /* ---------- Fullscreen ---------- */

  var fullscreen = (function () {
    var api = { active: false };
    var uiTimer = null;
    var nativeRequested = false;
    var app = document.body;

    function nativeElement() {
      return document.fullscreenElement || document.webkitFullscreenElement || null;
    }

    api.showUi = function () {
      if (!api.active) return;
      app.classList.add("show-ui");
      clearTimeout(uiTimer);
      uiTimer = setTimeout(function () {
        if ($("bar").contains(document.activeElement)) $("player").focus();
        app.classList.remove("show-ui");
      }, 4000);
    };

    function doExit() {
      api.active = false;
      clearTimeout(uiTimer);
      app.classList.remove("is-full");
      app.classList.remove("show-ui");
      if (nativeElement() && nativeRequested) {
        var exit = document.exitFullscreen || document.webkitExitFullscreen;
        try {
          if (exit) exit.call(document);
        } catch (e) {
          /* ignore */
        }
      }
      nativeRequested = false;
      list.focusCurrent();
    }

    api.enter = function () {
      if (api.active) return;
      api.active = true;
      app.classList.add("is-full");
      layers.open("full", doExit);
      $("player").focus();
      var root = document.documentElement;
      var request = root.requestFullscreen || root.webkitRequestFullscreen;
      if (request) {
        try {
          var result = request.call(root);
          nativeRequested = true;
          if (result && result.catch) {
            result.catch(function () {
              nativeRequested = false;
            });
          }
        } catch (e) {
          nativeRequested = false;
        }
      }
      api.showUi();
      if (state.current) osd.show(state.current, ui.qualitySummary());
    };

    api.exit = function () {
      if (api.active) layers.close("full");
    };

    api.toggle = function () {
      if (api.active) api.exit();
      else api.enter();
    };

    function onNativeChange() {
      if (!nativeElement() && nativeRequested && api.active) {
        nativeRequested = false;
        api.exit();
      }
    }

    document.addEventListener("fullscreenchange", onNativeChange);
    document.addEventListener("webkitfullscreenchange", onNativeChange);
    $("player").addEventListener("mousemove", api.showUi);
    $("player").addEventListener("touchstart", api.showUi);
    $("player").addEventListener("dblclick", api.toggle);
    return api;
  })();

  /* ---------- Quality menu ---------- */

  var qualityMenu = (function () {
    var menu = $("qualityMenu");
    var returnFocus = null;

    function item(label, value, detail, selected) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "menu-item" + (selected ? " is-selected" : "");
      button.setAttribute("role", "menuitemradio");
      button.setAttribute("aria-checked", selected ? "true" : "false");
      button.setAttribute("data-nav", "");
      var span = document.createElement("span");
      span.textContent = label;
      button.appendChild(span);
      if (detail) {
        var small = document.createElement("small");
        small.textContent = detail;
        button.appendChild(small);
      }
      button.addEventListener("click", function () {
        layers.close("menu");
        player.setQuality(value);
      });
      return button;
    }

    function build() {
      menu.textContent = "";
      var title = document.createElement("div");
      title.className = "menu-title";
      menu.appendChild(title);
      var levels = player.levels();
      if (!levels.length) {
        title.textContent = state.current
          ? "این منبع انتخاب کیفیت ندارد (کیفیت ثابت)"
          : "کیفیت پیش‌فرض: خودکار تا ۴۸۰p";
      } else if (levels.length === 1) {
        title.textContent = "این شبکه فقط یک کیفیت دارد";
      } else {
        title.textContent = "کیفیت تصویر · انتخابت ذخیره می‌شود";
      }
      menu.appendChild(item("خودکار · کم‌مصرف (تا ۴۸۰p)", "auto", "", prefs.quality === "auto"));
      var heights = [];
      levels.forEach(function (level) {
        var h = player.heightOf(level);
        if (h && heights.indexOf(h) === -1) heights.push(h);
      });
      if (!levels.length || (levels.length > 1 && !heights.length)) heights = [360, 480, 720, 1080];
      heights.sort(function (a, b) {
        return b - a;
      });
      heights.forEach(function (h) {
        var detail = h > 480 ? "مصرف بیشتر" : "";
        levels.forEach(function (level) {
          if (player.heightOf(level) === h && level.bitrate && !detail) {
            detail = (Math.round(level.bitrate / 100000) / 10) + " Mbps";
          }
        });
        menu.appendChild(item(h + "p", String(h), detail, String(prefs.quality) === String(h)));
      });
    }

    function position(anchor) {
      var rect = anchor.getBoundingClientRect();
      setHidden(menu, false);
      var height = menu.offsetHeight;
      var width = menu.offsetWidth;
      var top = rect.top - height - 8;
      if (top < 8) top = Math.min(window.innerHeight - height - 8, rect.bottom + 8);
      var left = rect.left + rect.width / 2 - width / 2;
      left = Math.max(8, Math.min(window.innerWidth - width - 8, left));
      menu.style.top = Math.max(8, top) + "px";
      menu.style.left = left + "px";
    }

    function close() {
      setHidden(menu, true);
      if (returnFocus) returnFocus.focus();
    }

    return {
      open: function (anchor) {
        returnFocus = anchor;
        build();
        position(anchor);
        layers.open("menu", close);
        var selected = menu.querySelector(".is-selected") || menu.querySelector(".menu-item");
        if (selected) selected.focus();
      },
      el: menu,
    };
  })();

  /* ---------- Help ---------- */

  function openHelp() {
    var returnFocus = document.activeElement;
    setHidden($("helpModal"), false);
    layers.open("help", function () {
      setHidden($("helpModal"), true);
      if (returnFocus && returnFocus.focus) returnFocus.focus();
    });
    $("helpClose").focus();
  }

  /* ---------- Sleep timer ---------- */

  var sleepTimer = null;
  function updateSleepLabel() {
    var left = prefs.sleepUntil - now();
    var on = left > 0;
    $("sleepLabel").textContent = on ? fa(Math.ceil(left / 60000)) + "′" : "";
    $("sleepBtn").classList.toggle("is-on", on);
  }

  function scheduleSleep() {
    clearTimeout(sleepTimer);
    var left = prefs.sleepUntil - now();
    if (left <= 0) {
      prefs.sleepUntil = 0;
      updateSleepLabel();
      return;
    }
    sleepTimer = setTimeout(function () {
      prefs.sleepUntil = 0;
      savePrefs();
      player.stop();
      fullscreen.exit();
      updateSleepLabel();
      toast("تایمر خواب: پخش متوقف شد", 6000);
    }, left);
    updateSleepLabel();
  }

  function cycleSleep() {
    var left = Math.ceil((prefs.sleepUntil - now()) / 60000);
    var next = left <= 0 ? 30 : left <= 30 ? 60 : left <= 60 ? 90 : 0;
    prefs.sleepUntil = next ? now() + next * 60000 : 0;
    savePrefs();
    scheduleSleep();
    toast(next ? "پخش تا " + fa(next) + " دقیقه دیگر متوقف می‌شود" : "تایمر خواب خاموش شد");
  }

  /* ---------- Clock ---------- */

  var clockFormat = null;
  try {
    clockFormat = new Intl.DateTimeFormat("fa-IR", {
      timeZone: "Asia/Tehran",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch (e) {
    clockFormat = null;
  }

  function updateClock() {
    var d = new Date();
    var text = clockFormat
      ? clockFormat.format(d)
      : fa(("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2));
    $("clock").textContent = text;
    $("osdClock").textContent = text;
    updateSleepLabel();
  }

  /* ------------------------------------------------------------------ *
   * Volume
   * ------------------------------------------------------------------ */

  function syncVolume() {
    var muted = video.muted || video.volume === 0;
    setIcon($("muteUse"), muted ? "i-mute" : "i-vol");
    $("volVal").textContent = muted ? "" : fa(Math.round(video.volume * 100));
  }

  function setVolume(value) {
    video.volume = Math.max(0, Math.min(1, Math.round(value * 10) / 10));
    video.muted = video.volume === 0;
    prefs.volume = video.volume;
    prefs.muted = video.muted;
    savePrefs();
    syncVolume();
    toast("صدا " + fa(Math.round(video.volume * 100)) + "٪", 1200);
  }

  function toggleMute() {
    if (video.muted || video.volume === 0) {
      if (video.volume === 0) video.volume = 0.5;
      video.muted = false;
    } else {
      video.muted = true;
    }
    prefs.muted = video.muted;
    prefs.volume = video.volume;
    savePrefs();
    syncVolume();
  }

  /* ------------------------------------------------------------------ *
   * Categories, search and loading
   * ------------------------------------------------------------------ */

  /* Two fixed rows on a TV: Persian lists and topics first, regions below.
   * (Phones show both rows side by side in one swipeable strip.) */
  function renderCategories() {
    var nav = $("cats");
    nav.textContent = "";
    var rows = { main: document.createElement("div"), region: document.createElement("div") };
    rows.main.className = "cats-row";
    rows.region.className = "cats-row";
    var lastGroup = "";
    CATEGORIES.forEach(function (cat) {
      if (cat.favorites && !prefs.favorites.length) return;
      var group = cat.group || "";
      var row = group === "region" ? rows.region : rows.main;
      if (group && group !== lastGroup) {
        // Topics follow the Persian lists after a thin divider; the region row gets a label.
        var mark = document.createElement("span");
        mark.setAttribute("aria-hidden", "true");
        if (row.childNodes.length) {
          mark.className = "cats-sep";
        } else {
          mark.className = "cats-label";
          mark.textContent = CATEGORY_GROUPS[group];
        }
        row.appendChild(mark);
      }
      lastGroup = group;
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip" + (state.cat && state.cat.key === cat.key ? " is-active" : "");
      chip.setAttribute("data-nav", "");
      chip.setAttribute("data-cat", cat.key);
      chip.textContent = (cat.favorites ? "★ " : "") + cat.title;
      if (group) chip.setAttribute("aria-label", CATEGORY_GROUPS[group] + ": " + cat.title);
      if (cat.note) {
        var small = document.createElement("small");
        small.textContent = cat.note;
        chip.appendChild(small);
      }
      chip.addEventListener("click", function () {
        loadCategory(cat.key, false);
      });
      row.appendChild(chip);
    });
    nav.appendChild(rows.main);
    nav.appendChild(rows.region);
  }

  function showListMessage(title, text, withRetry) {
    var box = $("listMsg");
    box.textContent = "";
    var strong = document.createElement("strong");
    strong.textContent = title;
    box.appendChild(strong);
    if (text) {
      var span = document.createElement("span");
      span.textContent = text;
      box.appendChild(span);
    }
    if (withRetry) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "btn primary";
      button.setAttribute("data-nav", "");
      button.textContent = "دوباره تلاش کن";
      button.addEventListener("click", function () {
        loadCategory(state.cat.key, true);
      });
      box.appendChild(button);
    }
    setHidden(box, false);
    setHidden(list.el, true);
    list.updatePager();
  }

  function updateFoot(savedAt) {
    var foot = $("listFootText");
    var parts = [];
    if (savedAt === null) savedAt = state.savedAt;
    else state.savedAt = savedAt;
    var dimmed = 0;
    state.channels.forEach(function (channel) {
      if (rankOf(channel.id) === 2) dimmed += 1;
    });
    if (dimmed) parts.push(fa(dimmed) + " شبکهٔ کم‌رنگ این‌جا معمولاً پخش نمی‌شود");
    if (hiddenCount && state.cat && !state.cat.favorites) {
      parts.push(fa(hiddenCount) + " شبکهٔ غیرقابل‌پخش در مرورگر پنهان شد");
    }
    if (savedAt) {
      var hours = Math.floor((now() - savedAt) / 3600000);
      parts.push(hours < 1 ? "فهرست به‌روز" : "فهرست " + fa(hours) + " ساعت پیش");
    }
    foot.textContent = parts.join(" · ");
  }

  function applyView(keepFocus) {
    var query = normalize(state.query);
    state.view = query
      ? state.channels.filter(function (channel) {
          return normalize(channel.name + " " + channel.group + " " + channel.id).indexOf(query) !== -1 ||
            String(channel.num) === query;
        })
      : state.channels.slice();
    $("count").textContent = fa(state.view.length);
    setHidden($("scanBtn"), !state.channels.length);
    if (!state.view.length) {
      if (query) showListMessage("شبکه‌ای پیدا نشد", "عبارت دیگری را امتحان کن", false);
      else if (hiddenCount) {
        showListMessage(
          "شبکه‌های این دسته در مرورگر پخش نمی‌شوند",
          fa(hiddenCount) + " شبکه فقط از سایت خود پخش‌کننده (مثلاً تلوبیون) یا با لینک ناامن پخش می‌شوند و منبع، پخش در سایت‌های دیگر را مسدود کرده است.",
          false,
        );
      } else showListMessage("این فهرست خالی است", "", false);
      return;
    }
    setHidden($("listMsg"), true);
    setHidden(list.el, false);
    var index = 0;
    var target = state.current ? state.current.id : prefs.lastId;
    var found = list.indexOfId(target);
    if (found >= 0 && !query) index = found;
    list.reset(index);
    if (keepFocus) list.focus(index);
  }

  function adoptPendingFavorites(channels) {
    if (!prefs.pendingFavoriteIds.length) return;
    var changed = false;
    channels.forEach(function (channel) {
      var at = prefs.pendingFavoriteIds.indexOf(channel.id);
      if (at !== -1 && !isFavorite(channel.id)) {
        prefs.favorites.push(favoriteRecord(channel));
        prefs.pendingFavoriteIds.splice(at, 1);
        changed = true;
      }
    });
    if (changed) {
      savePrefs();
      renderCategories();
    }
  }

  function setChannels(channels, keepFocus, savedAt) {
    scan.stop();
    state.channels = orderChannels(channels);
    adoptPendingFavorites(channels);
    applyView(keepFocus);
    updateFoot(savedAt);
  }

  function loadCategory(key, forceRefresh) {
    var cat = categoryByKey(key) || categoryByKey("fas");
    if (cat.favorites && !prefs.favorites.length) cat = categoryByKey("fas");
    var focusInList = list.hasFocus() || !document.activeElement || document.activeElement === document.body;
    state.cat = cat;
    state.query = "";
    $("search").value = "";
    prefs.cat = cat.key;
    savePrefs();
    renderCategories();
    state.loadToken += 1;
    var token = state.loadToken;

    if (cat.favorites) {
      hiddenCount = 0;
      setChannels(prefs.favorites.slice(), focusInList, 0);
      return Promise.resolve();
    }

    showListMessage("در حال دریافت فهرست «" + cat.title + "»…", "", false);
    $("count").textContent = "";
    return cacheGet(cat.cacheKey || cat.key).then(function (cached) {
      if (token !== state.loadToken) return null;
      var fresh = cached && cached.text && now() - cached.t < LIST_FRESH_MS;
      if (cached && cached.text) {
        setChannels(parseM3u(cached.text, cat), focusInList, cached.t);
        if (fresh && !forceRefresh) return null; // no network at all
      }
      if (navigator.onLine === false) {
        if (!cached) showListMessage("اینترنت وصل نیست", "پس از اتصال دوباره تلاش کن", true);
        return null;
      }
      return fetchCategory(cat, forceRefresh).then(function (text) {
        if (token !== state.loadToken) return;
        if (text.indexOf("#EXTINF") === -1) throw new Error("bad playlist");
        cachePut(cat.cacheKey || cat.key, text);
        if (cached && cached.text === text) {
          updateFoot(now());
          return;
        }
        var refocus = list.hasFocus();
        setChannels(parseM3u(text, cat), refocus || (!cached && focusInList), now());
      }).catch(function () {
        if (token !== state.loadToken) return;
        if (cached && cached.text) {
          toast("فهرست تازه دریافت نشد؛ نسخهٔ ذخیره‌شده نمایش داده می‌شود");
          return;
        }
        showListMessage("فهرست دریافت نشد", "اتصال اینترنت را بررسی کن", true);
      });
    });
  }

  function toggleFavorite() {
    var channel = state.current;
    if (!channel) {
      toast("ابتدا یک شبکه پخش کن");
      return;
    }
    if (isFavorite(channel.id)) {
      prefs.favorites = prefs.favorites.filter(function (fav) {
        return fav.id !== channel.id;
      });
      toast("از محبوب‌ها حذف شد");
    } else {
      prefs.favorites.push(favoriteRecord(channel));
      toast("به محبوب‌ها اضافه شد ★");
    }
    savePrefs();
    ui.updateFavorite();
    renderCategories();
    if (state.cat && state.cat.favorites) {
      if (!prefs.favorites.length) loadCategory("fas", false);
      else loadCategory("fav", false);
    } else {
      list.reset(list.getFocusIndex());
    }
  }

  /* ------------------------------------------------------------------ *
   * Channel switching and number entry
   * ------------------------------------------------------------------ */

  function switchChannel(delta) {
    if (!state.view.length) return;
    var index = state.current ? list.indexOfId(state.current.id) : -1;
    if (index < 0) index = list.getFocusIndex() - (delta > 0 ? 1 : -1);
    var next = (index + delta + state.view.length) % state.view.length;
    // CH+/CH- step over channels that usually fail here (unless every channel does).
    for (var tries = 0; tries < state.view.length && rankOf(state.view[next].id) === 2; tries += 1) {
      next = (next + delta + state.view.length) % state.view.length;
    }
    var channel = state.view[next];
    player.play(channel);
    if (fullscreen.active) {
      list.reset(next);
    } else if (list.hasFocus()) {
      list.focus(next);
    } else {
      list.reset(next);
    }
  }

  var numpad = (function () {
    var buffer = "";
    var timer = null;

    function commit() {
      var number = Number(buffer);
      buffer = "";
      setHidden($("numpad"), true);
      if (!number) return;
      var channel = null;
      for (var i = 0; i < state.channels.length; i += 1) {
        if (state.channels[i].num === number) channel = state.channels[i];
      }
      if (!channel) {
        toast("شبکهٔ شمارهٔ " + fa(number) + " وجود ندارد");
        return;
      }
      if (state.query) {
        state.query = "";
        $("search").value = "";
        applyView(false);
      }
      var index = list.indexOfId(channel.id);
      player.play(channel);
      if (list.hasFocus()) list.focus(index);
      else list.reset(index);
    }

    return {
      push: function (digit) {
        if (buffer.length >= 4) buffer = "";
        buffer += String(digit);
        $("numpad").textContent = fa(buffer) + "‒";
        setHidden($("numpad"), false);
        clearTimeout(timer);
        timer = setTimeout(commit, buffer.length >= 3 ? 700 : 1500);
      },
      active: function () {
        return buffer.length > 0;
      },
      commitNow: function () {
        clearTimeout(timer);
        commit();
      },
    };
  })();

  /* ------------------------------------------------------------------ *
   * Spatial navigation for the D-pad
   * ------------------------------------------------------------------ */

  function navScope() {
    var top = layers.top();
    if (top === "menu") return qualityMenu.el;
    if (top === "help") return $("helpModal");
    if (top === "full") return $("player");
    return document.body;
  }

  function navCandidates(scope) {
    var nodes = scope.querySelectorAll("[data-nav]");
    var out = [];
    for (var i = 0; i < nodes.length; i += 1) {
      if (isVisible(nodes[i])) out.push(nodes[i]);
    }
    return out;
  }

  function moveFocus(direction) {
    var scope = navScope();
    var from = document.activeElement;
    if (!from || from === document.body || !scope.contains(from)) {
      var first = navCandidates(scope)[0];
      if (scope === document.body && state.view.length) list.focusCurrent();
      else if (first) first.focus();
      return true;
    }
    var source = from.getBoundingClientRect();
    var sx = source.left + source.width / 2;
    var sy = source.top + source.height / 2;
    var best = null;
    var bestScore = Infinity;
    navCandidates(scope).forEach(function (el) {
      if (el === from || el.contains(from)) return;
      if (el === list.el && list.el.contains(from)) return;
      var r = el.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top + r.height / 2;
      var main;
      var cross;
      if (direction === "left" || direction === "right") {
        if (direction === "left" ? cx >= sx - 1 : cx <= sx + 1) return;
        main = direction === "left" ? Math.max(0, source.left - r.right) : Math.max(0, r.left - source.right);
        cross = Math.max(0, Math.max(r.top, source.top) - Math.min(r.bottom, source.bottom));
        if (r.bottom >= source.top && r.top <= source.bottom) cross = 0;
        else cross = Math.min(Math.abs(r.top - source.bottom), Math.abs(source.top - r.bottom));
      } else {
        if (direction === "up" ? cy >= sy - 1 : cy <= sy + 1) return;
        main = direction === "up" ? Math.max(0, source.top - r.bottom) : Math.max(0, r.top - source.bottom);
        if (r.right >= source.left && r.left <= source.right) cross = 0;
        else cross = Math.min(Math.abs(r.left - source.right), Math.abs(source.left - r.right));
      }
      var score = main + cross * 3 + Math.abs(direction === "left" || direction === "right" ? cy - sy : cx - sx) * 0.05;
      if (score < bestScore) {
        bestScore = score;
        best = el;
      }
    });
    if (!best) return false;
    // Entering the category row from below lands on the selected category.
    if ((direction === "up" || direction === "down") && best.classList.contains("chip") &&
      !from.classList.contains("chip")) {
      best = $("cats").querySelector(".chip.is-active") || best;
    }
    if (best === list.el) list.focusCurrent();
    else best.focus();
    return true;
  }

  /* ------------------------------------------------------------------ *
   * Keyboard / remote
   * ------------------------------------------------------------------ */

  var KEY = {
    back: [8, 27, 461, 10009],
    chUp: [33, 427],
    chDown: [34, 428],
    playPause: [179, 10252],
    play: [415, 250],
    pause: [19],
    stop: [178, 413],
  };

  function keyIs(event, codes, names) {
    var code = event.keyCode || event.which;
    if (codes.indexOf(code) !== -1) return true;
    return names ? names.indexOf(event.key) !== -1 : false;
  }

  function digitOf(event) {
    var code = event.keyCode || event.which;
    if (code >= 48 && code <= 57) return code - 48;
    if (code >= 96 && code <= 105) return code - 96;
    return -1;
  }

  function directionOf(event) {
    var key = event.key;
    var code = event.keyCode || event.which;
    if (key === "ArrowUp" || key === "Up" || code === 38) return "up";
    if (key === "ArrowDown" || key === "Down" || code === 40) return "down";
    if (key === "ArrowLeft" || key === "Left" || code === 37) return "left";
    if (key === "ArrowRight" || key === "Right" || code === 39) return "right";
    return "";
  }

  function isEnter(event) {
    var code = event.keyCode || event.which;
    return event.key === "Enter" || code === 13;
  }

  function registerTvKeys() {
    // Samsung Tizen web apps only deliver media/colour/number keys after registering them.
    try {
      var input = window.tizen && window.tizen.tvinputdevice;
      if (!input) return;
      ["ChannelUp", "ChannelDown", "MediaPlayPause", "MediaPlay", "MediaPause", "MediaStop",
        "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].forEach(function (name) {
        try {
          input.registerKey(name);
        } catch (e) {
          /* not available on this model */
        }
      });
    } catch (e) {
      /* not a Tizen app */
    }
  }

  function onKeyDown(event) {
    var target = event.target;
    var inInput = target && target.tagName === "INPUT";
    var direction = directionOf(event);
    var top = layers.top();

    // Back
    if (keyIs(event, KEY.back, ["Escape", "GoBack", "BrowserBack", "Back"])) {
      var code = event.keyCode || event.which;
      if (inInput && code === 8) return; // Backspace edits text
      if (top) {
        event.preventDefault();
        layers.closeTop(false);
        return;
      }
      if (inInput) {
        event.preventDefault();
        if (target.value) {
          target.value = "";
          state.query = "";
          applyView(false);
        }
        list.focusCurrent();
        return;
      }
      if (state.query) {
        event.preventDefault();
        state.query = "";
        $("search").value = "";
        applyView(true);
        return;
      }
      if (code === 8) event.preventDefault(); // never navigate away on Backspace
      return; // let the TV close the browser / go back
    }

    if (top === "help" || top === "menu") {
      if (direction) {
        event.preventDefault();
        moveFocus(direction);
      }
      return;
    }

    if (inInput) {
      if (direction === "down" || isEnter(event)) {
        event.preventDefault();
        if (isEnter(event)) target.blur();
        list.focusCurrent();
      } else if (direction === "up") {
        event.preventDefault();
        moveFocus("up");
      }
      return;
    }

    // Media keys
    if (keyIs(event, KEY.playPause, ["MediaPlayPause"]) || keyIs(event, KEY.play, ["MediaPlay"]) ||
      keyIs(event, KEY.pause, ["MediaPause"])) {
      event.preventDefault();
      player.togglePause();
      return;
    }
    if (keyIs(event, KEY.stop, ["MediaStop"])) {
      event.preventDefault();
      if (!player.isPaused()) player.togglePause();
      return;
    }
    if (keyIs(event, KEY.chUp, ["ChannelUp", "PageUp"])) {
      event.preventDefault();
      switchChannel(1);
      return;
    }
    if (keyIs(event, KEY.chDown, ["ChannelDown", "PageDown"])) {
      event.preventDefault();
      switchChannel(-1);
      return;
    }

    var digit = digitOf(event);
    if (digit >= 0 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      numpad.push(digit);
      return;
    }
    if (isEnter(event) && numpad.active()) {
      event.preventDefault();
      numpad.commitNow();
      return;
    }

    // Fullscreen: up/down zap, left/right/OK reveal the controls.
    if (top === "full") {
      fullscreen.showUi();
      var inBar = $("bar").contains(target);
      if (direction === "up" || direction === "down") {
        event.preventDefault();
        if (inBar && direction === "up") {
          $("player").focus();
          return;
        }
        if (!inBar) switchChannel(direction === "up" ? -1 : 1);
        return;
      }
      if (!inBar && (direction === "left" || direction === "right" || isEnter(event))) {
        event.preventDefault();
        $("playBtn").focus();
        return;
      }
      if (inBar && direction) {
        event.preventDefault();
        moveFocus(direction);
      }
      return;
    }

    // Channel list: up/down walk the list, OK plays.
    if (target && target.classList && target.classList.contains("row")) {
      var index = Number(target.getAttribute("data-i"));
      if (direction === "down") {
        event.preventDefault();
        if (index < state.view.length - 1) list.focus(index + 1);
        else if (isVisible($("pager"))) $("pageNext").focus(); // the buttons right below the list
        else if (isVisible($("scanBtn"))) $("scanBtn").focus();
        return;
      }
      if (direction === "up") {
        event.preventDefault();
        if (index > 0) list.focus(index - 1);
        else $("search").focus();
        return;
      }
      if (isEnter(event)) {
        event.preventDefault();
        list.activate(index);
        return;
      }
    }

    if (target === $("player")) {
      if (isEnter(event)) {
        event.preventDefault();
        if (state.current) fullscreen.enter();
        else list.activate(list.getFocusIndex());
        return;
      }
    }

    if (direction === "up" && $("bar").contains(target)) {
      event.preventDefault();
      $("player").focus();
      return;
    }

    if (direction) {
      event.preventDefault();
      moveFocus(direction);
    }
  }

  /* ------------------------------------------------------------------ *
   * Wiring
   * ------------------------------------------------------------------ */

  function bind() {
    document.addEventListener("keydown", onKeyDown);

    var search = $("search");
    var searchTimer = null;
    search.setAttribute("data-nav", "");
    search.addEventListener("input", function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        state.query = search.value;
        applyView(false);
      }, 220);
    });
    search.addEventListener("focus", function () {
      search.parentNode.classList.add("is-focus");
    });
    search.addEventListener("blur", function () {
      search.parentNode.classList.remove("is-focus");
    });

    list.el.setAttribute("data-nav", "");
    $("player").setAttribute("data-nav", "");
    ["sleepBtn", "helpBtn", "playBtn", "prevBtn", "nextBtn", "volDownBtn", "muteBtn", "volUpBtn",
      "qualityBtn", "favBtn", "fullBtn", "retryBtn", "skipBtn", "helpClose"].forEach(function (id) {
      $(id).setAttribute("data-nav", "");
    });

    $("playBtn").addEventListener("click", function () {
      player.togglePause();
    });
    $("prevBtn").addEventListener("click", function () {
      switchChannel(-1);
    });
    $("nextBtn").addEventListener("click", function () {
      switchChannel(1);
    });
    $("volDownBtn").addEventListener("click", function () {
      setVolume((video.muted ? 0 : video.volume) - 0.1);
    });
    $("volUpBtn").addEventListener("click", function () {
      setVolume((video.muted ? 0 : video.volume) + 0.1);
    });
    $("muteBtn").addEventListener("click", toggleMute);
    $("qualityBtn").addEventListener("click", function () {
      qualityMenu.open($("qualityBtn"));
    });
    $("favBtn").addEventListener("click", toggleFavorite);
    $("fullBtn").addEventListener("click", fullscreen.toggle);
    $("scanBtn").addEventListener("click", scan.start);
    $("helpBtn").addEventListener("click", openHelp);
    $("helpClose").addEventListener("click", function () {
      layers.close("help");
    });
    $("helpModal").addEventListener("click", function (event) {
      if (event.target === $("helpModal")) layers.close("help");
    });
    $("sleepBtn").addEventListener("click", cycleSleep);
    $("player").addEventListener("click", function (event) {
      if (event.target === video || event.target === $("player")) {
        if (fullscreen.active) fullscreen.showUi();
        else if (!state.current) list.activate(list.getFocusIndex());
      }
    });
    document.addEventListener("click", function (event) {
      if (layers.top() === "menu" && !qualityMenu.el.contains(event.target) && event.target !== $("qualityBtn") &&
        !$("qualityBtn").contains(event.target)) {
        layers.close("menu");
      }
    });
    $("bar").addEventListener("focusin", fullscreen.showUi);
  }

  function init() {
    if (!Element.prototype.closest) {
      Element.prototype.closest = function (selector) {
        var el = this;
        var matches = el.matches || el.webkitMatchesSelector || el.msMatchesSelector;
        while (el && el.nodeType === 1) {
          if (matches.call(el, selector)) return el;
          el = el.parentElement;
        }
        return null;
      };
    }
    cleanupOldStorage();
    registerTvKeys();
    video.volume = prefs.volume;
    video.muted = prefs.muted;
    syncVolume();
    ui.qualityState(null);
    bind();
    updateClock();
    setInterval(updateClock, 20000);
    scheduleSleep();
    loadCategory(prefs.cat, false).then(function () {
      if (!document.activeElement || document.activeElement === document.body) list.focusCurrent();
    });
  }

  init();
})();

/* Mowj TV — channel lists, shared by the app and scripts/build-data.mjs so a
 * list read online and the bundled copy come out exactly the same.
 * Plain ES5 for older TV browsers. */
(function (root) {
  "use strict";

  var MAX_CHANNELS = 1200; // a TV list is browsed page by page; past this it stops being useful

  function attr(line, name) {
    var match = line.match(new RegExp(name + '="([^"]*)"'));
    return match ? match[1] : "";
  }

  // M3U text -> [{ id, logo, group, title, ref, ua, url }]
  function parseM3u(text) {
    var entries = [];
    var cur = null;
    var lines = String(text || "").split(/\r?\n/);
    for (var i = 0; i < lines.length; i += 1) {
      var line = lines[i].trim();
      if (!line) continue;
      if (line.indexOf("#EXTINF") === 0) {
        var comma = line.lastIndexOf(",");
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
      if (line.indexOf("#EXTVLCOPT:http-referrer=") === 0) cur.ref = line.slice(line.indexOf("=") + 1);
      else if (line.indexOf("#EXTVLCOPT:http-user-agent=") === 0) cur.ua = line.slice(line.indexOf("=") + 1);
      else if (line.charAt(0) !== "#") {
        cur.url = line;
        entries.push(cur);
        cur = null;
      }
    }
    return entries;
  }

  // Can a browser on an HTTPS page play this link at all?
  function playable(url, ref, ua, corsLockedHosts) {
    if (!/^https:\/\//i.test(url)) return false; // HTTP is blocked on an HTTPS page
    if (ref || ua) return false; // browsers cannot send these headers
    if (/\.mpd(?:$|[?#])/i.test(url)) return false; // DASH is not supported
    var host = (url.split("/")[2] || "").toLowerCase();
    return (corsLockedHosts || []).indexOf(host) === -1;
  }

  function baseId(id) {
    return String(id || "").split("@")[0];
  }

  // File name of a channel's bundled logo.
  function logoName(base) {
    return base ? String(base).replace(/[^A-Za-z0-9._-]/g, "_") + ".webp" : "";
  }

  function clean(value) {
    return String(value || "").replace(/["\r\n]/g, "").trim();
  }

  function isGeo(title) {
    return /\[Geo-blocked\]/i.test(title);
  }

  function isPart(title) {
    return /\[Not 24\/7\]/i.test(title);
  }

  /* Entries of one category (from one or more playlists) ->
   * { c: rows, hidden, playable }. Row layout:
   * [id, name, logo file, group, height, flags (1 geo-blocked, 2 not 24/7), [urls]]
   * options: corsLockedHosts, logoFor(base, logoUrl) -> file name or "" */
  function buildRows(entries, options) {
    var order = [];
    var byKey = {};
    for (var i = 0; i < entries.length; i += 1) {
      var entry = entries[i];
      var key = entry.id || "n:" + String(entry.title).toLowerCase();
      var channel = byKey[key];
      if (!channel) {
        channel = { head: entry, urls: [], logo: entry.logo };
        byKey[key] = channel;
        order.push(channel);
      }
      if (!channel.logo && entry.logo) channel.logo = entry.logo;
      if (playable(entry.url, entry.ref, entry.ua, options.corsLockedHosts) && channel.urls.indexOf(entry.url) === -1) {
        channel.urls.push(entry.url);
      }
    }
    var kept = order.filter(function (c) {
      return c.urls.length > 0;
    });
    var playableCount = kept.length;
    if (kept.length > MAX_CHANNELS) {
      // Keep the channels most likely to work: 24/7, not geo-blocked, with a logo.
      var score = function (c) {
        return (isGeo(c.head.title) ? 0 : 4) + (isPart(c.head.title) ? 0 : 2) + (c.logo ? 1 : 0);
      };
      var ranked = kept.map(function (c, index) {
        return { c: c, s: score(c), i: index };
      });
      ranked.sort(function (a, b) {
        return b.s - a.s || a.i - b.i;
      });
      var best = ranked.slice(0, MAX_CHANNELS).map(function (r) {
        return r.c;
      });
      kept = kept.filter(function (c) {
        return best.indexOf(c) !== -1;
      });
    }
    var rows = kept.map(function (c) {
      var title = c.head.title || "";
      var quality = title.match(/\((\d{3,4})[pi]\)/i);
      var name = title.replace(/\s*\(\d{3,4}[pi]\)/gi, "").replace(/\s*\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim();
      return [
        clean(c.head.id),
        clean(name),
        options.logoFor ? options.logoFor(baseId(c.head.id), c.logo) || "" : "",
        clean(String(c.head.group || "").split(";")[0]).toLowerCase(),
        quality ? Number(quality[1]) : 0,
        (isGeo(title) ? 1 : 0) | (isPart(title) ? 2 : 0),
        c.urls,
      ];
    });
    return { c: rows, hidden: order.length - playableCount, playable: playableCount, kept: kept };
  }

  /* Remote first, bundled copy as the fallback:
   * - a remote that failed recently (memory) is skipped without waiting;
   * - the remote gets one try of timeoutMs, then the local copy is used;
   * - only when both fail does the promise reject.
   * options: remote() / local() -> Promise, isUnreachable(), markUnreachable(),
   * timeoutMs, cancelRemote(), setTimeout, clearTimeout.
   * Resolves { source: "remote"|"local", value }. */
  function loadWithFallback(options) {
    var setTimer = options.setTimeout || function (fn, ms) {
      return root.setTimeout(fn, ms);
    };
    var clearTimer = options.clearTimeout || function (id) {
      root.clearTimeout(id);
    };

    function local() {
      return options.local().then(function (value) {
        return { source: "local", value: value };
      });
    }

    if (!options.remote || options.isUnreachable()) return local();

    return new Promise(function (resolve, reject) {
      var done = false;
      var timer = setTimer(function () {
        if (options.cancelRemote) options.cancelRemote(); // stop the slow download, it is not needed any more
        fallback();
      }, options.timeoutMs);

      function fallback() {
        if (done) return;
        done = true;
        clearTimer(timer);
        options.markUnreachable();
        local().then(resolve, reject);
      }

      options.remote().then(function (value) {
        if (done) return;
        done = true;
        clearTimer(timer);
        resolve({ source: "remote", value: value });
      }, fallback);
    });
  }

  root.MowjLists = {
    MAX_CHANNELS: MAX_CHANNELS,
    parseM3u: parseM3u,
    playable: playable,
    baseId: baseId,
    logoName: logoName,
    buildRows: buildRows,
    loadWithFallback: loadWithFallback,
  };
})(typeof window !== "undefined" ? window : this);

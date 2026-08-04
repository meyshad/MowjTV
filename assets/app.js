(function () {
  "use strict";

  var PLAYLISTS = {
    all: {
      title: "همه شبکه‌ها",
      description: "فهرست جهانی همه کشورها",
      mark: "همه",
      url: "https://iptv-org.github.io/iptv/index.m3u",
      requestTimeout: 40000,
    },
    provinces: {
      title: "شبکه‌های استانی",
      description: "استان‌ها و مراکز محلی ایران",
      mark: "استان",
      url: "https://iptv-org.github.io/iptv/countries/ir.m3u",
      provincialOnly: true,
    },
    fas: {
      title: "شبکه‌های فارسی",
      description: "ایران و فارسی‌زبانان جهان",
      mark: "FA",
      url: "https://iptv-org.github.io/iptv/languages/fas.m3u",
    },
    tr: {
      title: "شبکه‌های ترکیه",
      description: "شبکه‌های سراسری و محلی ترکیه",
      mark: "TR",
      url: "https://iptv-org.github.io/iptv/countries/tr.m3u",
    },
    mideast: {
      title: "خاورمیانه",
      description: "شبکه‌های منطقه",
      mark: "ME",
      url: "https://iptv-org.github.io/iptv/regions/mideast.m3u",
    },
    news: {
      title: "اخبار جهان",
      description: "شبکه‌های خبری بین‌المللی",
      mark: "خبر",
      url: "https://iptv-org.github.io/iptv/categories/news.m3u",
    },
    sports: {
      title: "ورزش جهان",
      description: "شبکه‌های ورزشی زنده",
      mark: "ورزش",
      url: "https://iptv-org.github.io/iptv/categories/sports.m3u",
    },
    documentary: {
      title: "مستند",
      description: "علم، طبیعت و تاریخ",
      mark: "DOC",
      url: "https://iptv-org.github.io/iptv/categories/documentary.m3u",
    },
    kids: {
      title: "کودک و نوجوان",
      description: "کارتون و برنامه‌های کودک",
      mark: "کودک",
      url: "https://iptv-org.github.io/iptv/categories/kids.m3u",
    },
    movies: {
      title: "فیلم و سینما",
      description: "شبکه‌های سینمایی جهان",
      mark: "فیلم",
      url: "https://iptv-org.github.io/iptv/categories/movies.m3u",
    },
  };

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

  var STREAMS_API = "https://iptv-org.github.io/api/streams.json";
  var ICON_CDN = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/icons/";
  function getGridConfig() {
    if (window.innerWidth > 860 && window.innerHeight >= 900) {
      return { columns: 2, rows: 5, size: 10 };
    }
    if (window.innerHeight < 700) {
      return { columns: 2, rows: 3, size: 6 };
    }
    return { columns: 2, rows: 4, size: 8 };
  }

  var initialGrid = getGridConfig();
  var PREFS_KEY = "mowj-tv-preferences-v1";
  var CACHE_PREFIX = "mowj-tv-playlist-v1-";
  var HEALTH_PREFIX = "mowj-tv-health-v1-";
  var CACHE_DB_NAME = "mowj-tv-cache-v2";
  var CACHE_DB_STORE = "playlists";
  var CACHE_DB_LIMIT = 6;
  var CACHE_DB_TEXT_LIMIT = 12000000;
  var LOCAL_PLAYLIST_CACHE_LIMIT = 600000;
  var LOCAL_HEALTH_CACHE_LIMIT = 180000;
  var HEALTH_TIMEOUT = 6000;
  var HEALTH_WORKERS = 2;
  var HEALTH_FULL_SCAN_LIMIT = 300;
  var HEALTH_SAMPLE_SIZE = 40;
  var HEALTH_SAMPLE_BUDGET = 120000;
  var HEALTH_FULL_BUDGET = 180000;
  var HEALTH_CACHE_LIMIT = 600;
  var AUTO_SCAN_INTERVAL = 15000;
  var AUTO_SCAN_SESSION_LIMIT = 40;
  var AUTO_SCAN_TIMEOUT = 4000;
  var AUTO_RETRY_DELAYS = [1500, 4000, 10000, 30000, 60000, 120000];
  var PLAYBACK_START_TIMEOUT = 15000;
  var PLAYBACK_WATCHDOG_INTERVAL = 6000;
  var PLAYBACK_WATCHDOG_STALE = 12000;
  var STALL_QUALITY_DELAY = 2500;
  var STALL_RECOVERY_DELAY = 9000;

  function byId(id) {
    return document.getElementById(id);
  }

  var ui = {
    clock: byId("clock"),
    date: byId("persianDate"),
    weekday: byId("persianWeekday"),
    day: byId("persianDay"),
    networkPill: byId("networkPill"),
    networkText: byId("networkText"),
    sleepButton: byId("sleepButton"),
    sleepLabel: byId("sleepLabel"),
    helpButton: byId("helpButton"),
    helpModal: byId("helpModal"),
    closeHelpButton: byId("closeHelpButton"),
    playerShell: byId("playerShell"),
    video: byId("video"),
    placeholder: byId("playerPlaceholder"),
    playerStatus: byId("playerStatus"),
    statusTitle: byId("statusTitle"),
    statusDetail: byId("statusDetail"),
    retryButton: byId("retryButton"),
    channelOsd: byId("channelOsd"),
    osdLogo: byId("osdLogo"),
    osdName: byId("osdName"),
    osdMeta: byId("osdMeta"),
    controls: byId("controls"),
    playButton: byId("playButton"),
    playIcon: byId("playIcon"),
    previousChannelButton: byId("previousChannelButton"),
    nextChannelButton: byId("nextChannelButton"),
    muteButton: byId("muteButton"),
    muteIcon: byId("muteIcon"),
    volumeUpButton: byId("volumeUpButton"),
    volumeDownButton: byId("volumeDownButton"),
    volumeRange: byId("volumeRange"),
    volumeValue: byId("volumeValue"),
    qualitySelect: byId("qualitySelect"),
    qualityBadge: byId("qualityBadge"),
    controlNote: byId("controlNote"),
    fullscreenButton: byId("fullscreenButton"),
    fullscreenButtonText: byId("fullscreenButtonText"),
    nowLogo: byId("nowLogo"),
    nowStatusDot: byId("nowStatusDot"),
    nowStatusText: byId("nowStatusText"),
    nowName: byId("nowName"),
    nowMeta: byId("nowMeta"),
    favoriteButton: byId("favoriteButton"),
    favoriteIcon: byId("favoriteIcon"),
    favoriteText: byId("favoriteText"),
    reloadButton: byId("reloadButton"),
    sourceButton: byId("sourceButton"),
    sourceName: byId("sourceName"),
    sourceDescription: byId("sourceDescription"),
    sourceMark: document.querySelector(".source-picker-mark"),
    sourceModal: byId("sourceModal"),
    sourceModalKicker: byId("sourceModalKicker"),
    sourceModalTitle: byId("sourceModalTitle"),
    sourceModalLead: byId("sourceModalLead"),
    sourceDefaultNote: byId("sourceDefaultNote"),
    closeSourceModalButton: byId("closeSourceModalButton"),
    sourceOptions: byId("sourceOptions"),
    initialScanModal: byId("initialScanModal"),
    initialScanCard: document.querySelector(".initial-scan-card"),
    initialScanKicker: byId("initialScanKicker"),
    initialScanNote: byId("initialScanNote"),
    closeInitialScanButton: byId("closeInitialScanButton"),
    initialScanTitle: byId("initialScanTitle"),
    initialScanDescription: byId("initialScanDescription"),
    initialScanProgress: byId("initialScanProgress"),
    initialScanProgressBar: byId("initialScanProgressBar"),
    initialScanPercent: byId("initialScanPercent"),
    initialScanStatus: byId("initialScanStatus"),
    skipInitialScanButton: byId("skipInitialScanButton"),
    finishInitialScanButton: byId("finishInitialScanButton"),
    searchInput: byId("searchInput"),
    clearSearchButton: byId("clearSearchButton"),
    listMessage: byId("listMessage"),
    channelList: byId("channelList"),
    channelCount: byId("channelCount"),
    pagination: byId("pagination"),
    prevPageButton: byId("prevPageButton"),
    nextPageButton: byId("nextPageButton"),
    pageCurrent: byId("pageCurrent"),
    pageTotal: byId("pageTotal"),
    playlistUpdated: byId("playlistUpdated"),
    healthSummary: byId("healthSummary"),
    healthCheckButton: byId("healthCheckButton"),
    healthButtonLabel: byId("healthButtonLabel"),
    healthStatusDot: byId("healthStatusDot"),
    refreshListButton: byId("refreshListButton"),
    toast: byId("toast"),
  };

  var prefs = loadPreferences();
  var cacheDbPromise = null;
  var state = {
    channels: [],
    filtered: [],
    activeSource: PLAYLISTS[prefs.defaultSource] ? prefs.defaultSource : "all",
    query: "",
    pageIndex: 0,
    pageSize: initialGrid.size,
    gridColumns: initialGrid.columns,
    gridRows: initialGrid.rows,
    currentChannel: null,
    focusedChannelId: null,
    hls: null,
    hlsLevels: [],
    levelCap: -1,
    playbackToken: 0,
    mediaAttemptToken: 0,
    playbackSuspendedForScan: false,
    playbackTransitioning: false,
    userPaused: false,
    isBuffering: false,
    hasPlaybackStarted: false,
    lastMediaTime: 0,
    playbackStableSince: 0,
    lastPlaybackProgressAt: 0,
    lastPlaybackStallAt: 0,
    autoQualityCeiling: 480,
    autoRetryAttempts: 0,
    autoRetryTimer: null,
    stallRecoveryTimer: null,
    stablePlaybackTimer: null,
    playbackStartTimer: null,
    playbackWatchdogTimer: null,
    sourceQueue: [],
    sourceIndex: 0,
    mediaRecoveryTried: false,
    nativeFallbackTried: false,
    alternativesLoaded: false,
    nativeErrorTimer: null,
    bufferingTimer: null,
    recentTimer: null,
    controlsTimer: null,
    osdTimer: null,
    toastTimer: null,
    searchTimer: null,
    resizeTimer: null,
    sleepTimer: null,
    retryMode: "reload",
    streamsPromise: null,
    streamIndex: null,
    fullActive: false,
    pseudoFullscreen: false,
    historyGuard: false,
    ignoreNextPop: false,
    restoringFocus: false,
    sourceModalOpen: false,
    sourceModalMode: "picker",
    initialScanOpen: false,
    playlistLoadToken: 0,
    healthScanToken: 0,
    healthScanning: false,
    healthDone: 0,
    healthTotal: 0,
    healthAvailable: 0,
    healthScanCoversAll: false,
    healthBudgetTimer: null,
    healthScanOrigin: "manual",
    healthScanPool: [],
    healthControllers: [],
    healthConfirmTimer: null,
    autoHealthControllers: [],
    autoHealthTimer: null,
    autoHealthToken: 0,
    autoHealthRunning: false,
    autoHealthChannel: null,
    autoHealthCount: 0,
    autoHealthDirty: 0,
    autoHealthCooldownUntil: 0,
    autoHealthLastFinishedAt: 0,
    autoHealthStalls: 0,
    autoHealthDisabled: false,
  };

  function defaultPreferences() {
    return {
      favorites: [],
      recent: [],
      lastSource: "all",
      defaultSource: "all",
      onboardingVersion: 0,
      initialScanDone: false,
      sourceScanState: {},
      lastChannel: "",
      quality: "auto",
      muted: false,
      volume: 1,
      sleepUntil: 0,
    };
  }

  function loadPreferences() {
    var defaults = defaultPreferences();
    try {
      var saved = JSON.parse(localStorage.getItem(PREFS_KEY) || "null");
      if (!saved || typeof saved !== "object") return defaults;
      Object.keys(defaults).forEach(function (key) {
        if (typeof saved[key] !== "undefined") defaults[key] = saved[key];
      });
      if (defaults.lastSource === "ir") defaults.lastSource = "all";
      if (defaults.defaultSource === "ir") defaults.defaultSource = "all";
      if (!PLAYLISTS[defaults.defaultSource]) defaults.defaultSource = "all";
      defaults.volume = Math.max(0, Math.min(1, Number(defaults.volume) || 0));
      if (typeof saved.volume === "undefined") defaults.volume = 1;
      if (!Array.isArray(defaults.favorites)) defaults.favorites = [];
      if (!Array.isArray(defaults.recent)) defaults.recent = [];
      if (!defaults.sourceScanState || typeof defaults.sourceScanState !== "object" || Array.isArray(defaults.sourceScanState)) {
        defaults.sourceScanState = {};
      }
      if (defaults.initialScanDone && !Object.keys(defaults.sourceScanState).length) {
        defaults.sourceScanState[defaults.defaultSource] = "done";
      }
      return defaults;
    } catch {
      return defaults;
    }
  }

  function removeLocalCacheKey(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* Storage cleanup is best effort. */
    }
  }

  function evictOldestLocalCache(exceptKey) {
    var candidates = [];
    try {
      for (var i = 0; i < localStorage.length; i += 1) {
        var key = localStorage.key(i);
        if (
          !key ||
          key === exceptKey ||
          (key.indexOf(CACHE_PREFIX) !== 0 && key.indexOf(HEALTH_PREFIX) !== 0)
        ) continue;
        var value = localStorage.getItem(key) || "";
        var savedAtMatch = value.match(/"savedAt"\s*:\s*(\d+)/);
        candidates.push({
          key: key,
          savedAt: savedAtMatch ? Number(savedAtMatch[1]) : 0,
          size: value.length,
        });
      }
      candidates.sort(function (a, b) {
        return a.savedAt - b.savedAt || b.size - a.size;
      });
      if (!candidates.length) return false;
      localStorage.removeItem(candidates[0].key);
      return true;
    } catch {
      return false;
    }
  }

  function setLocalCacheItem(key, value, maxLength) {
    if (!value || value.length > maxLength) return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      if (!evictOldestLocalCache(key)) return false;
      try {
        localStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    }
  }

  function savePreferences() {
    var payload = JSON.stringify(prefs);
    try {
      localStorage.setItem(PREFS_KEY, payload);
    } catch {
      if (!evictOldestLocalCache(PREFS_KEY)) return;
      try {
        localStorage.setItem(PREFS_KEY, payload);
      } catch {
        /* Preferences are helpful, never required for playback. */
      }
    }
  }

  function setHidden(element, hidden) {
    if (!element) return;
    if (hidden) element.classList.add("is-hidden");
    else element.classList.remove("is-hidden");
  }

  function toPersianNumber(value) {
    try {
      return new Intl.NumberFormat("fa-IR").format(value);
    } catch {
      return String(value).replace(/[0-9]/g, function (digit) {
        return "۰۱۲۳۴۵۶۷۸۹"[Number(digit)];
      });
    }
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[يى]/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/[ۀة]/g, "ه")
      .replace(/ؤ/g, "و")
      .replace(/إ|أ|ٱ/g, "ا")
      .replace(/[\u064b-\u065f\u0670]/g, "")
      .replace(/[۰-۹]/g, function (digit) {
        return String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit));
      })
      .replace(/\s+/g, " ")
      .trim();
  }

  function cleanLabel(value) {
    return String(value || "")
      .replace(/\s*\((\d{3,4})p\)\s*/gi, " ")
      .replace(/\s*\[(Geo-blocked|Not 24\/7)\]\s*/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getNumericQuality(value) {
    var match = String(value || "").match(/(\d{3,4})p?/i);
    return match ? Number(match[1]) : 0;
  }

  function getInitial(name) {
    var clean = cleanLabel(name);
    return clean ? clean.charAt(0).toUpperCase() : "TV";
  }

  function updateClock() {
    var now = new Date();
    try {
      ui.clock.textContent = new Intl.DateTimeFormat("fa-IR", {
        timeZone: "Asia/Tehran",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now);
      ui.date.textContent = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        timeZone: "Asia/Tehran",
        month: "long",
        year: "numeric",
      }).format(now);
      ui.weekday.textContent = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        timeZone: "Asia/Tehran",
        weekday: "long",
      }).format(now);
      ui.day.textContent = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        timeZone: "Asia/Tehran",
        day: "numeric",
      }).format(now);
    } catch {
      ui.clock.textContent = now.toLocaleTimeString("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      ui.date.textContent = now.toLocaleDateString("fa-IR", {
        month: "long",
        year: "numeric",
      });
      ui.weekday.textContent = now.toLocaleDateString("fa-IR", { weekday: "long" });
      ui.day.textContent = now.toLocaleDateString("fa-IR", { day: "numeric" });
    }
    updateSleepLabel();
  }

  function updateNetworkState() {
    var online = navigator.onLine !== false;
    ui.networkPill.classList.toggle("is-offline", !online);
    ui.networkText.textContent = online ? "آنلاین" : "بدون اینترنت";
    if (!online) {
      stopAutoHealthScan(120000, false);
      cancelPlaybackRecovery();
      abortHealthChecks(true);
      if (state.initialScanOpen) {
        showInitialScanUnavailable("اتصال اینترنت قطع شد؛ سنجش را بعداً دوباره انجام بده.");
      }
      showToast("اتصال اینترنت قطع شده است");
      return;
    }
    if (state.currentChannel && !ui.video.paused) schedulePlaybackWatchdog();
    if (
      state.currentChannel &&
      ui.video.paused &&
      !state.userPaused &&
      !state.playbackSuspendedForScan
    ) {
      state.playbackTransitioning = false;
      scheduleAutoReconnect("اینترنت دوباره وصل شد");
    }
    scheduleAutoHealthScan(30000);
  }

  function parseAttributes(line) {
    var attributes = {};
    var pattern = /([\w-]+)="([^"]*)"/g;
    var match;
    while ((match = pattern.exec(line)) !== null) {
      attributes[match[1].toLowerCase()] = match[2];
    }
    return attributes;
  }

  function parsePlaylist(text, sourceKey) {
    var lines = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/);
    var entries = [];
    var pending = null;
    var pendingReferrer = "";
    var pendingUserAgent = "";

    lines.forEach(function (rawLine) {
      var line = rawLine.trim();
      if (!line) return;

      if (line.indexOf("#EXTINF:") === 0) {
        var comma = line.lastIndexOf(",");
        var metaPart = comma >= 0 ? line.slice(0, comma) : line;
        var title = comma >= 0 ? line.slice(comma + 1).trim() : "شبکه بدون نام";
        var attrs = parseAttributes(metaPart);
        var qualityMatch = title.match(/\((\d{3,4})p\)/i);
        pending = {
          tvgId: attrs["tvg-id"] || "",
          name: cleanLabel(title) || "شبکه بدون نام",
          rawName: title,
          logo: attrs["tvg-logo"] || "",
          category: attrs["group-title"] || "عمومی",
          language: attrs["tvg-language"] || "",
          country: attrs["tvg-country"] || "",
          quality: qualityMatch ? Number(qualityMatch[1]) : 0,
          geoBlocked: /\[Geo-blocked\]/i.test(title),
          notAlwaysOn: /\[Not 24\/7\]/i.test(title),
        };
        pendingReferrer = attrs["http-referrer"] || "";
        pendingUserAgent = attrs["http-user-agent"] || "";
        return;
      }

      if (line.indexOf("#EXTVLCOPT:http-referrer=") === 0) {
        pendingReferrer = line.slice(line.indexOf("=") + 1).trim();
        return;
      }

      if (line.indexOf("#EXTVLCOPT:http-user-agent=") === 0) {
        pendingUserAgent = line.slice(line.indexOf("=") + 1).trim();
        return;
      }

      if (line.charAt(0) === "#" || !pending) return;
      if (!/^https?:\/\//i.test(line)) {
        pending = null;
        return;
      }

      var stableId = pending.tvgId || normalizeText(pending.name);
      entries.push({
        id: stableId,
        tvgId: pending.tvgId,
        name: pending.name,
        rawName: pending.rawName,
        logo: pending.logo,
        category: pending.category,
        language: pending.language,
        country: pending.country,
        quality: pending.quality,
        geoBlocked: pending.geoBlocked,
        notAlwaysOn: pending.notAlwaysOn,
        sourceKey: sourceKey,
        sources: [
          {
            url: line,
            quality: pending.quality,
            referrer: pendingReferrer,
            userAgent: pendingUserAgent,
            label: "playlist",
          },
        ],
      });
      pending = null;
      pendingReferrer = "";
      pendingUserAgent = "";
    });

    return mergeChannels(entries);
  }

  function mergeChannels(entries) {
    var map = Object.create(null);
    var merged = [];
    entries.forEach(function (entry) {
      var key = entry.tvgId || normalizeText(entry.name);
      if (!map[key]) {
        map[key] = entry;
        merged.push(entry);
        return;
      }
      entry.sources.forEach(function (source) {
        var duplicate = map[key].sources.some(function (existing) {
          return existing.url === source.url;
        });
        if (!duplicate) map[key].sources.push(source);
      });
      if (!map[key].logo && entry.logo) map[key].logo = entry.logo;
      if (!map[key].quality && entry.quality) map[key].quality = entry.quality;
    });
    return merged;
  }

  function openCacheDatabase() {
    if (!window.indexedDB) return Promise.resolve(null);
    if (cacheDbPromise) return cacheDbPromise;
    var pending = new Promise(function (resolve) {
      var settled = false;
      var timeout = setTimeout(function () {
        settled = true;
        resolve(null);
      }, 6000);
      var request;
      try {
        request = window.indexedDB.open(CACHE_DB_NAME, 1);
      } catch {
        clearTimeout(timeout);
        resolve(null);
        return;
      }
      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains(CACHE_DB_STORE)) {
          db.createObjectStore(CACHE_DB_STORE, { keyPath: "key" });
        }
      };
      request.onsuccess = function () {
        clearTimeout(timeout);
        var db = request.result;
        if (settled) {
          db.close();
          return;
        }
        settled = true;
        db.onversionchange = function () {
          db.close();
          cacheDbPromise = null;
        };
        resolve(db);
      };
      request.onerror = function () {
        clearTimeout(timeout);
        if (!settled) {
          settled = true;
          resolve(null);
        }
      };
      request.onblocked = request.onerror;
    });
    cacheDbPromise = pending;
    pending.then(function (db) {
      if (!db && cacheDbPromise === pending) cacheDbPromise = null;
    });
    return pending;
  }

  function prunePlaylistDatabase(db) {
    try {
      var entries = [];
      var readTransaction = db.transaction(CACHE_DB_STORE, "readonly");
      var cursorRequest = readTransaction.objectStore(CACHE_DB_STORE).openCursor();
      cursorRequest.onsuccess = function (event) {
        var cursor = event.target.result;
        if (cursor) {
          entries.push({
            key: cursor.key,
            savedAt: cursor.value && cursor.value.savedAt || 0,
          });
          cursor.continue();
          return;
        }
        if (entries.length <= CACHE_DB_LIMIT) return;
        entries.sort(function (a, b) {
          return b.savedAt - a.savedAt;
        });
        var deleteTransaction = db.transaction(CACHE_DB_STORE, "readwrite");
        var store = deleteTransaction.objectStore(CACHE_DB_STORE);
        entries.slice(CACHE_DB_LIMIT).forEach(function (entry) {
          store.delete(entry.key);
        });
      };
    } catch {
      /* Pruning is optional; the browser still enforces its own quota. */
    }
  }

  function evictOldestPlaylistDatabase(db, exceptKey) {
    return new Promise(function (resolve) {
      var entries = [];
      var cursorRequest;
      try {
        cursorRequest = db.transaction(CACHE_DB_STORE, "readonly")
          .objectStore(CACHE_DB_STORE)
          .openCursor();
      } catch {
        resolve(false);
        return;
      }
      cursorRequest.onsuccess = function (event) {
        var cursor = event.target.result;
        if (cursor) {
          if (cursor.key !== exceptKey) {
            entries.push({
              key: cursor.key,
              savedAt: cursor.value && cursor.value.savedAt || 0,
            });
          }
          cursor.continue();
          return;
        }
        if (!entries.length) {
          resolve(false);
          return;
        }
        entries.sort(function (a, b) {
          return a.savedAt - b.savedAt;
        });
        var transaction;
        try {
          transaction = db.transaction(CACHE_DB_STORE, "readwrite");
          transaction.objectStore(CACHE_DB_STORE).delete(entries[0].key);
        } catch {
          resolve(false);
          return;
        }
        transaction.oncomplete = function () {
          resolve(true);
        };
        transaction.onerror = function () {
          resolve(false);
        };
        transaction.onabort = transaction.onerror;
      };
      cursorRequest.onerror = function () {
        resolve(false);
      };
    });
  }

  function writePlaylistDatabase(sourceKey, text) {
    return openCacheDatabase().then(function (db) {
      if (
        !db ||
        !text ||
        text.length > CACHE_DB_TEXT_LIMIT ||
        text.indexOf("#EXTM3U") === -1
      ) return false;
      function attemptWrite(retried) {
        return new Promise(function (resolve) {
          var transaction;
          var finished = false;
          try {
            transaction = db.transaction(CACHE_DB_STORE, "readwrite");
            transaction.objectStore(CACHE_DB_STORE).put({
              key: sourceKey,
              version: 2,
              savedAt: Date.now(),
              text: text,
            });
          } catch {
            resolve(false);
            return;
          }
          transaction.oncomplete = function () {
            if (finished) return;
            finished = true;
            prunePlaylistDatabase(db);
            resolve(true);
          };
          function handleFailure() {
            if (finished) return;
            finished = true;
            if (retried) {
              resolve(false);
              return;
            }
            evictOldestPlaylistDatabase(db, sourceKey).then(function (evicted) {
              if (!evicted) {
                resolve(false);
                return;
              }
              attemptWrite(true).then(resolve);
            });
          }
          transaction.onerror = handleFailure;
          transaction.onabort = handleFailure;
        });
      }
      return attemptWrite(false);
    });
  }

  function readPlaylistDatabase(sourceKey) {
    return openCacheDatabase().then(function (db) {
      if (!db) return null;
      return new Promise(function (resolve) {
        var request;
        try {
          request = db.transaction(CACHE_DB_STORE, "readonly")
            .objectStore(CACHE_DB_STORE)
            .get(sourceKey);
        } catch {
          resolve(null);
          return;
        }
        request.onsuccess = function () {
          var record = request.result;
          if (
            !record ||
            record.version !== 2 ||
            !record.text ||
            record.text.indexOf("#EXTM3U") === -1
          ) {
            if (record) {
              try {
                db.transaction(CACHE_DB_STORE, "readwrite")
                  .objectStore(CACHE_DB_STORE)
                  .delete(sourceKey);
              } catch {
                /* Invalid records can be ignored when cleanup is unavailable. */
              }
            }
            resolve(null);
            return;
          }
          resolve(record);
        };
        request.onerror = function () {
          resolve(null);
        };
      });
    });
  }

  function cachePlaylist(sourceKey, text, channels) {
    var savedAt = Date.now();
    var localSaved = false;
    if (channels.length <= 900) {
      try {
        var payload = JSON.stringify({ version: 2, savedAt: savedAt, channels: channels });
        localSaved = setLocalCacheItem(
          CACHE_PREFIX + sourceKey,
          payload,
          LOCAL_PLAYLIST_CACHE_LIMIT,
        );
      } catch {
        localSaved = false;
      }
    }
    writePlaylistDatabase(sourceKey, text).then(function (saved) {
      if (saved && !localSaved) removeLocalCacheKey(CACHE_PREFIX + sourceKey);
    });
  }

  function readLocalPlaylistCache(sourceKey) {
    var key = CACHE_PREFIX + sourceKey;
    try {
      var cached = JSON.parse(localStorage.getItem(key) || "null");
      if (!cached || !Array.isArray(cached.channels) || !cached.savedAt) {
        if (cached) removeLocalCacheKey(key);
        return null;
      }
      return cached;
    } catch {
      removeLocalCacheKey(key);
      return null;
    }
  }

  function readCachedPlaylist(sourceKey) {
    return readPlaylistDatabase(sourceKey).then(function (record) {
      if (record) {
        var channels = parsePlaylist(record.text, sourceKey);
        if (channels.length) {
          return { savedAt: record.savedAt, channels: channels };
        }
      }
      return readLocalPlaylistCache(sourceKey);
    });
  }

  function fetchWithTimeout(url, timeoutMs, options) {
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (controller) controller.abort();
    }, timeoutMs);
    var fetchOptions = options || {};
    if (controller) fetchOptions.signal = controller.signal;
    return fetch(url, fetchOptions).then(
      function (response) {
        clearTimeout(timer);
        return response;
      },
      function (error) {
        clearTimeout(timer);
        throw error;
      },
    );
  }

  function healthUrlKey(channel) {
    var value = (channel.sources || [])
      .slice(0, 2)
      .map(function (source) {
        try {
          var parsed = new URL(source.url);
          return parsed.origin + parsed.pathname + parsed.search;
        } catch {
          return String(source.url || "").split("?")[0];
        }
      })
      .join("|");
    var hash = 0;
    for (var i = 0; i < value.length; i += 1) {
      hash = (hash * 31 + value.charCodeAt(i)) | 0;
    }
    return (hash >>> 0).toString(36);
  }

  function hydrateHealth(channels, sourceKey) {
    var saved = null;
    var key = HEALTH_PREFIX + sourceKey;
    var raw = "";
    try {
      raw = localStorage.getItem(key) || "";
      saved = raw ? JSON.parse(raw) : null;
      if (saved && (!saved.records || typeof saved.records !== "object")) {
        removeLocalCacheKey(key);
        saved = null;
      }
    } catch {
      removeLocalCacheKey(key);
      saved = null;
    }
    var records = saved && saved.records ? saved.records : {};
    channels.forEach(function (channel, index) {
      channel.listOrder = index;
      channel.healthStatus = "unknown";
      channel.healthCheckedAt = 0;
      channel.healthLatency = 0;
      var record = records[channel.id];
      if (
        record &&
        record.urlKey === healthUrlKey(channel) &&
        record.checkedAt &&
        record.status
      ) {
        channel.healthStatus = record.status;
        channel.healthCheckedAt = record.checkedAt;
        channel.healthLatency = record.latency || 0;
      }
    });
    if (raw.length > LOCAL_HEALTH_CACHE_LIMIT) saveHealthCache();
  }

  function saveHealthCache() {
    var records = {};
    state.channels
      .filter(function (channel) {
        return channel.healthCheckedAt && channel.healthStatus !== "checking";
      })
      .sort(function (a, b) {
        return b.healthCheckedAt - a.healthCheckedAt;
      })
      .slice(0, HEALTH_CACHE_LIMIT)
      .forEach(function (channel) {
        records[channel.id] = {
          urlKey: healthUrlKey(channel),
          status: channel.healthStatus,
          checkedAt: channel.healthCheckedAt,
          latency: channel.healthLatency || 0,
        };
      });
    var payload = JSON.stringify({
      version: 2,
      savedAt: Date.now(),
      records: records,
    });
    setLocalCacheItem(
      HEALTH_PREFIX + state.activeSource,
      payload,
      LOCAL_HEALTH_CACHE_LIMIT,
    );
  }

  function healthRank(channel) {
    if (channel.healthStatus === "confirmed") return 0;
    if (channel.healthStatus === "reachable") return 1;
    if (channel.healthStatus === "checking") return 2;
    if (channel.healthStatus === "unknown") return 3;
    return 4;
  }

  function channelHealthLabel(channel) {
    if (channel.healthStatus === "confirmed") return "قابل پخش";
    if (channel.healthStatus === "reachable") {
      return channel.healthLatency
        ? "در دسترس · " + toPersianNumber(channel.healthLatency) + "ms"
        : "در دسترس";
    }
    if (channel.healthStatus === "checking") return "در حال سنجش دسترسی…";
    if (channel.healthStatus === "blocked") return "لینک ناامن؛ مرورگر مسدود می‌کند";
    if (channel.healthStatus === "failed") return "فعلاً پاسخ نمی‌دهد";
    return channel.healthCheckedAt ? "نیاز به تست پخش" : "در صف سنجش";
  }

  function updateHealthSummary() {
    var available = state.healthScanning ? state.healthAvailable : 0;
    var checked = 0;
    var sampleMode = state.channels.length > HEALTH_FULL_SCAN_LIMIT;
    if (!state.healthScanning) {
      state.channels.forEach(function (channel) {
        if (channel.healthStatus === "confirmed" || channel.healthStatus === "reachable") {
          available += 1;
        }
        if (channel.healthCheckedAt) checked += 1;
      });
    }
    ui.healthStatusDot.classList.toggle("is-scanning", state.healthScanning);
    ui.healthStatusDot.classList.toggle("is-ready", !state.healthScanning && available > 0);
    ui.healthCheckButton.setAttribute("aria-busy", state.healthScanning ? "true" : "false");
    if (state.healthScanning) {
      ui.healthSummary.textContent =
        toPersianNumber(state.healthDone) +
        " از " +
        toPersianNumber(state.healthTotal) +
        " بررسی · " +
        toPersianNumber(available) +
        " در دسترس";
      ui.healthButtonLabel.textContent = "در حال سنجش";
    } else if (checked) {
      ui.healthSummary.textContent = sampleMode
        ? toPersianNumber(available) +
          " قابل‌پخش · " +
          toPersianNumber(checked) +
          " از " +
          toPersianNumber(state.channels.length) +
          " سنجیده‌شده"
        : toPersianNumber(available) +
          " قابل‌پخش · " +
          toPersianNumber(Math.max(0, state.channels.length - available)) +
          " نیاز به تست";
      ui.healthButtonLabel.textContent = sampleMode ? "سنجش نمونه بعدی" : "سنجش دوباره";
    } else {
      ui.healthSummary.textContent = sampleMode
        ? toPersianNumber(state.channels.length) + " شبکه · سنجش سبک خودکار"
        : toPersianNumber(state.channels.length) + " شبکه · در صف سنجش خودکار";
      ui.healthButtonLabel.textContent = sampleMode ? "سنجش نمونه‌ای" : "سنجش پخش";
    }
    updateInitialScanProgress();
  }

  function countAvailable(channels) {
    return channels.filter(function (channel) {
      return channel.healthStatus === "confirmed" || channel.healthStatus === "reachable";
    }).length;
  }

  function isModalHealthScan(origin) {
    return origin === "onboarding" || origin === "category-modal" || origin === "manual-modal";
  }

  function setSourceScanState(status) {
    if (!PLAYLISTS[state.activeSource]) return;
    prefs.sourceScanState[state.activeSource] = status;
    savePreferences();
  }

  function updateInitialScanProgress() {
    if (!state.initialScanOpen) return;
    if (!state.healthTotal && !state.healthScanning) return;
    var total = Math.max(1, state.healthTotal);
    var done = Math.min(state.healthDone, total);
    var percent = Math.round((done / total) * 100);
    var available = state.healthScanning
      ? state.healthAvailable
      : countAvailable(state.healthScanPool);
    ui.initialScanProgress.setAttribute("aria-valuenow", String(percent));
    ui.initialScanProgressBar.style.width = percent + "%";
    ui.initialScanPercent.textContent = toPersianNumber(percent) + "٪";
    ui.initialScanStatus.textContent =
      toPersianNumber(done) +
      " از " +
      toPersianNumber(total) +
      " شبکه · " +
      toPersianNumber(available) +
      " در دسترس";
  }

  function updateScanModalScope(scanCount, fullCount) {
    if (!state.initialScanOpen) return;
    var count = toPersianNumber(scanCount);
    if (fullCount > HEALTH_FULL_SCAN_LIMIT) {
      ui.initialScanDescription.textContent =
        "پخش متوقف شده است؛ این بار " +
        count +
        " شبکه از " +
        toPersianNumber(fullCount) +
        " شبکه، شامل صفحهٔ فعلی و نمونه‌های تصادفیِ تست‌نشده، حداکثر دو دقیقه سنجیده می‌شوند.";
      return;
    }
    if (state.healthScanOrigin === "onboarding") {
      ui.initialScanDescription.textContent =
        "تمام " + count + " شبکهٔ این دسته با اینترنت شما بررسی می‌شوند تا موارد در دسترس بالاتر قرار بگیرند.";
      return;
    }
    if (state.healthScanOrigin === "category-modal") {
      ui.initialScanDescription.textContent =
        "در این دسته " + count + " شبکه سنجیده می‌شود.";
      return;
    }
    ui.initialScanDescription.textContent =
      "پخش متوقف شده است؛ تمام " + count + " شبکهٔ این دسته دوباره بررسی می‌شوند و نتیجه‌ها ذخیره خواهند شد.";
  }

  function prepareInitialScanModal(origin) {
    if (origin !== "manual-modal" && origin !== "category-modal") origin = "onboarding";
    var onboarding = origin === "onboarding";
    var categoryScan = origin === "category-modal";
    state.initialScanOpen = true;
    state.healthScanOrigin = origin;
    state.healthDone = 0;
    state.healthTotal = 0;
    state.healthScanPool = [];
    ui.initialScanCard.classList.remove("is-complete");
    ui.initialScanKicker.textContent = onboarding
      ? "آماده‌سازی اولین ورود"
      : categoryScan
        ? "سنجش این دسته"
        : "سنجش شبکه‌ها";
    ui.initialScanTitle.textContent = onboarding
      ? "در حال آماده‌کردن فهرست شما"
      : "در حال سنجش شبکه‌های این دسته";
    ui.initialScanDescription.textContent = onboarding
      ? "همهٔ شبکه‌های این دسته با اینترنت شما بررسی می‌شوند؛ این کار ممکن است چند دقیقه طول بکشد."
      : "پخش متوقف شده تا شبکه‌های قابل‌دسترسی دوباره شناسایی و بالاتر از بقیه چیده شوند.";
    ui.initialScanProgress.setAttribute("aria-valuenow", "0");
    ui.initialScanProgressBar.style.width = "0%";
    ui.initialScanPercent.textContent = "۰٪";
    ui.initialScanStatus.textContent = onboarding
      ? "در حال دریافت فهرست شبکه‌ها…"
      : "در حال آماده‌سازی سنجش…";
    ui.initialScanNote.textContent = onboarding
      ? "این کار ممکن است چند دقیقه طول بکشد؛ هر زمان خواستی می‌توانی متوقفش کنی."
      : categoryScan
        ? "هر دسته فقط یک‌بار سنجیده می‌شود."
        : "با توقف سنجش، نتیجه‌های انجام‌شده از بین نمی‌روند و روی همین دستگاه ذخیره می‌شوند.";
    ui.closeInitialScanButton.setAttribute(
      "aria-label",
      onboarding ? "بستن و انجام سنجش در فرصت دیگر" : "توقف سنجش و بستن",
    );
    ui.skipInitialScanButton.textContent = onboarding
      ? "فعلاً رد شو؛ بعداً خودکار ادامه می‌یابد"
      : categoryScan
        ? "فعلاً انجام نده"
        : "توقف سنجش";
    ui.finishInitialScanButton.textContent = onboarding ? "مشاهده شبکه‌ها" : "بازگشت به فهرست";
    setHidden(ui.skipInitialScanButton, false);
    setHidden(ui.finishInitialScanButton, true);
    setHidden(ui.initialScanModal, false);
    ui.skipInitialScanButton.focus();
  }

  function showInitialScanUnavailable(message) {
    if (!state.initialScanOpen) return;
    ui.initialScanTitle.textContent = "سنجش فعلاً ممکن نیست";
    ui.initialScanDescription.textContent =
      message || "فهرست شبکه‌ها دریافت نشد؛ می‌توانی بعداً دوباره سنجش را اجرا کنی.";
    ui.initialScanProgress.setAttribute("aria-valuenow", "0");
    ui.initialScanProgressBar.style.width = "0%";
    ui.initialScanPercent.textContent = "—";
    ui.initialScanStatus.textContent = state.healthScanOrigin === "onboarding"
      ? "سنجش سبک بعداً به‌صورت خودکار ادامه پیدا می‌کند"
      : "اتصال اینترنت را بررسی کن و دوباره تلاش کن";
    ui.initialScanNote.textContent = "سنجشی انجام نشد؛ پس از برطرف‌شدن مشکل دوباره تلاش کن.";
    ui.skipInitialScanButton.textContent = "بستن";
    setHidden(ui.skipInitialScanButton, false);
    setHidden(ui.finishInitialScanButton, true);
    ui.skipInitialScanButton.focus();
  }

  function showLargeScanSkipped() {
    if (!state.initialScanOpen) return;
    prefs.initialScanDone = true;
    setSourceScanState("skipped");
    ui.initialScanCard.classList.add("is-complete");
    ui.initialScanKicker.textContent = "حفظ سرعت اینترنت";
    ui.initialScanTitle.textContent = "فهرست برای سنجش سبک آماده است";
    ui.initialScanDescription.textContent =
      "این دسته " +
      toPersianNumber(state.channels.length) +
      " شبکه دارد؛ سنجش کامل آن طولانی است و می‌تواند روی پخش اثر بگذارد.";
    ui.initialScanProgress.setAttribute("aria-valuenow", "0");
    ui.initialScanProgressBar.style.width = "0%";
    ui.initialScanPercent.textContent = "—";
    ui.initialScanStatus.textContent = "سنجش سبک، خودکار و بدون توقف پخش ادامه پیدا می‌کند";
    ui.initialScanNote.textContent =
      "برای سنجش فوری " +
      toPersianNumber(HEALTH_SAMPLE_SIZE) +
      " شبکه نیز می‌توانی پایین فهرست «سنجش نمونه‌ای» را بزنی.";
    ui.finishInitialScanButton.textContent = "مشاهده شبکه‌ها";
    setHidden(ui.skipInitialScanButton, true);
    setHidden(ui.finishInitialScanButton, false);
    ui.finishInitialScanButton.focus();
  }

  function completeInitialScan(partial) {
    if (!state.initialScanOpen) return;
    var onboarding = state.healthScanOrigin === "onboarding";
    var total = state.healthScanPool.length;
    var done = partial ? state.healthDone : total;
    var percent = total ? Math.round((done / total) * 100) : 0;
    var available = countAvailable(state.healthScanPool);
    if (onboarding) {
      prefs.initialScanDone = true;
    }
    setSourceScanState(partial ? "partial" : state.healthScanCoversAll ? "done" : "sampled");
    ui.initialScanCard.classList.add("is-complete");
    ui.initialScanKicker.textContent = partial
      ? "پایان زمان سنجش"
      : onboarding
        ? "آماده‌سازی کامل شد"
        : "نتیجه سنجش";
    ui.initialScanTitle.textContent = partial
      ? "نتیجه‌های انجام‌شده ذخیره شدند"
      : onboarding
        ? "فهرستت آماده است"
        : state.healthScanCoversAll
          ? "سنجش شبکه‌ها کامل شد"
          : "نمونه‌گیری کامل شد";
    ui.initialScanDescription.textContent = partial
      ? "برای جلوگیری از مصرف طولانی اینترنت، سنجش در سقف زمانی متوقف شد."
      : available
        ? toPersianNumber(available) + " شبکهٔ در دسترس پیدا شد و بالاتر از بقیه قرار گرفت."
        : "نتیجهٔ واقعی پخش هر شبکه هنگام انتخاب نیز ثبت می‌شود.";
    ui.initialScanProgress.setAttribute("aria-valuenow", String(percent));
    ui.initialScanProgressBar.style.width = percent + "%";
    ui.initialScanPercent.textContent = toPersianNumber(percent) + "٪";
    ui.initialScanStatus.textContent =
      toPersianNumber(done) + " از " + toPersianNumber(total) + " شبکه · " + toPersianNumber(available) + " در دسترس";
    ui.initialScanNote.textContent = "نتیجه‌ها روی همین دستگاه ذخیره شدند و تا سنجش بعدی باقی می‌مانند.";
    ui.finishInitialScanButton.textContent = onboarding ? "مشاهده شبکه‌ها" : "بازگشت به فهرست";
    setHidden(ui.skipInitialScanButton, true);
    setHidden(ui.finishInitialScanButton, false);
    ui.finishInitialScanButton.focus();
  }

  function closeInitialScan(focusChannels) {
    state.initialScanOpen = false;
    state.healthScanOrigin = "manual";
    setHidden(ui.initialScanModal, true);
    if (focusChannels) {
      var first = ui.channelList.querySelector(".channel-card");
      if (first) first.focus();
      else ui.sourceButton.focus();
    }
    scheduleAutoHealthScan(15000);
  }

  function skipInitialScan() {
    var onboarding = state.healthScanOrigin === "onboarding";
    var categoryScan = state.healthScanOrigin === "category-modal";
    abortHealthChecks(true);
    stopAutoHealthScan(300000, false);
    saveHealthCache();
    if (onboarding) {
      prefs.initialScanDone = true;
    }
    if (onboarding || categoryScan) setSourceScanState("skipped");
    applyFilters(false);
    closeInitialScan(true);
    showToast(
      onboarding
        ? "سنجش سبک چند دقیقه دیگر خودکار ادامه پیدا می‌کند"
        : "سنجش متوقف شد؛ نتیجه‌های انجام‌شده ذخیره شدند",
      3800,
    );
  }

  function dismissInitialScan() {
    if (ui.initialScanCard.classList.contains("is-complete")) {
      closeInitialScan(true);
      return;
    }
    skipInitialScan();
  }

  function updateVisibleHealth(channel) {
    var cards = ui.channelList.querySelectorAll(".channel-card");
    var statuses = ["confirmed", "reachable", "checking", "unknown", "failed", "blocked"];
    for (var i = 0; i < cards.length; i += 1) {
      if (cards[i].getAttribute("data-channel-id") !== channel.id) continue;
      statuses.forEach(function (status) {
        cards[i].classList.remove("is-health-" + status);
      });
      cards[i].classList.add("is-health-" + channel.healthStatus);
      var meta = cards[i].querySelector(".channel-meta");
      if (meta) meta.textContent = channelHealthLabel(channel);
      break;
    }
  }

  function setChannelHealth(channel, status, latency, persist, resort) {
    if (!channel) return;
    channel.healthStatus = status;
    channel.healthCheckedAt = Date.now();
    channel.healthLatency = latency || 0;
    updateVisibleHealth(channel);
    updateHealthSummary();
    if (persist) saveHealthCache();
    if (resort) {
      var active = document.activeElement;
      applyFilters(Boolean(active && active.classList.contains("channel-card")));
    }
  }

  function removeHealthController(controller) {
    state.healthControllers = state.healthControllers.filter(function (item) {
      return item !== controller;
    });
  }

  function removeAutoHealthController(controller) {
    state.autoHealthControllers = state.autoHealthControllers.filter(function (item) {
      return item !== controller;
    });
  }

  function fetchHealthManifest(url, automatic) {
    return new Promise(function (resolve, reject) {
      var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      var settled = false;
      var startedAt = Date.now();
      if (controller) {
        if (automatic) state.autoHealthControllers.push(controller);
        else state.healthControllers.push(controller);
      }
      var timer = setTimeout(function () {
        if (controller) controller.abort();
        var error = new Error("health-timeout");
        error.healthUnknown = true;
        finish(error);
      }, automatic ? AUTO_SCAN_TIMEOUT : HEALTH_TIMEOUT);

      function finish(error, text) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (controller) {
          if (automatic) removeAutoHealthController(controller);
          else removeHealthController(controller);
        }
        if (error) reject(error);
        else resolve({ text: text, latency: Date.now() - startedAt });
      }

      var options = { cache: "no-store", credentials: "omit" };
      if (controller) options.signal = controller.signal;
      fetch(url, options)
        .then(function (response) {
          if (!response.ok) {
            var error = new Error("health-http-" + response.status);
            error.healthOffline = true;
            throw error;
          }
          return response.text();
        })
        .then(function (text) {
          if (String(text).indexOf("#EXTM3U") === -1) {
            var error = new Error("health-invalid-manifest");
            error.healthOffline = true;
            finish(error);
            return;
          }
          finish(null, text);
        })
        .catch(function (error) {
          if (!error.healthOffline) error.healthUnknown = true;
          finish(error);
        });
    });
  }

  function probeHealthSource(source, automatic) {
    if (!source || !source.url) return Promise.resolve({ status: "failed", latency: 0 });
    if (location.protocol === "https:" && /^http:\/\//i.test(source.url)) {
      return Promise.resolve({ status: "blocked", latency: 0 });
    }
    if (source.referrer || source.userAgent || !/\.m3u8(?:$|[?#])/i.test(source.url)) {
      return Promise.resolve({ status: "unknown", latency: 0 });
    }
    return fetchHealthManifest(source.url, automatic).then(
      function (result) {
        return { status: "reachable", latency: result.latency };
      },
      function (error) {
        return { status: error.healthOffline ? "failed" : "unknown", latency: 0 };
      },
    );
  }

  function probeChannelHealth(channel, automatic, scanToken) {
    var sources = (channel.sources || []).slice(0, 2);
    var sawUnknown = false;
    var sawBlocked = false;
    function isCurrentProbe() {
      return automatic
        ? scanToken === state.autoHealthToken
        : scanToken === state.healthScanToken;
    }
    function next(index) {
      if (!isCurrentProbe()) {
        return Promise.resolve({ status: "cancelled", latency: 0 });
      }
      if (index >= sources.length) {
        return Promise.resolve({
          status: sawUnknown ? "unknown" : sawBlocked ? "blocked" : "failed",
          latency: 0,
        });
      }
      return probeHealthSource(sources[index], automatic).then(function (result) {
        if (!isCurrentProbe()) return { status: "cancelled", latency: 0 };
        if (result.status === "reachable") return result;
        if (result.status === "unknown") sawUnknown = true;
        if (result.status === "blocked") sawBlocked = true;
        return next(index + 1);
      });
    }
    return next(0);
  }

  function abortHealthChecks(silent) {
    state.healthScanToken += 1;
    var wasScanning = state.healthScanning;
    clearTimeout(state.healthBudgetTimer);
    state.healthBudgetTimer = null;
    state.healthControllers.forEach(function (controller) {
      try {
        controller.abort();
      } catch {
        /* Ignore abort errors from older TV engines. */
      }
    });
    state.healthControllers = [];
    state.healthScanning = false;
    state.channels.forEach(function (channel) {
      if (channel.healthStatus === "checking") {
        channel.healthStatus = "unknown";
        channel.healthCheckedAt = 0;
        updateVisibleHealth(channel);
      }
    });
    updateHealthSummary();
    if (wasScanning && !silent) showToast("سنجش پخش متوقف شد");
  }

  function takeRandomChannels(channels, count) {
    var shuffled = channels.slice();
    var limit = Math.max(0, Math.min(count, shuffled.length));
    for (var i = 0; i < limit; i += 1) {
      var randomIndex = i + Math.floor(Math.random() * (shuffled.length - i));
      var current = shuffled[i];
      shuffled[i] = shuffled[randomIndex];
      shuffled[randomIndex] = current;
    }
    return shuffled.slice(0, limit);
  }

  function buildHealthScanPool() {
    if (state.channels.length <= HEALTH_FULL_SCAN_LIMIT) return state.channels.slice();
    var pageStart = state.pageIndex * state.pageSize;
    var scanPool = state.filtered.slice(pageStart, pageStart + state.pageSize);
    var selected = Object.create(null);
    scanPool.forEach(function (channel) {
      selected[channel.id] = true;
    });
    var untested = state.filtered.filter(function (channel) {
      return !selected[channel.id] && !channel.healthCheckedAt;
    });
    takeRandomChannels(untested, HEALTH_SAMPLE_SIZE - scanPool.length).forEach(
      function (channel) {
        selected[channel.id] = true;
        scanPool.push(channel);
      },
    );
    if (scanPool.length < HEALTH_SAMPLE_SIZE) {
      var globalUntested = state.channels.filter(function (channel) {
        return !selected[channel.id] && !channel.healthCheckedAt;
      });
      takeRandomChannels(globalUntested, HEALTH_SAMPLE_SIZE - scanPool.length).forEach(
        function (channel) {
          selected[channel.id] = true;
          scanPool.push(channel);
        },
      );
    }
    if (scanPool.length < HEALTH_SAMPLE_SIZE) {
      var remaining = state.channels.filter(function (channel) {
        return !selected[channel.id];
      });
      remaining.sort(function (a, b) {
        return (a.healthCheckedAt || 0) - (b.healthCheckedAt || 0);
      });
      scanPool = scanPool.concat(remaining.slice(0, HEALTH_SAMPLE_SIZE - scanPool.length));
    }
    return scanPool.slice(0, HEALTH_SAMPLE_SIZE);
  }

  function getBufferedAhead() {
    try {
      for (var i = 0; i < ui.video.buffered.length; i += 1) {
        if (
          ui.video.buffered.start(i) <= ui.video.currentTime &&
          ui.video.buffered.end(i) >= ui.video.currentTime
        ) return Math.max(0, ui.video.buffered.end(i) - ui.video.currentTime);
      }
    } catch {
      return 0;
    }
    return 0;
  }

  function connectionAllowsAutoHealth() {
    var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection) return true;
    if (connection.saveData) return false;
    if (connection.effectiveType === "slow-2g" || connection.effectiveType === "2g") return false;
    return !connection.downlink || connection.downlink >= 1.5;
  }

  function getAutoHealthSessionLimit() {
    return state.channels.length <= HEALTH_FULL_SCAN_LIMIT
      ? state.channels.length
      : AUTO_SCAN_SESSION_LIMIT;
  }

  function getAutoHealthInterval() {
    return state.currentChannel && !ui.video.paused ? AUTO_SCAN_INTERVAL : 2000;
  }

  function canRunAutoHealthScan() {
    if (
      state.autoHealthDisabled ||
      state.autoHealthRunning ||
      state.autoHealthCount >= getAutoHealthSessionLimit() ||
      state.healthScanning ||
      state.initialScanOpen ||
      state.sourceModalOpen ||
      !ui.helpModal.classList.contains("is-hidden") ||
      state.playbackSuspendedForScan ||
      state.playbackTransitioning ||
      state.isBuffering ||
      !state.channels.length ||
      navigator.onLine === false ||
      document.visibilityState === "hidden" ||
      Date.now() < state.autoHealthCooldownUntil ||
      !connectionAllowsAutoHealth()
    ) return false;
    if (!ui.video.paused) {
      if (typeof AbortController === "undefined") return false;
      if (
        !state.hasPlaybackStarted ||
        Date.now() - state.playbackStableSince < 20000 ||
        Date.now() - state.lastPlaybackStallAt < 30000 ||
        ui.video.readyState < 3 ||
        getBufferedAhead() < 10
      ) return false;
      if (state.hls && state.hls.bandwidthEstimate && state.hls.currentLevel >= 0) {
        var level = state.hls.levels[state.hls.currentLevel];
        if (level && level.bitrate && state.hls.bandwidthEstimate < level.bitrate * 2) return false;
      }
    }
    return true;
  }

  function getAutoHealthChannel() {
    var currentId = state.currentChannel && state.currentChannel.id;
    var pageStart = state.pageIndex * state.pageSize;
    var candidates = state.filtered
      .slice(pageStart, pageStart + state.pageSize)
      .filter(function (channel) {
        return channel.id !== currentId && !channel.healthCheckedAt && channel.healthStatus !== "checking";
      });
    if (!candidates.length) candidates = state.filtered.filter(function (channel) {
      return channel.id !== currentId && !channel.healthCheckedAt && channel.healthStatus !== "checking";
    });
    if (!candidates.length) {
      candidates = state.channels.filter(function (channel) {
        return channel.id !== currentId && !channel.healthCheckedAt && channel.healthStatus !== "checking";
      });
    }
    return takeRandomChannels(candidates, 1)[0] || null;
  }

  function flushAutoHealthResults() {
    if (!state.autoHealthDirty) return;
    saveHealthCache();
    updateHealthSummary();
    var active = document.activeElement;
    applyFilters(Boolean(active && active.classList.contains("channel-card")));
    state.autoHealthDirty = 0;
  }

  function stopAutoHealthScan(cooldown, possibleImpact) {
    clearTimeout(state.autoHealthTimer);
    state.autoHealthTimer = null;
    var nearProbe = state.autoHealthRunning || Date.now() - state.autoHealthLastFinishedAt < 8000;
    state.autoHealthToken += 1;
    state.autoHealthControllers.forEach(function (controller) {
      try {
        controller.abort();
      } catch {
        /* Ignore abort errors from older TV engines. */
      }
    });
    state.autoHealthControllers = [];
    if (state.autoHealthChannel && state.autoHealthChannel.healthStatus === "checking") {
      state.autoHealthChannel.healthStatus = "unknown";
      state.autoHealthChannel.healthCheckedAt = 0;
      updateVisibleHealth(state.autoHealthChannel);
    }
    state.autoHealthChannel = null;
    state.autoHealthRunning = false;
    if (possibleImpact && nearProbe) {
      state.autoHealthStalls += 1;
      state.autoHealthLastFinishedAt = 0;
      cooldown = Math.max(cooldown || 0, 300000);
      if (state.autoHealthStalls >= 2) state.autoHealthDisabled = true;
    }
    state.autoHealthCooldownUntil = Math.max(
      state.autoHealthCooldownUntil,
      Date.now() + (cooldown || 0),
    );
    flushAutoHealthResults();
  }

  function scheduleAutoHealthScan(delay) {
    clearTimeout(state.autoHealthTimer);
    state.autoHealthTimer = null;
    if (state.autoHealthDisabled || state.autoHealthCount >= getAutoHealthSessionLimit()) return;
    state.autoHealthTimer = setTimeout(function () {
      state.autoHealthTimer = null;
      if (!canRunAutoHealthScan()) {
        scheduleAutoHealthScan(AUTO_SCAN_INTERVAL);
        return;
      }
      runAutoHealthScan();
    }, Math.max(1000, delay || AUTO_SCAN_INTERVAL));
  }

  function runAutoHealthScan() {
    var channel = getAutoHealthChannel();
    if (!channel) {
      state.autoHealthCount = getAutoHealthSessionLimit();
      flushAutoHealthResults();
      return;
    }
    state.autoHealthToken += 1;
    var token = state.autoHealthToken;
    var sourceKey = state.activeSource;
    state.autoHealthRunning = true;
    state.autoHealthChannel = channel;
    channel.healthStatus = "checking";
    updateVisibleHealth(channel);
    probeChannelHealth(channel, true, token)
      .then(function (result) {
        if (token !== state.autoHealthToken || sourceKey !== state.activeSource) return;
        state.autoHealthRunning = false;
        state.autoHealthChannel = null;
        state.autoHealthCount += 1;
        state.autoHealthDirty += 1;
        state.autoHealthLastFinishedAt = Date.now();
        channel.healthStatus = result.status;
        channel.healthCheckedAt = Date.now();
        channel.healthLatency = result.latency || 0;
        updateVisibleHealth(channel);
        if (state.autoHealthDirty >= 5) flushAutoHealthResults();
        scheduleAutoHealthScan(getAutoHealthInterval());
      })
      .catch(function () {
        if (token !== state.autoHealthToken) return;
        state.autoHealthRunning = false;
        state.autoHealthChannel = null;
        channel.healthStatus = "unknown";
        channel.healthCheckedAt = 0;
        scheduleAutoHealthScan(AUTO_SCAN_INTERVAL);
      });
  }

  function startHealthScan(force, origin) {
    origin = origin || "manual";
    state.healthScanOrigin = origin;
    if (state.healthScanning) {
      showToast("سنجش شبکه‌ها در حال انجام است");
      return;
    }
    if (navigator.onLine === false) {
      if (isModalHealthScan(origin)) {
        showInitialScanUnavailable("برای سنجش شبکه‌ها، اینترنت باید وصل باشد.");
      } else {
        showToast("برای سنجش پخش، اینترنت باید وصل باشد");
      }
      return;
    }
    if (!isModalHealthScan(origin) && state.currentChannel && !ui.video.paused) {
      showToast("برای حفظ سرعت پخش، ابتدا ویدئو را مکث کن");
      return;
    }
    var scanPool = buildHealthScanPool();
    state.healthScanPool = scanPool.slice();
    state.healthScanCoversAll = scanPool.length === state.channels.length;
    updateScanModalScope(scanPool.length, state.channels.length);
    if (!scanPool.length) {
      if (isModalHealthScan(origin)) {
        showInitialScanUnavailable("شبکه‌ای برای سنجش در این فهرست پیدا نشد.");
      } else {
        showToast("شبکه‌ای برای سنجش پیدا نشد");
      }
      return;
    }
    if (force) {
      scanPool.forEach(function (channel) {
        channel.healthStatus = "unknown";
        channel.healthCheckedAt = 0;
        channel.healthLatency = 0;
      });
      renderChannels(state.initialScanOpen ? null : state.focusedChannelId);
    }
    var candidates = scanPool.filter(function (channel) {
      return !channel.healthCheckedAt;
    });
    if (!candidates.length) {
      state.healthTotal = scanPool.length;
      state.healthDone = scanPool.length;
      updateHealthSummary();
      if (isModalHealthScan(origin)) completeInitialScan();
      else showToast("نتیجه سنجش روی این تلویزیون ذخیره است");
      return;
    }

    state.healthScanToken += 1;
    var token = state.healthScanToken;
    var nextIndex = 0;
    state.healthScanning = true;
    state.healthDone = scanPool.length - candidates.length;
    state.healthTotal = scanPool.length;
    state.healthAvailable = countAvailable(scanPool);
    updateHealthSummary();
    state.healthBudgetTimer = setTimeout(
      function () {
        if (token !== state.healthScanToken) return;
        abortHealthChecks(true);
        saveHealthCache();
        applyFilters(false);
        if (isModalHealthScan(origin)) completeInitialScan(true);
        else showToast("سنجش در سقف زمانی متوقف و نتیجه‌ها ذخیره شدند", 4600);
      },
      state.healthScanCoversAll ? HEALTH_FULL_BUDGET : HEALTH_SAMPLE_BUDGET,
    );

    function worker() {
      if (token !== state.healthScanToken) return Promise.resolve();
      var channel = candidates[nextIndex];
      nextIndex += 1;
      if (!channel) return Promise.resolve();
      channel.healthStatus = "checking";
      updateVisibleHealth(channel);
      return probeChannelHealth(channel, false, token).then(function (result) {
        if (token !== state.healthScanToken) return;
        channel.healthStatus = result.status;
        channel.healthCheckedAt = Date.now();
        channel.healthLatency = result.latency || 0;
        if (result.status === "reachable" || result.status === "confirmed") {
          state.healthAvailable += 1;
        }
        state.healthDone += 1;
        updateVisibleHealth(channel);
        updateHealthSummary();
        return new Promise(function (resolve) {
          setTimeout(resolve, 70);
        }).then(worker);
      });
    }

    var workers = [];
    for (var i = 0; i < Math.min(HEALTH_WORKERS, candidates.length); i += 1) {
      workers.push(worker());
    }
    Promise.all(workers).then(function () {
      if (token !== state.healthScanToken) return;
      clearTimeout(state.healthBudgetTimer);
      state.healthBudgetTimer = null;
      state.healthScanning = false;
      state.healthControllers = [];
      saveHealthCache();
      updateHealthSummary();
      var active = document.activeElement;
      applyFilters(Boolean(active && active.classList.contains("channel-card")));
      if (isModalHealthScan(origin)) {
        completeInitialScan();
      } else {
        showToast("شبکه‌های در دسترس به ابتدای فهرست آمدند", 4300);
      }
    });
  }

  function showListLoading(text) {
    ui.listMessage.innerHTML = "";
    var loader = document.createElement("span");
    loader.className = "list-loader";
    loader.setAttribute("aria-hidden", "true");
    var label = document.createElement("span");
    label.textContent = text;
    ui.listMessage.appendChild(loader);
    ui.listMessage.appendChild(label);
    setHidden(ui.listMessage, false);
    setHidden(ui.channelList, true);
    setHidden(ui.pagination, true);
  }

  function showListEmpty(title, detail) {
    ui.listMessage.innerHTML = "";
    var strong = document.createElement("strong");
    strong.textContent = title;
    var span = document.createElement("span");
    span.textContent = detail;
    ui.listMessage.appendChild(strong);
    ui.listMessage.appendChild(span);
    setHidden(ui.listMessage, false);
    setHidden(ui.channelList, true);
    setHidden(ui.pagination, true);
  }

  function getBaseChannelId(channel) {
    return String(channel.tvgId || "").split("@")[0];
  }

  function filterIranCollection(channels, sourceKey) {
    if (sourceKey !== "provinces") return channels;
    return channels
      .filter(function (channel) {
        var isProvincial = Boolean(PROVINCIAL_NAMES[getBaseChannelId(channel)]);
        return isProvincial;
      })
      .map(function (channel) {
        var originalName = channel.name;
        channel.name = PROVINCIAL_NAMES[getBaseChannelId(channel)] || originalName;
        channel.rawName = originalName + " " + channel.rawName;
        channel.category = "شبکه استانی";
        channel.isProvincial = true;
        return channel;
      })
      .sort(function (a, b) {
        return a.name.localeCompare(b.name, "fa");
      });
  }

  function updateSourceButton() {
    var playlist = PLAYLISTS[state.activeSource] || PLAYLISTS.all;
    ui.sourceName.textContent = playlist.title;
    ui.sourceDescription.textContent = playlist.description;
    ui.sourceMark.textContent = playlist.mark;
    var options = ui.sourceOptions.querySelectorAll(".source-option");
    for (var i = 0; i < options.length; i += 1) {
      var selected = options[i].getAttribute("data-source") === state.activeSource;
      options[i].classList.toggle("is-selected", selected);
      options[i].setAttribute("aria-selected", selected ? "true" : "false");
    }
  }

  function restoreCachedPlaylist(sourceKey, loadToken) {
    return readCachedPlaylist(sourceKey).then(function (cached) {
      if (loadToken !== state.playlistLoadToken) return;
      if (cached && cached.channels.length) {
        state.channels = filterIranCollection(cached.channels, sourceKey);
        hydrateHealth(state.channels, sourceKey);
        ui.playlistUpdated.textContent = "نسخه ذخیره‌شده · اتصال برقرار نیست";
        showToast("فهرست آنلاین در دسترس نبود؛ نسخه ذخیره‌شده باز شد");
        applyFilters(false);
        updateHealthSummary();
        scheduleAutoHealthScan(20000);
        return;
      }
      ui.channelCount.textContent = "۰ شبکه";
      showListEmpty(
        "فهرست دریافت نشد",
        "اتصال اینترنت را بررسی کن و «بروزرسانی» را بزن",
      );
      updateHealthSummary();
    });
  }

  function loadPlaylist(sourceKey, forceRefresh) {
    var playlist = PLAYLISTS[sourceKey] || PLAYLISTS.all;
    stopAutoHealthScan(0, false);
    abortHealthChecks(true);
    state.playlistLoadToken += 1;
    var loadToken = state.playlistLoadToken;
    state.activeSource = sourceKey;
    prefs.lastSource = sourceKey;
    savePreferences();
    state.channels = [];
    state.filtered = [];
    state.autoHealthCount = 0;
    state.autoHealthStalls = 0;
    state.autoHealthDisabled = false;
    state.autoHealthCooldownUntil = 0;
    state.autoHealthLastFinishedAt = 0;
    state.pageIndex = 0;
    updateSourceButton();
    ui.channelCount.textContent = "—";
    showListLoading("در حال دریافت فهرست «" + playlist.title + "»…");

    if (navigator.onLine === false) {
      return restoreCachedPlaylist(sourceKey, loadToken);
    }

    return fetchWithTimeout(playlist.url, playlist.requestTimeout || 18000, {
      cache: forceRefresh ? "reload" : "default",
    })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.text();
      })
      .then(function (text) {
        if (loadToken !== state.playlistLoadToken) return;
        var channels = filterIranCollection(parsePlaylist(text, sourceKey), sourceKey);
        if (!channels.length) throw new Error("empty-playlist");
        state.channels = channels;
        cachePlaylist(sourceKey, text, channels);
        hydrateHealth(state.channels, sourceKey);
        ui.playlistUpdated.textContent =
          "بروزرسانی شد · " +
          new Intl.DateTimeFormat("fa-IR", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date());
        applyFilters(false);
        updateHealthSummary();
        scheduleAutoHealthScan(20000);
      })
      .catch(function () {
        if (loadToken !== state.playlistLoadToken) return;
        return restoreCachedPlaylist(sourceKey, loadToken);
      });
  }

  function isFavorite(id) {
    return prefs.favorites.indexOf(id) !== -1;
  }

  function applyFilters(preserveFocus) {
    var query = normalizeText(state.query);
    var filtered = state.channels.filter(function (channel) {
      if (!query) return true;
      var haystack = normalizeText(
        [
          channel.name,
          channel.rawName,
          channel.category,
          channel.language,
          channel.country,
          channel.tvgId,
        ].join(" "),
      );
      return haystack.indexOf(query) !== -1;
    });

    var favoriteOrder = Object.create(null);
    for (var favoriteIndex = 0; favoriteIndex < prefs.favorites.length; favoriteIndex += 1) {
      favoriteOrder[prefs.favorites[favoriteIndex]] = favoriteIndex + 1;
    }
    filtered.sort(function (a, b) {
      var aFavoriteOrder = favoriteOrder[a.id] || 0;
      var bFavoriteOrder = favoriteOrder[b.id] || 0;
      if (aFavoriteOrder || bFavoriteOrder) {
        if (!aFavoriteOrder) return 1;
        if (!bFavoriteOrder) return -1;
        return aFavoriteOrder - bFavoriteOrder;
      }
      var healthDifference = healthRank(a) - healthRank(b);
      if (healthDifference) return healthDifference;
      return (a.listOrder || 0) - (b.listOrder || 0);
    });

    state.filtered = filtered;
    var totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    if (state.pageIndex >= totalPages) state.pageIndex = totalPages - 1;
    renderChannels(preserveFocus ? state.focusedChannelId : null);
  }

  function createLogo(container, channel, lazy) {
    container.innerHTML = "";
    container.style.position = "relative";
    var fallback = document.createElement("span");
    fallback.textContent = getInitial(channel.name);
    container.appendChild(fallback);
    if (!channel.logo) return;
    var image = document.createElement("img");
    image.alt = "";
    image.referrerPolicy = "no-referrer";
    if (lazy) image.loading = "lazy";
    image.addEventListener("error", function () {
      if (image.parentNode) image.parentNode.removeChild(image);
    });
    image.src = channel.logo;
    container.appendChild(image);
  }

  function channelMeta(channel) {
    var parts = [];
    if (channel.category) parts.push(channel.category);
    if (channel.notAlwaysOn) parts.push("پخش محدود");
    if (channel.geoBlocked) parts.push("محدودیت منطقه‌ای");
    if (channel.sources[0] && /^http:\/\//i.test(channel.sources[0].url)) {
      parts.push("لینک ناامن");
    }
    return parts.join(" · ") || "پخش زنده";
  }

  function renderChannels(focusId) {
    ui.channelCount.textContent = toPersianNumber(state.filtered.length) + " شبکه";
    ui.channelList.innerHTML = "";
    ui.channelList.classList.remove("grid-2", "grid-3", "grid-compact", "grid-tall");
    ui.channelList.classList.add("grid-2");
    if (state.gridRows === 5) ui.channelList.classList.add("grid-tall");
    else if (state.gridRows === 3) ui.channelList.classList.add("grid-compact");

    if (!state.filtered.length) {
      if (state.query) {
        showListEmpty("شبکه‌ای پیدا نشد", "عبارت دیگری را امتحان کن");
      } else {
        showListEmpty("فهرست خالی است", "منبع دیگری را انتخاب کن");
      }
      return;
    }

    var totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    if (state.pageIndex >= totalPages) state.pageIndex = totalPages - 1;
    if (state.pageIndex < 0) state.pageIndex = 0;
    var pageStart = state.pageIndex * state.pageSize;
    var shown = state.filtered.slice(pageStart, pageStart + state.pageSize);
    ui.pageCurrent.textContent = toPersianNumber(state.pageIndex + 1);
    ui.pageTotal.textContent = toPersianNumber(totalPages);
    ui.prevPageButton.disabled = state.pageIndex === 0;
    ui.nextPageButton.disabled = state.pageIndex >= totalPages - 1;
    ui.prevPageButton.tabIndex = ui.prevPageButton.disabled ? -1 : 0;
    ui.nextPageButton.tabIndex = ui.nextPageButton.disabled ? -1 : 0;

    var activeId = focusId || state.focusedChannelId;
    if (!shown.some(function (channel) { return channel.id === activeId; })) {
      activeId = state.currentChannel && shown.some(function (channel) {
        return channel.id === state.currentChannel.id;
      }) ? state.currentChannel.id : shown[0].id;
    }

    var fragment = document.createDocumentFragment();
    shown.forEach(function (channel) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "channel-card focusable";
      button.setAttribute("role", "option");
      button.setAttribute(
        "aria-label",
        channel.name +
          (channel.quality ? "، " + channel.quality + "p" : "") +
          "، " +
          channelHealthLabel(channel),
      );
      button.setAttribute(
        "aria-selected",
        state.currentChannel && state.currentChannel.id === channel.id ? "true" : "false",
      );
      button.tabIndex = channel.id === activeId ? 0 : -1;
      button.setAttribute("data-channel-id", channel.id);
      if (state.currentChannel && state.currentChannel.id === channel.id) {
        button.classList.add("is-playing");
      }
      button.classList.add("is-health-" + (channel.healthStatus || "unknown"));

      var logo = document.createElement("span");
      logo.className = "channel-logo";
      createLogo(logo, channel, true);

      var copy = document.createElement("span");
      copy.className = "channel-copy";
      var name = document.createElement("span");
      name.className = "channel-name";
      name.textContent = channel.name;
      var meta = document.createElement("span");
      meta.className = "channel-meta";
      meta.textContent = channelHealthLabel(channel);
      copy.appendChild(name);
      copy.appendChild(meta);

      var trailing = document.createElement("span");
      trailing.className = "channel-trailing";
      var quality = document.createElement("span");
      quality.className = "channel-quality";
      quality.textContent = channel.quality ? channel.quality + "p" : "HLS";
      var heart = document.createElement("span");
      heart.className = "channel-heart";
      heart.textContent = isFavorite(channel.id) ? "★" : "";
      trailing.appendChild(quality);
      trailing.appendChild(heart);

      button.appendChild(logo);
      button.appendChild(copy);
      button.appendChild(trailing);
      button.addEventListener("click", function () {
        state.focusedChannelId = channel.id;
        playChannel(channel);
      });
      button.addEventListener("focus", function () {
        state.focusedChannelId = channel.id;
        updateRovingTabindex(button);
      });
      button.addEventListener("keydown", onChannelKeydown);
      fragment.appendChild(button);
    });

    ui.channelList.appendChild(fragment);
    setHidden(ui.listMessage, true);
    setHidden(ui.channelList, false);
    setHidden(ui.pagination, false);

    if (focusId) {
      window.requestAnimationFrame(function () {
        focusChannelById(focusId);
      });
    }
  }

  function updateRovingTabindex(activeButton) {
    var buttons = ui.channelList.querySelectorAll(".channel-card");
    for (var i = 0; i < buttons.length; i += 1) {
      buttons[i].tabIndex = buttons[i] === activeButton ? 0 : -1;
    }
  }

  function focusChannelById(id) {
    var buttons = ui.channelList.querySelectorAll(".channel-card");
    for (var i = 0; i < buttons.length; i += 1) {
      if (buttons[i].getAttribute("data-channel-id") === id) {
        buttons[i].tabIndex = 0;
        buttons[i].focus();
        return true;
      }
    }
    var channelIndex = state.filtered.findIndex(function (channel) {
      return channel.id === id;
    });
    if (channelIndex >= 0) {
      state.pageIndex = Math.floor(channelIndex / state.pageSize);
      renderChannels(null);
      window.requestAnimationFrame(function () {
        focusChannelById(id);
      });
      return true;
    }
    return false;
  }

  function changePage(delta, moveFocus) {
    var totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    var nextPage = state.pageIndex + delta;
    if (nextPage < 0 || nextPage >= totalPages || nextPage === state.pageIndex) return false;
    state.pageIndex = nextPage;
    renderChannels(null);
    if (moveFocus) {
      window.requestAnimationFrame(function () {
        var buttons = ui.channelList.querySelectorAll(".channel-card");
        var target = delta > 0 ? buttons[0] : buttons[buttons.length - 1];
        if (target) {
          updateRovingTabindex(target);
          target.focus();
        }
      });
    }
    return true;
  }

  function onChannelKeydown(event) {
    var key = event.key;
    if (
      key !== "ArrowDown" &&
      key !== "ArrowUp" &&
      key !== "ArrowLeft" &&
      key !== "ArrowRight"
    ) return;
    event.preventDefault();
    var buttons = Array.prototype.slice.call(
      ui.channelList.querySelectorAll(".channel-card"),
    );
    var index = buttons.indexOf(event.currentTarget);
    var columns = state.gridColumns;
    var row = Math.floor(index / columns);
    var column = index % columns;
    var nextIndex = -1;

    if (key === "ArrowLeft") {
      if (column < columns - 1 && buttons[index + 1]) nextIndex = index + 1;
      else {
        ui.playerShell.focus();
        return;
      }
    } else if (key === "ArrowRight") {
      if (column > 0 && buttons[index - 1]) nextIndex = index - 1;
    } else if (key === "ArrowUp") {
      nextIndex = index - columns;
      if (nextIndex < 0) {
        ui.searchInput.focus();
        return;
      }
    } else if (key === "ArrowDown") {
      var nextRowStart = (row + 1) * columns;
      if (nextRowStart < buttons.length) {
        nextIndex = Math.min(nextRowStart + column, buttons.length - 1);
      } else {
        if (!ui.nextPageButton.disabled) ui.nextPageButton.focus();
        else if (!ui.prevPageButton.disabled) ui.prevPageButton.focus();
        else ui.healthCheckButton.focus();
        return;
      }
    }

    if (buttons[nextIndex]) {
      updateRovingTabindex(buttons[nextIndex]);
      buttons[nextIndex].focus();
    }
  }

  function onPaginationKeydown(event) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      var cards = ui.channelList.querySelectorAll(".channel-card");
      var target = cards[cards.length - 1];
      if (target) target.focus();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      ui.healthCheckButton.focus();
    } else if (event.key === "ArrowLeft" && event.currentTarget === ui.prevPageButton) {
      event.preventDefault();
      if (!ui.nextPageButton.disabled) ui.nextPageButton.focus();
    } else if (event.key === "ArrowRight" && event.currentTarget === ui.nextPageButton) {
      event.preventDefault();
      if (!ui.prevPageButton.disabled) ui.prevPageButton.focus();
    }
  }

  function onFooterKeydown(event) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!ui.nextPageButton.disabled) ui.nextPageButton.focus();
      else if (!ui.prevPageButton.disabled) ui.prevPageButton.focus();
      else {
        var cards = ui.channelList.querySelectorAll(".channel-card");
        var target = cards[cards.length - 1];
        if (target) target.focus();
      }
    } else if (event.key === "ArrowLeft" && event.currentTarget === ui.healthCheckButton) {
      event.preventDefault();
      ui.refreshListButton.focus();
    } else if (event.key === "ArrowRight" && event.currentTarget === ui.refreshListButton) {
      event.preventDefault();
      ui.healthCheckButton.focus();
    }
  }

  function showStatus(title, detail, errorMode) {
    ui.statusTitle.textContent = title;
    ui.statusDetail.textContent = detail || "";
    setHidden(ui.playerStatus, false);
    setHidden(ui.retryButton, !errorMode);
    var spinner = ui.playerStatus.querySelector(".status-spinner");
    setHidden(spinner, Boolean(errorMode));
  }

  function hideStatus() {
    setHidden(ui.playerStatus, true);
    setHidden(ui.retryButton, true);
  }

  function showToast(message, duration) {
    clearTimeout(state.toastTimer);
    ui.toast.textContent = message;
    setHidden(ui.toast, false);
    state.toastTimer = setTimeout(function () {
      setHidden(ui.toast, true);
    }, duration || 3300);
  }

  function setNowPlaying(channel) {
    state.currentChannel = channel;
    prefs.lastChannel = channel.id;
    savePreferences();
    ui.nowName.textContent = channel.name;
    ui.nowMeta.textContent = channelMeta(channel);
    ui.nowStatusText.textContent = "در حال اتصال";
    ui.nowStatusDot.style.background = "#ffd166";
    createLogo(ui.nowLogo, channel, false);
    ui.favoriteButton.disabled = false;
    ui.reloadButton.disabled = false;
    updateFavoriteButton();
    renderChannels(null);
    showOsd(channel, "در حال اتصال…");
  }

  function updateFavoriteButton() {
    if (!state.currentChannel) return;
    var favorite = isFavorite(state.currentChannel.id);
    ui.favoriteButton.classList.toggle("is-favorite", favorite);
    ui.favoriteIcon.src = ICON_CDN + (favorite ? "star-fill.svg" : "star.svg");
    ui.favoriteText.textContent = favorite ? "محبوب من" : "علاقه‌مندی";
  }

  function showOsd(channel, meta) {
    clearTimeout(state.osdTimer);
    createLogo(ui.osdLogo, channel, false);
    ui.osdName.textContent = channel.name;
    ui.osdMeta.textContent = meta || "زنده";
    setHidden(ui.channelOsd, false);
    state.osdTimer = setTimeout(function () {
      setHidden(ui.channelOsd, true);
    }, 2600);
  }

  function addToRecent(channel, token) {
    clearTimeout(state.recentTimer);
    state.recentTimer = setTimeout(function () {
      if (token !== state.playbackToken || ui.video.paused) return;
      prefs.recent = prefs.recent.filter(function (id) {
        return id !== channel.id;
      });
      prefs.recent.unshift(channel.id);
      prefs.recent = prefs.recent.slice(0, 16);
      savePreferences();
    }, 5000);
  }

  function cancelPlaybackRecovery() {
    clearTimeout(state.bufferingTimer);
    clearTimeout(state.stallRecoveryTimer);
    clearTimeout(state.stablePlaybackTimer);
    clearTimeout(state.playbackStartTimer);
    clearTimeout(state.playbackWatchdogTimer);
    clearTimeout(state.autoRetryTimer);
    state.bufferingTimer = null;
    state.stallRecoveryTimer = null;
    state.stablePlaybackTimer = null;
    state.playbackStartTimer = null;
    state.playbackWatchdogTimer = null;
    state.autoRetryTimer = null;
    state.isBuffering = false;
  }

  function armStablePlaybackTimer() {
    clearTimeout(state.stablePlaybackTimer);
    state.playbackStableSince = Date.now();
    var stableSince = state.playbackStableSince;
    state.stablePlaybackTimer = setTimeout(function () {
      if (
        stableSince === state.playbackStableSince &&
        state.lastPlaybackStallAt < stableSince &&
        !ui.video.paused &&
        !state.isBuffering
      ) state.autoRetryAttempts = 0;
    }, 60000);
  }

  function cleanupMedia() {
    cancelPlaybackRecovery();
    clearTimeout(state.nativeErrorTimer);
    clearTimeout(state.recentTimer);
    clearTimeout(state.healthConfirmTimer);
    if (state.hls) {
      try {
        state.hls.destroy();
      } catch {
        /* Ignore teardown errors from broken streams. */
      }
      state.hls = null;
    }
    try {
      ui.video.pause();
      ui.video.removeAttribute("src");
      ui.video.load();
    } catch {
      /* Some TV engines throw while a failed media request is being removed. */
    }
    state.hlsLevels = [];
    state.levelCap = -1;
    state.lastMediaTime = 0;
  }

  function stopPlaybackForHealthScan() {
    var hadChannel = Boolean(state.currentChannel);
    state.playbackSuspendedForScan = hadChannel;
    state.playbackTransitioning = true;
    state.userPaused = false;
    state.playbackToken += 1;
    cleanupMedia();
    state.sourceQueue = [];
    state.sourceIndex = 0;
    state.alternativesLoaded = false;
    setPlayIcon(false);
    setHidden(ui.channelOsd, true);
    if (!hadChannel) return;
    state.retryMode = "reload";
    ui.retryButton.textContent = "ادامه پخش";
    ui.nowStatusText.textContent = "متوقف برای سنجش";
    ui.nowStatusDot.style.background = "#ffd166";
    showStatus(
      "پخش برای سنجش متوقف شد",
      "پس از پایان، دکمه پخش یا «ادامه پخش» را بزن",
      true,
    );
  }

  function startManualHealthScan() {
    if (state.healthScanning) {
      showToast("سنجش شبکه‌ها در حال انجام است");
      return;
    }
    if (navigator.onLine === false) {
      showToast("برای سنجش پخش، اینترنت باید وصل باشد");
      return;
    }
    if (!state.channels.length) {
      showToast("شبکه‌ای برای سنجش پیدا نشد");
      return;
    }
    stopAutoHealthScan(120000, false);
    stopPlaybackForHealthScan();
    prepareInitialScanModal("manual-modal");
    startHealthScan(true, "manual-modal");
  }

  function startCategoryHealthScan(sourceKey) {
    if (sourceKey !== state.activeSource || !state.channels.length) return;
    if (!prefs.sourceScanState[sourceKey]) setSourceScanState("automatic");
    updateHealthSummary();
    scheduleAutoHealthScan(5000);
    showToast(
      state.channels.length > HEALTH_FULL_SCAN_LIMIT
        ? "سنجش سبک این دسته در پس‌زمینه انجام می‌شود"
        : "سنجش این دسته خودکار و بدون توقف پخش انجام می‌شود",
      4200,
    );
  }

  function loadStreamIndex() {
    if (state.streamIndex) return Promise.resolve(state.streamIndex);
    if (state.streamsPromise) return state.streamsPromise;
    state.streamsPromise = fetchWithTimeout(STREAMS_API, 22000, { cache: "default" })
      .then(function (response) {
        if (!response.ok) throw new Error("streams-api");
        return response.json();
      })
      .then(function (streams) {
        var index = Object.create(null);
        streams.forEach(function (stream) {
          if (!stream || !stream.channel || !stream.url) return;
          if (!/^https:\/\//i.test(stream.url)) return;
          if (stream.referrer || stream.user_agent) return;
          if (!/\.m3u8(?:$|\?)/i.test(stream.url)) return;
          var quality = getNumericQuality(stream.quality);
          var item = {
            url: stream.url,
            quality: quality,
            referrer: "",
            userAgent: "",
            label: "api",
          };
          if (!index[stream.channel]) index[stream.channel] = [];
          index[stream.channel].push(item);
        });
        Object.keys(index).forEach(function (key) {
          index[key].sort(function (a, b) {
            var aScore = a.quality > 0 && a.quality <= 480 ? 1000 + a.quality : a.quality ? -a.quality : 1;
            var bScore = b.quality > 0 && b.quality <= 480 ? 1000 + b.quality : b.quality ? -b.quality : 1;
            return bScore - aScore;
          });
        });
        state.streamIndex = index;
        return index;
      })
      .catch(function (error) {
        state.streamsPromise = null;
        throw error;
      });
    return state.streamsPromise;
  }

  function uniqueSources(sources) {
    var seen = Object.create(null);
    return sources.filter(function (source) {
      if (!source || !source.url || seen[source.url]) return false;
      seen[source.url] = true;
      return true;
    });
  }

  function prepareSources(channel, recovering) {
    var originals = channel.sources.slice();
    var preferredQuality = prefs.quality === "auto"
      ? state.autoQualityCeiling
      : Number(prefs.quality) || 480;
    var targetQuality = Math.min(480, preferredQuality || 480);
    var needsLowerQuality = Boolean(channel.tvgId) && (
      channel.quality > targetQuality || targetQuality < 480
    );
    if (!needsLowerQuality) return Promise.resolve(uniqueSources(originals));

    showStatus(
      "در حال یافتن نسخه کم‌مصرف…",
      "نسخه " + targetQuality + "p یا پایین‌تر بررسی می‌شود",
      false,
    );
    var baseChannelId = channel.tvgId.split("@")[0];
    return loadStreamIndex()
      .then(function (index) {
        var alternatives = (index[baseChannelId] || []).filter(function (source) {
          return source.quality > 0 && source.quality <= targetQuality;
        });
        if (alternatives.length) {
          if (!recovering) {
            showToast("نسخه کم‌مصرف " + alternatives[0].quality + "p پیدا شد");
          }
          return uniqueSources(alternatives.concat(originals));
        }
        if (!recovering) showToast("این شبکه نسخه کم‌مصرف ثبت‌شده ندارد", 4200);
        return uniqueSources(originals);
      })
      .catch(function () {
        if (!recovering) {
          showToast("بررسی نسخه کم‌مصرف ممکن نشد؛ منبع اصلی امتحان می‌شود", 4300);
        }
        return uniqueSources(originals);
      });
  }

  function playChannel(channel, recovering) {
    stopAutoHealthScan(recovering ? 120000 : 30000, false);
    abortHealthChecks(true);
    state.playbackSuspendedForScan = false;
    state.playbackTransitioning = true;
    state.userPaused = false;
    state.isBuffering = false;
    state.hasPlaybackStarted = false;
    if (!recovering) {
      state.autoRetryAttempts = 0;
      state.autoQualityCeiling = 480;
    }
    state.playbackToken += 1;
    var token = state.playbackToken;
    cleanupMedia();
    state.mediaRecoveryTried = false;
    state.nativeFallbackTried = false;
    state.alternativesLoaded = false;
    if (!recovering) setNowPlaying(channel);
    else {
      state.currentChannel = channel;
      ui.nowStatusText.textContent = "اتصال دوباره";
      ui.nowStatusDot.style.background = "#ffd166";
    }
    setHidden(ui.placeholder, true);
    showStatus(
      recovering ? "اتصال خودکار دوباره…" : "در حال اتصال…",
      "منبع پخش بررسی می‌شود",
      false,
    );

    prepareSources(channel, Boolean(recovering)).then(function (sources) {
      if (token !== state.playbackToken) return;
      state.sourceQueue = sources;
      state.sourceIndex = 0;
      if (!sources.length) {
        showPlaybackError("منبع پخشی برای این شبکه پیدا نشد");
        return;
      }
      startCurrentSource(token);
    });
  }

  function startCurrentSource(token) {
    if (token !== state.playbackToken) return;
    state.mediaAttemptToken += 1;
    var attemptToken = state.mediaAttemptToken;
    state.playbackTransitioning = true;
    var source = state.sourceQueue[state.sourceIndex];
    if (!source) {
      showPlaybackError(
        "هیچ‌کدام از منابع این شبکه پاسخ نداد",
        "ممکن است شبکه خاموش، محدود به منطقه یا ناسازگار با مرورگر باشد",
      );
      return;
    }

    if (location.protocol === "https:" && /^http:\/\//i.test(source.url)) {
      tryNextSource(token, "لینک ناامن HTTP توسط مرورگر مسدود می‌شود");
      return;
    }

    state.mediaRecoveryTried = false;
    state.nativeFallbackTried = false;
    showStatus(
      state.sourceIndex ? "منبع جایگزین در حال بررسی است…" : "در حال اتصال…",
      source.quality ? "کیفیت ثبت‌شده: " + source.quality + "p" : "چند لحظه صبر کن",
      false,
    );

    if (/\.m3u8(?:$|\?)/i.test(source.url)) {
      if (window.Hls && window.Hls.isSupported()) {
        startHls(source, token, attemptToken);
      } else if (
        ui.video.canPlayType("application/vnd.apple.mpegurl") ||
        ui.video.canPlayType("application/x-mpegURL")
      ) {
        startNative(source, token, false, attemptToken);
      } else {
        tryNextSource(token, "فرمت HLS در این مرورگر پشتیبانی نمی‌شود");
      }
      return;
    }
    startNative(source, token, false, attemptToken);
  }

  function startHls(source, token, attemptToken) {
    var HlsClass = window.Hls;
    var hls = new HlsClass({
      enableWorker: true,
      startLevel: -1,
      abrEwmaDefaultEstimate: 700000,
      maxBufferLength: 20,
      maxMaxBufferLength: 30,
      backBufferLength: 10,
      maxBufferSize: 20 * 1000 * 1000,
      capLevelOnFPSDrop: true,
      capLevelToPlayerSize: false,
      useMediaCapabilities: false,
      manifestLoadingTimeOut: 12000,
      fragLoadingTimeOut: 15000,
    });
    state.hls = hls;

    hls.on(HlsClass.Events.MEDIA_ATTACHED, function () {
      if (token !== state.playbackToken || attemptToken !== state.mediaAttemptToken) return;
      hls.loadSource(source.url);
    });

    hls.on(HlsClass.Events.MANIFEST_PARSED, function () {
      if (token !== state.playbackToken || attemptToken !== state.mediaAttemptToken) return;
      if (state.currentChannel && state.currentChannel.healthStatus !== "confirmed") {
        setChannelHealth(state.currentChannel, "reachable", 0, true, false);
      }
      configureQualityLevels(hls, source);
      requestVideoPlay(token, attemptToken);
    });

    hls.on(HlsClass.Events.LEVEL_SWITCHED, function (event, data) {
      if (
        token !== state.playbackToken ||
        attemptToken !== state.mediaAttemptToken ||
        !hls.levels[data.level]
      ) return;
      var level = hls.levels[data.level];
      var quality = level.height || (source && source.quality) || 0;
      ui.qualityBadge.textContent = quality ? quality + "p" : "خودکار";
    });

    hls.on(HlsClass.Events.ERROR, function (event, data) {
      if (
        token !== state.playbackToken ||
        attemptToken !== state.mediaAttemptToken ||
        !data.fatal
      ) return;
      if (data.type === HlsClass.ErrorTypes.MEDIA_ERROR && !state.mediaRecoveryTried) {
        state.mediaRecoveryTried = true;
        showStatus("بازیابی پخش…", "تصویر دوباره هماهنگ می‌شود", false);
        try {
          hls.recoverMediaError();
          return;
        } catch {
          /* Continue to fallback below. */
        }
      }
      if (!state.nativeFallbackTried && canUseNativeHls()) {
        state.nativeFallbackTried = true;
        try {
          hls.destroy();
        } catch {
          /* Ignore failed teardown. */
        }
        state.hls = null;
        showStatus("حالت سازگار تلویزیون…", "پخش مستقیم امتحان می‌شود", false);
        state.mediaAttemptToken += 1;
        startNative(source, token, true, state.mediaAttemptToken);
        return;
      }
      tryNextSource(token, "سرور پخش پاسخ مناسب نداد");
    });

    try {
      hls.attachMedia(ui.video);
    } catch {
      tryNextSource(token, "اتصال پخش‌کننده ممکن نشد");
    }
  }

  function canUseNativeHls() {
    return Boolean(
      ui.video.canPlayType("application/vnd.apple.mpegurl") ||
        ui.video.canPlayType("application/x-mpegURL"),
    );
  }

  function startNative(source, token, fromHlsFallback, attemptToken) {
    if (token !== state.playbackToken || attemptToken !== state.mediaAttemptToken) return;
    if (state.hls) {
      try {
        state.hls.destroy();
      } catch {
        /* no-op */
      }
      state.hls = null;
    }
    setFixedQuality(source, fromHlsFallback);
    ui.video.src = source.url;
    ui.video.load();
    requestVideoPlay(token, attemptToken);
  }

  function requestVideoPlay(token, attemptToken) {
    attemptToken = typeof attemptToken === "number" ? attemptToken : state.mediaAttemptToken;
    if (token !== state.playbackToken || attemptToken !== state.mediaAttemptToken) return;
    state.playbackTransitioning = true;
    state.userPaused = false;
    var promise;
    try {
      promise = ui.video.play();
    } catch (error) {
      if (error && error.name === "NotAllowedError") {
        showPlayPrompt();
      } else {
        state.playbackTransitioning = false;
        tryNextSource(token, "مرورگر نتوانست این منبع را شروع کند");
      }
      return;
    }
    clearTimeout(state.playbackStartTimer);
    state.playbackStartTimer = setTimeout(function () {
      state.playbackStartTimer = null;
      if (
        token !== state.playbackToken ||
        attemptToken !== state.mediaAttemptToken ||
        state.userPaused
      ) return;
      if (!ui.video.paused && ui.video.readyState >= 3) {
        state.playbackTransitioning = false;
        schedulePlaybackWatchdog();
        return;
      }
      state.playbackTransitioning = false;
      scheduleAutoReconnect("شروع پخش بیش از حد طول کشید");
    }, PLAYBACK_START_TIMEOUT);
    if (promise && typeof promise.catch === "function") {
      promise.catch(function (error) {
        if (
          token !== state.playbackToken ||
          attemptToken !== state.mediaAttemptToken ||
          state.userPaused
        ) return;
        var errorName = error && error.name;
        if (errorName === "AbortError") return;
        if (errorName === "NotAllowedError") {
          showPlayPrompt();
          return;
        }
        state.playbackTransitioning = false;
        tryNextSource(token, "مرورگر نتوانست این منبع را شروع کند");
      });
    }
  }

  function showPlayPrompt() {
    state.playbackTransitioning = false;
    state.userPaused = true;
    cancelPlaybackRecovery();
    state.retryMode = "play";
    showStatus("برای پخش Enter را بزن", "مرورگر پخش خودکار صدا را محدود کرده است", true);
    ui.retryButton.textContent = "پخش کن";
  }

  function setFixedQuality(source, nativeMode) {
    ui.qualitySelect.innerHTML = "";
    var option = document.createElement("option");
    option.value = "fixed";
    if (source.quality) option.textContent = "کیفیت ثابت · " + source.quality + "p";
    else if (nativeMode) option.textContent = "مدیریت کیفیت با تلویزیون";
    else option.textContent = "کیفیت ثابت منبع";
    ui.qualitySelect.appendChild(option);
    ui.qualitySelect.disabled = true;
    ui.qualityBadge.textContent = source.quality ? source.quality + "p" : "ثابت";
    ui.controlNote.textContent = source.quality > 480 ? "پر‌مصرف" : "کیفیت ثابت";
    if (source.quality > 480) {
      showToast("این منبع نسخه ۴۸۰p یا پایین‌تر ندارد", 4500);
    }
  }

  function configureQualityLevels(hls, source) {
    state.hlsLevels = hls.levels || [];
    var levels = state.hlsLevels;
    var allowed = [];
    var lowestIndex = -1;
    var lowestScore = Infinity;
    var capIndex = -1;
    var capScore = -1;
    var autoBitrateLimit = state.autoQualityCeiling <= 240
      ? 500000
      : state.autoQualityCeiling <= 360
        ? 850000
        : 1200000;

    levels.forEach(function (level, index) {
      var score = level.height || Math.round((level.bitrate || 0) / 2500);
      if (score < lowestScore) {
        lowestScore = score;
        lowestIndex = index;
      }
      var isAllowed = level.height
        ? level.height <= 480
        : level.bitrate && level.bitrate <= 1200000;
      if (isAllowed) {
        allowed.push({ index: index, height: level.height || 0, bitrate: level.bitrate || 0 });
        var withinAutoCap = level.height
          ? level.height <= state.autoQualityCeiling
          : level.bitrate && level.bitrate <= autoBitrateLimit;
        if (withinAutoCap && score > capScore) {
          capScore = score;
          capIndex = index;
        }
      }
    });

    ui.qualitySelect.innerHTML = "";
    var autoOption = document.createElement("option");
    autoOption.value = "auto";
    autoOption.textContent = "خودکار · سقف " + state.autoQualityCeiling + "p";
    ui.qualitySelect.appendChild(autoOption);

    var uniqueHeights = Object.create(null);
    allowed
      .slice()
      .sort(function (a, b) {
        return b.height - a.height || b.bitrate - a.bitrate;
      })
      .forEach(function (item) {
        if (!item.height || uniqueHeights[item.height]) return;
        uniqueHeights[item.height] = true;
        var option = document.createElement("option");
        option.value = String(item.height);
        option.textContent = item.height + "p";
        ui.qualitySelect.appendChild(option);
      });

    if (capIndex >= 0) {
      state.levelCap = capIndex;
      hls.autoLevelCapping = capIndex;
      hls.currentLevel = -1;
      ui.qualitySelect.disabled = allowed.length <= 1 && !allowed[0].height;
      ui.controlNote.textContent = "خودکار تا " + state.autoQualityCeiling + "p";
      ui.qualityBadge.textContent = "تا " + state.autoQualityCeiling + "p";
      applySavedQuality(hls);
      return;
    }

    state.levelCap = lowestIndex;
    if (lowestIndex >= 0) {
      hls.autoLevelCapping = lowestIndex;
      hls.currentLevel = lowestIndex;
      var lowest = levels[lowestIndex];
      var fallbackQuality = lowest.height || source.quality || 0;
      autoOption.textContent = fallbackQuality
        ? "کمترین موجود · " + fallbackQuality + "p"
        : "کمترین کیفیت موجود";
      ui.qualitySelect.disabled = true;
      ui.qualityBadge.textContent = fallbackQuality ? fallbackQuality + "p" : "کمترین";
      ui.controlNote.textContent = "نسخه کم‌مصرف ندارد";
      showToast("این شبکه کیفیت ۴۸۰p یا پایین‌تر ندارد", 4600);
    } else {
      setFixedQuality(source, false);
    }
  }

  function lowerAutomaticQuality() {
    if (prefs.quality !== "auto") return false;
    var nextCeiling = state.autoQualityCeiling > 360
      ? 360
      : state.autoQualityCeiling > 240
        ? 240
        : 0;
    if (!nextCeiling) return false;
    if (!state.hls || !state.hlsLevels.length) {
      state.autoQualityCeiling = nextCeiling;
      ui.controlNote.textContent = "نسخه کم‌مصرف در اتصال بعدی";
      return Boolean(state.currentChannel && state.currentChannel.tvgId);
    }
    var bitrateLimit = nextCeiling <= 240 ? 500000 : 850000;
    var bestIndex = -1;
    var bestScore = -1;
    var lowestIndex = -1;
    var lowestScore = Infinity;
    state.hlsLevels.forEach(function (level, index) {
      var score = level.height || Math.round((level.bitrate || 0) / 2500);
      if (score < lowestScore) {
        lowestScore = score;
        lowestIndex = index;
      }
      var fits = level.height
        ? level.height <= nextCeiling
        : level.bitrate && level.bitrate <= bitrateLimit;
      if (fits && score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
    if (bestIndex < 0) bestIndex = lowestIndex;
    if (bestIndex < 0) return false;
    if (bestIndex === state.levelCap) {
      state.autoQualityCeiling = nextCeiling;
      return lowerAutomaticQuality();
    }
    state.autoQualityCeiling = nextCeiling;
    state.levelCap = bestIndex;
    state.hls.autoLevelCapping = bestIndex;
    state.hls.loadLevel = -1;
    try {
      state.hls.nextAutoLevel = bestIndex;
    } catch {
      /* Older hls.js builds may not expose nextAutoLevel. */
    }
    var autoOption = ui.qualitySelect.querySelector('option[value="auto"]');
    if (autoOption) autoOption.textContent = "خودکار · سقف " + nextCeiling + "p";
    ui.qualitySelect.value = "auto";
    ui.qualityBadge.textContent = "تا " + nextCeiling + "p";
    ui.controlNote.textContent = "کاهش خودکار برای پخش روان";
    showToast("برای پخش روان، کیفیت خودکار تا " + nextCeiling + "p کاهش یافت", 4200);
    return true;
  }

  function applySavedQuality(hls) {
    if (prefs.quality === "auto") {
      ui.qualitySelect.value = "auto";
      return;
    }
    var desired = Number(prefs.quality);
    var found = state.hlsLevels.findIndex(function (level) {
      return level.height === desired && desired <= 480;
    });
    if (found >= 0) {
      hls.loadLevel = found;
      ui.qualitySelect.value = String(desired);
    } else {
      prefs.quality = "auto";
      savePreferences();
      ui.qualitySelect.value = "auto";
    }
  }

  function tryNextSource(token, reason) {
    if (token !== state.playbackToken) return;
    state.mediaAttemptToken += 1;
    state.playbackTransitioning = true;
    clearTimeout(state.playbackStartTimer);
    state.playbackStartTimer = null;
    if (state.hls) {
      try {
        state.hls.destroy();
      } catch {
        /* no-op */
      }
      state.hls = null;
    }
    try {
      ui.video.pause();
      ui.video.removeAttribute("src");
      ui.video.load();
    } catch {
      /* no-op */
    }
    state.sourceIndex += 1;
    if (state.sourceIndex < state.sourceQueue.length) {
      showStatus("منبع اول پاسخ نداد", "منبع جایگزین در حال بررسی است", false);
      setTimeout(function () {
        startCurrentSource(token);
      }, 350);
      return;
    }
    if (
      !state.alternativesLoaded &&
      state.currentChannel &&
      state.currentChannel.tvgId
    ) {
      state.alternativesLoaded = true;
      showStatus(
        "در حال پیدا کردن مسیر جایگزین…",
        "منبع‌های دیگر همین شبکه بررسی می‌شوند",
        false,
      );
      var existingCount = state.sourceQueue.length;
      var baseChannelId = state.currentChannel.tvgId.split("@")[0];
      loadStreamIndex()
        .then(function (index) {
          if (token !== state.playbackToken) return;
          var combined = uniqueSources(
            state.sourceQueue.concat(index[baseChannelId] || []),
          );
          if (combined.length > existingCount) {
            state.sourceQueue = combined;
            state.sourceIndex = existingCount;
            showToast("یک مسیر جایگزین برای شبکه پیدا شد");
            startCurrentSource(token);
            return;
          }
          showPlaybackError(reason || "پخش این شبکه ممکن نشد");
        })
        .catch(function () {
          if (token === state.playbackToken) {
            showPlaybackError(reason || "پخش این شبکه ممکن نشد");
          }
        });
      return;
    }
    showPlaybackError(reason || "پخش این شبکه ممکن نشد");
  }

  function showPlaybackError(title, detail) {
    state.playbackTransitioning = false;
    state.retryMode = "reload";
    ui.nowStatusText.textContent = "پخش ناموفق";
    ui.nowStatusDot.style.background = "#ff7f83";
    showStatus(
      title || "پخش این شبکه ممکن نشد",
      detail || "ممکن است لینک موقتاً خاموش، محدود به منطقه یا فاقد CORS باشد",
      true,
    );
    ui.retryButton.textContent = "دوباره تلاش کن";
    setPlayIcon(false);
    if (state.currentChannel) {
      setChannelHealth(
        state.currentChannel,
        navigator.onLine === false ? "unknown" : "failed",
        0,
        true,
        true,
      );
    }
    scheduleAutoReconnect(title || "قطع پخش");
  }

  function canAutoRecover(token) {
    return Boolean(
      token === state.playbackToken &&
      state.currentChannel &&
      navigator.onLine !== false &&
      !state.userPaused &&
      !state.playbackTransitioning &&
      !state.playbackSuspendedForScan &&
      !state.healthScanning &&
      document.visibilityState !== "hidden"
    );
  }

  function scheduleAutoReconnect(reason) {
    var token = state.playbackToken;
    if (!canAutoRecover(token) || state.autoRetryTimer) return;
    var channel = state.currentChannel;
    var attempt = state.autoRetryAttempts;
    var delay = AUTO_RETRY_DELAYS[Math.min(attempt, AUTO_RETRY_DELAYS.length - 1)];
    clearTimeout(state.stallRecoveryTimer);
    state.stallRecoveryTimer = null;
    state.isBuffering = false;
    showStatus(
      "اتصال خودکار دوباره…",
      (reason || "پخش متوقف شد") + " · تلاش بعدی تا " + toPersianNumber(Math.ceil(delay / 1000)) + " ثانیه",
      false,
    );
    state.autoRetryTimer = setTimeout(function () {
      state.autoRetryTimer = null;
      if (!canAutoRecover(token) || state.currentChannel !== channel) return;
      state.autoRetryAttempts += 1;
      playChannel(channel, true);
    }, delay);
  }

  function handlePlaybackStall(reason) {
    if (
      state.userPaused ||
      state.playbackTransitioning ||
      state.playbackSuspendedForScan ||
      !state.currentChannel
    ) return;
    var firstStallEvent = !state.isBuffering;
    state.isBuffering = true;
    state.lastPlaybackStallAt = Date.now();
    if (!firstStallEvent) return;
    clearTimeout(state.stablePlaybackTimer);
    state.stablePlaybackTimer = null;
    stopAutoHealthScan(120000, true);
    clearTimeout(state.bufferingTimer);
    clearTimeout(state.stallRecoveryTimer);
    state.bufferingTimer = setTimeout(function () {
      if (!state.isBuffering || state.userPaused) return;
      var lowered = lowerAutomaticQuality();
      if (lowered && state.hls) {
        try {
          state.hls.startLoad(-1);
          requestVideoPlay(state.playbackToken);
        } catch {
          /* Recovery timer below will reconnect if load cannot resume. */
        }
      }
      showStatus(
        lowered
          ? state.hls
            ? "کیفیت برای پخش روان کاهش یافت"
            : "نسخه کم‌مصرف در اتصال بعدی امتحان می‌شود"
          : "در حال بازیابی پخش…",
        reason || "سرعت شبکه موقتاً پایین آمده است",
        false,
      );
    }, STALL_QUALITY_DELAY);
    state.stallRecoveryTimer = setTimeout(function () {
      if (!state.isBuffering || Date.now() - state.lastPlaybackProgressAt < 4000) return;
      state.playbackTransitioning = false;
      scheduleAutoReconnect("پخش برای چند ثانیه متوقف ماند");
    }, STALL_RECOVERY_DELAY);
  }

  function schedulePlaybackWatchdog() {
    clearTimeout(state.playbackWatchdogTimer);
    state.playbackWatchdogTimer = setTimeout(function checkPlaybackProgress() {
      state.playbackWatchdogTimer = null;
      if (!state.currentChannel || state.userPaused || state.playbackSuspendedForScan) return;
      if (
        !ui.video.paused &&
        !state.playbackTransitioning &&
        Date.now() - state.lastPlaybackProgressAt > PLAYBACK_WATCHDOG_STALE
      ) {
        handlePlaybackStall("تصویر برای چند ثانیه پیشرفتی نداشت");
      }
      state.playbackWatchdogTimer = setTimeout(
        checkPlaybackProgress,
        PLAYBACK_WATCHDOG_INTERVAL,
      );
    }, PLAYBACK_WATCHDOG_INTERVAL);
  }

  function setPlayIcon(isPlaying) {
    ui.playIcon.classList.toggle("is-play", !isPlaying);
    ui.playIcon.classList.toggle("is-pause", isPlaying);
  }

  function toggleFavorite() {
    if (!state.currentChannel) return;
    var id = state.currentChannel.id;
    if (isFavorite(id)) {
      prefs.favorites = prefs.favorites.filter(function (favoriteId) {
        return favoriteId !== id;
      });
      showToast("از محبوب‌ها حذف شد");
    } else {
      prefs.favorites.unshift(id);
      showToast("به محبوب‌ها اضافه شد");
    }
    savePreferences();
    updateFavoriteButton();
    state.pageIndex = 0;
    applyFilters(false);
  }

  function togglePlayback() {
    if (!state.currentChannel) {
      var first = state.filtered[0];
      if (first) playChannel(first);
      return;
    }
    if (state.playbackSuspendedForScan) {
      playChannel(state.currentChannel);
      return;
    }
    if (ui.video.paused) {
      state.userPaused = false;
      requestVideoPlay(state.playbackToken);
    } else {
      state.userPaused = true;
      cancelPlaybackRecovery();
      stopAutoHealthScan(120000, false);
      ui.video.pause();
    }
  }

  function toggleMute() {
    if (ui.video.muted || ui.video.volume === 0) {
      if (ui.video.volume === 0) {
        ui.video.volume = prefs.volume > 0 ? prefs.volume : 1;
        prefs.volume = ui.video.volume;
      }
      ui.video.muted = false;
    } else {
      ui.video.muted = true;
    }
    prefs.muted = ui.video.muted;
    savePreferences();
    syncVolumeControls();
  }

  function syncVolumeControls() {
    var percent = Math.round(Math.max(0, Math.min(1, ui.video.volume)) * 100);
    var muted = ui.video.muted || percent === 0;
    ui.volumeRange.value = String(percent);
    ui.volumeRange.setAttribute(
      "aria-valuetext",
      muted ? "صدا قطع است" : toPersianNumber(percent) + " درصد",
    );
    ui.volumeValue.textContent = toPersianNumber(percent) + "٪";
    ui.muteIcon.src =
      ICON_CDN +
      (muted
        ? "volume-mute-fill.svg"
        : percent < 50
          ? "volume-down-fill.svg"
          : "volume-up-fill.svg");
    ui.muteButton.setAttribute("aria-label", muted ? "وصل کردن صدا" : "قطع کردن صدا");
    ui.muteButton.setAttribute("title", muted ? "وصل کردن صدا" : "قطع کردن صدا");
  }

  function setVolume(value, announce) {
    var nextVolume = Math.max(0, Math.min(1, Number(value) || 0));
    ui.video.volume = nextVolume;
    ui.video.muted = nextVolume === 0;
    prefs.volume = nextVolume;
    prefs.muted = ui.video.muted;
    savePreferences();
    syncVolumeControls();
    if (announce) {
      showToast("صدا " + toPersianNumber(Math.round(nextVolume * 100)) + "٪");
    }
  }

  function adjustVolume(delta) {
    var base = ui.video.muted && delta > 0 ? 0 : ui.video.volume;
    setVolume(Math.round((base + delta) * 10) / 10, true);
  }

  function onControlsKeydown(event) {
    showControlsTemporarily();
    if (event.target === ui.volumeRange || event.target === ui.qualitySelect) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    var items = Array.prototype.slice.call(ui.controls.querySelectorAll(".focusable"))
      .filter(function (item) {
        return !item.disabled && !item.classList.contains("is-hidden");
      });
    var index = items.indexOf(event.target);
    if (index < 0) return;
    var nextIndex = event.key === "ArrowLeft" ? index + 1 : index - 1;
    if (!items[nextIndex]) return;
    event.preventDefault();
    event.stopPropagation();
    items[nextIndex].focus();
  }

  function getFullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function pushFullscreenGuard() {
    if (state.historyGuard) return;
    try {
      history.pushState({ mowjFullscreen: true }, "", location.href);
      state.historyGuard = true;
    } catch {
      state.historyGuard = false;
    }
  }

  function removeFullscreenGuard() {
    if (!state.historyGuard) return;
    state.historyGuard = false;
    state.ignoreNextPop = true;
    try {
      history.back();
    } catch {
      state.ignoreNextPop = false;
    }
  }

  function enterPseudoFullscreen() {
    state.pseudoFullscreen = true;
    state.fullActive = true;
    ui.playerShell.classList.add("is-fullscreen");
    updateFullscreenControls(true);
    pushFullscreenGuard();
    ui.playerShell.focus();
    showControlsTemporarily();
    showOsd(state.currentChannel || { name: "موج", logo: "" }, "تمام‌صفحه");
  }

  function enterFullscreen() {
    if (state.fullActive || getFullscreenElement()) return;
    pushFullscreenGuard();
    var request = ui.playerShell.requestFullscreen || ui.playerShell.webkitRequestFullscreen;
    if (!request) {
      enterPseudoFullscreen();
      return;
    }
    var result;
    try {
      result = request.call(ui.playerShell);
    } catch {
      enterPseudoFullscreen();
      return;
    }
    if (result && typeof result.catch === "function") {
      result.catch(function () {
        enterPseudoFullscreen();
      });
    }
    setTimeout(function () {
      if (!getFullscreenElement() && !state.pseudoFullscreen) enterPseudoFullscreen();
    }, 700);
  }

  function exitFullscreen(fromHistory) {
    var element = getFullscreenElement();
    clearTimeout(state.controlsTimer);
    state.controlsTimer = null;
    state.pseudoFullscreen = false;
    ui.playerShell.classList.remove("is-fullscreen");
    ui.playerShell.classList.remove("controls-hidden");
    updateFullscreenControls(false);
    if (element) {
      var exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) {
        try {
          exit.call(document);
        } catch {
          /* fullscreenchange will eventually clean up if supported. */
        }
      }
    }
    state.fullActive = false;
    if (!fromHistory) removeFullscreenGuard();
    restoreChannelFocus();
  }

  function toggleFullscreen() {
    if (state.fullActive || getFullscreenElement() || state.pseudoFullscreen) {
      exitFullscreen(false);
    } else {
      enterFullscreen();
    }
  }

  function onFullscreenChange() {
    var active = Boolean(getFullscreenElement());
    if (active) {
      state.fullActive = true;
      updateFullscreenControls(true);
      pushFullscreenGuard();
      ui.playerShell.focus();
      showControlsTemporarily();
      if (state.currentChannel) showOsd(state.currentChannel, "تمام‌صفحه");
    } else if (!state.pseudoFullscreen && state.fullActive) {
      clearTimeout(state.controlsTimer);
      state.controlsTimer = null;
      state.fullActive = false;
      ui.playerShell.classList.remove("controls-hidden");
      updateFullscreenControls(false);
      removeFullscreenGuard();
      restoreChannelFocus();
    }
  }

  function restoreChannelFocus() {
    if (state.restoringFocus) return;
    state.restoringFocus = true;
    setTimeout(function () {
      state.restoringFocus = false;
      if (!focusChannelById(state.focusedChannelId || (state.currentChannel && state.currentChannel.id))) {
        ui.playerShell.focus();
      }
    }, 120);
  }

  function updateFullscreenControls(active) {
    setHidden(ui.previousChannelButton, !active);
    setHidden(ui.nextChannelButton, !active);
    ui.fullscreenButton.setAttribute("aria-label", active ? "خروج از تمام صفحه" : "تمام صفحه");
    ui.fullscreenButton.title = active ? "خروج از تمام صفحه" : "تمام صفحه";
    ui.fullscreenButtonText.textContent = active ? "خروج" : "تمام‌صفحه";
  }

  function showControlsTemporarily() {
    clearTimeout(state.controlsTimer);
    ui.playerShell.classList.remove("controls-hidden");
    if (!state.fullActive && !state.pseudoFullscreen && !getFullscreenElement()) return;
    state.controlsTimer = setTimeout(function () {
      state.controlsTimer = null;
      if (!state.fullActive && !state.pseudoFullscreen && !getFullscreenElement()) return;
      if (document.activeElement && ui.controls.contains(document.activeElement)) {
        ui.playerShell.focus();
      }
      ui.playerShell.classList.add("controls-hidden");
    }, 4200);
  }

  function switchChannel(direction) {
    if (!state.filtered.length) return;
    var currentIndex = state.currentChannel
      ? state.filtered.findIndex(function (channel) {
          return channel.id === state.currentChannel.id;
        })
      : -1;
    var nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = state.filtered.length - 1;
    if (nextIndex >= state.filtered.length) nextIndex = 0;
    var channel = state.filtered[nextIndex];
    if (channel) {
      state.focusedChannelId = channel.id;
      playChannel(channel);
      showOsd(channel, "تعویض شبکه");
    }
  }

  function setSleep(minutes) {
    clearTimeout(state.sleepTimer);
    if (!minutes) {
      prefs.sleepUntil = 0;
      savePreferences();
      updateSleepLabel();
      showToast("تایمر خواب خاموش شد");
      return;
    }
    prefs.sleepUntil = Date.now() + minutes * 60 * 1000;
    savePreferences();
    scheduleSleepTimer();
    updateSleepLabel();
    showToast("پخش تا " + toPersianNumber(minutes) + " دقیقه دیگر متوقف می‌شود");
  }

  function scheduleSleepTimer() {
    clearTimeout(state.sleepTimer);
    var remaining = prefs.sleepUntil - Date.now();
    if (remaining <= 0) {
      prefs.sleepUntil = 0;
      savePreferences();
      return;
    }
    state.sleepTimer = setTimeout(function () {
      state.userPaused = true;
      cancelPlaybackRecovery();
      stopAutoHealthScan(120000, false);
      ui.video.pause();
      if (state.fullActive || state.pseudoFullscreen) exitFullscreen(false);
      prefs.sleepUntil = 0;
      savePreferences();
      updateSleepLabel();
      showToast("تایمر خواب: پخش متوقف شد", 5000);
    }, remaining);
  }

  function updateSleepLabel() {
    if (!prefs.sleepUntil || prefs.sleepUntil <= Date.now()) {
      ui.sleepLabel.textContent = "تایمر خواب";
      return;
    }
    var minutes = Math.max(1, Math.ceil((prefs.sleepUntil - Date.now()) / 60000));
    ui.sleepLabel.textContent = toPersianNumber(minutes) + " دقیقه";
  }

  function cycleSleepTimer() {
    var remaining = prefs.sleepUntil > Date.now()
      ? Math.ceil((prefs.sleepUntil - Date.now()) / 60000)
      : 0;
    if (!remaining) setSleep(30);
    else if (remaining <= 30) setSleep(60);
    else if (remaining <= 60) setSleep(90);
    else setSleep(0);
  }

  function updateGridConfig() {
    var config = getGridConfig();
    if (
      config.size === state.pageSize &&
      config.columns === state.gridColumns &&
      config.rows === state.gridRows
    ) return;
    var activeElement = document.activeElement;
    var restoreCardFocus = Boolean(
      activeElement && ui.channelList.contains(activeElement),
    );
    var anchorIndex = state.pageIndex * state.pageSize;
    if (state.focusedChannelId) {
      var focusedIndex = state.filtered.findIndex(function (channel) {
        return channel.id === state.focusedChannelId;
      });
      if (focusedIndex >= 0) anchorIndex = focusedIndex;
    }
    state.pageSize = config.size;
    state.gridColumns = config.columns;
    state.gridRows = config.rows;
    state.pageIndex = Math.floor(anchorIndex / state.pageSize);
    if (state.filtered.length) {
      renderChannels(restoreCardFocus ? state.focusedChannelId : null);
    }
  }

  function openSourceModal(mode) {
    stopAutoHealthScan(30000, false);
    state.sourceModalMode = mode || "picker";
    updateSourceButton();
    if (state.sourceModalMode === "welcome") {
      ui.sourceModalKicker.textContent = "به موج خوش آمدی";
      ui.sourceModalTitle.textContent = "دستهٔ پیش‌فرضت را انتخاب کن";
      ui.sourceModalLead.textContent =
        "از این به بعد، سایت با همین دسته برایت باز می‌شود.";
      ui.closeSourceModalButton.setAttribute("aria-label", "فعلاً انتخاب همه شبکه‌ها");
      setHidden(ui.sourceDefaultNote, false);
    } else {
      ui.sourceModalKicker.textContent = "انتخاب مجموعه";
      ui.sourceModalTitle.textContent = "کدام شبکه‌ها را می‌خواهی؟";
      ui.sourceModalLead.textContent = "با جهت‌های ریموت حرکت کن و Enter را بزن.";
      ui.closeSourceModalButton.setAttribute("aria-label", "بستن انتخاب فهرست");
      setHidden(ui.sourceDefaultNote, true);
    }
    var selectedKey = state.sourceModalMode === "welcome"
      ? prefs.defaultSource
      : state.activeSource;
    var options = ui.sourceOptions.querySelectorAll(".source-option");
    for (var optionIndex = 0; optionIndex < options.length; optionIndex += 1) {
      var optionSelected = options[optionIndex].getAttribute("data-source") === selectedKey;
      options[optionIndex].classList.toggle("is-selected", optionSelected);
      options[optionIndex].setAttribute("aria-selected", optionSelected ? "true" : "false");
    }
    state.sourceModalOpen = true;
    setHidden(ui.sourceModal, false);
    var selectedOption = ui.sourceOptions.querySelector(".source-option.is-selected");
    if (selectedOption) selectedOption.focus();
    else if (options[0]) options[0].focus();
  }

  function closeSourceModal(restoreFocus) {
    state.sourceModalOpen = false;
    setHidden(ui.sourceModal, true);
    if (restoreFocus !== false) ui.sourceButton.focus();
    scheduleAutoHealthScan(15000);
  }

  function continueInitialHealthScan() {
    if (!state.initialScanOpen) return;
    if (!state.channels.length) {
      showInitialScanUnavailable();
      return;
    }
    if (state.channels.length > HEALTH_FULL_SCAN_LIMIT) {
      showLargeScanSkipped();
      return;
    }
    startHealthScan(false, "onboarding");
  }

  function startFirstExperience(sourceKey) {
    var selectedSource = PLAYLISTS[sourceKey] ? sourceKey : "all";
    prefs.defaultSource = selectedSource;
    prefs.lastSource = selectedSource;
    prefs.onboardingVersion = 1;
    prefs.initialScanDone = false;
    savePreferences();
    state.activeSource = selectedSource;
    closeSourceModal(false);
    prepareInitialScanModal("onboarding");
    loadPlaylist(selectedSource, false).then(function () {
      continueInitialHealthScan();
    });
  }

  function dismissSourceModal() {
    if (state.sourceModalMode === "welcome") {
      startFirstExperience("all");
      return;
    }
    closeSourceModal(true);
  }

  function chooseSource(sourceKey) {
    if (!PLAYLISTS[sourceKey]) return;
    if (state.sourceModalMode === "welcome") {
      startFirstExperience(sourceKey);
      return;
    }
    closeSourceModal(true);
    if (sourceKey === state.activeSource && state.channels.length) return;
    state.query = "";
    state.pageIndex = 0;
    ui.searchInput.value = "";
    setHidden(ui.clearSearchButton, true);
    loadPlaylist(sourceKey, false).then(function () {
      startCategoryHealthScan(sourceKey);
    });
  }

  function onSourceOptionKeydown(event) {
    var key = event.key;
    if (
      key !== "ArrowDown" &&
      key !== "ArrowUp" &&
      key !== "ArrowLeft" &&
      key !== "ArrowRight"
    ) return;
    event.preventDefault();
    event.stopPropagation();
    var buttons = Array.prototype.slice.call(
      ui.sourceOptions.querySelectorAll(".source-option"),
    );
    var index = buttons.indexOf(event.currentTarget);
    var columns = 2;
    var column = index % columns;
    var nextIndex = index;
    if (key === "ArrowUp" && index - columns < 0) {
      ui.closeSourceModalButton.focus();
      return;
    }
    if (key === "ArrowLeft" && column < columns - 1) nextIndex = index + 1;
    if (key === "ArrowRight" && column > 0) nextIndex = index - 1;
    if (key === "ArrowDown" && index + columns < buttons.length) {
      nextIndex = index + columns;
    }
    if (key === "ArrowUp" && index - columns >= 0) nextIndex = index - columns;
    if (buttons[nextIndex]) buttons[nextIndex].focus();
  }

  function onInitialScanKeydown(event) {
    if (
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight" &&
      event.key !== "ArrowUp" &&
      event.key !== "ArrowDown"
    ) return;
    var items = [ui.closeInitialScanButton];
    if (!ui.skipInitialScanButton.classList.contains("is-hidden")) {
      items.push(ui.skipInitialScanButton);
    }
    if (!ui.finishInitialScanButton.classList.contains("is-hidden")) {
      items.push(ui.finishInitialScanButton);
    }
    var index = items.indexOf(event.target);
    if (index < 0) index = 0;
    var forward = event.key === "ArrowLeft" || event.key === "ArrowDown";
    var nextIndex = forward ? index + 1 : index - 1;
    if (nextIndex >= items.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = items.length - 1;
    event.preventDefault();
    event.stopPropagation();
    items[nextIndex].focus();
  }

  function openHelp() {
    stopAutoHealthScan(30000, false);
    setHidden(ui.helpModal, false);
    ui.closeHelpButton.focus();
  }

  function closeHelp() {
    setHidden(ui.helpModal, true);
    ui.helpButton.focus();
    scheduleAutoHealthScan(15000);
  }

  function isTextControl(element) {
    if (!element) return false;
    var tag = element.tagName;
    return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";
  }

  function handleBack(event) {
    var modalOpen = !ui.helpModal.classList.contains("is-hidden");
    if (state.initialScanOpen) {
      if (event) event.preventDefault();
      dismissInitialScan();
      return true;
    }
    if (state.fullActive || state.pseudoFullscreen || getFullscreenElement()) {
      if (event) event.preventDefault();
      exitFullscreen(false);
      return true;
    }
    if (state.sourceModalOpen) {
      if (event) event.preventDefault();
      dismissSourceModal();
      return true;
    }
    if (modalOpen) {
      if (event) event.preventDefault();
      closeHelp();
      return true;
    }
    if (ui.searchInput.value) {
      if (event) event.preventDefault();
      ui.searchInput.value = "";
      state.query = "";
      state.pageIndex = 0;
      setHidden(ui.clearSearchButton, true);
      applyFilters(false);
      ui.searchInput.focus();
      return true;
    }
    return false;
  }

  function onGlobalKeydown(event) {
    var key = event.key;
    var keyCode = event.keyCode || event.which;
    var isBack = key === "Escape" || key === "BrowserBack" || key === "GoBack" || keyCode === 10009;
    if (isBack) {
      handleBack(event);
      return;
    }

    if (
      state.sourceModalOpen ||
      state.initialScanOpen ||
      !ui.helpModal.classList.contains("is-hidden")
    ) return;

    var full = state.fullActive || state.pseudoFullscreen || Boolean(getFullscreenElement());
    if (full && keyCode === 427) {
      event.preventDefault();
      showControlsTemporarily();
      switchChannel(-1);
      return;
    }
    if (full && keyCode === 428) {
      event.preventDefault();
      showControlsTemporarily();
      switchChannel(1);
      return;
    }

    if (isTextControl(event.target)) return;

    if (full) {
      showControlsTemporarily();
      if (ui.controls.contains(event.target)) return;
      if (key === "ArrowUp") {
        event.preventDefault();
        switchChannel(-1);
        return;
      }
      if (key === "ArrowDown") {
        event.preventDefault();
        switchChannel(1);
        return;
      }
      if (key === "Enter" && event.target === ui.playerShell) {
        event.preventDefault();
        togglePlayback();
      }
    }

    if (!full && (key === "PageUp" || keyCode === 427)) {
      event.preventDefault();
      changePage(-1, true);
      return;
    }
    if (!full && (key === "PageDown" || keyCode === 428)) {
      event.preventDefault();
      changePage(1, true);
      return;
    }

    if (event.target === ui.playerShell) {
      if (key === "ArrowLeft") {
        event.preventDefault();
        ui.playButton.focus();
      } else if (key === "ArrowRight") {
        event.preventDefault();
        if (!focusChannelById(state.focusedChannelId)) {
          var first = ui.channelList.querySelector(".channel-card");
          if (first) first.focus();
        }
      } else if (key === "Enter" && !full) {
        event.preventDefault();
        togglePlayback();
      }
    }
  }

  function bindEvents() {
    window.addEventListener("online", updateNetworkState);
    window.addEventListener("offline", updateNetworkState);
    window.addEventListener("resize", function () {
      clearTimeout(state.resizeTimer);
      state.resizeTimer = setTimeout(updateGridConfig, 180);
    });
    document.addEventListener("keydown", onGlobalKeydown);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") {
        stopAutoHealthScan(30000, false);
        clearTimeout(state.playbackWatchdogTimer);
        state.playbackWatchdogTimer = null;
        return;
      }
      scheduleAutoHealthScan(30000);
      if (state.currentChannel && !ui.video.paused) schedulePlaybackWatchdog();
      if (
        state.currentChannel &&
        ui.video.paused &&
        !state.userPaused &&
        !state.playbackSuspendedForScan
      ) {
        state.playbackTransitioning = false;
        scheduleAutoReconnect("بازگشت به صفحه پخش");
      }
    });
    window.addEventListener("popstate", function () {
      if (state.ignoreNextPop) {
        state.ignoreNextPop = false;
        return;
      }
      if (state.historyGuard || state.fullActive || state.pseudoFullscreen) {
        state.historyGuard = false;
        exitFullscreen(true);
      }
    });

    ui.sourceButton.addEventListener("click", function () {
      openSourceModal("picker");
    });
    ui.sourceButton.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        ui.searchInput.focus();
      }
    });
    ui.closeSourceModalButton.addEventListener("click", dismissSourceModal);
    ui.closeSourceModalButton.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowDown") return;
      event.preventDefault();
      var selected = ui.sourceOptions.querySelector(".source-option.is-selected");
      if (selected) selected.focus();
    });
    ui.sourceModal.addEventListener("click", function (event) {
      if (event.target === ui.sourceModal) dismissSourceModal();
    });
    var sourceButtons = ui.sourceOptions.querySelectorAll(".source-option");
    for (var sourceIndex = 0; sourceIndex < sourceButtons.length; sourceIndex += 1) {
      sourceButtons[sourceIndex].addEventListener("keydown", onSourceOptionKeydown);
      sourceButtons[sourceIndex].addEventListener("click", function (event) {
        chooseSource(event.currentTarget.getAttribute("data-source"));
      });
    }

    ui.prevPageButton.addEventListener("click", function () {
      changePage(-1, true);
    });
    ui.nextPageButton.addEventListener("click", function () {
      changePage(1, true);
    });
    ui.prevPageButton.addEventListener("keydown", onPaginationKeydown);
    ui.nextPageButton.addEventListener("keydown", onPaginationKeydown);
    ui.healthCheckButton.addEventListener("click", function () {
      startManualHealthScan();
    });
    ui.healthCheckButton.addEventListener("keydown", onFooterKeydown);
    ui.refreshListButton.addEventListener("keydown", onFooterKeydown);

    ui.searchInput.addEventListener("input", function () {
      clearTimeout(state.searchTimer);
      setHidden(ui.clearSearchButton, !ui.searchInput.value);
      state.searchTimer = setTimeout(function () {
        state.query = ui.searchInput.value;
        state.pageIndex = 0;
        applyFilters(false);
      }, 180);
    });

    ui.searchInput.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        var first = ui.channelList.querySelector(".channel-card");
        if (first) first.focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        ui.sourceButton.focus();
      }
    });

    ui.clearSearchButton.addEventListener("click", function () {
      ui.searchInput.value = "";
      state.query = "";
      state.pageIndex = 0;
      setHidden(ui.clearSearchButton, true);
      applyFilters(false);
      ui.searchInput.focus();
    });

    ui.refreshListButton.addEventListener("click", function () {
      loadPlaylist(state.activeSource, true);
    });
    ui.favoriteButton.addEventListener("click", toggleFavorite);
    ui.reloadButton.addEventListener("click", function () {
      if (state.currentChannel) playChannel(state.currentChannel);
    });
    ui.retryButton.addEventListener("click", function () {
      if (!state.currentChannel) return;
      if (state.retryMode === "play") requestVideoPlay(state.playbackToken);
      else playChannel(state.currentChannel);
    });
    ui.playButton.addEventListener("click", togglePlayback);
    ui.previousChannelButton.addEventListener("click", function () {
      switchChannel(-1);
      showControlsTemporarily();
    });
    ui.nextChannelButton.addEventListener("click", function () {
      switchChannel(1);
      showControlsTemporarily();
    });
    ui.muteButton.addEventListener("click", toggleMute);
    ui.volumeUpButton.addEventListener("click", function () {
      adjustVolume(0.1);
    });
    ui.volumeDownButton.addEventListener("click", function () {
      adjustVolume(-0.1);
    });
    ui.volumeRange.addEventListener("input", function () {
      setVolume(Number(ui.volumeRange.value) / 100, false);
    });
    ui.fullscreenButton.addEventListener("click", toggleFullscreen);
    ui.playerShell.addEventListener("mousemove", showControlsTemporarily);
    ui.playerShell.addEventListener("wheel", showControlsTemporarily);
    ui.playerShell.addEventListener("touchstart", showControlsTemporarily);
    ui.playerShell.addEventListener("click", showControlsTemporarily);
    ui.controls.addEventListener("focusin", showControlsTemporarily);
    ui.controls.addEventListener("keydown", onControlsKeydown);

    ui.closeInitialScanButton.addEventListener("click", dismissInitialScan);
    ui.skipInitialScanButton.addEventListener("click", skipInitialScan);
    ui.finishInitialScanButton.addEventListener("click", function () {
      closeInitialScan(true);
    });
    ui.initialScanModal.addEventListener("click", function (event) {
      if (event.target === ui.initialScanModal) dismissInitialScan();
    });
    ui.initialScanModal.addEventListener("keydown", onInitialScanKeydown);

    ui.qualitySelect.addEventListener("change", function () {
      if (!state.hls) return;
      var value = ui.qualitySelect.value;
      prefs.quality = value;
      savePreferences();
      if (value === "auto") {
        state.autoQualityCeiling = 480;
        var autoCap = -1;
        var autoScore = -1;
        state.hlsLevels.forEach(function (level, index) {
          var fits = level.height
            ? level.height <= 480
            : level.bitrate && level.bitrate <= 1200000;
          var score = level.height || Math.round((level.bitrate || 0) / 2500);
          if (fits && score > autoScore) {
            autoScore = score;
            autoCap = index;
          }
        });
        if (autoCap >= 0) state.levelCap = autoCap;
        state.hls.autoLevelCapping = state.levelCap;
        state.hls.loadLevel = -1;
        var autoOption = ui.qualitySelect.querySelector('option[value="auto"]');
        if (autoOption) autoOption.textContent = "خودکار · سقف 480p";
        ui.qualityBadge.textContent = "تا 480p";
        ui.controlNote.textContent = "خودکار تا 480p";
        showToast("کیفیت خودکار فعال شد");
        return;
      }
      var desired = Number(value);
      state.autoQualityCeiling = Math.min(480, desired || 480);
      var index = state.hlsLevels.findIndex(function (level) {
        return level.height === desired;
      });
      if (index >= 0) {
        state.hls.loadLevel = index;
        ui.qualityBadge.textContent = desired + "p";
        showToast("کیفیت روی " + desired + "p تنظیم شد");
      }
    });

    ui.video.addEventListener("playing", function () {
      if (state.playbackSuspendedForScan) {
        ui.video.pause();
        return;
      }
      stopAutoHealthScan(30000, false);
      abortHealthChecks(true);
      clearTimeout(state.bufferingTimer);
      clearTimeout(state.stallRecoveryTimer);
      clearTimeout(state.autoRetryTimer);
      clearTimeout(state.stablePlaybackTimer);
      clearTimeout(state.playbackStartTimer);
      state.autoRetryTimer = null;
      state.stallRecoveryTimer = null;
      state.playbackStartTimer = null;
      state.playbackTransitioning = false;
      state.userPaused = false;
      state.isBuffering = false;
      state.hasPlaybackStarted = true;
      state.lastPlaybackProgressAt = Date.now();
      armStablePlaybackTimer();
      schedulePlaybackWatchdog();
      hideStatus();
      setHidden(ui.placeholder, true);
      setPlayIcon(true);
      ui.nowStatusText.textContent = "در حال پخش";
      ui.nowStatusDot.style.background = "#70f0c1";
      if (state.currentChannel) {
        showOsd(state.currentChannel, ui.qualityBadge.textContent + " · زنده");
        addToRecent(state.currentChannel, state.playbackToken);
        clearTimeout(state.healthConfirmTimer);
        var confirmedChannel = state.currentChannel;
        var confirmedToken = state.playbackToken;
        state.healthConfirmTimer = setTimeout(function () {
          if (
            confirmedToken === state.playbackToken &&
            state.currentChannel === confirmedChannel &&
            !ui.video.paused
          ) {
            setChannelHealth(confirmedChannel, "confirmed", 0, true, true);
          }
        }, 2000);
      }
      scheduleAutoHealthScan(20000);
    });

    ui.video.addEventListener("pause", function () {
      clearTimeout(state.playbackWatchdogTimer);
      state.playbackWatchdogTimer = null;
      setPlayIcon(false);
      if (state.currentChannel && !ui.video.ended) {
        ui.nowStatusText.textContent = state.playbackSuspendedForScan
          ? "متوقف برای سنجش"
          : state.userPaused
            ? "مکث"
            : "در حال اتصال دوباره";
        ui.nowStatusDot.style.background = "#ffd166";
      }
      if (
        state.currentChannel &&
        !state.userPaused &&
        !state.playbackTransitioning &&
        !state.playbackSuspendedForScan &&
        !ui.video.ended &&
        document.visibilityState !== "hidden"
      ) {
        cancelPlaybackRecovery();
        stopAutoHealthScan(120000, true);
        scheduleAutoReconnect("پخش ناخواسته متوقف شد");
      }
    });

    ui.video.addEventListener("waiting", function () {
      if (state.playbackSuspendedForScan) return;
      handlePlaybackStall("در حال دریافت ادامه پخش");
    });

    ui.video.addEventListener("stalled", function () {
      handlePlaybackStall("دریافت تصویر برای لحظه‌ای متوقف شد");
    });

    ui.video.addEventListener("canplay", function () {
      if (state.playbackSuspendedForScan) return;
      if (state.currentChannel && state.currentChannel.healthStatus !== "confirmed") {
        setChannelHealth(state.currentChannel, "reachable", 0, true, false);
      }
    });

    ui.video.addEventListener("timeupdate", function () {
      var mediaTime = Number(ui.video.currentTime);
      if (
        !isFinite(mediaTime) ||
        Math.abs(mediaTime - state.lastMediaTime) < 0.05
      ) return;
      state.lastMediaTime = mediaTime;
      state.lastPlaybackProgressAt = Date.now();
      clearTimeout(state.autoRetryTimer);
      state.autoRetryTimer = null;
      if (!ui.video.paused && state.playbackTransitioning) {
        state.playbackTransitioning = false;
        clearTimeout(state.playbackStartTimer);
        state.playbackStartTimer = null;
        schedulePlaybackWatchdog();
      }
      if (!state.isBuffering) return;
      state.isBuffering = false;
      clearTimeout(state.bufferingTimer);
      clearTimeout(state.stallRecoveryTimer);
      state.stallRecoveryTimer = null;
      armStablePlaybackTimer();
      if (!ui.video.paused) hideStatus();
      scheduleAutoHealthScan(30000);
    });

    ui.video.addEventListener("ended", function () {
      if (
        !state.currentChannel ||
        state.userPaused ||
        state.playbackSuspendedForScan ||
        document.visibilityState === "hidden"
      ) return;
      cancelPlaybackRecovery();
      stopAutoHealthScan(120000, true);
      state.playbackTransitioning = false;
      scheduleAutoReconnect("پخش زنده پایان یافت");
    });

    ui.video.addEventListener("seeking", function () {
      stopAutoHealthScan(120000, true);
    });

    ui.video.addEventListener("volumechange", function () {
      syncVolumeControls();
    });

    ui.video.addEventListener("error", function () {
      stopAutoHealthScan(300000, true);
      if (state.hls || !state.currentChannel) return;
      if (!ui.video.getAttribute("src")) return;
      clearTimeout(state.nativeErrorTimer);
      var token = state.playbackToken;
      var attemptToken = state.mediaAttemptToken;
      state.nativeErrorTimer = setTimeout(function () {
        if (
          token === state.playbackToken &&
          attemptToken === state.mediaAttemptToken
        ) tryNextSource(token, "مرورگر نتوانست این منبع را پخش کند");
      }, 500);
    });

    ui.helpButton.addEventListener("click", openHelp);
    ui.closeHelpButton.addEventListener("click", closeHelp);
    ui.helpModal.addEventListener("click", function (event) {
      if (event.target === ui.helpModal) closeHelp();
    });
    ui.sleepButton.addEventListener("click", cycleSleepTimer);
  }

  function requestPersistentStorage() {
    if (
      !navigator.storage ||
      typeof navigator.storage.persist !== "function"
    ) return;
    try {
      var persistenceRequest = navigator.storage.persist();
      if (persistenceRequest && typeof persistenceRequest.catch === "function") {
        persistenceRequest.catch(function () {
          /* IndexedDB still works when persistent-storage permission is unavailable. */
        });
      }
    } catch {
      /* Older television engines may expose an incomplete StorageManager API. */
    }
  }

  function init() {
    ui.video.volume = Math.max(0, Math.min(1, Number(prefs.volume) || 0));
    ui.video.muted = Boolean(prefs.muted);
    syncVolumeControls();
    updateSourceButton();
    updateGridConfig();
    updateClock();
    setInterval(updateClock, 1000);
    updateNetworkState();
    requestPersistentStorage();
    openCacheDatabase();
    scheduleSleepTimer();
    bindEvents();
    if (Number(prefs.onboardingVersion) < 1) {
      openSourceModal("welcome");
      return;
    }
    if (!prefs.initialScanDone) prepareInitialScanModal("onboarding");
    loadPlaylist(state.activeSource, false).then(function () {
      continueInitialHealthScan();
    });
  }

  init();
})();

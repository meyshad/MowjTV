# Mowj TV

[Open the live app](https://meyshad.github.io/MowjTV/)

موج یک رابط فارسی، استاتیک و سازگار با ریموت برای مرور و پخش شبکه‌های IPTV در مرورگر تلویزیون است. هستهٔ پروژه به بک‌اند، دیتابیس یا پروکسی نیاز ندارد و برای تلویزیون‌های Samsung، از جمله سری AU، بهینه شده است.

> Mowj TV is a lightweight, RTL, remote-friendly IPTV web client. It ships a snapshot of IPTV-ORG's public channel lists, but it does not host or restream any video.

## Features

- A dark, glassy 10-foot interface: the focused item lifts, grows slightly and turns bright so it is easy to spot from the sofa
- Categories in a segmented control with three groups: Persian (favorites, Persian, provincial), topics (news, sports, music, documentary, kids, movies and series) and regions (Turkey, Middle East, East Asia, Europe, Americas, all); the chosen group's categories sit right below it
- Playable-first lists: channels that played on this connection move to the top, and channels that usually fail here are dimmed, moved to the end and skipped by CH+/CH-
- Built for TV browsers: nothing scrolls inside the page; the channel list turns whole pages with large buttons (or by walking past the last row), and every category is visible at once, so both the D-pad and a remote-controlled pointer work well
- Full D-pad navigation with one high-contrast focus style, Back-key handling, number keys to jump to a channel, and CH+/CH- or Up/Down to zap in fullscreen
- Data-saving playback: automatic quality is capped at 480p; a higher quality can be chosen from the quality menu and is remembered
- Cautious adaptive bitrate tuned for slow, unstable connections, with bounded reconnects and no download while paused or hidden
- Lazy availability check: one small request for the channel the remote rests on, and an opt-in "check channels" button that checks a whole list (a few KB per channel); never an automatic background scan
- Fully self-hosted: the page, hls.js, the font, the channel lists and 64px WebP logos (about 1-2 KB each) all load from the host the package is uploaded to; only the video streams come from each channel's own server
- Channels a browser cannot play (HTTP-only, CORS-locked, or needing custom headers) are removed when the package is built, which keeps the bundled lists small
- Channel lists are cached for 12 hours, so opening the app normally costs no list traffic
- `npm run refresh-data` (and a weekly GitHub Action) refreshes the lists and logos and rebuilds the package
- Responsive layout for TVs, desktops and phones

## Quick Start

For conventional static hosting, extract [`release/tv.zip`](./release/tv.zip) into the public root of your server (for example `public_html`) and open `/tv/`; the domain root also redirects there. See [DEPLOY.md](./DEPLOY.md) for detailed instructions, or [DEPLOY.fa.md](./DEPLOY.fa.md) for steps in Persian.

You can also serve `public/tv/` directly from any HTTPS-enabled static web server without a build step. For local development:

```bash
npm ci
npm run dev
```

To validate the project:

```bash
npm test
npm run lint
```

## Project Structure

- `public/tv/`: the primary, standalone TV interface
- `app/`: the entry page that redirects visitors to `/tv/`
- `tests/`: build, compatibility, behavior, and output-size checks
- `scripts/build-data.mjs`: downloads the IPTV-ORG playlists, keeps browser-playable channels in `public/tv/data/` and builds the logos in `public/tv/logos/`
- `scripts/build-release.mjs`: builds `release/` (the site, a root redirect to `tv/`, and `tv.zip`)
- `release/`: the ready-to-upload hosting package

## Data, Privacy, and Limitations

Channel lists come from [IPTV-ORG](https://github.com/iptv-org/iptv) and are bundled when the package is built; playback connects directly to each channel's stream host. This repository and the Mowj TV website do not store video files. Channel names, logos, and programming remain the property of their respective owners.

Streams may fail because of CORS restrictions, regional limitations, DRM, unsupported codecs, insecure HTTP sources, or unavailable upstream servers. Favorites, availability results, settings, and playlist caches stay in the current browser's local storage. The app makes no requests to CDNs or playlist providers; requests to stream hosts still expose the viewer's IP address and standard browser metadata to those services.

Mowj TV does not bypass DRM, payments, authentication, or access restrictions. Only watch streams you are authorized to access. The project is independent and is not affiliated with or endorsed by Samsung or IPTV-ORG. [PROXY.md](./PROXY.md) provides security guidance only; the project does not include a ready-to-use streaming proxy.

## Contributing and License

Issues and pull requests are welcome. Run `npm test` and `npm run lint` before submitting a change. Report security concerns according to [SECURITY.md](./SECURITY.md).

Mowj TV is released under the [MIT License](./LICENSE). Third-party licenses and attribution are listed in [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

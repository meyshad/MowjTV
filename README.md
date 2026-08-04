# Mowj TV

[Open the live app](https://meyshad.github.io/MowjTV/)

موج یک رابط فارسی، استاتیک و سازگار با ریموت برای مرور و پخش شبکه‌های IPTV در مرورگر تلویزیون است. هستهٔ پروژه به بک‌اند، دیتابیس یا پروکسی نیاز ندارد و برای تلویزیون‌های Samsung، از جمله سری AU، بهینه شده است.

> Mowj TV is a lightweight, RTL, remote-friendly IPTV web client. It does not host, restream, or bundle television channels.

## Features

- Search, categories, pagination, and favorites
- HLS playback through the browser's native support or `hls.js`
- Full remote-control navigation, Back-to-exit fullscreen, and CH+/CH− channel switching
- Auto-hiding fullscreen controls with previous and next channel buttons
- Automatic 480p quality cap, adaptive quality reduction, and playback recovery
- Lightweight stream availability checks with local caching for playlists and settings
- Persian date and time, sleep timer, and a viewing-distance-friendly interface

## Quick Start

For conventional static hosting, extract [`release/tv.zip`](./release/tv.zip) into the public root of your server and open `/tv/`. See [DEPLOY.md](./DEPLOY.md) for detailed instructions.

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
- `release/`: the ready-to-upload hosting package

## Data, Privacy, and Limitations

Channel lists are fetched at runtime from [IPTV-ORG](https://github.com/iptv-org/iptv), and playback connects directly to each channel's stream host. This repository and the Mowj TV website do not store video files. Channel names, logos, and programming remain the property of their respective owners.

Streams may fail because of CORS restrictions, regional limitations, DRM, unsupported codecs, insecure HTTP sources, or unavailable upstream servers. Favorites, availability results, settings, and playlist caches stay in the current browser's local storage. Requests to CDNs, playlist providers, and stream hosts still expose the viewer's IP address and standard browser metadata to those services.

Mowj TV does not bypass DRM, payments, authentication, or access restrictions. Only watch streams you are authorized to access. The project is independent and is not affiliated with or endorsed by Samsung or IPTV-ORG. [PROXY.md](./PROXY.md) provides security guidance only; the project does not include a ready-to-use streaming proxy.

## Contributing and License

Issues and pull requests are welcome. Run `npm test` and `npm run lint` before submitting a change. Report security concerns according to [SECURITY.md](./SECURITY.md).

Mowj TV is released under the [MIT License](./LICENSE). Third-party licenses and attribution are listed in [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

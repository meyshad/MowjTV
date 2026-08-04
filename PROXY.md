# Streaming Proxy Guide

Only deploy a proxy for content you are authorized to access and retransmit. Do not use it to bypass DRM, payments, authentication, regional restrictions, or other access controls. Review the current terms of both your hosting provider and the stream source before deployment.

Before a proxy is needed, Mowj TV checks alternative sources for the same channel from IPTV-ORG. This approach is lighter and does not consume bandwidth on your server.

## What Can a Proxy Help With?

- Incorrect or missing CORS headers on an upstream server
- An HTTP stream embedded in an HTTPS website
- Some IP, DNS, Referer, or User-Agent requirements
- Regional availability, but only when the proxy server can legally access the stream from an eligible region

A proxy cannot repair an offline stream, remove DRM, add codec support, or improve the viewer's internet connection. It also does not convert 1080p video to 480p; real transcoding requires FFmpeg and substantially more server resources.

## Recommended Approach

For personal use, the safest practical option is a small VPS running a private, allowlisted proxy. Shared-hosting PHP is suitable only when the provider explicitly permits streaming or proxy workloads, outbound cURL connections, and the expected bandwidth usage.

A public Cloudflare Worker is not recommended for this purpose. Cloudflare's Self-Serve terms restrict using the service as a general proxy, and Cloudflare provides separate products for high-volume video delivery:

- https://www.cloudflare.com/terms/
- https://developers.cloudflare.com/fundamentals/reference/policies-compliances/delivering-videos-with-cloudflare/

## Critical Security Requirements

Never expose an endpoint like this:

```text
/proxy.php?url=https://anything.example/video.m3u8
```

That design creates an open proxy and an SSRF attack surface. A secure implementation must:

- accept only predefined channel identifiers;
- allowlist every permitted hostname;
- generate rewritten HLS segment URLs with short-lived, server-signed tokens;
- reject local, private, and metadata IP ranges as well as unapproved redirects;
- enforce rate limits and private access controls;
- correctly rewrite master and media playlists, segments, encryption keys, and initialization segments;
- forward Range headers and preserve 206 and 416 responses.

Related security guidance: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html

Before implementing a proxy, determine whether the existing host supports PHP and cURL or whether a separate VPS will be used.

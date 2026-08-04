# Security Policy

## Supported Versions

The current version on the default branch is supported.

## Reporting a Vulnerability

Use **Security → Report a vulnerability** on GitHub to submit security reports privately. Do not disclose exploitation details in a public issue. If private vulnerability reporting is unavailable, open an issue without sensitive details and request a private communication channel.

Please include the affected feature, reproduction steps, expected impact, browser or device information, and any relevant proof of concept. Allow reasonable time for investigation and remediation before public disclosure.

## Security Scope

An unavailable stream, regional restriction, CORS failure, or content ownership claim is not, by itself, a Mowj TV security vulnerability. URL injection, script execution, data exposure, interface restriction bypasses, and cache or proxy vulnerabilities should be reported privately.

## Proxy Security

This repository does not provide a ready-to-use streaming proxy. Any proxy implementation must enforce a host allowlist, block private and metadata IP ranges, validate every redirect, apply rate limits and access controls, and never accept an unrestricted user-supplied destination URL.

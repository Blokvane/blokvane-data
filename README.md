# Blokvane data

Every copy of Blokvane reads `fixes.json` from this repo once a day. It lets us fix
YouTube, Facebook, Instagram and streaming ads, and add or remove a blocked address,
without a new version of the extension.

`fixes.json` holds data only: names, CSS selectors, words and domains. Blokvane checks
every entry and drops anything that doesn't look exactly right. Nothing here runs as code.

## What each part does

| Part | What it does |
|---|---|
| `youtube.deleteKeys`, `youtube.adRenderers` | New names YouTube uses for ads in its page data |
| `youtube.keepKeys` | Stop removing a name (if it ever breaks YouTube) |
| `youtube.skipButtons`, `youtube.enforcement`, `youtube.shortsAd`, `youtube.overlayClose` | New CSS selectors for Skip buttons, "ad blocker" popups, Shorts ads |
| `facebook.markers`, `facebook.adKeys`, `facebook.words`, `facebook.adLinks` | New signs of sponsored posts on Facebook and Instagram |
| `instagram.words`, `instagram.adLinks` | Instagram only |
| `streaming.<service>`, `streaming.skipWords` | New ad markers on Netflix, Prime Video, Twitch, Spotify and others |
| `block.domains` | Extra ad or tracker addresses to block (never shared services like fonts or CDNs) |
| `allow.domains` | Emergency: stop blocking an address that breaks sites |
| `hide.generic`, `hide.sites` | Extra boxes to hide, everywhere or on one site |
| `unhide.generic` | Emergency: stop hiding a box that breaks sites |

Rules from this file can never override what a user blocked, paused or allowed,
the malware and phishing lists, or Kid mode.

## Daily auto test

Every day a GitHub job (in the private app repo) runs Blokvane's Protection test with the
online ad block tests, picks the ad and tracker addresses that got through, checks popular
sites still work without them, and adds them to `block.domains` here. It adds at most 25 a
day and never blocks shared services, work sites or anything in `autotest/never.json`.

- `autotest/log.json`: what each daily run did (newest first)
- `autotest/never.json`: addresses the auto test must never add, like `["example.com"]`

To undo an address: remove it from `block.domains`, and add it to `autotest/never.json`
so it isn't added again. If it broke sites, also add it to `allow.domains` for a day.

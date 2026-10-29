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
| `allow.domains` | Emergency: stop blocking an address that breaks sites (at most 100) |
| `hide.generic`, `hide.sites` | Extra boxes to hide, everywhere or on one site |
| `unhide.generic` | Emergency: stop hiding a box that breaks sites (at most 300) |

Rules from this file can never override what a user blocked, paused or allowed,
the malware and phishing lists, or Kid mode.

## Safety limits (built into the extension)

Even if this repo were ever taken over, Blokvane drops anything that could do real harm:

- **CSS selectors** (hiding, clicking or spotting ads) must name something specific: a class
  (`.ad-box`), an id (`#ad-top`), a custom element (`ytd-ad-slot-renderer`) or an attribute
  (`[id^="div-gpt-ad"]`, `[data-ad-slot]`). Dropped: `*`, `html`, `body`, plain tags like `div` or
  `button`, page wrappers like `#root` or `.container`, `:has()`, `:is()`, `:where()`, and
  attributes like `lang` or `dir`. A hiding rule can never hide the page itself.
- Every selector must also **name an ad** on the element it hides, clicks or spots: a word like
  `ad`, `ads`, `sponsored`, `advert`, `doubleclick` or `taboola` in its class, id, tag or attribute
  (`skipButtons` may say `skip`, `enforcement` may say `enforcement`). A short word only counts
  when it stands apart: `[class*="ad"]` also matches "header" and "loading", so it is dropped,
  while `[class*="-ad-"]`, `[class^="ad-"]` and `.ad-box` are fine. `banner` and `promo` don't count
  (sites use them for their own headers and coupon boxes).
- **block.domains** can't hold shared services or work sites, a parent of one (`googleapis.com`),
  a whole address ending (`co.uk`, `github.io`, `netlify.app`, `r2.dev`), or a big platform's own
  image and video servers (`fbcdn.net`, `ggpht.com`, `twimg.com`...).
- **allow.domains** can't hold a known ad or tracking company, a big platform (`google.com`,
  `youtube.com`, `amazon.com`... and anything under them), an address that starts like an
  ad server (`ads.`, `pixel.`, `analytics.`...), or a whole address ending.
- **unhide.generic** can't switch off Blokvane's core ad hiding (`.adsbygoogle`, `.ad-banner`...),
  and **youtube.keepKeys** can't stop the core YouTube ad removal (`adPlacements`, `adSlots`, `playerAds`).

## Daily auto test

Every day a GitHub job (in the private app repo) runs Blokvane's Protection test with the
online ad block tests, picks the ad and tracker addresses that got through, checks popular
sites still work without them, and adds them to `block.domains` here. It only adds addresses
that AdGuard's public ad and tracker list already has, at most 25 a day, and never blocks
shared services, work sites or anything in `autotest/never.json`.

- `autotest/log.json`: what each daily run did (newest first)
- `autotest/never.json`: addresses the auto test must never add, like `["example.com"]`

To undo an address: remove it from `block.domains`, and add it to `autotest/never.json`
so it isn't added again. If it broke sites, also add it to `allow.domains` for a day.

## Templates

`templates/index.json` is the free list of extra Signage templates. In the Signage Studio they
show under "More templates" in the Templates window, and in their own categories next to the
built-in ones. Blokvane only downloads this list when someone opens "More templates" or presses
"Check for new templates", and nothing about them is sent.

The format: one list called `templates`, one template per line.

```json
{ "templates": [
  { "id": "pi-day", "name": "Pi Day", "cat": "Education", "color": "blue",
    "tags": ["pi day", "math", "march"],
    "when": { "kind": "year", "month": 3, "day": 14, "start": "00:00", "end": "00:00", "label": "Pi Day (March 14)" },
    "wide": { "name": "Pi Day", "background": "#13315c", "items": [] },
    "tall": { "name": "Pi Day", "background": "#13315c", "items": [] } }
] }
```

| Part | What it is |
|---|---|
| `id` | Short lowercase words with dashes. It must not be the id of another template (Blokvane puts `more-` in front) |
| `name` | The name people see |
| `cat` | One of: Holidays, Seasons, Celebrations, Business, Retail, Restaurants, Education, Healthcare, Worship, Fitness, Hotels, Info screens. Anything else shows as "More" |
| `color` | For the color filter: red, orange, yellow, gold, green, teal, blue, navy, purple, pink, brown, sand, black, pastel, coral or rainbow |
| `tags` | Words people might search for (at most 20) |
| `when` | Optional: when the template makes sense, as a schedule rule (`year` for a date, `nth` for "the first Friday of June", `week` for weekdays), or the name of a holiday Blokvane knows, like `"halloween"`. Leave it out for templates that fit any time |
| `wide` | The slide for a wide screen (16:9) |
| `tall` | Optional: the same slide made for a tall screen (9:16). Without it, tall screens get the wide one |

A list can also point to more lists with `"packs": ["more.json"]` (at most 30).

**Pictures are left out.** A template here can only hold words, colors, drawings, shapes and
widgets: pictures, videos and parts of websites are dropped. Every template also goes through
the same checks as a saved slideshow, so this list can never put anything harmful on a screen.

**To add a template:**

1. Make the slide in the Signage Studio (for a wide screen, and a tall one if you like).
2. Use "Save as a template file" to export it.
3. Open that file and copy the template in it (the part with `id`, `name` and `wide`) into the
   `templates` list here, on its own line, with a comma after the template before it.
4. Give it a new `id`, the right `cat`, a `color` and a few `tags`. Keep the file under 1 MB.
5. To try it before it goes live, put the file's raw GitHub address into "Template list address"
   under "More templates" in the Studio, and set it back afterwards.

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
built-in ones. Blokvane only downloads the list when someone opens "More templates" (or presses
"Check for new templates"), at most once a week after that (a part that could not be downloaded is
tried again the next time), keeps it on that computer, and sends nothing about anyone.

The list has two parts:

- `templates`: hand-made templates, one per line (at most 500).
- `packs`: more files of templates, one per category, in `templates/packs/` (at most 60 packs,
  400 templates and 2 MB each, 2000 templates and 24 MB in all). Blokvane only reads packs over https,
  on the list's own site and in its folder.

```json
{ "templates": [
    { "id": "pi-day", "name": "Pi Day", "cat": "Education", "color": "blue", "tags": ["pi day", "math", "march"], "wide": { ... }, "tall": { ... } }
  ],
  "packs": [
    { "url": "packs/restaurants.json", "cat": "Restaurants", "count": 40 }
  ] }
```

**The packs are built, not written by hand.** Each template in them comes from a short spec in
`templates/src/` (a layout, a color set and the words), and the builder makes its wide and tall
slides with Blokvane's own code. See [templates/src/README.md](templates/src/README.md) for how
to write specs, with examples. The tools (they need Node.js; the path is the extension folder of
the app repo, the one with `manifest.json`):

| Command | What it does |
|---|---|
| `node tools/build-templates.js ../blokvane/blokvane` | Builds every spec in `templates/src` into `templates/packs/*.json` and updates `templates/index.json` (the hand-made templates stay as they are). Writes nothing if any template has a problem |
| `node tools/check-templates.js ../blokvane/blokvane` | Checks the whole list as it will go live, and loads it the way Blokvane does |
| `node tools/sheet-templates.js ../blokvane/blokvane` | Contact sheets: pictures of the templates, wide and tall (`--src` for the specs, `--filter=menu` for some). Needs Playwright |
| `node tools/kit-info.js ../blokvane/blokvane` | What a spec can use: layouts and their options, palettes, fonts, categories, holidays, drawings |

| Part of a template | What it is |
|---|---|
| `id` | Short lowercase words with dashes. It must not be the id of another template, built-in or online (Blokvane puts `more-` in front) |
| `name` | The name people see |
| `cat` | A category (below). Anything else shows as "Other" |
| `color` | For the color filter: red, orange, yellow, gold, green, teal, blue, navy, purple, pink, brown, sand, black, pastel, coral or rainbow |
| `tags` | Words people might search for (at most 20). Search also finds words that mean the same, like "sale" for "discount" |
| `when` | Optional: when the template makes sense, as a schedule rule (`year` for a date, `nth` for "the first Friday of June", `week` for weekdays), or the name of a holiday Blokvane knows, like `"halloween"`. Leave it out for templates that fit any time |
| `palette` | Its eight colors by role, so people can recolor it exactly with "Make it yours" (the builder adds it) |
| `wide` | The slide for a wide screen (16:9) |
| `tall` | The same slide made for a tall screen (9:16). Without it, tall screens get the wide one |

The categories, in the groups the Studio shows them in:

| Group | Categories |
|---|---|
| Celebrate | Holidays, Seasons, Celebrations, Events |
| Food and drink | Restaurants, Menus, Cafes and bakeries, Bars and nightlife |
| Shops and services | Retail, Sales and deals, Beauty and spa, Cars and auto, Real estate, Pets, Home services, Finance and law |
| Work | Business, Office life, Numbers and charts, Marketing and social |
| Learning | Education, College, Kids and youth |
| Health and fitness | Healthcare, Fitness, Wellness, Sports |
| Community and travel | Worship, Charity and fundraising, Public services, Hotels, Travel |
| Info and safety | Info screens, Safety, Split screens |

**Pictures are left out.** A template here can only hold words, colors, drawings, shapes and
widgets: pictures, videos, links and parts of websites become empty areas people fill with their
own photos. Every template also goes through the same checks as a saved slideshow, so this list
can never put anything harmful on a screen.

**To add a hand-made template** (one you made in the Studio):

1. Make the slide in the Signage Studio (for a wide screen, and a tall one if you like).
2. Use "Save as a template file" to export it.
3. Open that file and copy the template in it (the part with `id`, `name` and `wide`) into the
   `templates` list in `templates/index.json`, on its own line, with a comma after the template before it.
4. Give it a new `id`, the right `cat`, a `color` and a few `tags`.
5. Run `node tools/check-templates.js ../blokvane/blokvane`.
6. To try the list before it goes live, put its raw GitHub address (from a branch) into
   "Template list address" under "More templates" in the Studio, and set it back afterwards.

## Boo Box and Elements

`boobox/` holds the lists behind Boo Box in the Signage Studio: moving stickers Blokvane drew,
animated emoji (Noto Emoji Animation by Google, CC BY 4.0), moving words and moving
backgrounds. `elements/` holds the icons in Elements (Tabler Icons, MIT, without logos of companies,
products or organizations).
Blokvane downloads a part only when someone opens it, keeps it on that computer, checks it again
at most once a week, and sends nothing about anyone. Every sticker, emoji and icon is checked
with Blokvane's own rules before it is shown, and none of it can run code.

How they are built and checked (`node boobox/tools/build.js`, `node boobox/tools/check.js`), what
each file holds and where each part comes from: see [boobox/README.md](boobox/README.md).

## TV screens anywhere (`tv/`)

`tv/` is the page a TV opens with a screen's private link from Blokvane, like
`https://blokvane.github.io/blokvane-data/tv/#s1.<secret>.<owner>`. GitHub Pages serves it
(Settings, Pages, Deploy from a branch, `main`, `/ (root)`). `.nojekyll` tells Pages to serve
every file as it is.

There is no server behind it. The page finds the computer with the slideshows through the same
free public relays Watch together uses, connects straight to it (WebRTC, encrypted), and copies the
slideshow player, that one screen's slideshows and their pictures and videos into the TV's browser.
`sw.js` plays them from that copy, so the screen keeps playing when the computer is off. The
secret after `#` never leaves the TV (browsers don't send that part to any website), and only
messages signed by the computer's own key are believed.

`wt-core.js` and `wt-net.js` are copies of `blokvane/lib/wt-core.js` and `blokvane/lib/wt-net.js`
in the extension. Copy them again when those change.

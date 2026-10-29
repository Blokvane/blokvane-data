# Boo Box and Elements

The lists behind **Boo Box** (moving stickers, animated emoji, moving words and moving
backgrounds) and the **icons in Elements**, in the Signage Studio. Blokvane downloads a part
only when someone opens it, keeps it on that computer, checks it again at most once a week and
sends nothing about anyone. When someone adds a sticker or an emoji to a slide, the file goes
into that slideshow's library, so it keeps working offline and on TV screens. Icons are kept in
the slide's own settings.

Nothing here runs as code. Blokvane checks every part with its own rules (`lib/boo-core.js` in
the extension) and leaves out anything that does not fit:

- **Stickers** are lists of drawing parts (`[tag, attributes, children]`) from a short allowlist:
  paths, circles, boxes, lines, gradients and groups, with checked numbers and colors. Their
  motion is plain CSS keyframes (no addresses, no quotes). Blokvane builds the SVG picture itself
  and only ever shows it as a picture (`<img>`), where nothing can run.
- **Animated emoji** are Lottie files: drawing data only. A file with an expression (code), a
  picture or font from anywhere, or a layer type other than shapes, groups and solids is refused.
- **Icons** are short lists of shapes (paths, circles, boxes, lines) in a 24 x 24 box, rebuilt
  by Blokvane.
- **Words** and **moving backgrounds** are settings for the Word art and Moving backgrounds
  widgets: styles, fonts, colors and motions from fixed lists.

## What is where

| Folder | What it holds |
|---|---|
| `boobox/index.json` | The tabs, their counts and their files |
| `boobox/stickers/*.json` | The stickers, one file per group, one sticker per line |
| `boobox/emoji/list.json` | The emoji: names, groups, search words, skin tones and their place on the preview sheets |
| `boobox/emoji/a/*.json` | One Lottie file per emoji (`<name>--<skin tone>.json` for the skin tones) |
| `boobox/emoji/sheets/*.webp` | Still pictures of every emoji, many on one picture, so the panel opens fast |
| `boobox/emoji/NOTICE` | The credit for the animated emoji (CC BY 4.0) |
| `boobox/words/words.json` | The moving words |
| `boobox/scenes/scenes.json` | The moving backgrounds |
| `elements/index.json`, `elements/icons/*.json` | The icons, one file per group |
| `elements/LICENSE` | The Tabler Icons license (MIT) |
| `boobox/tools/` | The tools that build and check all of the above (not downloaded by Blokvane) |

## Where it comes from

| Part | Made by | License |
|---|---|---|
| Stickers, words, moving backgrounds | Blokvane (`boobox/tools/recipes`) | Ours |
| Animated emoji | [Noto Emoji Animation](https://googlefonts.github.io/noto-emoji-animation/) by Google | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (credited in the panel, on each emoji's file in the slideshow's library, next to its settings, and in `emoji/NOTICE`) |
| Emoji names and search words | unicode-emoji-json and emojilib by Mu-An Chiou | MIT (full texts in `emoji/NOTICE`) |
| The list of animated emoji | the animated_emoji package by Clever Tasks | BSD 3-Clause (full text in `emoji/NOTICE`) |
| Icons | [Tabler Icons](https://tabler.io/icons) by Paweł Kuna, without logos of companies, products or organizations | MIT (`elements/LICENSE`) |

The icons left out are Tabler's "brand" icons and the ones on the list in `tools/boo-core.js` (`ICON_DENY`): other
logos and marks (such as the Olympic rings, Bluetooth, USB, NFC, Creative Commons, PlayStation, Xbox and crypto
coins), pictures named after Apple products, and a rude hand gesture. The stickers, words and moving backgrounds
show no company's characters, logos or brands.

## Building and checking

The tools need Node.js 18 or newer. Run `npm install` once in `boobox/tools` (it installs the
font reader; Playwright is only needed for the pictures). `<ext>` is the extension folder of the
app repo, the one with `manifest.json` and `fonts/`.

| Command (in `boobox/tools`) | What it does |
|---|---|
| `node build.js --ext <ext>` | Builds the stickers, words and moving backgrounds from `recipes/`, and `boobox/index.json` |
| `node build.js --ext <ext> --emoji <lottie folder> --emoji-meta <folder>` | Also the animated emoji (the meta folder holds `emojis.g.dart`, `animated_emoji-LICENSE`, `unicode-emoji-json/data-by-emoji.json`, `emojilib/emoji-en-US.json` and the two packages' `LICENSE` files, which go into `emoji/NOTICE`) |
| `node build.js --icons <@tabler/icons package folder>` | The icons (logos of companies, products and organizations are left out) |
| `node sheet.js previews --ext <ext>` | The emoji preview sheets (after building the emoji) |
| `node check.js` | Checks everything the way Blokvane will read it. Run it before every commit |
| `node sheet.js review --ext <ext> --out <folder>` | Contact sheets of every tab, the shapes and the icons, to look over |

**To add a sticker:** add a recipe to one of the `recipes/stickers-*.js` files (the group is the
file's `CAT`), build, look at it on the contact sheet, run `node check.js`, then commit.

**To add a moving word or background:** add a line to `recipes/words.js` or `recipes/scenes.js`.

**To try a list before it goes live:** Blokvane's own tests point the Studio at a copy on the same
computer; the store version only ever reads this repo's `main` branch.

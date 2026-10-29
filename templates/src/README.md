# Template specs

The free online templates ("More templates" in the Signage Studio) are made here, from short **specs**.
A spec names a layout (a **recipe**), a color set (a **palette**), and the words and drawings to put in it.
The builder turns every spec into a finished slide for a wide screen (16:9) **and** one for a tall screen
(9:16), using Blokvane's own code, so what you build is exactly what people see.

Because every template keeps its palette, people can recolor it exactly with "Make it yours" in the Studio,
swap its fonts, and type their own words before they add it.

## Adding templates, step by step

1. Write specs in a `.js` file in this folder (one file per theme is easiest, like `restaurants.js`).
2. Build: `node tools/build-templates.js ../path/to/blokvane` (the extension folder of the app repo: the
   folder with `manifest.json` in it). It writes `templates/packs/*.json` and `templates/index.json`, and
   writes nothing if any template has a problem (it tells you what and where). While you work on one file,
   `--only=restaurants.js` checks just that file (and that its ids are new) and writes nothing.
3. Check: `node tools/check-templates.js ../path/to/blokvane`. It also loads the whole list the way
   Blokvane does.
4. Look at them: `node tools/sheet-templates.js ../path/to/blokvane --src` draws contact sheets (needs
   Playwright: `npm install playwright` and `npx playwright install chromium`, once). To draw some of them:
   `--prefix=food-` (ids that start with it), `--recipe=receipt` (one layout), `--ids=food-tacos,food-brunch`,
   or `--filter=menu` (any part of the id, name or category).
5. Commit `templates/src`, `templates/packs` and `templates/index.json`, and push.

Not sure what you can use? `node tools/kit-info.js ../path/to/blokvane` lists the recipes and their
options, the palettes, font pairs, categories, colors, holidays and all the drawings (`kit-info.js art`).

## Spec files are code

The tools load every `.js` file in this folder as a program: Node.js runs it with your access to this
computer, also with `--dry`, `--only` and the sheet tool. So read every spec file you did not write yourself
before you build, check or draw sheets, the same way you would review code someone sends you. The builder
never writes through a link: if `templates`, `templates/packs`, `templates/index.json` or a pack is a link to
somewhere else, it stops and writes nothing.

## A spec

```js
module.exports = [
  { id: 'chef-picks', name: 'Chef\'s picks', cat: 'Restaurants', color: 'green', tags: 'chef,dishes,specials,dinner',
    recipe: 'dishes', palette: 'forest', fonts: 'elegant',
    o: { kick: 'From the kitchen', title: 'Chef\'s picks this week', dishes: [ /* ... */ ] } }
];
```

A file can also be `module.exports = kit => [ ... ]` to get Blokvane's template kit as `kit`.

| Part | What it is |
|---|---|
| `id` | Short lowercase words with dashes, at most 40 letters. New: not used by any other template, built-in or online |
| `name` | The name people see (at most 60 letters) |
| `cat` | The category (see below) |
| `color` | For the color filter: the main color people see |
| `tags` | Words people might search for, with commas: `'sale,discount,shop'` (3 to 20). Search also finds words that mean the same |
| `when` | Optional: when it makes sense. A holiday id (`'halloween'`) or a rule (see below). Leave it out for any time |
| `recipe` | The layout (see below) |
| `palette` | A palette id (`'forest'`), or your own colors: `{ bg1: '#102030', ink: '#ffffff', accent: '#ff6b5e' }` (missing roles are filled in) |
| `fonts` | Optional: a font pair id (`'elegant'`). Without it, each recipe uses its own fonts |
| `o` | The recipe's options: the words, drawings and so on, for both shapes |
| `wide`, `tall` | Optional: options only for one shape, on top of `o` (like a shorter title for the tall one) |

**Colors in options**: write `'$accent'` (or any role: `$bg1`, `$bg2`, `$ink`, `$ink2`, `$accent`,
`$accent2`, `$paper`, `$paperInk`) instead of a color, and it becomes that role's color. Then it changes
with the palette too. A fixed color like `'#ffd166'` stays the same in every palette.

## Rules (the builder and the checker stop on these)

- Every name, place, handle and phone number is **made up** (`Maple Street Deli`, `555-0142`). Never a real
  business, person, brand or logo.
- **No years** like 2027 in the words (they go out of date). No web addresses (`www.`, `https://`).
  A countdown keeps its date empty: people pick their own.
- **No em dash** anywhere. Use a comma, a colon or two short sentences. Spec files are plain ASCII (write
  an accented letter as `\u00e9`).
- Only words, shapes, drawings and widgets that load nothing from the internet. Pictures go in **empty
  areas** (the recipes make them, with a picture placeholder) for people to fill with their own photos.
- At most 60 things on a slide and 40 drawings. Every drawing id must exist (`kit-info.js art`).
- Short, friendly words. Big titles are 1 to 4 words; a list line is a few words.
- Make both shapes look good: check the tall one in the contact sheets too.
- A slide is written the way Blokvane keeps it: the checker stops on any value Blokvane would change, like a
  color written as a name (`red`), a box outside the slide or a setting Blokvane does not know. Slides made
  by a recipe are always written that way; this matters for hand-made templates in `index.json`.
- A slide in a template has no days of its own and is never switched off: give the template a `when` instead
  (people can switch it off when they add it). A schedule rule in a hand-made template needs its hours
  (`start` and `end`) and a label of at most 60 letters.
- The list and all its packs stay under 24 MB together: Blokvane reads at most that much in one update.

## Palettes

Each palette has eight roles: `bg1` background, `bg2` second background (the gradient), `ink` big words,
`ink2` small words, `accent`, `accent2` second accent, `paper` cards, `paperInk` words on cards.

`midnight`, `coral`, `forest`, `ocean`, `berry`, `sunshine`, `mono` (black and white), `blush`, `citrus`,
`lavender`, `espresso`, `ruby`, `mint`, `slate`. (`kit-info.js palettes` shows their colors.)

## Font pairs

`poster`, `elegant`, `friendly`, `slab`, `modern`, `glow` (neon), `handmade`, `retro`. Every pair uses the fonts
that come with Blokvane, so it looks the same on every TV.

## Categories

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

Colors for `color`: red, orange, yellow, gold, green, teal, blue, navy, purple, pink, brown, sand, black,
pastel, coral, rainbow.

## When

- A holiday Blokvane knows: `when: 'thanksgiving'` (`kit-info.js holidays` lists them).
- A date every year: `when: { kind: 'year', month: 4, day: 22, span: 1, label: 'Earth Day (April 22)' }`
  (`span`: how many days). A rule is for the whole day unless you add hours: `start: '17:00', end: '22:00'`.
- Like "the second Sunday of May": `when: { kind: 'nth', month: 5, nth: 2, weekday: 0, label: '...' }`
  (`weekday`: 0 is Sunday; `nth: -1` is the last one).

People can switch it off when they add the template.

## Options every recipe takes

| Option | What it does |
|---|---|
| `kick` | A small line above the title (`scriptKick: true` writes it in script) |
| `title` | The big words. `\n` starts a new line |
| `sub` | A line or two under the title |
| `foot` | A small label at the bottom |
| `art` | Drawings in the recipe's spots: `[['balloons'], ['star', ['$accent']]]` (id, then up to 3 colors) |
| `back` | Drawings over the whole background: `[['dots', ['$bg2', '$accent']]]` |
| `fx` | A moving effect over everything: `['confetti', { amount: 3, speed: 3 }]`. Effects: confetti, snow, hearts, leaves, stars, bubbles, petals, fireworks, balloons, sparkles |
| `bg` | Your own background (a color, or a gradient `{ type: 'gradient', a: '#..', b: '#..', angle: 160 }`). `flat: true`: one color |
| `kickStyle`, `titleStyle`, `subStyle` | Word art settings for that line, like `{ effect: 'neon' }`, `{ font: 'script' }`, `{ caps: true }` |

## The recipes made for palettes

These read every color from the palette, so they recolor exactly.

| Recipe | What it is | Its own options |
|---|---|---|
| `magazine` | A magazine cover: masthead, a big drawing, headlines down the side, a corner badge | `mast`, `big`, `lines` (up to 3), `badge` |
| `admit` | An event ticket with a numbered stub | `details` ([[label, value]] x3), `stub`, `stubLabel`, `admit` |
| `polaroids` | Three photo prints taped to the wall (empty areas for photos) | `captions` (3) |
| `receipt` | A receipt with items and prices | `shop`, `shopSub`, `items` ('Name \| 9.50' lines), `total` ([label, price]), `thanks`, `currency` |
| `diagonal` | The screen cut on a slant, a big drawing on a disc | `big` ([id, colors]) |
| `bigstats` | Two to four big numbers, each with a drawing and a label | `stats` ([{ value, label, art }]) |
| `timeline` | Three to five moments on a line | `steps` ([{ label, text }]) |
| `checklist` | A checklist on a card | `items`, `done` (how many are ticked), `big` |
| `directory` | A list of names and places (two columns on wide when long) | `rows` ([[name, where]]), `clock` |
| `scan` | Scan this code: three steps and a QR code (people put in their own link) | `steps` (3), `codeLabel` |
| `social` | Where to find you online, with simple icons | `handles` ([[icon, name]]: iconcamera, iconplay, iconchat, iconweb...), `big` |
| `testimonial` | A review on a card with five stars | `quote`, `who`, `role` |
| `features` | Three good things side by side | `features` ([{ art, title, text }]) |
| `prices` | Two or three price cards, one picked out | `plans` ([{ name, price, per, lines, hot, tag }]) |
| `coupon` | A cut-out coupon | `deal`, `code`, `until` |
| `banner` | A cloth banner hanging from two ropes | `sway` (gently moving) |
| `infoboard` | Three info cards, the time, a scrolling line | `cards` ([{ label, value, art }]), `ticker`, `label` |
| `schedule` | A day's schedule: times in pills | `rows` ([[time, what, where]]), `big` |
| `beforeafter` | Before and after: two photo areas | `before`, `after` (the labels) |
| `split2`, `split3` | A screen in 2 or 3 parts for live content, a title bar with the time | `labels`, `ticker`, `label`, `clock: false` |
| `gig` | A gig poster: the date in a block, the name huge | `day`, `date`, `month`, `lines` (3), `strip` |
| `dishes` | Three dishes or products on cards | `dishes` ([{ name, note, price, art }]; no `art`: a photo area) |
| `steps` | How it works in three steps | `steps` ([{ title, text }]) |
| `team` | Three or four people with photo areas | `people` ([{ name, role }]) |
| `corkboard` | A cork board with sticky notes | `notes` (up to 4) |
| `findus` | A little map with a pin, the address and hours | `address` (3 lines), `hours`, `bounce` |

## The older recipes

They work with palettes too (their colors come from the palette's roles). `hero` (big centered words),
`split` (words on a panel, a drawing or photo next to it), `poster` (a sale poster with a deal badge: `deal`,
`badge`), `countdown` (`label`, `done`, `days`, `up`), `photo` (a framed photo area), `note` (a calm message
with a big drawing: `big`), `neon` (a neon sign), `ticket` (`stub`), `stamp` (a round seal: `ring`, `center`),
`ribbon`, `sunburst`, `marquee` (blinking lights), `arch` (`big`), `swiss` (one giant number: `num`), `bigtype`
(`lines`), `kids`, `paper` (a paper-cut landscape: `land`), `datestamp` (`month`, `day`), `alert`, `board`,
`lobby`, `chalk`, `full`, `duo`, `stats`. The built-in templates are made from these, so the Studio has
examples of each.

## Examples

**1. A simple welcome** (the smallest spec)

```js
{ id: 'welcome-dental', name: 'Welcome to the clinic', cat: 'Healthcare', color: 'blue', tags: 'welcome,dentist,clinic,check in',
  recipe: 'hero', palette: 'ocean',
  o: { kick: 'Welcome to', title: 'Bright Path Dental', sub: 'Please check in at the front desk', art: [['tooth'], ['sparkle']] } }
```

**2. A holiday, shown around the day**

```js
{ id: 'thanksgiving-hours', name: 'Thanksgiving hours', cat: 'Holidays', color: 'orange', tags: 'thanksgiving,hours,closed,november',
  when: 'thanksgiving', recipe: 'paper', palette: 'espresso', fonts: 'elegant',
  o: { land: 'hills', kick: 'Happy Thanksgiving', title: 'Closed on Thursday', sub: 'Open again Friday at 9 AM',
       art: [['pumpkin'], ['wheat'], ['leaves']] } }
```

**3. A date every year, with a moving effect**

```js
{ id: 'world-kindness', name: 'Kindness week', cat: 'Education', color: 'pink', tags: 'kindness,school,week,friends',
  when: { kind: 'year', month: 11, day: 13, span: 7, label: 'Kindness week' },
  recipe: 'kids', palette: 'blush', fonts: 'friendly',
  o: { kick: 'This week', title: 'Be kind', sub: 'Say thank you, help a friend, share a smile', art: [['heart', ['$accent']], ['star']],
       fx: ['hearts', { amount: 2, speed: 2 }] } }
```

**4. A menu of three dishes**

```js
{ id: 'soup-of-the-day', name: 'Soups today', cat: 'Restaurants', color: 'orange', tags: 'soup,lunch,menu,daily',
  recipe: 'dishes', palette: 'coral',
  o: { kick: 'Made this morning', title: 'Soups today', dishes: [
    { name: 'Tomato basil', note: 'With a cheese toast', price: '$6', art: ['bowl'] },
    { name: 'Chicken noodle', note: 'Like grandma makes', price: '$7', art: ['bowl'] },
    { name: 'Lentil', note: 'Vegan', price: '$6' } ] } }
```

**5. Prices, one picked out**

```js
{ id: 'gym-memberships', name: 'Memberships', cat: 'Fitness', color: 'navy', tags: 'gym,membership,prices,join',
  recipe: 'prices', palette: 'midnight', fonts: 'modern',
  o: { kick: 'Peak Fitness', title: 'Join this month', plans: [
    { name: 'Day pass', price: '$12', per: 'a day', lines: ['All machines', 'Showers'] },
    { name: 'Monthly', price: '$39', per: 'a month', lines: ['Everything', 'All classes'], hot: true, tag: 'Best value' } ] } }
```

**6. A coupon for a sale**

```js
{ id: 'shoe-sale-coupon', name: 'Shoe sale coupon', cat: 'Sales and deals', color: 'red', tags: 'sale,coupon,shoes,discount',
  recipe: 'coupon', palette: 'ruby',
  o: { kick: 'Step Right Shoes', deal: '25% OFF', title: 'All sneakers', sub: 'In store only', code: 'Code: STEP25',
       until: 'This weekend only', art: [['sneaker'], ['tag', ['$accent']]] } }
```

**7. A safety checklist**

```js
{ id: 'kitchen-safety', name: 'Kitchen safety', cat: 'Safety', color: 'yellow', tags: 'safety,kitchen,checklist,staff',
  recipe: 'checklist', palette: 'sunshine',
  o: { kick: 'Every shift', title: 'Kitchen safety', items: ['Wash your hands', 'Wipe spills right away', 'Knives in the block',
       'Oven mitts for hot pans'], done: 0, big: ['chefhat'] } }
```

**8. Big numbers for a fundraiser**

```js
{ id: 'food-drive-results', name: 'Food drive results', cat: 'Charity and fundraising', color: 'green', tags: 'food drive,charity,thank you,results',
  recipe: 'bigstats', palette: 'forest',
  o: { kick: 'Thank you, neighbors', title: 'Our food drive', stats: [
    { value: '2,400', label: 'Cans collected', art: ['foodbox'] },
    { value: '180', label: 'Families helped', art: ['hearthands', ['$accent', '$accent2']] } ], foot: 'See you next month' } }
```

**9. A split screen for live content**

```js
{ id: 'two-areas-news', name: 'Two areas and news', cat: 'Split screens', color: 'navy', tags: 'split,two areas,live,news',
  recipe: 'split2', palette: 'slate',
  o: { title: 'Oak Hill Library', labels: ['Main', 'Side'], ticker: 'Story time Saturday at 10\nNew books every week', label: 'News' } }
```

**10. A shorter title on the tall screen, and colors from the palette**

```js
{ id: 'book-fair', name: 'Book fair', cat: 'Education', color: 'purple', tags: 'book fair,books,school,reading',
  recipe: 'banner', palette: 'lavender', fonts: 'slab',
  o: { kick: 'Room 4 and the library', title: 'Spring\nbook fair', sub: 'Every book under ten dollars', foot: 'Monday to Friday',
       art: [['books', ['$accent', '$paper']], ['pencil'], ['star', ['$accent2']]] },
  tall: { title: 'Book\nfair' } }
```

The file `starter.js` here has more, one or more for every newer recipe.

// Moving words for Boo Box: ready Word art (the fonts that come with Blokvane, a style, two colors and a motion),
// in groups. People can change the words, the colors, the style and the motion after adding one.
'use strict';

// ---------- looks: a style, a font, colors (a few pairs to take turns), a motion and the tile behind it in the panel
const L = {
  neonPink: { effect: 'neon', font: 'neon', weight: '400', pairs: [['#ff4fd8', '#ff4fd8'], ['#ff6b9a', '#ff6b9a']], motion: 'flicker', tile: '#1a1033' },
  neonBlue: { effect: 'neon', font: 'neon', weight: '400', pairs: [['#4cc9f0', '#4cc9f0'], ['#7df9ff', '#7df9ff']], motion: 'flicker', tile: '#0b1426' },
  neonGreen: { effect: 'neon', font: 'neon', weight: '400', pairs: [['#7cff6b', '#7cff6b'], ['#d0ff5c', '#d0ff5c']], motion: 'glow', tile: '#0d1a12' },
  retro: { effect: 'retro', font: 'retro', weight: '400', pairs: [['#ffd166', '#e63946'], ['#ffffff', '#ff6b5e'], ['#ffe066', '#7048e8']], motion: 'float', tile: '#3a0f4f' },
  retroWide: { effect: 'retro', font: 'wide', weight: '900', pairs: [['#ffffff', '#ff6b5e'], ['#ffd43b', '#1c7ed6'], ['#fff3bf', '#e8590c']], motion: 'bounce', tile: '#1d3557' },
  extrude: { effect: 'extrude', font: 'tall', weight: '400', pairs: [['#ffd166', '#e85d04'], ['#ffffff', '#1c7ed6'], ['#ff8fab', '#c2255c']], motion: 'pop', tile: '#1d3557' },
  extrudeBubbly: { effect: 'extrude', font: 'bubbly', weight: '700', pairs: [['#ff8fab', '#c9184a'], ['#74c0fc', '#1864ab'], ['#8ce99a', '#2b8a3e']], motion: 'jelly', tile: '#fff0f6' },
  gradientFire: { effect: 'gradient', font: 'wide', weight: '900', pairs: [['#ffe29a', '#ff6b5e'], ['#fff3bf', '#f76707']], motion: 'pulse', tile: '#2b2346' },
  gradientOcean: { effect: 'gradient', font: 'geo', weight: '700', pairs: [['#a5f3fc', '#3b82f6'], ['#c3fae8', '#0ca678']], motion: 'wave', tile: '#0b1f3a' },
  gradientCandy: { effect: 'gradient', font: 'bubbly', weight: '700', pairs: [['#ffd6e7', '#b197fc'], ['#ffe3ec', '#ff6b9a']], motion: 'jelly', tile: '#3b2a5c' },
  sticker: { effect: 'sticker', font: 'bubbly', weight: '700', pairs: [['#ff6b5e', '#ffffff'], ['#845ef7', '#ffffff'], ['#1c7ed6', '#ffffff']], motion: 'bounce', tile: '#ffe8cc' },
  stickerMint: { effect: 'sticker', font: 'rounded', weight: '900', pairs: [['#20c997', '#ffffff'], ['#f76707', '#ffffff']], motion: 'wiggle', tile: '#e6fcf5' },
  stickerTall: { effect: 'sticker', font: 'tall', weight: '400', pairs: [['#ffd43b', '#2b2346'], ['#ffffff', '#e03131']], motion: 'pop', tile: '#4dabf7' },
  stamp: { effect: 'stamp', font: 'heavyslab', weight: '400', pairs: [['#e63946', '#e63946'], ['#1c7ed6', '#1c7ed6'], ['#2b8a3e', '#2b8a3e']], motion: 'pulse', tile: '#fff9db', tilt: -3 },
  marker: { effect: 'highlight', font: 'marker', weight: '700', pairs: [['#1f2937', '#ffd166'], ['#1f2937', '#8ce99a'], ['#1f2937', '#ffc9de']], motion: 'typewriter', tile: '#ffffff' },
  hand: { effect: 'highlight', font: 'hand', weight: '700', pairs: [['#1f2937', '#a5d8ff'], ['#1f2937', '#ffd8a8']], motion: 'wiggle', tile: '#f8f9fa' },
  chalk: { effect: 'chalk', font: 'marker', weight: '700', pairs: [['#f8fafc', '#f8fafc'], ['#ffec99', '#ffec99'], ['#ffc9de', '#ffc9de']], motion: 'typewriter', tile: '#2f4f3f' },
  arc: { effect: 'arc', font: 'heavyslab', weight: '400', pairs: [['#ffffff', '#ffffff'], ['#fff3bf', '#fff3bf']], motion: 'none', tile: '#e8590c', curve: 50 },
  arcDown: { effect: 'arc', font: 'display', weight: '900', pairs: [['#ffffff', '#ffffff']], motion: 'sway', tile: '#7048e8', curve: -20 },
  echo: { effect: 'echo', font: 'tall', weight: '400', pairs: [['#ffffff', '#ffd166'], ['#ffffff', '#ff8fab'], ['#ffd43b', '#ffffff']], motion: 'pulse', tile: '#6741d9' },
  outline: { effect: 'outline', font: 'wide', weight: '900', pairs: [['#ffffff', '#ffffff'], ['#ffd43b', '#ffd43b']], motion: 'glow', tile: '#212529' },
  glowGold: { effect: 'glow', font: 'script', weight: '400', pairs: [['#fff7e6', '#ffd166'], ['#ffffff', '#ff8fab']], motion: 'glow', tile: '#2b2346' },
  glowCyan: { effect: 'glow', font: 'geo', weight: '700', pairs: [['#e0fbff', '#22d3ee'], ['#f3f0ff', '#9775fa']], motion: 'float', tile: '#0b1426' },
  elegant: { effect: 'shadow', font: 'fashion', weight: '700', pairs: [['#ffffff', '#ffffff']], motion: 'sway', tile: '#845ef7', italic: true },
  rainbow: { effect: 'shadow', font: 'bubbly', weight: '700', pairs: [['#ff6b5e', '#ff6b5e'], ['#4dabf7', '#4dabf7']], motion: 'rainbow', tile: '#212529' },
  poster: { effect: 'shadow', font: 'poster', weight: '400', pairs: [['#ffffff', '#ffffff'], ['#ffd43b', '#ffd43b']], motion: 'shake', tile: '#e03131' },
  mono: { effect: 'solid', font: 'mono', weight: '700', pairs: [['#1f2937', '#1f2937'], ['#1c7ed6', '#1c7ed6']], motion: 'typewriter', tile: '#f8f9fa' },
  wave: { effect: 'shadow', font: 'rounded', weight: '900', pairs: [['#ffffff', '#ffffff'], ['#fff3bf', '#fff3bf']], motion: 'wave', tile: '#4dabf7' },
  script: { effect: 'shadow', font: 'script', weight: '400', pairs: [['#ffffff', '#ffffff'], ['#ffe066', '#ffe066']], motion: 'float', tile: '#e64980' },
  slab: { effect: 'retro', font: 'heavyslab', weight: '400', pairs: [['#fff3bf', '#e8590c'], ['#ffffff', '#1c7ed6']], motion: 'bounce', tile: '#2b8a3e' },
  condensed: { effect: 'shadow', font: 'condensed', weight: '900', pairs: [['#ffffff', '#ffffff']], motion: 'pop', tile: '#1c7ed6', caps: true, spacing: 6 },
  serif: { effect: 'glow', font: 'elegant', weight: '700', pairs: [['#ffffff', '#ffd8a8'], ['#fff5f5', '#ffc9de']], motion: 'float', tile: '#5c3d24', italic: true }
};

// ---------- the words, in groups, each with the looks that suit the group (taken in turn)
const GROUPS = [
  ['Hello and welcome', ['hello', 'welcome', 'greeting'], ['sticker', 'neonBlue', 'retro', 'wave', 'glowGold', 'extrudeBubbly', 'marker', 'arc', 'gradientOcean', 'script', 'echo', 'stickerMint'],
    ['Hello!', 'Hi there!', 'Welcome!', 'Welcome in', 'Come on in', 'Good morning', 'Good afternoon', 'Good evening', 'Good night', 'Hey!', 'Howdy!', 'Greetings!',
      'Nice to see you', "Glad you're here", 'Make yourself at home', 'Welcome back', 'Hello friend', 'Hi everyone', 'Good day!', 'Rise and shine', 'Hello sunshine', "We're open",
      "Come in, we're open", 'Welcome to our shop', 'Thanks for visiting', 'See you soon', 'Goodbye!', 'Bye for now', 'Have a great day', 'Have a nice day', 'Enjoy your stay',
      'Take care', 'Hello world', 'Welcome, team', 'Welcome aboard', 'Hey there!']],
  ['Celebrate', ['celebrate', 'party', 'congrats'], ['extrude', 'gradientFire', 'neonPink', 'sticker', 'retroWide', 'echo', 'glowGold', 'rainbow', 'arc', 'stickerTall', 'gradientCandy', 'script'],
    ['Congrats!', 'Congratulations', 'Happy birthday!', 'Hooray!', 'Cheers!', "Let's party", 'Party time!', 'Woohoo!', 'You did it!', 'Well done!', 'Best day ever', 'Celebrate!',
      'Yay!', 'Make a wish', 'Happy anniversary', 'Just married', "It's a boy!", "It's a girl!", 'Welcome, baby', 'Happy retirement', 'Bravo!', 'Good luck!', 'Best wishes',
      'Way to go!', 'Hip hip hooray!', 'Thank you!', 'Thanks a lot', 'Many thanks', 'Thank you so much', 'Big news!', 'Proud of you', 'High five!', "Let's celebrate", 'Cheers to you',
      'Happy graduation', 'Happy birthday to you']],
  ['Shop and sale', ['shop', 'sale', 'store', 'deal'], ['stickerTall', 'stamp', 'poster', 'extrude', 'gradientFire', 'condensed', 'neonPink', 'retroWide', 'sticker', 'echo', 'outline', 'slab'],
    ['SALE!', 'Big sale', 'Mega sale', 'Flash sale', 'Clearance', 'New arrivals', 'Just in', 'Best seller', 'Limited time', 'Today only', 'Last chance', 'Buy now',
      'Shop now', 'Order now', 'Free shipping', 'Free gift', 'Special offer', 'Hot deal', 'Deal of the day', '2 for 1', 'Half price', 'Sold out', 'Back in stock', 'Coming soon',
      'Pre-order now', 'Members only', 'Gift cards here', 'Ask us!', 'Pay here', 'Pick up here', 'Price drop', 'New collection', 'Holiday sale', 'Weekend sale', 'Shop local', 'Up to 50% off']],
  ['Food and drink', ['food', 'drink', 'cafe', 'menu', 'restaurant'], ['chalk', 'script', 'neonGreen', 'marker', 'slab', 'retro', 'arc', 'sticker', 'serif', 'stickerMint', 'hand', 'extrudeBubbly'],
    ['Fresh coffee', 'Coffee time', 'But first, coffee', 'Tea time', 'Hot drinks', 'Fresh baked', 'Daily special', 'Soup of the day', "Today's menu", "Chef's special", 'Lunch time', 'Brunch',
      'Pizza night', 'Burger time', 'Taco Tuesday', 'Sweet treats', 'Ice cream!', 'Smoothies', 'Fresh juice', 'Happy hour', 'Dinner is served', 'Bon appetit', 'Yummy!', 'Delicious',
      'Grab and go', 'Take away', 'Order here', 'Snack time', 'Breakfast all day', 'Homemade', 'Vegan options', 'Gluten free', 'Kids menu', 'Fresh salads', 'Dessert first', 'Open for lunch']],
  ['Feelings', ['feelings', 'love', 'happy', 'kind'], ['glowGold', 'gradientCandy', 'sticker', 'neonPink', 'script', 'extrudeBubbly', 'wave', 'rainbow', 'serif', 'hand', 'glowCyan', 'stickerMint'],
    ['Love you', 'I love it!', 'XOXO', 'Miss you', 'Thank you', 'So happy', 'Feeling good', 'Good vibes', 'Stay positive', 'Smile!', 'You got this', 'Believe',
      'Dream big', 'Be kind', 'Stay strong', 'Keep going', 'Never give up', 'You rock!', 'Awesome!', 'Amazing!', 'Wow!', 'OMG!', 'LOL', 'Haha!',
      'Oops!', 'Sorry!', 'Calm', 'Relax', 'Chill', 'Hugs', 'Peace', 'Joy', 'Hope', 'Love wins', 'Be yourself', 'Shine bright']],
  ['Seasons and holidays', ['holiday', 'season'], ['glowGold', 'retro', 'script', 'gradientOcean', 'extrude', 'neonBlue', 'chalk', 'arc', 'serif', 'sticker', 'echo', 'gradientFire'],
    ['Happy New Year!', 'Merry Christmas', 'Happy holidays', "Season's greetings", 'Let it snow', 'Winter wonderland', 'Hello winter', 'Hello spring', 'Spring is here', 'Happy Easter',
      'Ramadan Kareem', 'Eid Mubarak', 'Happy Diwali', 'Hello summer', 'Summer vibes', 'Beach day', 'Hello autumn', 'Fall vibes', 'Happy Halloween', 'Trick or treat',
      'Happy Thanksgiving', 'Give thanks', "Happy Valentine's Day", 'Be mine', "Happy Mother's Day", "Happy Father's Day", 'Back to school', 'Happy weekend', 'TGIF', 'Holiday hours',
      'Snow day', 'Sunny days', 'Rainy day', 'Cozy season', 'Happy spring', 'Summer sale']],
  ['Info and signs', ['sign', 'info', 'notice'], ['condensed', 'neonPink', 'stamp', 'outline', 'mono', 'stickerTall', 'neonBlue', 'poster', 'slab', 'marker', 'sticker', 'echo'],
    ['OPEN', 'CLOSED', 'Open late', 'Back soon', 'Be right back', 'Please wait here', 'Pay here', 'Order here', 'Pick up here', 'EXIT', 'Entrance', 'This way',
      'Restrooms', 'No smoking', 'Quiet, please', 'Wet floor', 'Staff only', 'PUSH', 'PULL', 'Free Wi-Fi', 'Scan me', 'Follow us', 'Call us', 'Book now',
      'Reserved', 'Now hiring', 'Join our team', 'Ask me!', 'Information', 'Lost and found', 'Mind the step', 'Thanks for waiting', 'Line starts here', 'Out of order', 'Do not disturb', 'Front desk']],
  ['School and work', ['school', 'work', 'office', 'team'], ['chalk', 'marker', 'stickerMint', 'retroWide', 'mono', 'extrude', 'hand', 'condensed', 'sticker', 'gradientOcean', 'arcDown', 'stamp'],
    ['Good job!', 'Great work', 'Well done', 'Gold star', 'A+', 'Teamwork', "Let's go, team", 'Meeting time', 'Deadline', 'Focus', 'Study time', 'Homework',
      'Test today', 'Class is in', 'Welcome, class', 'Field trip', 'Science fair', 'Story time', 'Art class', 'Lunch break', 'Coffee break', 'Team lunch', 'Brainstorm', 'New project',
      'Launch day', 'Goal!', 'Star of the month', 'Shout out', 'Thank you, team', 'Welcome, new friend', 'Happy Friday', 'Monday mood', 'On air', 'Live now', 'Q and A', 'Questions?']],
  ['Fun', ['fun', 'game', 'play'], ['poster', 'neonGreen', 'extrudeBubbly', 'stickerTall', 'rainbow', 'retroWide', 'gradientCandy', 'echo', 'outline', 'sticker', 'glowCyan', 'arcDown'],
    ["Let's go!", 'Game on', 'Level up', 'GG', 'Epic!', 'BOOM!', 'POW!', 'ZAP!', 'BAM!', 'Whoa!', 'Cool!', 'Nice!',
      'Sweet!', 'YES!', 'No way!', 'Hmm...', 'Shh...', 'Zzz...', 'Ta-da!', 'Whoops!', 'Oh yeah!', 'Bingo!', 'Jackpot!', 'Winner!',
      'Ready?', 'GO!', 'STOP!', 'Hi five!', 'Mic drop', 'Vibes', 'Mood', 'Fresh!', 'Rad!', 'Party on', 'Dance!', 'Have fun!']]
];

const slug = s => s.toLowerCase().replace(/'/g, '').replace(/%/g, ' percent').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
function LIST() {
  const out = [], ids = new Set();
  for (const [cat, catTags, looks, words] of GROUPS) {
    words.forEach((text, i) => {
      const key = looks[i % looks.length], lk = L[key];
      if (!lk) throw new Error('No look called ' + key);
      const pair = lk.pairs[Math.floor(i / looks.length) % lk.pairs.length];
      let id = 'w-' + slug(text);
      if (ids.has(id)) id += '-' + slug(cat).split('-')[0];
      if (ids.has(id)) throw new Error('Two words are called ' + id);
      ids.add(id);
      const cfg = { text, effect: lk.effect, font: lk.font, weight: lk.weight, c1: pair[0], c2: pair[1], motion: lk.motion, caps: !!lk.caps, italic: !!lk.italic,
        tilt: lk.tilt || 0, spacing: lk.spacing || 0, curve: lk.curve || 40 };
      const tags = [...new Set([...catTags, ...text.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(w => w.length > 1)])].slice(0, 12);
      out.push({ id, name: text, cat, tags, cfg, tile: lk.tile });
    });
  }
  return out;
}
module.exports = { LIST, LOOKS: L, GROUPS };

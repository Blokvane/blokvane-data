// Moving backgrounds for Boo Box: the Moving backgrounds widget (rain, bokeh, aurora, waves, fireflies, streamers,
// shooting stars, clouds, glitter, embers) and the Moving effects widget (confetti, snow, hearts, leaves, stars,
// bubbles, petals, fireworks, balloons, sparkles), in many color sets, over the slide or with their own sky.
'use strict';

const SCENE = new Set(['rain', 'bokeh', 'aurora', 'waves', 'fireflies', 'streamers', 'meteors', 'clouds', 'glitter', 'embers']);
const BACK_TILE = { none: '', night: '#0b1026', ocean: '#03253f', dusk: '#2b1055', ink: '#0b0f17', sky: '#3a8dde', sunset: '#ff7e5f', forest: '#0b3d2e', berry: '#3a0f4f', candy: '#ff9ac1', gold: '#3b2a05' };
// [effect, name, colors, back, amount, speed, tags, own sky colors]
const GROUPS = [
  ['Celebrate', ['celebrate', 'party'], [
    ['confetti', 'Confetti', '', 'none', 6, 5, ['confetti', 'birthday']],
    ['confetti', 'Pastel confetti', '#ffc9de, #b2f2bb, #a5d8ff, #ffec99, #d0bfff', 'none', 6, 4, ['pastel', 'baby', 'soft']],
    ['confetti', 'Gold confetti', '#ffd43b, #fab005, #fff3bf, #ffffff', 'night', 6, 4, ['gold', 'new year', 'gala']],
    ['confetti', 'Rainbow confetti on candy', '#ff6b5e, #ffd43b, #51cf66, #4dabf7, #cc5de8', 'candy', 7, 5, ['rainbow', 'kids']],
    ['confetti', 'Red and white confetti', '#e03131, #ffffff, #ffc9c9', 'none', 6, 5, ['red', 'valentine', 'sale']],
    ['confetti', 'Blue and silver confetti', '#1c7ed6, #74c0fc, #dee2e6, #ffffff', 'ink', 6, 4, ['blue', 'silver', 'winter']],
    ['streamers', 'Streamers', '', 'none', 5, 5, ['streamers', 'ribbons']],
    ['streamers', 'Gold streamers', '#ffd43b, #fab005, #fff3bf', 'night', 5, 4, ['gold', 'new year']],
    ['streamers', 'Candy streamers', '#ff8fab, #ffffff, #b197fc', 'berry', 6, 5, ['pink', 'sweet']],
    ['streamers', 'Team colors', '#1c7ed6, #ffffff, #e03131', 'none', 5, 5, ['team', 'sports', 'game day']],
    ['streamers', 'Green and gold', '#2b8a3e, #ffd43b, #ffffff', 'forest', 5, 4, ['green', 'gold', 'luck']],
    ['fireworks', 'Fireworks', '', 'night', 5, 5, ['fireworks', 'new year', 'night']],
    ['fireworks', 'Gold fireworks', '#ffd43b, #fff3bf, #ffa94d', 'ink', 5, 5, ['gold', 'gala']],
    ['fireworks', 'Pink and blue fireworks', '#ff6b9a, #74c0fc, #ffffff', 'dusk', 6, 5, ['pink', 'blue']],
    ['fireworks', 'Fireworks over the slide', '', 'none', 4, 5, ['over', 'celebrate']],
    ['fireworks', 'Red and white fireworks', '#e03131, #ffffff', 'night', 5, 6, ['red', 'national day']],
    ['balloons', 'Balloons', '', 'none', 5, 5, ['balloons', 'birthday']],
    ['balloons', 'Pastel balloons', '#ffc9de, #b2f2bb, #a5d8ff, #ffec99', 'sky', 5, 4, ['pastel', 'baby']],
    ['balloons', 'Gold and white balloons', '#ffd43b, #ffffff, #fab005', 'none', 5, 4, ['gold', 'wedding', 'anniversary']],
    ['balloons', 'Red balloons', '#e03131, #ff6b6b', 'none', 4, 4, ['red', 'love']],
    ['balloons', 'Balloons at sunset', '#ffffff, #ffd43b, #ff8787', 'sunset', 5, 4, ['sunset', 'party']]
  ]],
  ['Sparkle and glow', ['sparkle', 'glow', 'lights'], [
    ['glitter', 'Glitter', '', 'none', 6, 5, ['glitter', 'shiny']],
    ['glitter', 'Gold glitter', '#ffd43b, #fff3bf, #ffffff', 'gold', 7, 5, ['gold', 'luxury', 'gala']],
    ['glitter', 'Silver glitter', '#ffffff, #dee2e6, #a5d8ff', 'ink', 7, 5, ['silver', 'winter']],
    ['glitter', 'Pink glitter', '#ff8fab, #ffc9de, #ffffff', 'berry', 7, 5, ['pink', 'girly']],
    ['glitter', 'Rainbow glitter', '#ff6b5e, #ffd43b, #51cf66, #4dabf7, #cc5de8', 'night', 7, 6, ['rainbow', 'fun']],
    ['sparkles', 'Sparkles', '', 'none', 5, 5, ['sparkles', 'magic']],
    ['sparkles', 'Magic sparkles', '#e5dbff, #b197fc, #ffffff', 'dusk', 6, 5, ['magic', 'purple', 'fairy']],
    ['sparkles', 'Gold sparkles', '#ffd43b, #fff3bf', 'ink', 6, 5, ['gold', 'award']],
    ['sparkles', 'Icy sparkles', '#d0ebff, #ffffff, #a5d8ff', 'ocean', 6, 4, ['ice', 'winter', 'frozen']],
    ['sparkles', 'Sparkles on candy', '#ffffff, #fff3bf', 'candy', 6, 5, ['pink', 'sweet']],
    ['bokeh', 'Bokeh lights', '', 'none', 5, 5, ['bokeh', 'lights', 'soft']],
    ['bokeh', 'Warm bokeh', '#ffd8a8, #ffc078, #ffe066', 'ink', 6, 4, ['warm', 'cozy', 'evening']],
    ['bokeh', 'City lights', '#ffd43b, #ff8787, #74c0fc, #ffffff', 'night', 7, 5, ['city', 'night', 'lights']],
    ['bokeh', 'Pastel bokeh', '#ffc9de, #d0bfff, #a5d8ff', 'none', 5, 4, ['pastel', 'soft', 'dream']],
    ['bokeh', 'Holiday bokeh', '#e03131, #2f9e44, #ffd43b', 'ink', 6, 4, ['holiday', 'christmas', 'lights']],
    ['bokeh', 'Golden hour', '#fff3bf, #ffd8a8, #ffc9c9', 'sunset', 6, 3, ['gold', 'sunset', 'warm']],
    ['fireflies', 'Fireflies', '', 'forest', 5, 5, ['fireflies', 'summer night', 'nature']],
    ['fireflies', 'Fireflies over the slide', '', 'none', 5, 4, ['fireflies', 'glow']],
    ['fireflies', 'Blue fireflies', '#74c0fc, #d0ebff, #ffffff', 'night', 6, 4, ['blue', 'magic']],
    ['fireflies', 'Pink fireflies', '#ff8fab, #ffc9de', 'berry', 6, 4, ['pink', 'love']],
    ['stars', 'Twinkling stars', '', 'night', 6, 5, ['stars', 'night', 'sky']],
    ['stars', 'Stars over the slide', '', 'none', 5, 4, ['stars', 'twinkle']],
    ['stars', 'Gold stars', '#ffd43b, #fff3bf', 'dusk', 6, 4, ['gold', 'award']],
    ['stars', 'Stars at dusk', '#ffffff, #ffe066', 'dusk', 6, 4, ['dusk', 'evening']],
    ['stars', 'Blue stars', '#a5d8ff, #ffffff', 'ocean', 6, 5, ['blue', 'calm']]
  ]],
  ['Sky and night', ['sky', 'night'], [
    ['aurora', 'Northern lights', '', 'night', 5, 5, ['aurora', 'northern lights']],
    ['aurora', 'Pink aurora', '#ff8fab, #b197fc, #74c0fc', 'night', 5, 4, ['pink', 'dream']],
    ['aurora', 'Green aurora', '#38d9a9, #69db7c, #a9e34b', 'ink', 5, 4, ['green', 'calm']],
    ['aurora', 'Sunset glow', '#ffa94d, #ff6b6b, #ffd43b', 'dusk', 5, 4, ['sunset', 'warm']],
    ['aurora', 'Ocean glow', '#3bc9db, #4dabf7, #748ffc', 'ocean', 5, 4, ['ocean', 'blue']],
    ['aurora', 'Aurora over the slide', '', 'none', 4, 4, ['soft', 'glow']],
    ['meteors', 'Shooting stars', '', 'night', 5, 5, ['shooting stars', 'wish', 'space']],
    ['meteors', 'Shooting stars at dusk', '#ffffff, #ffe066', 'dusk', 5, 5, ['dusk', 'wish']],
    ['meteors', 'Golden comets', '#ffd43b, #ffa94d', 'ink', 6, 5, ['gold', 'comet']],
    ['meteors', 'Blue meteors', '#74c0fc, #d0ebff', 'ocean', 6, 6, ['blue', 'space']],
    ['meteors', 'Shooting stars over the slide', '', 'none', 4, 5, ['stars', 'wish']],
    ['clouds', 'Clouds', '', 'sky', 5, 4, ['clouds', 'sky', 'day']],
    ['clouds', 'Clouds at sunset', '#ffe3e3, #fff3bf', 'sunset', 5, 3, ['sunset', 'warm']],
    ['clouds', 'Night clouds', '#adb5bd, #ced4da', 'night', 5, 3, ['night', 'moody']],
    ['clouds', 'Candy clouds', '#ffffff, #ffe3ec', 'candy', 5, 3, ['pink', 'dream', 'kids']],
    ['clouds', 'Clouds over the slide', '', 'none', 4, 3, ['clouds', 'soft']]
  ]],
  ['Weather', ['weather'], [
    ['rain', 'Rain', '', 'ink', 5, 5, ['rain', 'rainy day']],
    ['rain', 'Rain over the slide', '', 'none', 5, 5, ['rain', 'wet']],
    ['rain', 'Night rain', '#a5d8ff, #ffffff', 'night', 6, 6, ['rain', 'storm', 'night']],
    ['rain', 'Golden rain', '#ffd43b, #fff3bf', 'gold', 6, 5, ['gold', 'luck', 'sparkle']],
    ['rain', 'Spring shower', '#e7f5ff, #ffffff', 'sky', 4, 4, ['spring', 'shower']],
    ['snow', 'Snow', '', 'none', 5, 5, ['snow', 'winter']],
    ['snow', 'Snowy night', '', 'night', 6, 4, ['snow', 'night', 'holiday']],
    ['snow', 'Blizzard', '', 'ink', 10, 8, ['snow', 'storm', 'cold']],
    ['snow', 'Gentle snow', '', 'ocean', 3, 3, ['snow', 'calm', 'quiet']],
    ['snow', 'Pink snow', '#ffc9de, #ffffff', 'berry', 5, 4, ['pink', 'winter']]
  ]],
  ['Love', ['love', 'heart'], [
    ['hearts', 'Floating hearts', '', 'none', 5, 5, ['hearts', 'valentine']],
    ['hearts', 'Hearts on berry', '', 'berry', 6, 4, ['hearts', 'romance']],
    ['hearts', 'Pink hearts', '#ff8fab, #ffc9de, #ffffff', 'candy', 6, 4, ['pink', 'cute']],
    ['hearts', 'Gold hearts', '#ffd43b, #fff3bf', 'ink', 5, 4, ['gold', 'wedding', 'anniversary']],
    ['hearts', 'Rainbow hearts', '#ff6b5e, #ffd43b, #51cf66, #4dabf7, #cc5de8', 'none', 6, 5, ['rainbow', 'kind']],
    ['petals', 'Flower petals', '', 'none', 5, 4, ['petals', 'spring', 'wedding']],
    ['petals', 'Rose petals', '#e03131, #ff6b6b, #ffc9c9', 'berry', 6, 4, ['roses', 'romance']],
    ['petals', 'Cherry blossoms', '#ffc9de, #ffffff, #fcc2d7', 'sky', 6, 3, ['cherry blossom', 'spring', 'sakura']],
    ['petals', 'White petals', '#ffffff, #f8f9fa', 'dusk', 6, 3, ['white', 'wedding', 'calm']],
    ['petals', 'Sunset petals', '#ffd8a8, #ffc9c9', 'sunset', 5, 3, ['sunset', 'warm']]
  ]],
  ['Nature and seasons', ['nature', 'season'], [
    ['leaves', 'Falling leaves', '', 'none', 5, 4, ['leaves', 'autumn', 'fall']],
    ['leaves', 'Autumn forest', '', 'forest', 6, 4, ['autumn', 'forest']],
    ['leaves', 'Golden leaves', '#ffd43b, #fab005, #f08c00', 'ink', 6, 4, ['gold', 'autumn']],
    ['leaves', 'Spring leaves', '#69db7c, #a9e34b, #38d9a9', 'sky', 5, 4, ['spring', 'green', 'fresh']],
    ['leaves', 'Red leaves', '#e03131, #fa5252, #ff8787', 'none', 5, 4, ['red', 'autumn', 'maple']],
    ['embers', 'Embers', '', 'ink', 6, 5, ['embers', 'fire', 'cozy']],
    ['embers', 'Campfire', '#ff922b, #ffd43b', 'night', 7, 5, ['campfire', 'warm', 'outdoors']],
    ['embers', 'Embers over the slide', '', 'none', 5, 5, ['fire', 'warm']],
    ['embers', 'Magic embers', '#b197fc, #74c0fc, #ffffff', 'dusk', 6, 4, ['magic', 'purple']]
  ]],
  ['Water', ['water', 'sea'], [
    ['waves', 'Ocean waves', '', 'none', 5, 5, ['waves', 'ocean', 'beach']],
    ['waves', 'Deep ocean', '', 'ocean', 5, 4, ['ocean', 'deep', 'calm']],
    ['waves', 'Sunset waves', '#ff8787, #ffa94d, #ffd43b', 'sunset', 5, 4, ['sunset', 'beach', 'summer']],
    ['waves', 'Tropical waves', '#3bc9db, #63e6be, #96f2d7', 'sky', 5, 5, ['tropical', 'summer', 'pool']],
    ['waves', 'Night waves', '#364fc7, #4c6ef5, #748ffc', 'night', 5, 3, ['night', 'calm']],
    ['waves', 'Candy waves', '#ff8fab, #b197fc, #ffc9de', 'none', 5, 4, ['pink', 'fun']],
    ['bubbles', 'Bubbles', '', 'ocean', 5, 4, ['bubbles', 'underwater']],
    ['bubbles', 'Bubbles over the slide', '', 'none', 5, 4, ['bubbles', 'soap']],
    ['bubbles', 'Soap bubbles on sky', '', 'sky', 6, 4, ['soap', 'kids', 'play']],
    ['bubbles', 'Bubbles on candy', '', 'candy', 6, 4, ['pink', 'fun']],
    ['bubbles', 'Night bubbles', '', 'night', 5, 3, ['night', 'calm']]
  ]]
];

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function LIST() {
  const out = [], ids = new Set();
  for (const [cat, catTags, list] of GROUPS) {
    for (const [effect, name, colors, back, amount, speed, tags] of list) {
      const id = 'sc-' + slug(name);
      if (ids.has(id)) throw new Error('Two backgrounds are called ' + id);
      ids.add(id);
      const k = SCENE.has(effect) ? 'scene' : 'effects';
      // the tile in the panel: the sky when there is one, otherwise a dark tile (most effects are light)
      const tile = BACK_TILE[back] || '#1d2433';
      out.push({ id, name, cat, tags: [...new Set([...catTags, effect, ...tags])], k, cfg: { effect, amount, speed, colors, back, backA: '#0b1026', backB: '#1b2a5e' }, tile });
    }
  }
  return out;
}
module.exports = { LIST, GROUPS };

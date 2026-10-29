// The first templates made from specs: one or more for each of the newer layouts (recipes), in many categories.
// See README.md in this folder for how a spec works. Every name, place and handle here is made up.
module.exports = [
  // ---------- Celebrate
  { id: 'earth-day-cleanup', name: 'Earth Day park cleanup', cat: 'Holidays', color: 'green', tags: 'earth day,cleanup,park,volunteer,april', when: 'earthday',
    recipe: 'hero', palette: 'forest', fonts: 'friendly',
    o: { kick: 'Earth Day', title: 'Park\ncleanup', sub: 'Gloves and bags are on us. Bring a friend.', foot: 'Saturday, 9 AM at the north gate', art: [['globe'], ['leaf'], ['recycle'], ['plant']] } },

  // ---------- Food and drink
  { id: 'chef-picks', name: 'Chef\'s picks', cat: 'Restaurants', color: 'green', tags: 'chef,dishes,specials,dinner', recipe: 'dishes', palette: 'forest', fonts: 'elegant',
    o: { kick: 'From the kitchen', title: 'Chef\'s picks this week', dishes: [{ name: 'Garden bowl', note: 'Grains, greens, lemon', price: '$12', art: ['bowl'] }, { name: 'Wood-fired pizza', note: 'Basil and mozzarella', price: '$16', art: ['pizza'] }, { name: 'Berry tart', note: 'Made this morning', price: '$7' }] } },
  { id: 'lunch-deal-receipt', name: 'Lunch deal receipt', cat: 'Menus', color: 'orange', tags: 'lunch,deal,menu,combo', recipe: 'receipt', palette: 'coral',
    o: { kick: 'Lunch deal', title: 'Your lunch,\nall in one', sub: 'Any sandwich, a side and a drink', shop: 'Maple Street Deli', shopSub: '12 Maple Street', items: 'Turkey club | 9.50\nTomato soup | 4.00\nIced tea | 2.50', total: ['Deal price', '$12'], thanks: 'Thank you!', foot: 'Every weekday', art: [['hotdog'], ['fries']] } },
  { id: 'how-to-order', name: 'How to order', cat: 'Cafes and bakeries', color: 'brown', tags: 'order,steps,cafe,counter', recipe: 'steps', palette: 'espresso',
    o: { kick: 'New here?', title: 'Ordering is easy', steps: [{ title: 'Pick', text: 'Choose a drink and a treat' }, { title: 'Pay', text: 'Card or cash at the counter' }, { title: 'Enjoy', text: 'We call your name when it is ready' }], foot: 'Ask about oat milk' } },
  { id: 'jazz-night-ticket', name: 'Jazz night ticket', cat: 'Bars and nightlife', color: 'purple', tags: 'jazz,music,ticket,live music', recipe: 'admit', palette: 'berry',
    o: { kick: 'Live at The Copper Lantern', title: 'Jazz Night', sub: 'Doors open at 7. Small plates all night.', details: [['Date', 'Fri, June 12'], ['Time', '8 PM'], ['Place', 'Main room']], stub: '017', foot: 'Tickets at the bar', art: [['vinyl', ['$paperInk', '$accent']], ['headphones', ['$ink', '$accent']]] } },
  { id: 'live-band-poster', name: 'Live band poster', cat: 'Bars and nightlife', color: 'purple', tags: 'live music,band,gig,concert', recipe: 'gig', palette: 'berry', fonts: 'glow',
    o: { title: 'The Velvet Owls', day: 'Saturday', date: '14', month: 'June', lines: ['Live on the patio', 'With Mara Quinn and friends', 'Free entry'], strip: 'The Copper Lantern, 9 PM', art: [['guitar']] } },

  // ---------- Shops and services
  { id: 'grand-opening-banner', name: 'Grand opening banner', cat: 'Retail', color: 'red', tags: 'grand opening,new,store,opening', recipe: 'banner', palette: 'ruby', fonts: 'slab',
    o: { kick: 'We are open!', title: 'Grand\nopening', sub: 'Come say hello at 48 Birch Lane', foot: 'Treats for the first 50 guests', art: [['balloons'], ['balloons'], ['confetti']], fx: ['confetti', { amount: 3, speed: 3 }] } },
  { id: 'spring-style-issue', name: 'Spring style issue', cat: 'Beauty and spa', color: 'pink', tags: 'salon,spring,style,hair', recipe: 'magazine', palette: 'blush',
    o: { mast: 'GLOW', kick: 'Spring issue', title: 'Fresh looks\nfor sunny days', sub: 'Book a cut and color this month', lines: ['New: silk press', 'Brow and lash bar', 'Gift cards at the desk'], badge: '20% off', big: ['hairdryer', ['$accent', '$paperInk', '$accent2']] } },
  { id: 'oil-change-special', name: 'Oil change special', cat: 'Cars and auto', color: 'red', tags: 'oil change,car,service,garage', recipe: 'diagonal', palette: 'midnight',
    o: { kick: 'Quick service', title: 'Oil change\nspecial', sub: 'In and out in 30 minutes. No appointment needed.', big: ['oilcan', ['$accent', '#ffd166', '$paperInk']], foot: 'Only $39 this week', art: [['wrench', ['$ink2']], ['tire']] } },
  { id: 'car-wash-prices', name: 'Car wash prices', cat: 'Cars and auto', color: 'blue', tags: 'car wash,prices,packages,car', recipe: 'prices', palette: 'midnight',
    o: { kick: 'Sparkle Car Wash', title: 'Pick your wash', plans: [{ name: 'Basic', price: '$9', per: 'per car', lines: ['Wash and rinse', 'Air dry'] }, { name: 'Deluxe', price: '$15', per: 'per car', lines: ['Basic, plus', 'Wheel shine', 'Hand dry'], hot: true, tag: 'Most picked' }, { name: 'Ultimate', price: '$24', per: 'per car', lines: ['Deluxe, plus', 'Wax coat', 'Inside vacuum'] }] } },
  { id: 'open-house-find-us', name: 'Open house: find us', cat: 'Real estate', color: 'green', tags: 'open house,find us,directions,real estate', recipe: 'findus', palette: 'citrus',
    o: { kick: 'Open house', title: 'Find us this Sunday', address: ['22 Willow Bend', 'Cedar Hills', 'Look for the green flags'], hours: 'Sunday 1 to 4 PM', foot: 'Everyone welcome' } },
  { id: 'grooming-coupon', name: 'Grooming coupon', cat: 'Pets', color: 'teal', tags: 'pets,grooming,coupon,dog', recipe: 'coupon', palette: 'mint',
    o: { kick: 'Happy Tails Grooming', deal: '15% OFF', title: 'Your next groom', sub: 'For dogs and cats of every size', code: 'Code: FLUFFY15', until: 'Good until the end of the month', foot: 'Show this screen at the desk', art: [['paw', ['$accent']], ['bone', ['#fff1d6', '$accent2']]] } },
  { id: 'plumbing-why-us', name: 'Why neighbors call us', cat: 'Home services', color: 'blue', tags: 'plumbing,repairs,services,home', recipe: 'features', palette: 'ocean',
    o: { kick: 'Clearwater Plumbing', title: 'Why neighbors call us', features: [{ art: ['pipe', ['#94a3b8', '$accent', '#64748b']], title: 'Fast repairs', text: 'Same-day visits for leaks and clogs' }, { art: ['toolbox', ['$accent2', '#1f2937', '#cbd5e1']], title: 'Fair prices', text: 'A clear quote before we start' }, { art: ['house', ['#ffd166', '$accent', '#bde0fe']], title: 'Local team', text: 'Serving Pine Valley for 20 years' }], foot: 'Call 555-0142' } },

  // ---------- Work
  { id: 'year-in-numbers', name: 'Our year in numbers', cat: 'Numbers and charts', color: 'blue', tags: 'stats,numbers,results,thank you', recipe: 'bigstats', palette: 'slate',
    o: { kick: 'Northwind Studio', title: 'Our year in numbers', sub: 'Thank you to every client and every team member', stats: [{ value: '1,240', label: 'Happy clients', art: ['hearthands', ['$accent', '$accent2']] }, { value: '98%', label: 'Projects on time', art: ['check', ['$accent']] }, { value: '36', label: 'New team members', art: ['people'] }], foot: 'Here is to next year' } },
  { id: 'closing-checklist', name: 'Closing checklist', cat: 'Office life', color: 'green', tags: 'checklist,closing,office,reminder', recipe: 'checklist', palette: 'mint',
    o: { kick: 'Before you go', title: 'Closing checklist', sub: 'The last one out, please check each one', items: ['Windows closed', 'Coffee machine off', 'Lights off in all rooms', 'Back door locked', 'Alarm on'], done: 2, big: ['clipboard', ['$paper', '#b5651d', '$accent']] } },
  { id: 'meet-the-team', name: 'Meet the team', cat: 'Office life', color: 'blue', tags: 'team,staff,people,welcome', recipe: 'team', palette: 'slate',
    o: { kick: 'Say hello to', title: 'Our front desk team', people: [{ name: 'Priya S.', role: 'Office manager' }, { name: 'Tom W.', role: 'Reception' }, { name: 'Lena K.', role: 'Support' }, { name: 'Omar B.', role: 'Facilities' }] } },
  { id: 'scan-for-menu', name: 'Scan for the menu', cat: 'Marketing and social', color: 'teal', tags: 'qr,scan,menu,phone', recipe: 'scan', palette: 'forest',
    o: { kick: 'No app needed', title: 'Scan for\nour menu', steps: ['Open your phone camera', 'Point it at the code', 'Tap the link'], foot: 'Free Wi-Fi inside' } },
  { id: 'happy-guest-review', name: 'What our guests say', cat: 'Marketing and social', color: 'orange', tags: 'review,testimonial,stars,bakery', recipe: 'testimonial', palette: 'espresso', fonts: 'elegant',
    o: { kick: 'What our guests say', quote: 'The friendliest little bakery in town. The cinnamon buns are worth the trip!', who: 'Dana R.', role: 'A guest for years', foot: 'Thank you for your kind words', art: [['croissant']] } },

  // ---------- Learning
  { id: 'college-open-day', name: 'Open day timeline', cat: 'College', color: 'navy', tags: 'open day,schedule,college,campus', recipe: 'timeline', palette: 'ocean',
    o: { kick: 'Hillcrest College', title: 'Open day', sub: 'Saturday, all over campus', steps: [{ label: '9 AM', text: 'Welcome talk in the main hall' }, { label: '10 AM', text: 'Campus tours' }, { label: '12 PM', text: 'Lunch on the lawn' }, { label: '2 PM', text: 'Meet the teachers' }], foot: 'Everyone is welcome' } },
  { id: 'summer-camp-memories', name: 'Summer camp memories', cat: 'Kids and youth', color: 'yellow', tags: 'camp,photos,summer,kids', recipe: 'polaroids', palette: 'sunshine', fonts: 'friendly',
    o: { kick: 'Camp Willow Creek', title: 'Best summer ever', sub: 'Add your own photos to each frame', captions: ['Day one!', 'Lake day', 'Campfire'], art: [['kite', ['$accent', '$accent2', '$ink2']]] } },

  // ---------- Health, community, info
  { id: 'gym-class-schedule', name: 'Today\'s classes', cat: 'Fitness', color: 'orange', tags: 'classes,gym,schedule,fitness', recipe: 'schedule', palette: 'coral', fonts: 'modern',
    o: { kick: 'Peak Fitness', title: 'Today\'s classes', sub: 'Drop in any time. Bring water.', big: ['kettlebell', ['$paperInk', '$accent']], rows: [['6:00', 'Sunrise yoga', 'Studio A'], ['7:30', 'Spin', 'Bike room'], ['9:00', 'Strength', 'Main floor'], ['12:15', 'Lunch HIIT', 'Studio B'], ['17:30', 'Boxing', 'Ring'], ['19:00', 'Stretch', 'Studio A']] } },
  { id: 'front-desk-info', name: 'Front desk info', cat: 'Hotels', color: 'navy', tags: 'hotel,front desk,info,guests', recipe: 'infoboard', palette: 'espresso',
    o: { kick: 'The Linden Inn', title: 'Good to know', cards: [{ label: 'Breakfast', value: '7 to 10 AM', art: ['coffee'] }, { label: 'Pool', value: 'Open until 9 PM', art: ['umbrella'] }, { label: 'Check-out', value: '11 AM', art: ['key'] }], ticker: 'Welcome to The Linden Inn\nLate check-out on request\nAsk us about city tours', label: 'Today' } },
  { id: 'building-directory', name: 'Building directory', cat: 'Info screens', color: 'navy', tags: 'directory,building,floors,lobby', recipe: 'directory', palette: 'midnight', fonts: 'modern',
    o: { kick: 'Welcome to', title: 'Harbor Point Center', clock: true, rows: [['Reception', 'Ground'], ['Bright Path Dental', '1st floor'], ['Oakline Accounting', '2nd floor'], ['Studio Nine Design', '2nd floor'], ['Fern and Co. Law', '3rd floor'], ['Meeting rooms', '4th floor'], ['Roof garden', '5th floor'], ['Parking', 'Level B1']] } }
];

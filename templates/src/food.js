// Food and drink: restaurants, menus, cafes and bakeries, bars and nightlife.
// See README.md in this folder for how a spec works. Every name, place, dish, price and handle here is made up.

// A menu board on a card in the palette's colors (wide: two columns, tall: one)
const card = (items, columns) => ({ title: '', subtitle: '', items, currency: '$', columns, leaders: true, showDesc: true,
  theme: 'paper', bg: 'color', bgColor: '$paper', font: 'geo', cText: '$paperInk', cAccent: '$accent' });
const PIZZA = '# Classics\n*Margherita | 14 | Tomato, mozzarella, basil\nPepperoni | 16\nFour cheese | 16\n# Specials\nHot honey salami | 18 | Chili flakes | hot\nWild mushroom | 17 | Garlic cream, thyme\nGarden | 16 | Peppers, olives, onion | vegan\n# Sides\nGarlic knots | 6\nCaesar salad | 9';
const TEA = '# Green\nSencha | 4\n*Ceremonial matcha | 5.50 | Whisked to order\n# Black\nEarl grey | 4\nMasala chai | 4.75 | Spiced, with milk\n# Herbal\nChamomile | 4\nMint and lemongrass | 4 | | new\n# Cold\nPeach iced tea | 4.50\nBrown sugar boba | 6 | | popular';

module.exports = [
  // ===================================================================== Restaurants
  { id: 'food-farm-to-table', name: 'Farm to table', cat: 'Restaurants', color: 'green', tags: 'farm to table,local,fresh,seasonal,organic,restaurant',
    recipe: 'features', palette: 'citrus', fonts: 'elegant',
    o: { kick: 'From our farms to your table', title: 'Why it tastes better', features: [
      { art: ['seedling'], title: 'Local farms', text: 'Six family farms within 40 miles' },
      { art: ['bread'], title: 'Made from scratch', text: 'Sauces, breads and stocks, every morning' },
      { art: ['leaves'], title: 'Picked in season', text: 'The menu changes with the harvest' }],
      foot: 'Ask what is fresh today', back: [['dotsbg', ['$accent'], { opacity: 22 }]] } },

  { id: 'food-family-bundle', name: 'Family dinner bundle', cat: 'Restaurants', color: 'yellow', tags: 'family meal,bundle,pizza,dinner deal,takeout,family night',
    recipe: 'receipt', palette: 'sunshine', fonts: 'slab',
    o: { kick: 'Family night', title: 'Dinner for four', sub: 'One price and everyone is fed', shop: 'Fireside Pizza Co.', shopSub: '88 Harbor Road',
      items: 'Large pizza | 18.00\nGarden salad | 8.00\nGarlic knots | 6.00\nBrownie bites | 5.00', total: ['Bundle price', '$32'], thanks: 'Enjoy, neighbor!',
      foot: 'Tuesdays and Wednesdays', art: [['pizza'], ['lpizza', ['$accent']]] } },

  { id: 'food-burger-night', name: 'Burger night', cat: 'Restaurants', color: 'red', tags: 'burger,burger night,thursday,weekly special,dinner,deal',
    when: { kind: 'week', days: [4], label: 'Every Thursday' },
    recipe: 'diagonal', palette: 'ruby', fonts: 'slab',
    o: { kick: 'Every Thursday', title: 'Burger night', sub: 'Any burger with fries and a shake for $15', big: ['burger', [], { motion: 'float' }],
      foot: '5 PM until close', art: [['fries'], ['lburger', ['$bg1']]] } },

  { id: 'food-chefs-table', name: 'Chef\'s table dinner', cat: 'Restaurants', color: 'brown', tags: 'chef\'s table,tasting menu,dinner,event,reservation,ticket',
    recipe: 'admit', palette: 'espresso', fonts: 'elegant',
    o: { kick: 'An evening with Chef Rosa', title: 'Chef\'s table', details: [['Date', 'Sat, Nov 8'], ['Time', '7 PM'], ['Seats', '12 only']],
      stubLabel: 'Seat', stub: '07', sub: 'Seven courses cooked right in front of you', foot: 'Book at the host stand',
      art: [['wine'], ['cutlery', ['$ink2', '$accent']]] } },

  { id: 'food-order-at-table', name: 'Order from your table', cat: 'Restaurants', color: 'navy', tags: 'qr,order,scan,table,contactless,phone',
    recipe: 'scan', palette: 'midnight', fonts: 'modern',
    o: { kick: 'No waiting', title: 'Order from\nyour table', steps: ['Scan the code', 'Pick your dishes', 'We bring them to you'],
      foot: 'Pay when you are ready', back: [['mesh', ['$accent', '$bg2', '$accent2'], { opacity: 22 }]] } },

  { id: 'food-diner-review', name: 'What diners say', cat: 'Restaurants', color: 'green', tags: 'review,testimonial,guests,stars,feedback,restaurant',
    recipe: 'testimonial', palette: 'forest', fonts: 'elegant',
    o: { kick: 'Overheard at table six', quote: 'The best ravioli I have had outside my grandmother\'s kitchen. We come back every Sunday.',
      who: 'Marco T.', role: 'Sunday regular', foot: 'Thank you for every kind word', art: [['heart', ['$accent']]] } },

  { id: 'food-meet-the-kitchen', name: 'Meet our kitchen', cat: 'Restaurants', color: 'blue', tags: 'team,chefs,kitchen,staff,meet the team,cooks',
    recipe: 'team', palette: 'slate', fonts: 'elegant',
    o: { kick: 'The people behind your plate', title: 'Meet our kitchen', people: [
      { name: 'Rosa M.', role: 'Head chef' }, { name: 'Theo K.', role: 'Sous chef' }, { name: 'Ana P.', role: 'Pastry' }, { name: 'Malik J.', role: 'Grill' }] } },

  { id: 'food-now-open-downtown', name: 'Now open downtown', cat: 'Restaurants', color: 'purple', tags: 'new location,now open,find us,directions,map,grand opening',
    recipe: 'findus', palette: 'berry', fonts: 'poster',
    o: { kick: 'Our second kitchen', title: 'Now open\ndowntown', address: ['410 Elm Street', 'Corner of Elm and 4th', 'Free parking out back'],
      hours: 'Open every day, 11 AM to 10 PM', foot: 'Come say hello' } },

  { id: 'food-kitchen-numbers', name: 'Our kitchen today', cat: 'Restaurants', color: 'purple', tags: 'numbers,stats,kitchen,handmade,fresh,dumplings',
    recipe: 'bigstats', palette: 'lavender', fonts: 'modern',
    o: { kick: 'Made by hand, every day', title: 'Our kitchen today', stats: [
      { value: '640', label: 'Dumplings folded', art: ['bowl'] },
      { value: '18 hrs', label: 'Broth simmering', art: ['flame'] },
      { value: '6', label: 'Local farms', art: ['seedling'] }], foot: 'Thanks for eating with us' } },

  { id: 'food-wine-dinner', name: 'Wine dinner', cat: 'Restaurants', color: 'black', tags: 'wine dinner,pairing,event,dinner,wine,schedule',
    recipe: 'timeline', palette: 'mono', fonts: 'elegant',
    o: { kick: 'Thursday wine dinner', title: 'A night with us', steps: [
      { label: '6:30 PM', text: 'Welcome glass on the patio' }, { label: '7 PM', text: 'Four courses, four wines' },
      { label: '8:30 PM', text: 'Meet the winemaker' }, { label: '9 PM', text: 'Dessert and coffee' }],
      foot: '$85 per guest', back: [['grain', []]] } },

  { id: 'food-catering-packages', name: 'Catering packages', cat: 'Restaurants', color: 'blue', tags: 'catering,office lunch,party,packages,prices,events',
    recipe: 'prices', palette: 'ocean', fonts: 'modern',
    o: { kick: 'Catering from Bay Leaf Kitchen', title: 'Feed the whole team', plans: [
      { name: 'Small', price: '$150', per: '10 people', lines: ['Two mains', 'One big salad'] },
      { name: 'Office', price: '$340', per: '25 people', lines: ['Three mains', 'Two salads', 'Dessert tray'], hot: true, tag: 'Most ordered' },
      { name: 'Party', price: '$620', per: '50 people', lines: ['Four mains', 'Sides and salads', 'We set it up'] }] } },

  { id: 'food-birthday-dessert', name: 'Birthday dessert on us', cat: 'Restaurants', color: 'pink', tags: 'birthday,dessert,free,coupon,celebration,treat',
    recipe: 'coupon', palette: 'blush', fonts: 'friendly',
    o: { kick: 'Happy birthday from us', deal: 'FREE', title: 'Birthday dessert', sub: 'Any dessert on the house during your birthday week',
      code: 'Just tell your server', until: 'One per guest, dine in only', foot: 'We bring the candle too',
      art: [['cake'], ['balloon', ['$accent']]], fx: ['confetti', { amount: 2, speed: 2 }] } },

  { id: 'food-patio-season', name: 'Patio season', cat: 'Restaurants', color: 'teal', tags: 'patio,outdoor seating,summer,spring,garden,open air',
    when: { kind: 'year', month: 5, day: 1, span: 60, label: 'May and June' },
    recipe: 'banner', palette: 'mint', fonts: 'retro',
    o: { kick: 'Fresh air is back', title: 'Patio\nseason', sub: 'Our garden patio is open for lunch and dinner', foot: 'Dogs welcome',
      art: [['umbrella'], ['plant'], ['sun', [], { motion: 'spin' }]] } },

  { id: 'food-today-at-the-grill', name: 'Today at the grill', cat: 'Restaurants', color: 'coral', tags: 'today,specials,soup,wait time,info board,grill',
    recipe: 'infoboard', palette: 'coral', fonts: 'slab',
    o: { kick: 'Main Street Grill', title: 'Today at the grill', cards: [
      { label: 'Soup', value: 'Corn chowder', art: ['bowl'] }, { label: 'Special', value: 'Brisket plate', art: ['flame'] },
      { label: 'Wait', value: 'About 15 min', art: ['clock'] }],
      ticker: 'Gluten-free buns on request\nKids eat half price on Sundays\nAsk us about catering', label: 'Good to know' } },

  { id: 'food-takeout-steps', name: 'Takeout made easy', cat: 'Restaurants', color: 'yellow', tags: 'takeout,to go,pickup,order,how it works,phone order',
    recipe: 'steps', palette: 'sunshine', fonts: 'friendly',
    o: { kick: 'Hungry at home?', title: 'Takeout made easy', steps: [
      { title: 'Call or scan', text: 'Call 555-0147 or use the code by the door' }, { title: 'We cook', text: 'Fresh, never sitting under a lamp' },
      { title: 'Grab and go', text: 'Pickup window on the left' }], foot: 'Ready in about 20 minutes' } },

  { id: 'food-allergy-notice', name: 'Food allergies notice', cat: 'Restaurants', color: 'teal', tags: 'allergies,allergy,food safety,gluten,nuts,notice',
    recipe: 'note', palette: 'mint',
    o: { kick: 'Food allergies?', title: 'Please tell\nyour server', sub: 'Let us know before you order. Our kitchen will do its best to help you eat safely.',
      big: ['speech', ['$accent', '$paper']], foot: 'Thank you for telling us', art: [['sparkle', ['$accent2']], ['leaf', ['$accent']]] } },

  { id: 'food-private-dining', name: 'Private dining room', cat: 'Restaurants', color: 'brown', tags: 'private dining,party,events,group,celebration,private room',
    recipe: 'split', palette: 'espresso', fonts: 'elegant',
    o: { photo: true, kick: 'Private dining', title: 'Host your\nparty here', sub: 'Our private room seats up to 40 guests', foot: 'Ask for the manager',
      art: [['champagne', ['$accent', '$paper']], ['sparkle', ['$accent']], ['star', ['$accent2']]] } },

  { id: 'food-hall-directory', name: 'Food hall directory', cat: 'Restaurants', color: 'blue', tags: 'food hall,directory,vendors,stalls,food court,map',
    recipe: 'directory', palette: 'slate', fonts: 'modern',
    o: { kick: 'Welcome to', title: 'Dockside Food Hall', clock: true, rows: [
      ['Noodle Bar', 'Stall 1'], ['Taco Window', 'Stall 2'], ['Wood Fire Pizza', 'Stall 3'], ['Green Bowl', 'Stall 4'],
      ['Dumpling House', 'Stall 5'], ['Smoke and Bun', 'Stall 6'], ['Sweet Spot', 'Stall 7'], ['Coffee Corner', 'Stall 8'],
      ['Taproom', 'Stall 9'], ['Seating', 'Upstairs'], ['Restrooms', 'Back hall'], ['Exit and parking', 'North door']] } },

  { id: 'food-new-menu-cover', name: 'New menu magazine cover', cat: 'Restaurants', color: 'red', tags: 'new menu,magazine,seasonal,dishes,launch,restaurant',
    recipe: 'magazine', palette: 'ruby', fonts: 'elegant',
    o: { mast: 'TASTE', kick: 'New season menu', title: 'Fresh start,\nbold flavor', sub: 'Twelve new dishes from our kitchen',
      lines: ['Wood-fired mains', 'Garden plates', 'House-made desserts'], badge: 'New' } },

  { id: 'food-behind-the-kitchen', name: 'Behind the kitchen door', cat: 'Restaurants', color: 'yellow', tags: 'photos,kitchen,behind the scenes,chef,gallery,team',
    recipe: 'polaroids', palette: 'sunshine', fonts: 'handmade',
    o: { kick: 'Behind the kitchen door', title: 'How we cook', captions: ['Morning prep', 'Fresh pasta', 'Plating up'],
      art: [['cutlery', ['$ink2', '$accent']]] } },

  { id: 'food-kitchen-notes', name: 'Kitchen notes for staff', cat: 'Restaurants', color: 'brown', tags: 'staff,notes,kitchen,team,reminders,board',
    recipe: 'corkboard', palette: 'coral',
    o: { title: 'Kitchen notes', notes: ['Fish arrives at 10', 'New dessert today!', 'Team meal at 4', 'Great service last night'],
      sub: 'Thanks, team!', art: [['bowl'], ['pizza']] } },

  { id: 'food-thanksgiving-to-go', name: 'Thanksgiving to go', cat: 'Restaurants', color: 'orange', tags: 'thanksgiving,to go,turkey,holiday meal,order,november',
    when: { kind: 'nth', month: 11, nth: 4, weekday: 4, offset: -14, span: 15, label: 'Two weeks before Thanksgiving' },
    recipe: 'paper', palette: 'espresso', fonts: 'elegant',
    o: { land: 'hills', landCols: ['$accent2', '$accent', '$bg2'], kick: 'Order by Monday', title: 'Thanksgiving to go', tallTitle: 'Thanksgiving\nto go',
      sub: 'Turkey, sides and pie for six, ready to heat', art: [['pumpkin'], ['wheat'], ['leaves'], ['acorn'], ['maple', ['$accent']]],
      fx: ['leaves', { amount: 2, speed: 2 }] } },

  { id: 'food-valentines-dinner', name: 'Valentine\'s dinner for two', cat: 'Restaurants', color: 'pink', tags: 'valentine\'s day,dinner for two,date night,romantic,february,couples',
    when: { kind: 'year', month: 2, day: 1, span: 14, label: 'Early February' },
    recipe: 'arch', palette: 'blush', fonts: 'elegant',
    o: { kick: 'Valentine\'s Day', title: 'Dinner for two', sub: 'Three courses and a glass of bubbly, $79 for two', foot: 'Book a table',
      big: ['hearts'], art: [['heart', ['$accent']], ['champagne', ['$accent2', '$accent', '$accent2']], ['sparkle', ['$accent2']]],
      fx: ['hearts', { amount: 2, speed: 2 }] } },

  { id: 'food-mothers-day-brunch', name: 'Mother\'s Day brunch', cat: 'Restaurants', color: 'purple', tags: 'mother\'s day,brunch,mom,may,reservations,flowers',
    when: { kind: 'nth', month: 5, nth: 2, weekday: 0, offset: -10, span: 11, label: 'Before Mother\'s Day' },
    recipe: 'photo', palette: 'lavender', fonts: 'elegant',
    o: { kick: 'Mother\'s Day', title: 'Brunch\nfor Mom', sub: 'Seatings at 10, 12 and 2. A flower for every mom.', caption: 'Book early!', foot: 'Reserve a table',
      art: [['tulip'], ['flower'], ['sparkle', ['$accent']]] } },

  { id: 'food-now-hiring-crew', name: 'Now hiring kitchen crew', cat: 'Restaurants', color: 'green', tags: 'hiring,jobs,now hiring,careers,kitchen,staff',
    recipe: 'checklist', palette: 'forest', fonts: 'slab',
    o: { kick: 'Join our crew', title: 'Now hiring', sub: 'Flexible shifts, free meals and real training', items: ['Line cooks', 'Dishwashers', 'Servers', 'Hosts', 'Weekend bartender'],
      big: ['chefhat'], art: [['star', ['$accent']]] },
    tall: { art: [] } },

  { id: 'food-famous-no-7', name: 'Our famous No. 7', cat: 'Restaurants', color: 'black', tags: 'signature dish,sandwich,brisket,bbq,famous,lunch',
    recipe: 'swiss', palette: 'mono', fonts: 'poster',
    o: { num: 'No.7', kick: 'Our famous', title: 'Smoked brisket sandwich', sub: '14 hours in the smoker. Pickles, slaw and a soft bun.', foot: '$13 with fries',
      art: [['flame', ['$accent', '$accent2']]] } },

  { id: 'food-our-promise', name: 'Our promise', cat: 'Restaurants', color: 'green', tags: 'promise,values,fresh,local,quality,about us',
    recipe: 'bigtype', palette: 'citrus',
    o: { lines: ['FRESH', 'LOCAL', 'HONEST'], kick: 'Our promise', sub: 'Real food from real farms, cooked the slow way', art: [['seedling']] } },

  { id: 'food-now-delivering', name: 'Now delivering', cat: 'Restaurants', color: 'blue', tags: 'delivery,we deliver,order,takeout,home delivery,phone',
    recipe: 'ribbon', palette: 'ocean', fonts: 'slab',
    o: { kick: 'Good news', title: 'Now delivering', sub: 'Hot food to your door within 3 miles', foot: 'Call 555-0163',
      art: [['car', [], { motion: 'drift' }], ['pizza'], ['bowl'], ['burger']] } },

  { id: 'food-best-brunch-award', name: 'Voted best brunch', cat: 'Restaurants', color: 'gold', tags: 'award,best,brunch,voted,thank you,weekend',
    recipe: 'stamp', palette: 'sunshine', fonts: 'retro',
    o: { ring: 'Voted best brunch', center: 'No. 1', kick: 'Thank you, neighbors', title: 'Best brunch\nin town', sub: 'Three years in a row. We could not do it without you.',
      foot: 'Weekends 9 AM to 2 PM', art: [['pancakes'], ['coffee'], ['sparkle', ['$accent']]] } },

  { id: 'food-wing-night', name: 'Wing night', cat: 'Restaurants', color: 'coral', tags: 'wings,wing night,wednesday,weekly special,game night,deal',
    when: { kind: 'week', days: [3], label: 'Every Wednesday' },
    recipe: 'sunburst', palette: 'coral', fonts: 'poster',
    o: { kick: 'Every Wednesday', title: 'WING\nNIGHT', sub: '75 cent wings and ten sauces', foot: 'Dine in only',
      art: [['chili'], ['chili', [], { flip: true }], ['flame'], ['star', ['$accent']], ['sparkle']] } },

  { id: 'food-gift-card-bonus', name: 'Gift card bonus', cat: 'Restaurants', color: 'purple', tags: 'gift cards,gifts,holiday,bonus,christmas,prices',
    when: { kind: 'year', month: 11, day: 25, span: 31, label: 'Holiday gift season' },
    recipe: 'prices', palette: 'berry', fonts: 'glow',
    o: { kick: 'The gift everyone eats up', title: 'Gift cards', plans: [
      { name: 'Classic', price: '$25', per: 'gift card', lines: ['Any day, any dish'] },
      { name: 'Bonus', price: '$50', per: 'gift card', lines: ['Plus $10 for you'], hot: true, tag: 'Holiday deal' },
      { name: 'Feast', price: '$100', per: 'gift card', lines: ['Plus $25 for you'] }],
      fx: ['sparkles', { amount: 2, speed: 2 }] } },

  { id: 'food-new-years-eve-dinner', name: 'New Year\'s Eve dinner', cat: 'Restaurants', color: 'red', tags: 'new year\'s eve,dinner,reservations,december,celebration,party',
    when: { kind: 'year', month: 12, day: 10, span: 22, label: 'The weeks before New Year\'s Eve' },
    recipe: 'datestamp', palette: 'ruby', fonts: 'elegant',
    o: { month: 'Dec', day: '31', kick: 'Ring it in with us', title: 'New Year\'s Eve dinner', sub: 'Five courses, live piano and a toast at midnight', foot: 'Book now',
      art: [['champagne', ['$accent', '$paper', '$accent']], ['firework', ['$accent', '$accent2', '$paper']], ['star', ['$accent']]], fx: ['sparkles', { amount: 2, speed: 2 }] } },

  { id: 'food-serving-all-day', name: 'Serving all day', cat: 'Restaurants', color: 'blue', tags: 'hours,kitchen hours,breakfast,lunch,dinner,schedule',
    recipe: 'schedule', palette: 'slate', fonts: 'slab',
    o: { kick: 'Kitchen hours', title: 'Serving all day', sub: 'Come hungry any time', big: ['cutlery', ['$paperInk', '$accent']], rows: [
      ['7 AM', 'Breakfast', 'Until 11'], ['11 AM', 'Lunch', 'Until 3'], ['3 PM', 'Happy hour bites', 'Until 6'], ['5 PM', 'Dinner', 'Until 10'], ['10 PM', 'Late night menu', 'Until late']] } },

  { id: 'food-follow-our-kitchen', name: 'Follow our kitchen', cat: 'Restaurants', color: 'orange', tags: 'social media,follow us,online,specials,photos,video',
    recipe: 'social', palette: 'coral', fonts: 'friendly',
    o: { kick: 'Daily specials first', title: 'Follow our kitchen', handles: [['iconcamera', '@bayleafkitchen'], ['iconplay', 'Bay Leaf Kitchen'], ['iconchat', 'Text MENU to 555-0199']],
      big: ['chefhat', ['$paper', '$accent']] } },

  { id: 'food-new-dining-room', name: 'Our new dining room', cat: 'Restaurants', color: 'teal', tags: 'remodel,renovation,new look,dining room,before and after,reopening',
    recipe: 'beforeafter', palette: 'mint', fonts: 'elegant',
    o: { kick: 'We remodeled', title: 'Same food, new room', before: 'Before', after: 'After' } },

  { id: 'food-reopening-soon', name: 'Reopening soon', cat: 'Restaurants', color: 'navy', tags: 'reopening,countdown,coming soon,opening,doors open,restaurant',
    recipe: 'countdown', palette: 'midnight', fonts: 'poster',
    o: { kick: 'Fresh paint, same recipes', title: 'Reopening soon', label: 'Doors open in', done: 'We are open!', days: true, foot: 'Follow us for the big day',
      art: [['chefhat'], ['cutlery', ['$ink2', '$accent']], ['sparkle', ['$accent']], ['star', ['$accent2']]] } },

  { id: 'food-ramadan-nights', name: 'Ramadan nights', cat: 'Restaurants', color: 'green', tags: 'ramadan,iftar,suhoor,evening,dinner,ramadan hours',
    when: 'ramadan',
    recipe: 'timeline', palette: 'forest', fonts: 'elegant',
    o: { kick: 'Ramadan Kareem', title: 'Ramadan nights', steps: [
      { label: 'Sunset', text: 'Iftar with dates and lentil soup' }, { label: '8 PM', text: 'Family dinner platters' },
      { label: '10 PM', text: 'Tea and sweets' }, { label: '1 AM', text: 'Suhoor until 4' }],
      foot: 'Open late all month', back: [['pattern8', ['$accent'], { opacity: 18 }]], fx: ['stars', { amount: 2, speed: 2 }] } },

  // ===================================================================== Menus
  { id: 'food-menu-street-tacos', name: 'Street tacos menu', cat: 'Menus', color: 'yellow', tags: 'tacos,mexican,menu,street food,taqueria,lunch',
    recipe: 'dishes', palette: 'sunshine', fonts: 'slab',
    o: { kick: 'Taqueria Sol', title: 'Street tacos', dishes: [
      { name: 'Carnitas', note: 'Slow pork, onion, cilantro', price: '$4', art: ['taco'] },
      { name: 'Chile chicken', note: 'Charred salsa, lime crema', price: '$4', art: ['taco', ['#f4b942', '#e63946', '#ffd166']] },
      { name: 'Grilled veggie', note: 'Peppers, beans, cotija', price: '$3.50', art: ['taco', ['#f4b942', '#6ab04c', '#2b9348']] }] } },

  { id: 'food-menu-fresh-pasta', name: 'Fresh pasta menu', cat: 'Menus', color: 'black', tags: 'pasta,italian,menu,dinner,fresh,handmade',
    recipe: 'dishes', palette: 'mono', fonts: 'elegant',
    o: { kick: 'Rolled by hand this morning', title: 'Fresh pasta', dishes: [
      { name: 'Cacio e pepe', note: 'Pecorino and black pepper', price: '$16' },
      { name: 'Mushroom ragu', note: 'Wild mushrooms and thyme', price: '$18' },
      { name: 'Lemon ravioli', note: 'Ricotta and brown butter', price: '$19' }] } },

  { id: 'food-menu-set-menus', name: 'Set menus', cat: 'Menus', color: 'green', tags: 'set menu,prix fixe,courses,dinner,prices,lunch',
    recipe: 'prices', palette: 'citrus',
    o: { kick: 'Lunch and dinner', title: 'Set menus', plans: [
      { name: 'Two courses', price: '$24', per: 'per guest', lines: ['Starter and main', 'Or main and dessert'] },
      { name: 'Three courses', price: '$32', per: 'per guest', lines: ['Starter and main', 'Dessert', 'Coffee'], hot: true, tag: 'Chef\'s pick' },
      { name: 'Tasting', price: '$55', per: 'per guest', lines: ['Six small plates', 'Whole table'] }] } },

  { id: 'food-menu-tasting', name: 'Tasting menu', cat: 'Menus', color: 'red', tags: 'tasting menu,courses,fine dining,dinner,chef,wine pairing',
    recipe: 'timeline', palette: 'ruby', fonts: 'elegant',
    o: { kick: 'Tonight\'s tasting menu', title: 'Five courses', steps: [
      { label: 'Snack', text: 'Oyster, cucumber, dill' }, { label: 'Starter', text: 'Beets and goat cheese' },
      { label: 'Fish', text: 'Seared scallop, sweet corn' }, { label: 'Main', text: 'Lamb with rosemary' },
      { label: 'Sweet', text: 'Dark chocolate, sea salt' }],
      foot: '$68, wine pairing $35', back: [['grain', []]] } },

  { id: 'food-menu-build-a-bowl', name: 'Build your bowl', cat: 'Menus', color: 'green', tags: 'bowl,build your own,poke,salad,healthy,how to order',
    recipe: 'steps', palette: 'citrus', fonts: 'friendly',
    o: { kick: 'Your bowl, your way', title: 'Build your bowl', steps: [
      { title: 'Pick a base', text: 'Rice, greens or noodles' }, { title: 'Add a protein', text: 'Chicken, tofu or salmon' },
      { title: 'Top it off', text: 'Sauces, seeds and crunch' }], foot: 'Bowls from $11', back: [['dotsbg', ['$accent'], { opacity: 18 }]] } },

  { id: 'food-menu-weekly-specials', name: 'Specials all week', cat: 'Menus', color: 'purple', tags: 'weekly specials,daily specials,menu,deals,week,diner',
    recipe: 'schedule', palette: 'berry', fonts: 'slab',
    o: { kick: 'Corner Kitchen', title: 'Specials all week', sub: 'One great deal every day', big: ['calendar'], rows: [
      ['Mon', 'Meatball sub', '$9'], ['Tue', 'Taco plate', '$10'], ['Wed', 'Chicken pot pie', '$12'], ['Thu', 'Burger and a beer', '$14'],
      ['Fri', 'Fish and chips', '$13'], ['Sat', 'Brunch skillet', '$12'], ['Sun', 'Roast dinner', '$16']] } },

  { id: 'food-menu-sandwich-board', name: 'Sandwich board', cat: 'Menus', color: 'coral', tags: 'sandwiches,deli,menu,price list,lunch,subs',
    recipe: 'directory', palette: 'coral', fonts: 'poster',
    o: { kick: 'Made to order', title: 'Sandwich board', rows: [
      ['Turkey club', '$9.50'], ['BLT', '$8.50'], ['Italian hoagie', '$10.50'], ['Tuna melt', '$9'], ['Caprese', '$9'], ['Reuben', '$11'],
      ['Chicken pesto', '$10'], ['Egg salad', '$7.50'], ['Veggie hummus', '$8.50'], ['Grilled cheese', '$6.50'], ['Soup of the day', '$5'], ['Add chips', '$1.50']] } },

  { id: 'food-menu-fish-shack', name: 'Fresh off the boat', cat: 'Menus', color: 'blue', tags: 'seafood,fish,catch of the day,oysters,chowder,menu',
    recipe: 'infoboard', palette: 'ocean', fonts: 'slab',
    o: { kick: 'Harbor Fish Shack', title: 'Fresh off the boat', cards: [
      { label: 'Catch of the day', value: 'Wild halibut', art: ['lemon', ['#ffd60a', '#2b9348']] }, { label: 'Oysters', value: '$2 each', art: ['wine', ['#8d1d3b', '#ffffff']] },
      { label: 'Chowder', value: 'Clam and corn', art: ['bowl'] }],
      ticker: 'Prices change with the tide\nAsk what came in this morning\nFish tacos every Friday', label: 'Today' } },

  { id: 'food-menu-autumn', name: 'Autumn menu', cat: 'Menus', color: 'brown', tags: 'autumn,fall menu,seasonal,harvest,soup,new menu',
    when: { kind: 'year', month: 9, day: 22, span: 60, label: 'Fall' },
    recipe: 'magazine', palette: 'espresso', fonts: 'elegant',
    o: { mast: 'HARVEST', kick: 'Our autumn menu', title: 'Cozy plates\nare back', sub: 'Warm flavors from local farms', badge: 'Fall',
      lines: ['Butternut squash soup', 'Braised short rib', 'Apple crumble'], big: ['pumpkin'] } },

  { id: 'food-menu-kids', name: 'Kids menu', cat: 'Menus', color: 'purple', tags: 'kids menu,children,family,kids meals,menu,little ones',
    recipe: 'dishes', palette: 'lavender', fonts: 'friendly',
    o: { kick: 'For our little diners', title: 'Kids menu', dishes: [
      { name: 'Mini pizza', note: 'Cheese or pepperoni', price: '$6', art: ['pizza'] },
      { name: 'Mac and cheese', note: 'With apple slices', price: '$6', art: ['bowl', ['#ffc857', '#ffd166', '#6b4226']] },
      { name: 'Hot dog bites', note: 'With fries or fruit', price: '$6', art: ['hotdog'] }] } },

  { id: 'food-menu-under-seven', name: 'Nothing over $7', cat: 'Menus', color: 'navy', tags: 'cheap eats,value menu,lunch,deals,prices,budget',
    recipe: 'bigstats', palette: 'midnight', fonts: 'poster',
    o: { kick: 'Quick lunch, small price', title: 'Nothing over $7', stats: [
      { value: '$3', label: 'Street tacos', art: ['taco'] }, { value: '$5', label: 'Rice bowls', art: ['bowl'] },
      { value: '$7', label: 'Lunch plates', art: ['cutlery', ['$ink', '$accent']] }], foot: 'Weekdays 11 to 3' } },

  { id: 'food-menu-dish-of-the-day', name: 'Dish of the day', cat: 'Menus', color: 'pink', tags: 'dish of the day,special,ramen,noodles,today only,menu',
    recipe: 'diagonal', palette: 'berry', fonts: 'modern',
    o: { kick: 'Today only', title: 'Spicy miso ramen', sub: 'Pork broth, soft egg and chili oil', big: ['bowl', [], { motion: 'pulse' }], foot: '$14 while it lasts',
      art: [['chili'], ['lsparkle', ['$bg1']]] } },

  { id: 'food-menu-new-on-the-menu', name: 'New on the menu', cat: 'Menus', color: 'pink', tags: 'new item,new on the menu,chicken sandwich,launch,special,try it',
    recipe: 'banner', palette: 'blush', fonts: 'slab',
    o: { kick: 'New on the menu', title: 'Hot honey\nchicken', sub: 'Crispy chicken, hot honey and pickles on a toasted bun', foot: '$13 with fries',
      art: [['burger'], ['flame'], ['star', ['$accent2']]] } },

  { id: 'food-menu-fish-fry-friday', name: 'Fish fry Friday', cat: 'Menus', color: 'teal', tags: 'fish fry,friday,fish and chips,weekly special,cod,dinner',
    when: { kind: 'week', days: [5], label: 'Every Friday' },
    recipe: 'ticket', palette: 'mint', fonts: 'retro',
    o: { kick: 'Every Friday', title: 'Fish fry', sub: 'Beer-battered cod, fries, slaw and tartar sauce', stub: '$15', foot: 'Until we run out',
      art: [['lemon'], ['fries'], ['beer'], ['star', ['$accent']]] } },

  { id: 'food-menu-pizza', name: 'Pizza menu', cat: 'Menus', color: 'coral', tags: 'pizza,menu,pizzeria,italian,prices,slices',
    recipe: 'board', palette: 'coral', fonts: 'poster',
    o: { title: 'Pizza menu', sub: 'Hand-stretched dough, baked in a stone oven', mark: ['pizza', [], { motion: 'float' }], kind: 'menu',
      cfg: card(PIZZA, '2'), back: [['checker', ['$accent', '$bg1'], { opacity: 10 }]] },
    tall: { cfg: card(PIZZA, '1') } },

  { id: 'food-menu-weekend-brunch', name: 'Weekend brunch chalkboard', cat: 'Menus', color: 'green', tags: 'brunch,weekend,chalkboard,menu,pancakes,eggs',
    recipe: 'chalk', palette: 'forest',
    o: { title: 'Weekend brunch', sub: 'Saturdays and Sundays, 9 to 2', side: 'Bottomless\ncoffee $3', back: [['chalkboard', ['$bg1']]],
      art: [['lcoffee', ['$ink']], ['lsparkle', ['$accent']]],
      cfg: { items: '# Plates\n*Lemon ricotta pancakes | 12 | Berries and maple\nShakshuka | 13 | Two eggs, feta, toast\nChicken and waffles | 15\nVeggie hash | 11 | | vegan\n# Sides\nThick-cut bacon | 4\nFruit cup | 4\nCinnamon roll | 5' } },
    tall: { art: [['lcoffee', ['$ink']]] } },

  { id: 'food-menu-todays-plates', name: 'Today\'s plates', cat: 'Menus', color: 'teal', tags: 'photos,dishes,lunch,menu,plates,bowls',
    recipe: 'polaroids', palette: 'mint', fonts: 'handmade',
    o: { kick: 'Fresh from the pass', title: 'Today\'s plates', captions: ['Poke bowl, $13', 'Banh mi, $10', 'Pho, $12'], art: [['bowl']] } },

  { id: 'food-menu-early-bird', name: 'Early bird breakfast', cat: 'Menus', color: 'black', tags: 'breakfast,early bird,eggs,coffee,diner,morning',
    recipe: 'receipt', palette: 'mono', fonts: 'retro',
    o: { kick: 'Before 9 AM', title: 'Early bird\nbreakfast', sub: 'Up early? Breakfast is on sale.', shop: 'Sunny Side Diner', shopSub: 'Open at 6 AM',
      items: 'Two eggs any style | 4.50\nHash browns | 2.50\nToast and jam | 1.50\nBottomless coffee | 2.50', total: ['Early bird', '$8.99'], thanks: 'Rise and shine!',
      foot: 'Weekdays only', art: [['pancakes'], ['coffee']] } },

  { id: 'food-menu-family-meals', name: 'Family meals to go', cat: 'Menus', color: 'blue', tags: 'family meals,to go,takeout,dinner,feeds four,prices',
    recipe: 'prices', palette: 'slate', fonts: 'friendly',
    o: { kick: 'Dinner for the whole crew', title: 'Family meals', plans: [
      { name: 'Feeds 2', price: '$22', per: 'to go', lines: ['One main', 'Two sides'] },
      { name: 'Feeds 4', price: '$39', per: 'to go', lines: ['Two mains', 'Three sides', 'Cookies'], hot: true, tag: 'Most popular' },
      { name: 'Feeds 6', price: '$54', per: 'to go', lines: ['Three mains', 'Four sides', 'Cookies'] }] } },

  { id: 'food-menu-ask-about', name: 'We can make it your way', cat: 'Menus', color: 'teal', tags: 'gluten free,vegan,dietary,allergies,options,custom',
    recipe: 'checklist', palette: 'mint', fonts: 'modern',
    o: { kick: 'Just ask', title: 'Your way', sub: 'Our kitchen is happy to change most dishes', items: ['Gluten-free buns', 'Vegan swaps', 'Half portions', 'Mild or extra spicy', 'Sauce on the side'],
      big: ['speech', ['$accent', '$paper']] } },

  { id: 'food-menu-desserts', name: 'Dessert menu', cat: 'Menus', color: 'blue', tags: 'dessert,sweets,cake,gelato,menu,after dinner',
    recipe: 'dishes', palette: 'ocean', fonts: 'elegant',
    o: { kick: 'Save room', title: 'Sweet endings', dishes: [
      { name: 'Tiramisu', note: 'Espresso and mascarpone', price: '$8', art: ['cake', ['#f3e3c8', '#6b3e26', '#ffd166']] },
      { name: 'Lemon tart', note: 'Torched meringue', price: '$7', art: ['lemon'] },
      { name: 'Gelato', note: 'Three scoops, any flavors', price: '$6', art: ['icecream'] }] } },

  { id: 'food-menu-sushi-bar', name: 'Sushi bar menu', cat: 'Menus', color: 'navy', tags: 'sushi,japanese,rolls,menu,nigiri,dinner',
    recipe: 'board', palette: 'midnight', fonts: 'modern',
    o: { title: 'Sushi bar', sub: 'Rolled to order by Chef Ken', mark: ['lantern'], kind: 'menu',
      cfg: { title: '', subtitle: '', items: '# Rolls\n*Rainbow | 14 | Tuna, salmon, avocado\nSpicy tuna | 11 | | hot\nAvocado | 8 | | vegan\nTempura | 12 | Shrimp, cucumber\n# Nigiri, 2 pieces\nSalmon | 6\nTuna | 7\nYellowtail | 7\n# Sides\nMiso soup | 3\nSeaweed salad | 5\nEdamame | 4',
        currency: '$', columns: 'auto', leaders: true, showDesc: true, theme: 'clear', bg: 'none', font: 'geo', cText: '$ink', cAccent: '$accent' },
      back: [['mesh', ['$accent', '$bg2', '$accent2'], { opacity: 18 }]] } },

  { id: 'food-menu-lunar-new-year', name: 'Lunar New Year dishes', cat: 'Menus', color: 'red', tags: 'lunar new year,chinese new year,dumplings,noodles,festival,menu',
    when: 'lunar',
    recipe: 'dishes', palette: 'ruby', fonts: 'poster',
    o: { kick: 'Lunar New Year', title: 'Lucky dishes', dishes: [
      { name: 'Golden dumplings', note: 'For wealth in the new year', price: '$12' },
      { name: 'Long-life noodles', note: 'Never cut, for a long life', price: '$14' },
      { name: 'Whole steamed fish', note: 'For plenty all year', price: '$28' }],
      back: [['bokeh', ['$accent', '$accent2', '$paper'], { opacity: 28 }]], fx: ['sparkles', { amount: 2, speed: 2, colors: '#ffd166, #ff6b5e' }] } },

  { id: 'food-menu-july-4-cookout', name: 'Fourth of July cookout', cat: 'Menus', color: 'blue', tags: 'fourth of july,july 4,cookout,bbq,independence day,summer',
    when: { kind: 'year', month: 6, day: 28, span: 7, label: 'The week of July 4' },
    recipe: 'receipt', palette: 'slate', fonts: 'slab',
    o: { kick: 'Fourth of July', title: 'Cookout combo', sub: 'Everything you need for the backyard', shop: 'Stars and Grill', shopSub: 'Order by July 3',
      items: 'Smash burger | 9.00\nCorn on the cob | 3.00\nWatermelon slice | 2.00\nLemonade | 3.00', total: ['Combo price', '$14'], thanks: 'Happy Fourth!',
      foot: 'Pickup or dine in', art: [['firework', ['$accent', '#e63946', '$accent2']], ['watermelon']], fx: ['fireworks', { amount: 1, speed: 2 }] } },

  { id: 'food-menu-blue-plate', name: 'Blue plate special', cat: 'Menus', color: 'blue', tags: 'diner,blue plate special,meatloaf,comfort food,special,retro',
    recipe: 'marquee', palette: 'ocean',
    o: { kick: 'Today\'s', title: 'BLUE PLATE\nSPECIAL', sub: 'Meatloaf, mashed potatoes and gravy', foot: '$11 with pie', art: [['coffee'], ['pancakes']] } },

  { id: 'food-menu-lunch-special', name: 'Lunch special poster', cat: 'Menus', color: 'green', tags: 'lunch special,lunch,deal,bowl,weekday,poster',
    recipe: 'poster', palette: 'citrus',
    o: { kick: 'Weekdays 11 to 3', title: 'LUNCH\nSPECIAL', deal: 'ANY\nBOWL\n$9', sub: 'With a drink and a cookie', foot: 'Dine in or to go',
      art: [['bowl'], ['juice'], ['sparkles', ['$accent2', '$accent', '$accent2']]] } },

  { id: 'food-menu-plant-based', name: 'Plant-based picks', cat: 'Menus', color: 'green', tags: 'vegan,plant based,vegetarian,healthy,menu,green',
    recipe: 'features', palette: 'forest', fonts: 'friendly',
    o: { kick: 'Plant-based picks', title: 'Green and hearty', features: [
      { art: ['taco', ['#f4b942', '#6ab04c', '#2b9348']], title: 'Jackfruit tacos', text: 'Smoky and tender, $12' },
      { art: ['bowl', ['#2b9348', '#ffd166', '#6b4226']], title: 'Garden curry', text: 'Chickpeas, coconut, rice, $14' },
      { art: ['chili'], title: 'Cauliflower bites', text: 'Buffalo sauce and ranch, $9' }],
      foot: 'All vegan, all delicious' } },

  { id: 'food-menu-soup-season', name: 'Soup season', cat: 'Menus', color: 'brown', tags: 'soup,soup season,fall,winter,comfort food,bread bowl',
    when: { kind: 'year', month: 10, day: 15, span: 60, label: 'Soup season' },
    recipe: 'hero', palette: 'espresso',
    o: { kick: 'It is soup season', title: 'Soup\'s on!', sub: 'Four new soups, made fresh every morning', foot: 'Ask for a bread bowl',
      art: [['bowl'], ['bowl', ['$accent', '#ffd166', '#6b4226']], ['bread'], ['leaf'], ['maple', ['$accent2']], ['sparkle', ['$accent']]],
      back: [['grain', []]] } },

  { id: 'food-menu-burger-of-the-month', name: 'Burger of the month', cat: 'Menus', color: 'coral', tags: 'burger,burger of the month,special,monthly,bacon,menu',
    recipe: 'split', palette: 'coral', fonts: 'slab',
    o: { kick: 'Burger of the month', title: 'The\nSmokehouse', sub: 'Bacon jam, aged cheddar and crispy onions', foot: '$15 with fries', big: ['burger'],
      art: [['fries'], ['star', ['$accent']], ['sparkle', ['$accent2']]] } },

  { id: 'food-menu-holiday-feast', name: 'Holiday feast menu', cat: 'Menus', color: 'red', tags: 'christmas,holiday menu,december,feast,turkey,ham',
    when: 'christmasseason',
    recipe: 'banner', palette: 'ruby', fonts: 'elegant',
    o: { kick: 'Holiday menu', title: 'Holiday\nfeast', sub: 'Roast turkey, glazed ham and all the sides, all December', foot: 'Book your table',
      art: [['wreath'], ['ornament', [], { motion: 'swing' }], ['star', ['$accent']]], fx: ['snow', { amount: 2, speed: 2 }] } },

  { id: 'food-menu-allergen-guide', name: 'Allergen guide', cat: 'Menus', color: 'blue', tags: 'allergens,ingredients,allergies,nutrition,qr,menu',
    recipe: 'scan', palette: 'ocean',
    o: { kick: 'Allergies or diets?', title: 'Every ingredient,\nlisted', steps: ['Scan the code', 'Pick a dish', 'See its allergens'], foot: 'Still not sure? Ask us' } },

  { id: 'food-menu-shakes', name: 'Shakes and floats', cat: 'Menus', color: 'pink', tags: 'milkshakes,shakes,floats,ice cream,soda fountain,dessert',
    recipe: 'bigtype', palette: 'berry', fonts: 'retro',
    o: { lines: ['SHAKES', 'FLOATS', 'MALTS'], kick: 'Soda fountain', sub: 'Thick, cold and made with real ice cream, from $6', art: [['icecream']] },
    tall: { sub: 'Real ice cream, from $6' } },

  { id: 'food-menu-pancakes-all-day', name: 'Pancakes all day', cat: 'Menus', color: 'pink', tags: 'pancakes,breakfast all day,breakfast,brunch,diner,syrup',
    recipe: 'kids', palette: 'blush',
    o: { kick: 'Breakfast lovers', title: 'Pancakes\nall day!', sub: 'Breakfast is served from open to close', foot: 'Short stack $7',
      art: [['pancakes'], ['coffee'], ['juice'], ['star', ['$accent']], ['sparkle', ['$accent2']]] } },

  { id: 'food-menu-specials-notes', name: 'Specials on sticky notes', cat: 'Menus', color: 'yellow', tags: 'specials,today,soup,pie,sticky notes,board',
    recipe: 'corkboard', palette: 'sunshine',
    o: { title: 'Today\'s specials', notes: ['Soup: roasted tomato $6', 'Pie: sour cherry $5', 'Fish: grilled trout $17', 'Bread: warm rye $3'],
      sub: 'Ask us what else is new', art: [['bowl'], ['bread']] } },

  { id: 'food-menu-easter-brunch', name: 'Easter brunch', cat: 'Menus', color: 'green', tags: 'easter,brunch,buffet,spring,sunday,family',
    when: { kind: 'easter', offset: -7, span: 8, label: 'The week before Easter' },
    recipe: 'paper', palette: 'citrus', fonts: 'friendly',
    o: { kick: 'Easter Sunday', title: 'Easter brunch', sub: 'Buffet from 9 to 2. Kids under 6 eat free.',
      art: [['egg'], ['bunny'], ['tulip'], ['flower'], ['egg', ['#ffd166', '#ff8fab', '#bde0fe']]], fx: ['petals', { amount: 2, speed: 2 }] } },

  // ===================================================================== Cafes and bakeries
  { id: 'food-cafe-espresso-bar', name: 'Espresso bar', cat: 'Cafes and bakeries', color: 'brown', tags: 'coffee,espresso,latte,cafe,drinks,menu',
    recipe: 'dishes', palette: 'espresso', fonts: 'elegant',
    o: { kick: 'Pulled to order', title: 'Espresso bar', dishes: [
      { name: 'Oat latte', note: 'Double shot, silky oat milk', price: '$4.75', art: ['coffee'] },
      { name: 'Cortado', note: 'Equal parts espresso and milk', price: '$4', art: ['coffee', ['#ffffff', '#e2e8f0', '#a0522d']] },
      { name: 'Mocha', note: 'Dark chocolate, whipped cream', price: '$5.25', art: ['mug', ['$paperInk', '#ffffff', '#6b3e26']] }] } },

  { id: 'food-cafe-pastry-case', name: 'In the pastry case', cat: 'Cafes and bakeries', color: 'pink', tags: 'pastry,bakery,croissant,buns,fresh baked,morning',
    recipe: 'dishes', palette: 'blush', fonts: 'elegant',
    o: { kick: 'Baked before sunrise', title: 'In the pastry case', dishes: [
      { name: 'Almond croissant', note: 'Twice baked, extra flaky', price: '$4.25' },
      { name: 'Cardamom bun', note: 'Swedish style, pearl sugar', price: '$4.50' },
      { name: 'Pear galette', note: 'Rustic and buttery', price: '$5' }] } },

  { id: 'food-cafe-loyalty-card', name: 'Coffee club card', cat: 'Cafes and bakeries', color: 'green', tags: 'loyalty,rewards,stamp card,free coffee,coffee club,punch card',
    recipe: 'coupon', palette: 'mint', fonts: 'friendly',
    o: { kick: 'Coffee club', deal: 'FREE', title: 'Your 10th coffee', sub: 'Get a stamp with every drink. Ten stamps and the next one is on us.',
      code: 'Ask for a card', until: 'Cards never expire', foot: 'Thank you for coming back', art: [['coffee'], ['heart', ['$accent']]] } },

  { id: 'food-cafe-cold-brew', name: 'Cold brew is back', cat: 'Cafes and bakeries', color: 'blue', tags: 'cold brew,iced coffee,summer,coffee,drinks,cafe',
    when: { kind: 'year', month: 5, day: 15, span: 60, label: 'Late spring and summer' },
    recipe: 'diagonal', palette: 'ocean', fonts: 'poster',
    o: { kick: 'Hello, summer', title: 'Cold brew\nis back', sub: 'Slow steeped for 18 hours. Smooth and never bitter.', big: ['juice', ['#6b3e26', '#e0f2fe', '$accent2'], { motion: 'float' }],
      foot: '$4.75 any size', art: [['sun', [], { motion: 'spin' }], ['lsparkle', ['$bg1']]] } },

  { id: 'food-cafe-maple-latte', name: 'Maple oat latte', cat: 'Cafes and bakeries', color: 'orange', tags: 'fall drinks,latte,maple,autumn,seasonal,coffee',
    when: { kind: 'year', month: 9, day: 15, span: 60, label: 'Fall' },
    recipe: 'banner', palette: 'coral', fonts: 'elegant',
    o: { kick: 'Fall favorite', title: 'Maple oat\nlatte', sub: 'Real maple syrup, oat milk and a pinch of cinnamon', foot: 'Hot or iced',
      art: [['maple'], ['leaves'], ['coffee', [], { motion: 'float' }]], fx: ['leaves', { amount: 2, speed: 2 }] } },

  { id: 'food-cafe-winter-warmers', name: 'Winter warmers', cat: 'Cafes and bakeries', color: 'navy', tags: 'winter drinks,hot drinks,mocha,chai,cider,cozy',
    when: { kind: 'year', month: 12, day: 1, span: 60, label: 'December and January' },
    recipe: 'features', palette: 'midnight', fonts: 'elegant',
    o: { kick: 'Winter warmers', title: 'Something cozy', features: [
      { art: ['mug'], title: 'Peppermint mocha', text: 'Dark chocolate and candy cane, $5.50' },
      { art: ['teapot'], title: 'Spiced chai', text: 'Cinnamon, clove and ginger, $4.75' },
      { art: ['coffee', ['#ffffff', '#e2e8f0', '#c8553d']], title: 'Hot cider', text: 'Apple, orange peel, star anise, $4.25' }],
      fx: ['snow', { amount: 2, speed: 2 }] } },

  { id: 'food-cafe-order-ahead', name: 'Order ahead', cat: 'Cafes and bakeries', color: 'teal', tags: 'order ahead,mobile order,qr,skip the line,pickup,coffee',
    recipe: 'scan', palette: 'mint', fonts: 'modern',
    o: { kick: 'Skip the line', title: 'Order ahead', steps: ['Scan the code', 'Order and pay', 'Grab it from the shelf'], foot: 'Ready in about 5 minutes' } },

  { id: 'food-cafe-oven-times', name: 'Out of the oven', cat: 'Cafes and bakeries', color: 'yellow', tags: 'bakery,bread,oven,schedule,baking times,fresh bread',
    recipe: 'schedule', palette: 'sunshine', fonts: 'slab',
    o: { kick: 'Mill Lane Bakery', title: 'Out of the oven', sub: 'Come early for warm bread', big: ['bread'], rows: [
      ['6:30 AM', 'Sourdough loaves', 'Rack 1'], ['7 AM', 'Croissants', 'Rack 2'], ['8:30 AM', 'Cinnamon buns', 'Counter'],
      ['11 AM', 'Focaccia', 'Rack 1'], ['2 PM', 'Cookies', 'Counter'], ['4 PM', 'Baguettes', 'Rack 3']] } },

  { id: 'food-cafe-sourdough-story', name: 'Our 24-hour sourdough', cat: 'Cafes and bakeries', color: 'green', tags: 'sourdough,bread,bakery,how it is made,slow,artisan',
    recipe: 'timeline', palette: 'citrus', fonts: 'elegant',
    o: { kick: 'How we make it', title: 'Our 24-hour sourdough', steps: [
      { label: 'Day 1, 8 PM', text: 'Feed the starter' }, { label: 'Day 2, 7 AM', text: 'Mix and fold by hand' },
      { label: '11 AM', text: 'Shape every loaf' }, { label: '2 PM', text: 'Bake on hot stone' }], foot: 'Loaves out at 3 PM' },
    tall: { title: 'Our 24-hour\nsourdough' } },

  { id: 'food-cafe-cake-sizes', name: 'Celebration cakes', cat: 'Cafes and bakeries', color: 'purple', tags: 'cakes,birthday cake,celebration,prices,sizes,bakery',
    recipe: 'prices', palette: 'lavender', fonts: 'friendly',
    o: { kick: 'Celebration cakes', title: 'Pick your size', plans: [
      { name: '6 inch', price: '$32', per: 'serves 8', lines: ['Any flavor', 'Short message'] },
      { name: '8 inch', price: '$45', per: 'serves 14', lines: ['Any flavor', 'Fresh flowers', 'Your message'], hot: true, tag: 'Most loved' },
      { name: '10 inch', price: '$62', per: 'serves 22', lines: ['Two flavors', 'Fresh flowers', 'Your message'] }] } },

  { id: 'food-cafe-custom-cake', name: 'Custom cakes', cat: 'Cafes and bakeries', color: 'pink', tags: 'custom cake,order,birthday,wedding,how to order,bakery',
    recipe: 'steps', palette: 'berry', fonts: 'elegant',
    o: { kick: 'Dream it, we bake it', title: 'Custom cakes', steps: [
      { title: 'Pick a size', text: 'And your favorite flavor' }, { title: 'Share the design', text: 'Colors, words or a photo' },
      { title: 'Pick it up', text: 'Fresh on your big day' }], foot: 'Order 3 days ahead' } },

  { id: 'food-cafe-baristas', name: 'Your baristas', cat: 'Cafes and bakeries', color: 'coral', tags: 'baristas,team,staff,meet the team,coffee,cafe',
    recipe: 'team', palette: 'coral', fonts: 'retro',
    o: { kick: 'Say good morning to', title: 'Your baristas', people: [
      { name: 'June', role: 'Head barista' }, { name: 'Kai', role: 'Latte art' }, { name: 'Sofia', role: 'Baker' }, { name: 'Ben', role: 'Weekends' }] } },

  { id: 'food-cafe-latte-art', name: 'Latte art wall', cat: 'Cafes and bakeries', color: 'brown', tags: 'latte art,photos,coffee,baristas,gallery,cafe',
    recipe: 'polaroids', palette: 'espresso', fonts: 'friendly',
    o: { kick: 'Poured this week', title: 'Latte art wall', captions: ['Rosetta', 'Tulip', 'Swan'], art: [['coffee']] } },

  { id: 'food-cafe-bread-issue', name: 'The bread issue', cat: 'Cafes and bakeries', color: 'black', tags: 'bread,bakery,magazine,rye,focaccia,baguette',
    recipe: 'magazine', palette: 'mono', fonts: 'elegant',
    o: { mast: 'CRUMB', kick: 'This week at the bakery', title: 'The bread\nissue', sub: 'Slow loaves and long ferments', badge: 'Fresh',
      lines: ['Rye is back', 'Olive focaccia Fridays', 'Baguettes at 4 PM'], big: ['bread'] } },

  { id: 'food-cafe-in-numbers', name: 'Our cafe by the numbers', cat: 'Cafes and bakeries', color: 'green', tags: 'numbers,stats,coffee,tea,cafe,fun facts',
    recipe: 'bigstats', palette: 'forest', fonts: 'poster',
    o: { kick: 'Our little cafe', title: 'By the numbers', stats: [
      { value: '310', label: 'Cups a day', art: ['coffee'] }, { value: '9', label: 'Kinds of tea', art: ['teapot'] },
      { value: '1', label: 'Very old oven', art: ['bread'] }], foot: 'Thanks for being part of it' } },

  { id: 'food-cafe-info-board', name: 'Cafe info board', cat: 'Cafes and bakeries', color: 'blue', tags: 'wifi,cafe info,hours,info board,welcome,today',
    recipe: 'infoboard', palette: 'slate',
    o: { kick: 'Little Fern Cafe', title: 'Make yourself at home', cards: [
      { label: 'Wi-Fi', value: 'FernGuest', art: ['wifi'] }, { label: 'Bake of the day', value: 'Pear galette', art: ['croissant', ['#e9a23b', '#c47f1a', '#ffffff']] },
      { label: 'Open until', value: '7 PM', art: ['clock'] }],
      ticker: 'Ask for the Wi-Fi password at the counter\nOat, almond and soy milk at no extra charge\nPlease clear your table when you go', label: 'Hello' } },

  { id: 'food-cafe-new-bakery', name: 'Our new bakery', cat: 'Cafes and bakeries', color: 'green', tags: 'new location,moving,find us,bakery,map,grand opening',
    recipe: 'findus', palette: 'citrus', fonts: 'elegant',
    o: { kick: 'We are moving up the street', title: 'Our new bakery', address: ['27 Mill Lane', 'Next to the bookshop', 'Bike racks out front'],
      hours: 'Tuesday to Sunday, 7 AM to 3 PM', foot: 'Opening Saturday' } },

  { id: 'food-cafe-regular-review', name: 'Words from a regular', cat: 'Cafes and bakeries', color: 'purple', tags: 'review,testimonial,coffee,regulars,stars,cafe',
    recipe: 'testimonial', palette: 'lavender', fonts: 'elegant',
    o: { kick: 'From one of our regulars', quote: 'Best flat white in the city, and they always remember my name. My favorite part of the morning.',
      who: 'Jess L.', role: 'Comes in every weekday', foot: 'See you tomorrow, Jess!', art: [['coffee', ['#ffffff', '#e2e8f0', '$accent']]] } },

  { id: 'food-cafe-follow-the-bakery', name: 'Follow the bakery', cat: 'Cafes and bakeries', color: 'pink', tags: 'social media,follow us,bakery,online,sold out alerts,photos',
    recipe: 'social', palette: 'blush', fonts: 'friendly',
    o: { kick: 'New bakes and sold-out alerts', title: 'Follow the bakery', handles: [['iconcamera', '@millbakery'], ['iconplay', 'Mill Lane Bakery'], ['iconchat', 'Text BREAD to 555-0186']],
      big: ['croissant'] } },

  { id: 'food-cafe-acoustic-sundays', name: 'Acoustic Sundays', cat: 'Cafes and bakeries', color: 'navy', tags: 'live music,acoustic,open mic,sunday,cafe,event',
    recipe: 'gig', palette: 'midnight', fonts: 'glow',
    o: { title: 'Acoustic Sundays', day: 'Sunday', date: '14', month: 'April', lines: ['Live music with your latte', 'Local songwriters', 'Free, all ages'],
      strip: 'Mill Lane Cafe, 3 PM', art: [['guitar']] } },

  { id: 'food-cafe-latte-class', name: 'Latte art class', cat: 'Cafes and bakeries', color: 'purple', tags: 'class,latte art,workshop,barista,ticket,event',
    recipe: 'admit', palette: 'lavender', fonts: 'retro',
    o: { kick: 'Learn from our baristas', title: 'Latte art class', details: [['Date', 'Sat, May 9'], ['Time', '8 AM'], ['Spots', '8 only']],
      stubLabel: 'Spot', stub: '03', sub: 'Two hours and all the milk you can pour', foot: 'Sign up at the register', art: [['coffee'], ['heart', ['$accent']]] } },

  { id: 'food-cafe-tea-menu', name: 'Tea menu', cat: 'Cafes and bakeries', color: 'teal', tags: 'tea,tea menu,matcha,chai,boba,drinks',
    recipe: 'board', palette: 'mint', fonts: 'elegant',
    o: { title: 'Tea menu', sub: 'Loose leaf, steeped to order', mark: ['teapot', [], { motion: 'float' }], kind: 'menu',
      cfg: card(TEA, '2'), back: [['dotsbg', ['$accent'], { opacity: 15 }]] },
    tall: { cfg: card(TEA, '1') } },

  { id: 'food-cafe-dozen-donuts', name: 'Dozen donut Friday', cat: 'Cafes and bakeries', color: 'pink', tags: 'donuts,dozen,friday,deal,bakery,weekly special',
    when: { kind: 'week', days: [5], label: 'Every Friday' },
    recipe: 'swiss', palette: 'berry', fonts: 'poster',
    o: { num: '$12', kick: 'Every Friday', title: 'A dozen donuts', sub: 'Mix and match any flavors', foot: 'While they last', art: [['donut']] } },

  { id: 'food-cafe-stay-a-while', name: 'Stay a while', cat: 'Cafes and bakeries', color: 'blue', tags: 'wifi,work,study,cafe,refills,laptop friendly',
    recipe: 'features', palette: 'ocean', fonts: 'retro',
    o: { kick: 'Stay a while', title: 'Work, read, relax', features: [
      { art: ['wifi'], title: 'Free Wi-Fi', text: 'Fast and free all day' }, { art: ['plug'], title: 'Plugs everywhere', text: 'At almost every table' },
      { art: ['coffee'], title: '$1 refills', text: 'On drip coffee and tea' }], foot: 'Quiet hours 8 to 11 AM' } },

  { id: 'food-cafe-smoothies', name: 'Smoothie bar', cat: 'Cafes and bakeries', color: 'blue', tags: 'smoothies,juice,healthy,drinks,fruit,blended',
    recipe: 'dishes', palette: 'slate', fonts: 'friendly',
    o: { kick: 'Blended to order', title: 'Smoothie bar', dishes: [
      { name: 'Berry blast', note: 'Blueberry, banana, oat milk', price: '$7', art: ['juice', ['#7b2cbf', '#e0f2fe', '#06d6a0']] },
      { name: 'Green machine', note: 'Spinach, mango, ginger', price: '$7.50', art: ['juice', ['#2b9348', '#e0f2fe', '#ffd166']] },
      { name: 'Strawberry kiss', note: 'Strawberry, yogurt, honey', price: '$7', art: ['juice', ['#e63946', '#e0f2fe', '#06d6a0']] }] } },

  { id: 'food-cafe-bagel-combo', name: 'Bagel and coffee combo', cat: 'Cafes and bakeries', color: 'green', tags: 'bagel,breakfast,combo,coffee,morning,deal',
    recipe: 'receipt', palette: 'citrus', fonts: 'friendly',
    o: { kick: 'Morning combo', title: 'Bagel and coffee', sub: 'Your breakfast, sorted', shop: 'Little Fern Cafe', shopSub: 'Fresh bagels daily',
      items: 'Everything bagel | 3.25\nScallion cream cheese | 1.50\nDrip coffee | 2.75', total: ['Combo price', '$6.50'], thanks: 'Have a great day!',
      foot: 'Until 11 AM', art: [['donut', ['#d9a05b', '#c47f1a', '#ffffff']]] } },

  { id: 'food-cafe-cookie-of-the-week', name: 'Cookie of the week', cat: 'Cafes and bakeries', color: 'red', tags: 'cookie,cookie of the week,bakery,sweet,special,weekly',
    recipe: 'stamp', palette: 'ruby', fonts: 'slab',
    o: { ring: 'Cookie of the week', center: '$3', kick: 'Baked every hour', title: 'Brown butter\nsea salt', sub: 'Crispy edges and a gooey middle', foot: 'Grab one warm',
      art: [['coffee'], ['sparkle', ['$accent']], ['heart', ['$accent2']]] } },

  { id: 'food-cafe-closing-early', name: 'Closing early today', cat: 'Cafes and bakeries', color: 'blue', tags: 'closing early,hours,notice,closed,staff training,today',
    recipe: 'note', palette: 'slate',
    o: { kick: 'Heads up', title: 'Closing early\ntoday', sub: 'We close at 2 PM for staff training. See you tomorrow at 7!', big: ['clock'], foot: 'Thank you for understanding',
      art: [['coffee'], ['sparkle', ['$accent']]] } },

  { id: 'food-cafe-bring-your-cup', name: 'Bring your own cup', cat: 'Cafes and bakeries', color: 'green', tags: 'reusable cup,eco,green,discount,coffee,planet',
    recipe: 'split', palette: 'forest', fonts: 'friendly',
    o: { kick: 'Good for the planet', title: 'Bring your\nown cup', sub: 'Save 25 cents on any drink in your own mug', foot: 'Thank you!', big: ['mug', ['$accent', '#ffffff', '#6b3e26']],
      art: [['recycle'], ['leaf', ['$accent']], ['sparkle', ['$accent2']]] } },

  { id: 'food-cafe-community-board', name: 'Community board', cat: 'Cafes and bakeries', color: 'brown', tags: 'community,notice board,events,local,neighbors,cafe',
    recipe: 'corkboard', palette: 'ocean',
    o: { title: 'Community board', notes: ['Yoga in the park, Sat 9 AM', 'Guitar lessons: call 555-0182', 'Book swap shelf by the door', 'Lost: blue scarf, ask us'],
      sub: 'Pin your notes here', back: [['cork', []]], art: [['books'], ['guitar']] } },

  { id: 'food-cafe-breakfast-sandwich', name: 'Breakfast sandwiches', cat: 'Cafes and bakeries', color: 'coral', tags: 'breakfast sandwich,egg,bacon,avocado,morning,brioche',
    recipe: 'photo', palette: 'coral', fonts: 'slab',
    o: { kick: 'Hot off the griddle', title: 'Breakfast\nsandwiches', sub: 'Egg and cheddar with bacon or avocado on a brioche bun. $7.', caption: 'Made to order',
      foot: 'Served until 11 AM', art: [['coffee'], ['juice'], ['sparkle', ['$accent']]] } },

  { id: 'food-cafe-mothers-day-sweets', name: 'Mother\'s Day sweets', cat: 'Cafes and bakeries', color: 'yellow', tags: 'mother\'s day,cupcakes,gift box,preorder,mom,may',
    when: { kind: 'nth', month: 5, nth: 2, weekday: 0, offset: -10, span: 11, label: 'Before Mother\'s Day' },
    recipe: 'arch', palette: 'sunshine', fonts: 'elegant',
    o: { kick: 'For Mom', title: 'Sweets for\nsomeone sweet', sub: 'Flower cupcakes and gift boxes. Order by Friday.', foot: 'Preorder at the counter',
      big: ['cupcake'], art: [['tulip'], ['heart', ['$accent2']], ['sparkle', ['$accent']]] } },

  { id: 'food-cafe-spooky-treats', name: 'Spooky treats', cat: 'Cafes and bakeries', color: 'orange', tags: 'halloween,treats,cookies,cupcakes,october,kids',
    when: { kind: 'year', month: 10, day: 20, span: 12, label: 'Halloween week' },
    recipe: 'banner', palette: 'espresso', fonts: 'poster',
    o: { kick: 'Halloween week', title: 'Spooky\ntreats', sub: 'Ghost cookies, pumpkin muffins and witch hat cupcakes', foot: 'Free cookie in costume',
      art: [['ghost', [], { motion: 'float' }], ['jackolantern'], ['bat', ['$accent', '$bg1'], { motion: 'float' }]] } },

  { id: 'food-cafe-pie-preorders', name: 'Thanksgiving pie preorders', cat: 'Cafes and bakeries', color: 'yellow', tags: 'pie,thanksgiving,preorder,pumpkin pie,apple pie,november',
    when: { kind: 'nth', month: 11, nth: 4, weekday: 4, offset: -21, span: 21, label: 'Three weeks before Thanksgiving' },
    recipe: 'prices', palette: 'sunshine', fonts: 'elegant',
    o: { kick: 'Thanksgiving pies', title: 'Preorder your pie', plans: [
      { name: 'Pumpkin', price: '$22', per: '9 inch pie', lines: ['Spiced custard', 'Whipped cream'] },
      { name: 'Apple', price: '$24', per: '9 inch pie', lines: ['Crumb topping', 'Local apples'], hot: true, tag: 'Most loved' },
      { name: 'Pecan', price: '$26', per: '9 inch pie', lines: ['Brown butter', 'Toasted pecans'] }] } },

  { id: 'food-cafe-pan-de-muerto', name: 'Pan de muerto', cat: 'Cafes and bakeries', color: 'pink', tags: 'day of the dead,dia de muertos,pan de muerto,bakery,november,sweet bread',
    when: { kind: 'year', month: 10, day: 25, span: 9, label: 'Late October to November 2' },
    recipe: 'datestamp', palette: 'berry', fonts: 'elegant',
    o: { month: 'Nov', day: '2', kick: 'Day of the Dead', title: 'Pan de muerto', sub: 'Our sweet orange bread, baked only for the season', foot: 'Order by the dozen',
      art: [['candle'], ['marigold'], ['marigold', ['#ff4d8d', '#ffbf69', '#c9184a']]], fx: ['petals', { amount: 2, speed: 2, colors: '#ff9f1c, #ffbf69, #e85d04' }] } },

  // ===================================================================== Bars and nightlife
  { id: 'food-bar-signature-cocktails', name: 'Signature cocktails', cat: 'Bars and nightlife', color: 'purple', tags: 'cocktails,drinks,bar menu,mixology,signature,happy hour',
    recipe: 'dishes', palette: 'berry', fonts: 'elegant',
    o: { kick: 'Shaken and stirred to order', title: 'Signature cocktails', dishes: [
      { name: 'Old fashioned', note: 'Smoked, with maple and orange', price: '$14', art: ['cocktail', ['#b45309', '#e0f2fe', '#f97316']] },
      { name: 'Garden gimlet', note: 'Gin, cucumber, lime', price: '$12', art: ['cocktail', ['#a3e635', '#e0f2fe', '#65a30d']] },
      { name: 'Lavender fizz', note: 'Vodka, lemon, lavender', price: '$13', art: ['cocktail', ['#a78bfa', '#e0f2fe', '#fde68a']] }] } },

  { id: 'food-bar-zero-proof', name: 'Zero-proof drinks', cat: 'Bars and nightlife', color: 'teal', tags: 'mocktails,zero proof,alcohol free,sober curious,drinks,non alcoholic',
    recipe: 'features', palette: 'mint', fonts: 'modern',
    o: { kick: 'All the flavor, no alcohol', title: 'Zero-proof drinks', features: [
      { art: ['cocktail', ['#fb7185', '#e0f2fe', '#34d399']], title: 'Ginger spritz', text: 'Ginger, grapefruit and soda, $8' },
      { art: ['juice', ['#f97316', '#e0f2fe', '#34d399']], title: 'Sunset cooler', text: 'Mango, lime and mint, $7' },
      { art: ['beer', ['#fbbf24', '#ffffff', '#cbd5e1']], title: 'Craft NA beer', text: 'Hazy pale, crisp lager, $6' }],
      foot: 'Ask for the full list' } },

  { id: 'food-bar-on-tap', name: 'On tap today', cat: 'Bars and nightlife', color: 'yellow', tags: 'beer list,on tap,craft beer,draft,taproom,brewery',
    recipe: 'directory', palette: 'sunshine', fonts: 'slab',
    o: { kick: 'Pints $7, flights $12', title: 'On tap today', rows: [
      ['Harbor Haze IPA', '6.5%'], ['Golden Hour Lager', '4.8%'], ['Fox Den Red', '5.6%'], ['Night Owl Stout', '7.2%'], ['Orchard Cider', '5.2%'],
      ['Sunday Wheat', '5%'], ['Ridge Pale Ale', '5.4%'], ['Cherry Sour', '4.5%'], ['Dark Matter Porter', '6.8%'], ['Rotating guest tap', 'Ask us']] } },

  { id: 'food-bar-wine-flights', name: 'Wine flights', cat: 'Bars and nightlife', color: 'red', tags: 'wine,wine flight,tasting,wine bar,prices,red wine',
    recipe: 'prices', palette: 'ruby', fonts: 'elegant',
    o: { kick: 'Three pours, one table', title: 'Wine flights', plans: [
      { name: 'Whites', price: '$14', per: 'three pours', lines: ['Crisp and bright', 'Cheese pairing +$6'] },
      { name: 'Reds', price: '$16', per: 'three pours', lines: ['Bold and smooth', 'Cheese pairing +$6'], hot: true, tag: 'Most poured' },
      { name: 'Bubbles', price: '$18', per: 'three pours', lines: ['Dry to sweet', 'Cheese pairing +$6'] }] } },

  { id: 'food-bar-happy-hour-tab', name: 'Happy hour tab', cat: 'Bars and nightlife', color: 'purple', tags: 'happy hour,drink specials,deals,after work,bar,weekdays',
    when: { kind: 'week', days: [1, 2, 3, 4, 5], start: '15:00', end: '18:00', label: 'Weekdays 3 to 6 PM' },
    recipe: 'receipt', palette: 'berry', fonts: 'glow',
    o: { kick: 'Weekdays 4 to 6 PM', title: 'Happy hour', sub: 'Same great drinks, smaller tab', shop: 'The Brass Fox', shopSub: 'Bar and kitchen',
      items: 'Draft beer | 5.00\nHouse wine | 6.00\nWell drinks | 6.00\nWings | 8.00\nLoaded fries | 7.00', total: ['Save up to', '40%'], thanks: 'Cheers!',
      foot: 'At the bar and patio', art: [['beer'], ['lcocktail', ['$accent']]] } },

  { id: 'food-bar-music-bingo', name: 'Music bingo night', cat: 'Bars and nightlife', color: 'purple', tags: 'music bingo,bingo,game night,music,weekly,bar event',
    recipe: 'gig', palette: 'lavender', fonts: 'retro',
    o: { title: 'Music bingo', day: 'Tuesday', date: '7', month: 'May', lines: ['Name that tune, win a bar tab', 'Free cards, teams welcome', 'Three rounds from 8 PM'],
      strip: 'The Brass Fox, back room', art: [['music']] } },

  { id: 'food-bar-dj-lineup', name: 'Tonight\'s DJ lineup', cat: 'Bars and nightlife', color: 'navy', tags: 'dj,lineup,club,dance,saturday night,schedule',
    recipe: 'schedule', palette: 'midnight', fonts: 'glow',
    o: { kick: 'Saturday', title: 'Tonight\'s lineup', sub: 'Doors at 9. No cover before 10.', big: ['headphones', ['$paperInk', '$accent']], rows: [
      ['9 PM', 'DJ Lumen', 'Main room'], ['10:30 PM', 'Kira Vale', 'Rooftop'], ['Midnight', 'Nightshift', 'Main room'], ['1:30 AM', 'Last dance set', 'Rooftop']],
      back: [['starfield', ['$ink2', '$accent'], { opacity: 50 }]] } },

  { id: 'food-bar-game-day', name: 'Game day at the bar', cat: 'Bars and nightlife', color: 'green', tags: 'game day,sports bar,football,wings,watch the game,specials',
    recipe: 'infoboard', palette: 'citrus', fonts: 'slab',
    o: { kick: 'The Dugout Sports Bar', title: 'Game day', cards: [
      { label: 'Kickoff', value: '1 PM', art: ['football', ['#8b4513', '#ffffff']] }, { label: 'Wings', value: '50 cents', art: ['flame', ['#f77f00', '#ffd60a']] },
      { label: 'Screens', value: '14 big TVs', art: ['iconplay'] }],
      ticker: 'Pitchers $14 during every game\nReserve a booth at the bar\nSound on for the home team', label: 'Game on' } },

  { id: 'food-bar-watch-party', name: 'Big game watch party', cat: 'Bars and nightlife', color: 'blue', tags: 'watch party,big game,football,sunday,party,sports bar',
    when: { kind: 'nth', month: 2, nth: 2, weekday: 0, offset: -6, span: 7, label: 'Big game week (early February)' },
    recipe: 'banner', palette: 'ocean', fonts: 'slab',
    o: { kick: 'This Sunday', title: 'Watch\nparty', sub: 'Giant screen, free halftime chili and prizes every quarter', foot: 'Reserve a table',
      art: [['football'], ['trophy'], ['star', ['$accent']]], fx: ['confetti', { amount: 2, speed: 2 }] } },

  { id: 'food-bar-get-home-safe', name: 'Get home safe', cat: 'Bars and nightlife', color: 'navy', tags: 'ride home,designated driver,safe ride,taxi,responsible,last call',
    recipe: 'note', palette: 'midnight',
    o: { kick: 'Had a great night?', title: 'Get home safe', sub: 'Ask us to call you a ride. Free soft drinks for designated drivers.', big: ['car'], foot: 'We are happy to help',
      art: [['moon', [], { motion: 'float' }], ['star', ['$accent']]] } },

  { id: 'food-bar-id-check', name: 'We check ID', cat: 'Bars and nightlife', color: 'coral', tags: 'id,age check,21 and over,door,entry,policy',
    recipe: 'stamp', palette: 'coral', fonts: 'slab',
    o: { ring: 'We check ID', center: '21+', kick: 'At the door', title: 'Have your\nID ready', sub: 'We check everyone who looks under 40. Thank you!', foot: 'No ID, no entry',
      art: [['idcard'], ['check', ['$accent2']], ['star', ['$accent']]] } },

  { id: 'food-bar-last-call', name: 'Last call', cat: 'Bars and nightlife', color: 'black', tags: 'last call,closing time,bar,hours,final orders,night',
    recipe: 'swiss', palette: 'midnight', fonts: 'poster',
    o: { num: '1:30', kick: 'Heads up', title: 'Last call', sub: 'Final orders at 1:30 AM. Lights up at 2.', foot: 'Thanks for a great night', art: [['beer']] } },

  { id: 'food-bar-taproom-numbers', name: 'Our taproom', cat: 'Bars and nightlife', color: 'brown', tags: 'taproom,brewery,beer,numbers,craft beer,local',
    recipe: 'bigstats', palette: 'espresso', fonts: 'slab',
    o: { kick: 'Harbor Taproom', title: 'By the pint', stats: [
      { value: '24', label: 'Beers on tap', art: ['beer'] }, { value: '8', label: 'Local brewers', art: ['wheat'] },
      { value: '1', label: 'Big fireplace', art: ['flame'] }], foot: 'Flights every day' } },

  { id: 'food-bar-behind-the-bar', name: 'Behind the bar', cat: 'Bars and nightlife', color: 'purple', tags: 'bartenders,team,staff,meet the team,bar,cocktails',
    recipe: 'team', palette: 'berry', fonts: 'glow',
    o: { kick: 'Your hosts tonight', title: 'Behind the bar', people: [
      { name: 'Marco', role: 'Bar manager' }, { name: 'Ines', role: 'Head bartender' }, { name: 'Tobi', role: 'Cocktails' }, { name: 'Lea', role: 'Weekends' }] } },

  { id: 'food-bar-cocktail-class', name: 'Cocktail class', cat: 'Bars and nightlife', color: 'blue', tags: 'cocktail class,workshop,mixology,ticket,event,learn',
    recipe: 'admit', palette: 'ocean', fonts: 'elegant',
    o: { kick: 'Shake it like a pro', title: 'Cocktail class', details: [['Date', 'Thu, Oct 2'], ['Time', '7 PM'], ['Seats', '10 only']],
      stubLabel: 'Seat', stub: '10', sub: 'Make three classics and take the recipes home', foot: 'Tickets at the bar',
      art: [['cocktail'], ['lcocktail', ['$accent']]] } },

  { id: 'food-bar-whiskey-flight', name: 'Whiskey tasting flight', cat: 'Bars and nightlife', color: 'yellow', tags: 'whiskey,tasting,flight,bourbon,scotch,spirits',
    recipe: 'timeline', palette: 'sunshine', fonts: 'retro',
    o: { kick: 'Whiskey tasting', title: 'Four pours', steps: [
      { label: 'Pour 1', text: 'Light and grassy' }, { label: 'Pour 2', text: 'Sweet and smooth' },
      { label: 'Pour 3', text: 'Rich and spicy' }, { label: 'Pour 4', text: 'Big and smoky' }], foot: '$28 a flight' } },

  { id: 'food-bar-rooftop-review', name: 'Rooftop review', cat: 'Bars and nightlife', color: 'green', tags: 'review,testimonial,rooftop,bar,stars,guests',
    recipe: 'testimonial', palette: 'citrus', fonts: 'elegant',
    o: { kick: 'Overheard on the rooftop', quote: 'The best sunset in town, and the bartender remembered my drink after one visit.',
      who: 'Sam R.', role: 'Friday night regular', foot: 'Thank you, Sam!', art: [['cocktail']] } },

  { id: 'food-bar-tag-us', name: 'Tag us tonight', cat: 'Bars and nightlife', color: 'teal', tags: 'social media,tag us,photos,follow,hashtag,nightlife',
    recipe: 'social', palette: 'mint',
    o: { kick: 'Snap, post, tag', title: 'Tag us tonight', handles: [['iconcamera', '@thebrassfox'], ['iconhash', 'BrassFoxNights'], ['iconplay', 'The Brass Fox']],
      big: ['cocktail'] } },

  { id: 'food-bar-rooftop-find-us', name: 'Rooftop bar this way', cat: 'Bars and nightlife', color: 'blue', tags: 'rooftop,find us,directions,elevator,views,terrace',
    recipe: 'findus', palette: 'ocean', fonts: 'poster',
    o: { kick: 'Up on the roof', title: 'Rooftop bar', address: ['Take the elevator to floor 8', 'Turn left at the top', 'Heaters on cool nights'],
      hours: 'Open 4 PM to midnight', foot: 'Sunset views' } },

  { id: 'food-bar-st-patricks', name: 'St. Patrick\'s Day party', cat: 'Bars and nightlife', color: 'green', tags: 'st patrick\'s day,irish,green beer,party,march,pub',
    when: 'stpatrick',
    recipe: 'sunburst', palette: 'forest', fonts: 'slab',
    o: { kick: 'St. Patrick\'s Day', title: 'LUCK OF\nTHE PINT', sub: 'Live fiddle band from 6 PM', foot: 'Wear green',
      art: [['shamrock'], ['clover'], ['beer'], ['beer', [], { flip: true }], ['sparkle', ['$accent']]], fx: ['confetti', { amount: 2, speed: 2, colors: '#2b9348, #80b918, #ffd166' }] } },

  { id: 'food-bar-costume-party', name: 'Halloween costume party', cat: 'Bars and nightlife', color: 'orange', tags: 'halloween,costume party,october,party,contest,night',
    when: { kind: 'year', month: 10, day: 18, span: 14, label: 'Two weeks before Halloween' },
    recipe: 'gig', palette: 'espresso', fonts: 'glow',
    o: { title: 'Costume party', day: 'Halloween', date: '31', month: 'October', lines: ['Best costume wins $200', 'DJ and spooky cocktails', 'No cover in costume'],
      strip: 'Night Owl Tavern, 9 PM', art: [['jackolantern']], back: [['web', ['$ink2'], { opacity: 25 }]] } },

  { id: 'food-bar-nye-ticket', name: 'New Year\'s Eve party ticket', cat: 'Bars and nightlife', color: 'purple', tags: 'new year\'s eve,party,ticket,countdown,champagne,december',
    when: { kind: 'year', month: 12, day: 15, span: 17, label: 'Late December' },
    recipe: 'admit', palette: 'berry', fonts: 'poster',
    o: { kick: 'New Year\'s Eve', title: 'Midnight party', details: [['Date', 'Dec 31'], ['Doors', '9 PM'], ['Ticket', '$40']],
      stub: '200', sub: 'Live band, party favors and a toast at midnight', foot: 'Only 200 tickets',
      art: [['champagne'], ['firework', ['$accent', '$accent2', '$paper']]], fx: ['fireworks', { amount: 1, speed: 2 }] } },

  { id: 'food-bar-cinco-de-mayo', name: 'Cinco de Mayo fiesta', cat: 'Bars and nightlife', color: 'red', tags: 'cinco de mayo,fiesta,margaritas,tacos,may,party',
    when: { kind: 'year', month: 5, day: 1, span: 5, label: 'Early May' },
    recipe: 'poster', palette: 'ruby', fonts: 'slab',
    o: { kick: 'Cinco de Mayo', title: 'FIESTA!', deal: '$6\nMARGS', sub: 'Tacos, mariachi and margaritas all night', foot: 'From 4 PM',
      art: [['taco'], ['chili'], ['cocktail', ['#a3e635', '#e0f2fe', '#3f6212']]], back: [['papelpicado', ['$accent', '$accent2', '#ff4d8d'], { opacity: 14 }]] } },

  { id: 'food-bar-beer-fest', name: 'Fall beer fest', cat: 'Bars and nightlife', color: 'coral', tags: 'beer fest,fall,lager,pretzels,september,october',
    when: { kind: 'year', month: 9, day: 19, span: 16, label: 'Late September to early October' },
    recipe: 'ribbon', palette: 'coral', fonts: 'slab',
    o: { kick: 'Fall beer fest', title: 'Prost!', sub: 'Lagers, giant pretzels and a brass band every Saturday', foot: 'Steins $9',
      art: [['beer'], ['beer', [], { flip: true }], ['wheat'], ['bread']] } },

  { id: 'food-bar-comedy-night', name: 'Comedy night', cat: 'Bars and nightlife', color: 'red', tags: 'comedy,stand up,comedy night,show,live,bar event',
    when: { kind: 'week', days: [4], label: 'Every Thursday' },
    recipe: 'marquee', palette: 'ruby',
    o: { kick: 'Every Thursday', title: 'COMEDY\nNIGHT', sub: 'Five local comics, one very brave host', foot: '$10 at the door', art: [['mic'], ['star', ['$accent'], { motion: 'twinkle' }]] } },

  { id: 'food-bar-darts-league', name: 'Darts league', cat: 'Bars and nightlife', color: 'blue', tags: 'darts,league,teams,thursday,game night,sign up',
    recipe: 'steps', palette: 'slate', fonts: 'slab',
    o: { kick: 'Thursday nights', title: 'Darts league', steps: [
      { title: 'Sign up', text: 'Teams of four, any skill level' }, { title: 'Play weekly', text: 'Eight weeks, 7 PM sharp' },
      { title: 'Win big', text: 'A bar tab for the champs' }], foot: 'Sign up at the bar', back: [['rings2', ['$accent'], { opacity: 8 }]] } },

  { id: 'food-bar-industry-night', name: 'Industry night', cat: 'Bars and nightlife', color: 'blue', tags: 'industry night,hospitality,discount,monday,bartenders,servers',
    when: { kind: 'week', days: [1], label: 'Every Monday' },
    recipe: 'coupon', palette: 'slate', fonts: 'poster',
    o: { kick: 'Mondays after 10 PM', deal: '20% OFF', title: 'Industry night', sub: 'For bar and kitchen crews',
      code: 'Show your work badge', until: 'Every Monday', foot: 'You serve all week. Tonight we serve you.', art: [['beer'], ['cocktail']] } },

  { id: 'food-bar-love-potions', name: 'Valentine\'s cocktails', cat: 'Bars and nightlife', color: 'pink', tags: 'valentine\'s day,cocktails,date night,pink drinks,february,couples',
    when: { kind: 'year', month: 2, day: 7, span: 8, label: 'Valentine\'s week' },
    recipe: 'diagonal', palette: 'blush', fonts: 'elegant',
    o: { kick: 'Valentine\'s week', title: 'Love potions', sub: 'Three pink cocktails made for sharing, $12 each', big: ['cocktail', ['#ff4fa3', '#e0f2fe', '#ffd166'], { motion: 'pulse' }],
      foot: 'Cheers to love', art: [['heart'], ['lheart', ['$bg1']]], fx: ['hearts', { amount: 2, speed: 2 }] } },

  { id: 'food-bar-fireworks-rooftop', name: 'Fireworks from the roof', cat: 'Bars and nightlife', color: 'navy', tags: 'fourth of july,fireworks,rooftop,july 4,party,summer',
    when: { kind: 'year', month: 6, day: 28, span: 7, label: 'The week of July 4' },
    recipe: 'banner', palette: 'midnight', fonts: 'poster',
    o: { kick: 'Fourth of July', title: 'Fireworks\nfrom the roof', sub: 'Best view in town. Doors at 7, show at dark.', foot: 'Rooftop tickets $20',
      art: [['firework', ['#e63946', '#ffffff', '#60a5fa']], ['firework', ['#ffd166', '#ffffff', '#e63946']], ['star', ['#ffffff']]], fx: ['fireworks', { amount: 1, speed: 2 }] },
    tall: { title: 'Rooftop\nfireworks' } },

  { id: 'food-bar-house-rules', name: 'House rules', cat: 'Bars and nightlife', color: 'purple', tags: 'house rules,bar rules,policy,21 and over,respect,staff',
    recipe: 'checklist', palette: 'lavender', fonts: 'slab',
    o: { kick: 'Our house, our rules', title: 'House rules', items: ['Be kind to our staff', 'No outside drinks', '21+ after 9 PM', 'Tip your bartender', 'Have a great time'],
      big: ['beer'], art: [['star', ['$accent']]] },
    tall: { art: [] } },

  { id: 'food-bar-wine-wednesday', name: 'Wine Wednesday', cat: 'Bars and nightlife', color: 'red', tags: 'wine wednesday,wine,half price,bottles,weekly,wine bar',
    when: { kind: 'week', days: [3], label: 'Every Wednesday' },
    recipe: 'hero', palette: 'ruby', fonts: 'elegant',
    o: { kick: 'Every Wednesday', title: 'Wine\nWednesday', sub: 'Half-price bottles all night', foot: 'Cheese boards $12',
      art: [['wine'], ['wine', [], { flip: true }], ['champagne'], ['heart', ['$accent']], ['sparkle', ['$accent2']], ['star', ['$accent2']]] } },

  { id: 'food-bar-cocktail-issue', name: 'New cocktail menu cover', cat: 'Bars and nightlife', color: 'purple', tags: 'cocktail menu,new menu,magazine,drinks,local spirits,launch',
    recipe: 'magazine', palette: 'lavender', fonts: 'elegant',
    o: { mast: 'SPIRITS', kick: 'New cocktail menu', title: 'Shaken, stirred,\nlocal', sub: 'Twelve drinks made with local spirits', badge: 'New',
      lines: ['Smoked rosemary sour', 'Cucumber basil cooler', 'Espresso tonic'], big: ['cocktail'] } },

  { id: 'food-bar-beer-garden', name: 'Beer garden is open', cat: 'Bars and nightlife', color: 'green', tags: 'beer garden,outdoor,patio,summer,photos,open',
    recipe: 'polaroids', palette: 'forest', fonts: 'handmade',
    o: { kick: 'Now open', title: 'Beer garden', captions: ['Long tables', 'String lights', 'Cold pints'], art: [['beer']] } },

  { id: 'food-bar-split-the-check', name: 'Split the check', cat: 'Bars and nightlife', color: 'coral', tags: 'split the bill,pay,qr,check,groups,phone',
    recipe: 'scan', palette: 'coral', fonts: 'friendly',
    o: { kick: 'Out with friends?', title: 'Split the check', steps: ['Scan the code', 'Pick what you had', 'Pay your part'], foot: 'No math needed' } },

  { id: 'food-bar-quiz-leaderboard', name: 'Quiz night leaderboard', cat: 'Bars and nightlife', color: 'pink', tags: 'trivia,quiz night,leaderboard,scores,teams,pub quiz',
    recipe: 'directory', palette: 'blush', fonts: 'poster',
    o: { kick: 'After round four', title: 'Quiz leaderboard', rows: [
      ['1. Know-It-Ales', '48'], ['2. Quizzly Bears', '45'], ['3. Smarty Pints', '43'], ['4. Table Six', '39'], ['5. The Late Arrivals', '36'], ['6. Fact Hunters', '31'], ['7. Mind the Quiz', '28']] } }
];

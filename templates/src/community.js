// Community and travel: templates for places of worship, charities, public services, hotels and travel.
// See README.md in this folder for how a spec works. Every name, place, handle and phone number here is made up.
module.exports = [
  // ===================================================================== Worship
  { id: 'comm-this-week', name: 'This week at the center', cat: 'Worship', color: 'brown', tags: 'service times,schedule,worship,events,weekly,community',
    recipe: 'schedule', palette: 'espresso', fonts: 'elegant',
    o: { kick: 'Riverside Interfaith', title: 'This week', sub: 'Everyone is welcome at every gathering.', big: ['candle'],
      rows: [['Sun', 'Morning service', '10 AM, Main hall'], ['Sun', 'Family gathering', '4 PM, Garden room'], ['Tue', 'Study circle', '7 PM, Library'],
        ['Wed', 'Choir practice', '6:30 PM, Main hall'], ['Fri', 'Youth night', '7 PM, Hall B'], ['Sat', 'Food pantry', '10 AM, Side door']] } },

  { id: 'comm-all-welcome', name: 'Welcome, friends', cat: 'Worship', color: 'purple', tags: 'welcome,all are welcome,worship,visitors,new here,community',
    recipe: 'banner', palette: 'lavender', fonts: 'elegant',
    o: { kick: 'All are welcome', title: 'Welcome,\nfriends', sub: 'Coffee and tea in the hall after every service', foot: 'New here? Say hello!',
      art: [['heart', ['$accent2']], ['sparkle', ['$accent2'], { motion: 'twinkle' }], ['candle']] } },

  { id: 'comm-helping-hands', name: 'Helping hands needed', cat: 'Worship', color: 'yellow', tags: 'volunteers,sign up,helpers,worship,kitchen,childcare',
    recipe: 'corkboard', palette: 'sunshine', fonts: 'handmade',
    o: { title: 'Helping hands needed', notes: ['Greeters', 'Kitchen crew', 'Childcare', 'Music team'], sub: 'Sign up at the welcome table',
      art: [['hearthands'], ['raisedhand']] } },

  { id: 'comm-community-supper', name: 'Community supper', cat: 'Worship', color: 'green', tags: 'community meal,supper,free meal,worship,dinner,everyone welcome',
    recipe: 'dishes', palette: 'forest', fonts: 'elegant',
    o: { kick: 'Every Thursday at 6 PM', title: 'Community supper', sub: 'Free for everyone. Bring a friend.', dishes: [
      { name: 'Lentil soup', note: 'Warm and hearty', art: ['bowl'] },
      { name: 'Fresh bread', note: 'Baked this morning', art: ['bread'] },
      { name: 'Apple crisp', note: 'With cream or custard', art: ['apple'] }] } },

  { id: 'comm-giving-at-work', name: 'Your giving at work', cat: 'Worship', color: 'red', tags: 'giving,donations,thank you,impact,stats,community',
    recipe: 'bigstats', palette: 'ruby', fonts: 'elegant',
    o: { kick: 'Your giving at work', title: 'Thank you', stats: [{ value: '1,200', label: 'Meals served', art: ['foodbox'] },
      { value: '48', label: 'Families helped', art: ['hearthands'] }, { value: '310', label: 'Warm coats given', art: ['heart', ['$accent2']] }], foot: 'Every gift matters' } },

  { id: 'comm-retreat-day', name: 'A day of quiet retreat', cat: 'Worship', color: 'teal', tags: 'retreat,reflection,schedule,spiritual,quiet day,worship',
    recipe: 'timeline', palette: 'mint', fonts: 'elegant',
    o: { kick: 'Spring retreat', title: 'A day of quiet', steps: [{ label: '9 AM', text: 'Welcome and tea' }, { label: '10 AM', text: 'Quiet reflection' },
      { label: '12 PM', text: 'Shared lunch' }, { label: '2 PM', text: 'Garden walk' }, { label: '4 PM', text: 'Closing circle' }], foot: 'All are welcome' } },

  { id: 'comm-evening-of-song', name: 'An evening of song', cat: 'Worship', color: 'navy', tags: 'choir,concert,music,worship,free event,evening',
    recipe: 'gig', palette: 'midnight', fonts: 'elegant',
    o: { title: 'An Evening of Song', day: 'Sunday', date: '16', month: 'March', lines: ['Community choir and friends', 'Free entry, all ages', 'Tea and cake after'],
      strip: 'Riverside Interfaith Center, 6 PM', art: [['music', [], { motion: 'float' }]] } },

  { id: 'comm-youth-night', name: 'Youth night', cat: 'Worship', color: 'green', tags: 'youth group,teens,friday night,games,worship,young people',
    recipe: 'kids', palette: 'citrus', fonts: 'friendly',
    o: { kick: 'Ages 11 to 17', title: 'Youth night', sub: 'Games, snacks and good talks every Friday', foot: '7 to 9 PM in Hall B',
      art: [['pizza'], ['music'], ['dice'], ['star', [], { motion: 'twinkle' }]] } },

  { id: 'comm-interfaith-evening', name: 'Interfaith evening', cat: 'Worship', color: 'purple', tags: 'interfaith,many faiths,community,dinner,neighbors,worship',
    recipe: 'hero', palette: 'berry', fonts: 'elegant',
    o: { kick: 'Interfaith evening', title: 'Many faiths,\none community', sub: 'Share a meal and stories with neighbors of every faith', foot: 'Thursday, 6:30 PM',
      art: [['dove'], ['hearthands'], ['candle'], ['lotus'], ['sparkle', [], { motion: 'twinkle' }], ['star', ['$accent2']]] } },

  { id: 'comm-prayer-care', name: 'Prayer and care', cat: 'Worship', color: 'blue', tags: 'prayer requests,care,support,worship,kindness,community',
    recipe: 'note', palette: 'slate', fonts: 'elegant',
    o: { kick: 'Prayer and care', title: 'We hold you close', sub: 'Write a name in the book by the door. Every request is held with care.', big: ['hearthands'],
      foot: 'Kept private and kind' } },

  { id: 'comm-ramadan-nights', name: 'Ramadan Mubarak', cat: 'Worship', color: 'green', tags: 'ramadan,iftar,mosque,prayers,ramadan mubarak,islamic',
    when: 'ramadan', recipe: 'arch', palette: 'forest', fonts: 'elegant',
    o: { kick: 'Ramadan Mubarak', title: 'Blessed nights', sub: 'Iftar at sunset and evening prayers every night this month', foot: 'All are welcome',
      big: ['fanous', [], { motion: 'swing' }], art: [['crescent'], ['star', [], { motion: 'twinkle' }], ['sparkle']],
      back: [['pattern8', ['$accent'], { opacity: 8 }]], fx: ['stars', { amount: 2, speed: 1 }] } },

  { id: 'comm-eid-mubarak', name: 'Eid Mubarak', cat: 'Worship', color: 'red', tags: 'eid,eid al-fitr,eid mubarak,mosque,celebration,islamic',
    when: 'eidfitr', recipe: 'sunburst', palette: 'ruby', fonts: 'elegant',
    o: { kick: 'From all of us', title: 'Eid Mubarak', sub: 'Eid prayer at 8:30 AM', foot: 'Breakfast in the hall after',
      art: [['crescent'], ['fanous'], ['star'], ['star'], ['sparkle']], fx: ['sparkles', { amount: 2, speed: 2 }] } },

  { id: 'comm-eid-al-adha', name: 'Eid al-Adha Mubarak', cat: 'Worship', color: 'teal', tags: 'eid al-adha,eid,mosque,sharing,celebration,islamic',
    when: 'eidadha', recipe: 'diagonal', palette: 'mint', fonts: 'elegant',
    o: { kick: 'Eid al-Adha Mubarak', title: 'Share the joy', sub: 'Eid prayer at 8 AM, then a shared meal for neighbors in need', foot: 'Families welcome',
      big: ['domes'], art: [['crescent', ['$accent2', '$paper']], ['star', ['$accent2'], { motion: 'twinkle' }]] } },

  { id: 'comm-easter-sunrise', name: 'Easter sunrise service', cat: 'Worship', color: 'pink', tags: 'easter,sunrise service,church,spring,egg hunt,worship',
    when: 'easter', recipe: 'paper', palette: 'blush', fonts: 'friendly',
    o: { land: 'hills', landCols: ['#2b9348', '#55a630', '#aacc00'], kick: 'Easter Sunday', title: 'Sunrise service', sub: 'In the garden at 7 AM',
      art: [['sun', [], { motion: 'spin' }], ['butterfly'], ['tulip'], ['egg'], ['flower']] } },

  { id: 'comm-christmas-eve', name: 'Christmas Eve candlelight', cat: 'Worship', color: 'navy', tags: 'christmas eve,candlelight,carols,church,christmas,worship',
    when: 'christmaseve', recipe: 'hero', palette: 'midnight', fonts: 'elegant',
    o: { kick: 'Christmas Eve', title: 'Candlelight service', sub: 'Carols at 6 PM, candlelight service at 7 PM', foot: 'Everyone is welcome',
      art: [['candle'], ['star', [], { motion: 'twinkle' }], ['ornament', [], { motion: 'swing' }], ['pine'], ['sparkle'], ['candle']], fx: ['snow', { amount: 2, speed: 1 }] } },

  { id: 'comm-yom-kippur', name: 'Yom Kippur services', cat: 'Worship', color: 'blue', tags: 'yom kippur,synagogue,services,jewish,high holy days,reflection',
    when: 'yomkippur', recipe: 'timeline', palette: 'ocean', fonts: 'elegant',
    o: { kick: 'Yom Kippur', title: 'A day of reflection', steps: [{ label: 'Evening', text: 'Kol Nidre' }, { label: 'Morning', text: 'Morning service' },
      { label: 'Afternoon', text: 'Study and rest' }, { label: 'Sunset', text: 'Closing service' }], foot: 'Wishing you an easy fast' } },

  { id: 'comm-shabbat-shalom', name: 'Shabbat Shalom', cat: 'Worship', color: 'brown', tags: 'shabbat,friday,synagogue,candles,dinner,jewish',
    when: { kind: 'week', days: [5], label: 'Fridays' }, recipe: 'split', palette: 'espresso', fonts: 'elegant',
    o: { kick: 'Every Friday evening', title: 'Shabbat Shalom', sub: 'Candle lighting at sundown, then a service and a shared dinner', foot: 'Guests always welcome',
      big: ['candle'], art: [['star', ['$accent'], { motion: 'twinkle' }], ['sparkle', ['$accent']]] } },

  { id: 'comm-temple-hours', name: 'Temple hours', cat: 'Worship', color: 'yellow', tags: 'temple,hours,darshan,aarti,hindu,notices',
    recipe: 'infoboard', palette: 'sunshine',
    o: { kick: 'Hilltop Hindu Temple', title: 'Temple hours', cards: [
      { label: 'Morning darshan', value: '7 to 11 AM', art: ['sun', ['$paper', '$bg2']] },
      { label: 'Evening darshan', value: '5 to 8 PM', art: ['moon'] },
      { label: 'Aarti', value: '7 PM daily', art: ['diya', ['$bg1', '$paper', '$accent2']] }],
      ticker: 'Please leave your shoes at the entrance\nSunday community lunch at noon\nFestival helpers, sign up at the office', label: 'Notices' } },

  { id: 'comm-langar', name: 'Langar for all', cat: 'Worship', color: 'coral', tags: 'langar,gurdwara,free meal,community kitchen,sikh,volunteer',
    recipe: 'features', palette: 'coral', fonts: 'friendly',
    o: { kick: 'Oak Valley Gurdwara', title: 'Langar for all', features: [
      { art: ['bowl'], title: 'Free meal', text: 'Served every day at noon' },
      { art: ['hearthands'], title: 'All welcome', text: 'Everyone eats together' },
      { art: ['raisedhand'], title: 'Lend a hand', text: 'Help us cook or serve' }], foot: 'Please cover your head inside' } },

  { id: 'comm-sunday-sitting', name: 'Sunday meditation', cat: 'Worship', color: 'black', tags: 'meditation,buddhist,sitting,beginners,calm,sunday',
    recipe: 'stamp', palette: 'mono', fonts: 'elegant',
    o: { ring: 'Sit with us', center: '9 AM', kick: 'Lotus Path Meditation Center', kickStyle: { font: 'geo', weight: '700', caps: true, spacing: 3 }, title: 'Sunday sitting', sub: 'Beginners welcome. Cushions and tea are ready for you.',
      foot: 'Free, donations welcome', art: [['lotus'], ['candle'], ['leaf']] } },

  { id: 'comm-join-online', name: 'Join us online', cat: 'Worship', color: 'blue', tags: 'livestream,online,services,watch,social media,worship',
    recipe: 'social', palette: 'slate', fonts: 'modern',
    o: { kick: 'Can\'t make it in?', title: 'Join us online', handles: [['iconplay', 'Live every Sunday at 10'], ['iconcamera', '@riversideinterfaith'], ['iconmail', 'Weekly news by email'],
      ['iconchat', 'Prayer and care line']], big: ['laptop'] } },

  { id: 'comm-new-here', name: 'First time here?', cat: 'Worship', color: 'coral', tags: 'new here,visitors,welcome,first visit,worship,guests',
    recipe: 'steps', palette: 'coral', fonts: 'friendly',
    o: { kick: 'First time here?', title: 'Welcome in', steps: [{ title: 'Grab a coffee', text: 'At the table by the door' }, { title: 'Sit anywhere', text: 'There are no saved seats' },
      { title: 'Say hello', text: 'We would love to meet you' }], foot: 'Kids corner at the back' } },

  { id: 'comm-member-words', name: 'Why I come here', cat: 'Worship', color: 'pink', tags: 'testimonial,members,community,belonging,worship,family',
    recipe: 'testimonial', palette: 'blush', fonts: 'elegant',
    o: { kick: 'Why I come here', quote: 'I came for the music and stayed for the people. This place feels like family.', who: 'Ruth A.', role: 'Member for ten years',
      foot: 'You belong here too', art: [['heart', ['$accent']]] } },

  // ===================================================================== Charity and fundraising
  { id: 'comm-give-in-seconds', name: 'Give in seconds', cat: 'Charity and fundraising', color: 'coral', tags: 'donate,qr,scan,food bank,giving,charity',
    recipe: 'scan', palette: 'coral', fonts: 'friendly',
    o: { kick: 'Harbor Light Food Bank', title: 'Give in seconds', steps: ['Open your phone camera', 'Scan the code', 'Pick any amount'], codeLabel: 'Scan to donate',
      foot: '$25 feeds a family for a week' } },

  { id: 'comm-spring-gala', name: 'Spring gala ticket', cat: 'Charity and fundraising', color: 'purple', tags: 'gala,fundraiser,ticket,dinner,auction,charity event',
    recipe: 'admit', palette: 'berry',
    o: { kick: 'Bright Futures Fund', title: 'Spring Gala', admit: 'Admit one', details: [['Date', 'April 26'], ['Time', '6:30 PM'], ['Place', 'Grand hall']],
      sub: 'Dinner, music and a silent auction for local schools', stub: '088', stubLabel: 'Table', foot: 'Black tie optional',
      art: [['champagne'], ['star', ['$accent2'], { motion: 'twinkle' }]] } },

  { id: 'comm-silent-auction', name: 'Silent auction', cat: 'Charity and fundraising', color: 'brown', tags: 'silent auction,bids,fundraiser,gala,prizes,charity',
    recipe: 'dishes', palette: 'espresso', fonts: 'elegant',
    o: { kick: 'Silent auction', title: 'Bid to give', dishes: [
      { name: 'Lakeside weekend', note: 'Two nights for two', price: 'From $200', art: ['suitcase'] },
      { name: 'Cooking class', note: 'For two, with dinner', price: 'From $80', art: ['chefhat'] },
      { name: 'Signed guitar', note: 'From a local band', price: 'From $150', art: ['guitar'] }] } },

  { id: 'comm-bake-sale', name: 'Bake sale receipt', cat: 'Charity and fundraising', color: 'pink', tags: 'bake sale,fundraiser,treats,cookies,charity,shelter',
    recipe: 'receipt', palette: 'blush', fonts: 'handmade',
    o: { kick: 'Bake sale', title: 'Treats for a cause', sub: 'Every penny goes to the animal shelter', shop: 'Hope Street Bake Sale', shopSub: 'Saturday at the library',
      items: 'Brownie | 2.00\nThree cookies | 2.00\nLemon bar | 2.50\nBanana bread | 3.00', total: ['All four', '$9.50'], thanks: 'Thank you!', foot: 'Saturday, 9 AM to noon',
      art: [['cupcake'], ['donut']] } },

  { id: 'comm-volunteers-needed', name: 'Volunteers needed', cat: 'Charity and fundraising', color: 'green', tags: 'volunteer,food bank,help,sign up,community,charity',
    recipe: 'banner', palette: 'citrus', fonts: 'slab',
    o: { kick: 'Join us', title: 'Volunteers\nneeded', sub: 'Sort food, pack boxes and meet great people', foot: 'Saturdays, 9 AM to noon',
      art: [['hearthands'], ['foodbox'], ['raisedhand']] } },

  { id: 'comm-food-drive-needs', name: 'Food drive wish list', cat: 'Charity and fundraising', color: 'teal', tags: 'food drive,donations,wish list,pantry,canned food,charity',
    recipe: 'checklist', palette: 'mint', fonts: 'friendly',
    o: { kick: 'Food drive', title: 'What we need', items: ['Canned beans and soup', 'Pasta and rice', 'Peanut butter', 'Breakfast cereal', 'Diapers and wipes'], done: 0,
      big: ['foodbox'] } },

  { id: 'comm-coat-drive', name: 'Coat drive', cat: 'Charity and fundraising', color: 'blue', tags: 'coat drive,winter,donations,warm clothes,charity,giving',
    when: { kind: 'year', month: 11, day: 1, span: 45, label: 'Coat drive season' }, recipe: 'diagonal', palette: 'ocean', fonts: 'poster',
    o: { kick: 'Warm a neighbor', title: 'Coat drive', sub: 'Drop off clean coats, hats and gloves in the lobby bin', foot: 'Until December 15',
      big: ['snowflake', ['$accent', '$bg2']], art: [['heart', ['$accent2']], ['snowflake', ['$accent']]], fx: ['snow', { amount: 2, speed: 2 }] } },

  { id: 'comm-toy-drive', name: 'Holiday toy drive', cat: 'Charity and fundraising', color: 'red', tags: 'toy drive,christmas,holidays,donations,kids,giving',
    when: 'christmasseason', recipe: 'marquee', palette: 'ruby', fonts: 'poster',
    o: { kick: 'Holiday toy drive', title: 'Give a gift', sub: 'New, unwrapped toys, please', foot: 'Until December 20',
      art: [['gift', [], { motion: 'swing' }], ['teddy']] } },

  { id: 'comm-our-sponsors', name: 'Thank you, sponsors', cat: 'Charity and fundraising', color: 'blue', tags: 'sponsors,thank you,partners,donors,fundraiser,charity',
    recipe: 'directory', palette: 'slate', fonts: 'elegant',
    o: { kick: 'Thank you to', title: 'Our sponsors', rows: [['Northwind Bakery', 'Gold'], ['Cedar and Pine Law', 'Gold'], ['Bluebird Pediatrics', 'Silver'], ['Harbor Cycles', 'Silver'],
      ['Maple Lane Books', 'Silver'], ['Sunny Side Diner', 'Friend'], ['Fern and Co. Florist', 'Friend'], ['Lakeside Rec Center', 'Friend']] } },

  { id: 'comm-campaign-month', name: 'Campaign month plan', cat: 'Charity and fundraising', color: 'yellow', tags: 'campaign,fundraiser,schedule,books,kids,events',
    recipe: 'timeline', palette: 'sunshine', fonts: 'slab',
    o: { kick: 'Read for Kids campaign', title: 'Our big month', steps: [{ label: 'Week 1', text: 'Kickoff party' }, { label: 'Week 2', text: 'Book drive' },
      { label: 'Week 3', text: 'Read-a-thon' }, { label: 'Week 4', text: 'Big picnic' }], foot: 'Everyone can help' } },

  { id: 'comm-round-up', name: 'Round up at the register', cat: 'Charity and fundraising', color: 'purple', tags: 'round up,donate,checkout,giving,kids,charity',
    recipe: 'coupon', palette: 'lavender',
    o: { kick: 'At the register', deal: 'ROUND UP', title: 'For local kids', sub: 'Round up your total to the next dollar', code: 'Every cent helps', until: 'All month long',
      foot: 'Thank you for giving', art: [['coins'], ['heart', ['$accent'], { motion: 'pulse' }]] } },

  { id: 'comm-walk-for-hope', name: 'Walk for Hope', cat: 'Charity and fundraising', color: 'coral', tags: 'charity walk,awareness,fundraiser,walkathon,teams,community',
    recipe: 'gig', palette: 'coral', fonts: 'slab',
    o: { title: 'Walk for Hope', day: 'Sunday', date: '21', month: 'September', lines: ['3 miles around Lake Park', 'Teams, families and dogs welcome', 'Free T-shirt for every walker'],
      strip: 'Kind Hands Foundation, 9 AM start', art: [['awareness', ['$accent']]] } },

  { id: 'comm-sponsor-a-pet', name: 'Sponsor a pet', cat: 'Charity and fundraising', color: 'green', tags: 'sponsor,animal shelter,pets,monthly giving,donate,rescue',
    recipe: 'prices', palette: 'forest', fonts: 'friendly',
    o: { kick: 'Second Chance Animal Rescue', title: 'Sponsor a pet', plans: [
      { name: 'Friend', price: '$25', per: 'a month', lines: ['Food for one pet', 'A thank-you card'] },
      { name: 'Hero', price: '$50', per: 'a month', lines: ['Food and vet care', 'Photo updates', 'Name on our wall'], hot: true, tag: 'Most loved' },
      { name: 'Guardian', price: '$100', per: 'a month', lines: ['Care for a whole room', 'A shelter tour', 'Name on our wall'] }] } },

  { id: 'comm-raffle', name: 'Big raffle', cat: 'Charity and fundraising', color: 'yellow', tags: 'raffle,tickets,prize,fundraiser,draw,youth',
    recipe: 'ticket', palette: 'sunshine', fonts: 'slab',
    o: { kick: 'Big raffle', title: 'Win a bike', sub: 'Tickets are $5. Draw on Saturday at 3 PM.', stub: 'No. 0217', foot: 'Every dollar goes to the youth band',
      art: [['bicycle'], ['star', ['$accent'], { motion: 'twinkle' }], ['sparkle']] } },

  { id: 'comm-thank-volunteers', name: 'Thank you, volunteers', cat: 'Charity and fundraising', color: 'teal', tags: 'volunteers,thank you,photos,community,memories,charity',
    recipe: 'polaroids', palette: 'mint', fonts: 'handmade',
    o: { kick: 'Thank you, volunteers', title: 'We did it together', captions: ['Packing day', 'Food drive', 'Park cleanup'], art: [['hearthands']] } },

  { id: 'comm-why-we-give', name: 'Why we give', cat: 'Charity and fundraising', color: 'purple', tags: 'story,testimonial,food bank,volunteer,giving,community',
    recipe: 'testimonial', palette: 'lavender', fonts: 'elegant',
    o: { kick: 'Why we give', quote: 'The pantry helped my family through a hard winter. Now I volunteer every Saturday.', who: 'Luis M.', role: 'Neighbor and volunteer',
      foot: 'Thank you for giving', art: [['heart', ['$accent']]] } },

  { id: 'comm-where-gift-goes', name: 'Where your gift goes', cat: 'Charity and fundraising', color: 'green', tags: 'impact,donations,giving,nonprofit,charity,programs',
    recipe: 'features', palette: 'citrus', fonts: 'friendly',
    o: { kick: 'Where your gift goes', title: 'Every dollar counts', features: [
      { art: ['foodbox'], title: 'Meals', text: 'Fresh food for families' },
      { art: ['house'], title: 'Shelter', text: 'Safe beds every night' },
      { art: ['books'], title: 'School', text: 'Supplies for every child' }], foot: 'Thank you for your gift' } },

  { id: 'comm-roof-fund', name: 'Fundraising progress', cat: 'Charity and fundraising', color: 'navy', tags: 'fundraising goal,progress,donors,campaign,library,thank you',
    recipe: 'bigstats', palette: 'midnight', fonts: 'poster',
    o: { kick: 'Library roof fund', title: 'Almost there!', stats: [{ value: '$42,000', label: 'Raised so far', art: ['piggybank'] },
      { value: '84%', label: 'Of our goal', art: ['target'] }, { value: '612', label: 'Kind donors', art: ['hearthands'] }], foot: 'Help us finish strong' } },

  { id: 'comm-charity-car-wash', name: 'Charity car wash', cat: 'Charity and fundraising', color: 'blue', tags: 'car wash,fundraiser,youth,saturday,charity,community',
    recipe: 'kids', palette: 'ocean', fonts: 'friendly',
    o: { kick: 'Saturday, 10 to 2', title: 'Charity car wash', sub: 'All tips help the youth band go on tour', foot: 'Just $10 a car',
      art: [['car'], ['bubbles', [], { motion: 'float' }], ['sun'], ['spraybottle']] } },

  { id: 'comm-matching-gift', name: 'Matching gift countdown', cat: 'Charity and fundraising', color: 'purple', tags: 'matching gift,countdown,donate,deadline,giving,campaign',
    recipe: 'countdown', palette: 'berry', fonts: 'slab',
    o: { kick: 'Matching gift', title: 'Double your gift', label: 'The match ends in', done: 'Thank you! We did it!', foot: 'Every gift today is matched, up to $10,000',
      art: [['coins'], ['heart', ['$accent'], { motion: 'pulse' }], ['donationjar'], ['sparkle']] } },

  { id: 'comm-shelter-wish-list', name: 'Shelter wish list', cat: 'Charity and fundraising', color: 'pink', tags: 'animal shelter,wish list,donations,pets,rescue,supplies',
    recipe: 'corkboard', palette: 'blush', fonts: 'handmade',
    o: { title: 'Shelter wish list', notes: ['Old towels', 'Pet food', 'Chew toys', 'Cat litter'], sub: 'Drop off at Second Chance Animal Rescue',
      art: [['paw', ['$accent']], ['bone']] } },

  { id: 'comm-giving-season', name: '12 days of giving', cat: 'Charity and fundraising', color: 'green', tags: 'season of giving,december,holidays,kindness,charity,christmas',
    when: 'christmasseason', recipe: 'swiss', palette: 'forest', fonts: 'elegant',
    o: { num: '12', kick: 'Days of giving', title: 'Small acts,\nbig hearts', sub: 'A new way to help, every day in December', foot: 'See the list at the desk',
      art: [['gift']], fx: ['snow', { amount: 2, speed: 1 }] } },

  { id: 'comm-follow-rescue', name: 'Follow the rescue', cat: 'Charity and fundraising', color: 'brown', tags: 'social media,follow,animal rescue,adopt,online,charity',
    recipe: 'social', palette: 'espresso', fonts: 'friendly',
    o: { kick: 'Share our story', title: 'Follow the rescue', handles: [['iconcamera', '@chancerescue'], ['iconplay', 'Rescue stories'], ['iconhash', '#ChancePets'],
      ['iconthumb', 'Like our page']], big: ['paw'] } },

  // ===================================================================== Public services
  { id: 'comm-city-hall-directory', name: 'City hall directory', cat: 'Public services', color: 'blue', tags: 'city hall,directory,government,offices,rooms,lobby',
    recipe: 'directory', palette: 'slate', fonts: 'modern',
    o: { kick: 'Welcome to', title: 'Larkfield City Hall', clock: true, rows: [['Permits and licenses', 'Room 101'], ['Water and sewer billing', 'Room 104'], ['City clerk', 'Room 110'],
      ['Parks and recreation', 'Room 120'], ['Mayor\'s office', 'Room 201'], ['Council chambers', 'Room 210'], ['Planning', 'Room 214'], ['Restrooms', 'Ground floor']] } },

  { id: 'comm-service-desk', name: 'Service desk now serving', cat: 'Public services', color: 'blue', tags: 'now serving,queue,wait time,city hall,service desk,government',
    recipe: 'infoboard', palette: 'ocean',
    o: { kick: 'Larkfield City Hall', title: 'Service desk', cards: [
      { label: 'Now serving', value: 'A 42', art: ['bell'] },
      { label: 'Wait time', value: 'About 10 min', art: ['clock', ['$paper', '$paperInk', '$accent2']] },
      { label: 'Windows open', value: '3 of 4', art: ['people'] }],
      ticker: 'Please have your number ready\nPermits at windows 1 and 2\nWater bills at window 3', label: 'Info' } },

  { id: 'comm-library-hours', name: 'Library hours', cat: 'Public services', color: 'purple', tags: 'library,hours,opening hours,schedule,books,public library',
    recipe: 'schedule', palette: 'lavender', fonts: 'elegant',
    o: { kick: 'Brightwater Library', title: 'Library hours', sub: 'The book drop is open all day, every day.', big: ['books'],
      rows: [['Mon', '10 AM to 8 PM', 'Story time 10:30'], ['Tue', '10 AM to 8 PM', 'Homework help'], ['Wed', '10 AM to 8 PM', 'Teen club at 4'], ['Thu', '10 AM to 8 PM', 'Book club at 6'],
        ['Fri', '10 AM to 6 PM', ''], ['Sat', '10 AM to 5 PM', 'Used book sale'], ['Sun', '1 to 5 PM', '']] } },

  { id: 'comm-story-time', name: 'Library story time', cat: 'Public services', color: 'yellow', tags: 'story time,library,kids,toddlers,reading,children',
    recipe: 'kids', palette: 'sunshine', fonts: 'friendly',
    o: { kick: 'Ages 2 to 6', title: 'Story time', sub: 'Songs, stories and a craft every Tuesday at 10:30', foot: 'In the children\'s room',
      art: [['books'], ['teddy'], ['star', [], { motion: 'twinkle' }], ['crayon']] } },

  { id: 'comm-recycling-guide', name: 'Recycling guide', cat: 'Public services', color: 'green', tags: 'recycling,guide,bins,waste,city,environment',
    recipe: 'features', palette: 'citrus', fonts: 'friendly',
    o: { kick: 'Larkfield recycles', title: 'What to recycle', features: [
      { art: ['contract'], title: 'Paper and cardboard', text: 'Flatten boxes and keep them dry' },
      { art: ['juice', ['$accent', '#e0f2fe', '$accent2']], title: 'Cans and bottles', text: 'Give them a quick rinse' },
      { art: ['recycle', ['$accent']], title: 'Plastics 1 to 5', text: 'Check the number on the bottom' }], foot: 'No plastic bags, please' } },

  { id: 'comm-collection-days', name: 'Trash and recycling days', cat: 'Public services', color: 'teal', tags: 'trash,recycling,collection,schedule,waste,public works',
    recipe: 'timeline', palette: 'mint', fonts: 'slab',
    o: { kick: 'Your street', title: 'Collection days', steps: [{ label: 'Monday', text: 'Trash' }, { label: 'Wednesday', text: 'Recycling' }, { label: 'Friday', text: 'Yard waste' }],
      foot: 'Bins out by 7 AM' } },

  { id: 'comm-road-work', name: 'Road work ahead', cat: 'Public services', color: 'orange', tags: 'road work,road closure,detour,construction,traffic,notice',
    recipe: 'diagonal', palette: 'sunshine', fonts: 'poster',
    o: { kick: 'Road work ahead', title: 'Main Street closed', sub: 'From Elm to Oak, Monday to Friday. Please use Pine Street.', foot: 'Thank you for your patience',
      big: ['cone'], art: [['warning', [], { motion: 'pulse' }], ['hardhat']] } },

  { id: 'comm-town-meeting', name: 'Town hall meeting', cat: 'Public services', color: 'blue', tags: 'town hall,meeting,council,community,public meeting,government',
    recipe: 'datestamp', palette: 'slate', fonts: 'slab',
    o: { month: 'March', day: '12', kick: 'Your voice matters', title: 'Town hall meeting', sub: 'Talk with us about the new park and bus routes. Everyone is welcome.',
      foot: '7 PM, Council chambers', art: [['megaphone'], ['people'], ['govbuilding']] } },

  { id: 'comm-parks-guide', name: 'Parks summer guide', cat: 'Public services', color: 'green', tags: 'parks,recreation,summer,guide,camps,events',
    recipe: 'magazine', palette: 'forest', fonts: 'slab',
    o: { mast: 'PARKS', kick: 'Summer guide', title: 'Out and about', sub: 'Larkfield Parks and Recreation', lines: ['Swim lessons', 'Day camps', 'Movies in the park'],
      badge: 'Free events', big: ['kite', [], { motion: 'sway' }] } },

  { id: 'comm-class-fees', name: 'Community classes', cat: 'Public services', color: 'coral', tags: 'classes,community center,prices,adult classes,fall,learning',
    recipe: 'prices', palette: 'coral', fonts: 'friendly',
    o: { kick: 'Elmsbury Community Center', title: 'Classes this fall', plans: [
      { name: 'Pottery', price: '$40', per: '6 weeks', lines: ['Tuesday evenings', 'Clay included'] },
      { name: 'Spanish', price: '$30', per: '8 weeks', lines: ['Thursday evenings', 'All levels'], hot: true, tag: 'New' },
      { name: 'Tai chi', price: '$25', per: '6 weeks', lines: ['Saturday mornings', 'Easy pace'] }] } },

  { id: 'comm-cooling-center', name: 'Cooling center open', cat: 'Public services', color: 'blue', tags: 'cooling center,heat,summer,library,public safety,free',
    when: { kind: 'year', month: 6, day: 15, span: 60, label: 'Summer heat' }, recipe: 'note', palette: 'ocean', fonts: 'friendly',
    o: { kick: 'Hot days ahead', title: 'Cooling center open', sub: 'Cool air, water and a place to rest at the library, noon to 8 PM.',
      big: ['sun', [], { motion: 'spin' }], foot: 'Free for everyone' } },

  { id: 'comm-warming-center', name: 'Warming center', cat: 'Public services', color: 'purple', tags: 'warming center,winter,cold,shelter,public safety,free',
    when: { kind: 'year', month: 12, day: 1, span: 60, label: 'Winter' }, recipe: 'stamp', palette: 'berry', fonts: 'slab',
    o: { ring: 'Open tonight', center: '6 PM', kick: 'Cold nights', title: 'Warming center', sub: 'Warm drinks, blankets and a safe place to rest at the community center',
      foot: 'Pets welcome', art: [['snowflake'], ['mug'], ['moon']], fx: ['snow', { amount: 2, speed: 1 }] } },

  { id: 'comm-lost-and-found', name: 'Lost and found', cat: 'Public services', color: 'pink', tags: 'lost and found,front desk,notice,library,community center,items',
    recipe: 'corkboard', palette: 'blush', fonts: 'handmade',
    o: { title: 'Lost and found', notes: ['Blue umbrella', 'Kids mittens', 'Reading glasses', 'Set of keys'], sub: 'Ask at the front desk to claim',
      art: [['key'], ['glasses']] } },

  { id: 'comm-library-wifi', name: 'Free library Wi-Fi', cat: 'Public services', color: 'purple', tags: 'wifi,internet,library,password,free,guest',
    recipe: 'steps', palette: 'lavender', fonts: 'modern',
    o: { kick: 'Free Wi-Fi', title: 'Get online', steps: [{ title: 'Network', text: 'Brightwater Guest' }, { title: 'Password', text: 'readmore' },
      { title: 'Agree', text: 'Tap I agree and you are in' }], foot: 'Need help? Ask a librarian' } },

  { id: 'comm-permit-checklist', name: 'Permit checklist', cat: 'Public services', color: 'green', tags: 'permits,checklist,city hall,building,paperwork,government',
    recipe: 'checklist', palette: 'citrus', fonts: 'poster',
    o: { kick: 'Building permits', title: 'Before you come in', items: ['Photo ID', 'Your address and plans', 'Contractor details', 'A card or a check'], done: 0,
      big: ['clipboard'] } },

  { id: 'comm-meet-council', name: 'Meet your council', cat: 'Public services', color: 'pink', tags: 'city council,mayor,government,team,representatives,meet',
    recipe: 'team', palette: 'blush', fonts: 'elegant',
    o: { kick: 'Your city council', title: 'Meet your council', people: [{ name: 'Maria Chen', role: 'Mayor' }, { name: 'David Osei', role: 'Ward 1' },
      { name: 'Helen Brooks', role: 'Ward 2' }, { name: 'Sam Ortiz', role: 'Ward 3' }] } },

  { id: 'comm-city-at-work', name: 'Your city at work', cat: 'Public services', color: 'navy', tags: 'city,stats,numbers,report,community,government',
    recipe: 'bigstats', palette: 'midnight', fonts: 'poster',
    o: { kick: 'Larkfield this year', title: 'Your city at work', stats: [{ value: '12', label: 'Miles of bike lanes', art: ['bicycle'] },
      { value: '3', label: 'New parks', art: ['seedling'] }, { value: '40,000', label: 'Library visits', art: ['books'] }], foot: 'Thank you, neighbors' } },

  { id: 'comm-library-card', name: 'Free library card', cat: 'Public services', color: 'purple', tags: 'library card,free,sign up,library,books,membership',
    recipe: 'coupon', palette: 'berry',
    o: { kick: 'Brightwater Library', deal: 'FREE', title: 'Library card', sub: 'Books, movies and classes, all free with your card', code: 'Bring a photo ID',
      until: 'Takes five minutes', foot: 'Ask at the front desk', art: [['books'], ['idcard']] } },

  { id: 'comm-new-branch', name: 'New library branch', cat: 'Public services', color: 'teal', tags: 'new library,branch,location,map,opening,directions',
    recipe: 'findus', palette: 'mint', fonts: 'friendly',
    o: { kick: 'Now open', title: 'New library branch', address: ['75 Orchard Lane', 'Next to Elmsbury Park', 'Free parking'], hours: 'Tue to Sat, 10 AM to 6 PM',
      foot: 'Grand opening Saturday' } },

  { id: 'comm-fire-open-house', name: 'Fire station open house', cat: 'Public services', color: 'red', tags: 'fire station,open house,firefighters,safety,family,event',
    recipe: 'gig', palette: 'ruby', fonts: 'slab',
    o: { title: 'Fire Station Open House', day: 'Saturday', date: '11', month: 'October', lines: ['Meet the firefighters', 'Climb aboard the fire truck', 'Free smoke alarm tips'],
      strip: 'Station 3, 10 AM to 2 PM', art: [['extinguisher']] },
    wide: { art: [] } },

  { id: 'comm-tell-us', name: 'Tell us how we did', cat: 'Public services', color: 'coral', tags: 'feedback,survey,qr,scan,service,city',
    recipe: 'scan', palette: 'coral', fonts: 'friendly',
    o: { kick: 'Your opinion counts', title: 'How did we do?', steps: ['Scan the code', 'Answer three questions', 'Help us serve you better'], codeLabel: 'Scan for the short survey',
      foot: 'It takes one minute' } },

  { id: 'comm-city-lobby-screen', name: 'City hall lobby screen', cat: 'Public services', color: 'black', tags: 'split screen,lobby,city hall,news,government,screen',
    recipe: 'split2', palette: 'mono',
    o: { title: 'Larkfield City Hall', labels: ['City news', 'Meetings'], ticker: 'Council meets Tuesday at 7 PM\nLeaf pickup starts next week\nOffices closed Monday for the holiday',
      label: 'News' } },

  // ===================================================================== Hotels
  { id: 'comm-room-service', name: 'Room service menu', cat: 'Hotels', color: 'brown', tags: 'room service,menu,hotel,in-room dining,food,guests',
    recipe: 'dishes', palette: 'espresso', fonts: 'elegant',
    o: { kick: 'In-room dining', title: 'Room service', dishes: [
      { name: 'Club sandwich', note: 'With fries and pickles', price: '$16', art: ['fries'] },
      { name: 'Pasta of the day', note: 'Ask what the chef made', price: '$18', art: ['bowl'] },
      { name: 'Pancake stack', note: 'Served until 11 AM', price: '$12', art: ['pancakes'] }] } },

  { id: 'comm-hotel-amenities', name: 'Hotel amenities', cat: 'Hotels', color: 'blue', tags: 'amenities,hotel,pool,gym,cafe,guests',
    recipe: 'features', palette: 'ocean', fonts: 'elegant',
    o: { kick: 'The Wren Hotel', title: 'Enjoy your stay', features: [
      { art: ['umbrella'], title: 'Rooftop pool', text: 'Open 7 AM to 10 PM' },
      { art: ['dumbbell'], title: 'Fitness room', text: 'Open all day, every day' },
      { art: ['coffee'], title: 'Lobby cafe', text: 'Fresh coffee from 6 AM' }], foot: 'Towels at the front desk' } },

  { id: 'comm-guest-wifi', name: 'Guest Wi-Fi', cat: 'Hotels', color: 'blue', tags: 'wifi,internet,password,hotel,guests,network',
    recipe: 'note', palette: 'slate', fonts: 'friendly',
    o: { kick: 'Stay connected', title: 'Guest Wi-Fi', sub: 'Network: WrenGuest\nPassword: sleepwell', big: ['wifi', ['$accent'], { motion: 'pulse' }], foot: 'Trouble? Dial 0' } },

  { id: 'comm-stay-at-a-glance', name: 'Your stay at a glance', cat: 'Hotels', color: 'purple', tags: 'check in,check out,hotel,times,guests,info',
    recipe: 'timeline', palette: 'berry', fonts: 'elegant',
    o: { kick: 'Your stay at a glance', title: 'Good to know', steps: [{ label: '3 PM', text: 'Your room is ready' }, { label: '7 AM', text: 'Breakfast starts' },
      { label: '10 PM', text: 'Pool closes' }, { label: '11 AM', text: 'Time to check out' }], foot: 'Late checkout on request' } },

  { id: 'comm-hotel-directory', name: 'Hotel directory', cat: 'Hotels', color: 'blue', tags: 'directory,hotel,floors,ballroom,meeting rooms,lobby',
    recipe: 'directory', palette: 'ocean', fonts: 'elegant',
    o: { kick: 'Find your way', title: 'The Wren Hotel', clock: true, rows: [['Front desk', 'Lobby'], ['Restaurant', 'Lobby'], ['Ballroom', 'Level 2'], ['Meeting rooms', 'Level 2'],
      ['Business center', 'Level 2'], ['Fitness room', 'Level 3'], ['Rooftop pool', 'Roof'], ['Ice and snacks', 'Every floor']] } },

  { id: 'comm-things-to-do', name: 'Things to do nearby', cat: 'Hotels', color: 'yellow', tags: 'things to do,local,attractions,concierge,photos,hotel',
    recipe: 'polaroids', palette: 'sunshine', fonts: 'handmade',
    o: { kick: 'Ask our concierge', title: 'Things to do nearby', captions: ['Old town', 'The harbor', 'Night market'], art: [['compass']] } },

  { id: 'comm-concierge-picks', name: 'Concierge picks', cat: 'Hotels', color: 'navy', tags: 'concierge,local tips,city guide,hotel,recommendations,guests',
    recipe: 'magazine', palette: 'midnight', fonts: 'elegant',
    o: { mast: 'LOCAL', kick: 'Concierge picks', title: 'Our city, your way', sub: 'Tips from people who live here', lines: ['Tacos two blocks east', 'Sunset boat at 6 PM', 'Farmers market on Sunday'],
      badge: 'Insider tips', big: ['pin'] } },

  { id: 'comm-room-upgrade', name: 'Upgrade your room', cat: 'Hotels', color: 'purple', tags: 'room rates,upgrade,prices,hotel,suite,deals',
    recipe: 'prices', palette: 'berry', fonts: 'elegant',
    o: { kick: 'Treat yourself', title: 'Upgrade your room', plans: [
      { name: 'Classic', price: '$129', per: 'a night', lines: ['Queen bed', 'City view'] },
      { name: 'Deluxe', price: '$159', per: 'a night', lines: ['King bed', 'Balcony', 'Free breakfast'], hot: true, tag: 'Best value' },
      { name: 'Suite', price: '$229', per: 'a night', lines: ['Living room', 'Harbor view', 'Late check-out'] }] } },

  { id: 'comm-guest-review', name: 'What our guests say', cat: 'Hotels', color: 'pink', tags: 'review,guests,testimonial,hotel,stars,thank you',
    recipe: 'testimonial', palette: 'blush', fonts: 'elegant',
    o: { kick: 'What our guests say', quote: 'Spotless rooms, the comfiest beds and the friendliest staff. We will be back!', who: 'Priya and Tom', role: 'Stayed for a long weekend',
      foot: 'Thank you for staying with us', art: [['bed']] } },

  { id: 'comm-wedding-guests', name: 'Welcome, wedding guests', cat: 'Hotels', color: 'coral', tags: 'wedding,welcome,guests,reception,hotel,celebration',
    recipe: 'banner', palette: 'coral', fonts: 'retro',
    o: { kick: 'Welcome, wedding guests', title: 'Ana and\nMarco', sub: 'Reception in the Garden Ballroom at 6 PM', foot: 'Shuttle from the lobby at 5:30',
      art: [['rings'], ['champagne'], ['heart', ['$accent']]], fx: ['petals', { amount: 2, speed: 2 }] } },

  { id: 'comm-conference-day', name: 'Conference sessions', cat: 'Hotels', color: 'blue', tags: 'conference,sessions,schedule,event,hotel,meeting',
    recipe: 'schedule', palette: 'slate', fonts: 'modern',
    o: { kick: 'Harbor Design Forum', title: 'Today\'s sessions', sub: 'Pick up your badge at the registration desk.', big: ['idcard'],
      rows: [['8:30', 'Registration', 'Lobby'], ['9:00', 'Welcome talk', 'Ballroom'], ['10:30', 'Workshops', 'Rooms A to D'], ['12:30', 'Lunch', 'Garden terrace'],
        ['2:00', 'Panel talk', 'Ballroom'], ['5:00', 'Mixer', 'Lobby bar']] } },

  { id: 'comm-happy-hour', name: 'Lobby bar happy hour', cat: 'Hotels', color: 'black', tags: 'happy hour,hotel bar,drinks,lobby bar,evening,neon',
    recipe: 'neon', palette: 'mono',
    o: { kick: 'The Wren Lobby Bar', title: 'Happy hour', sub: '5 to 7 PM, every day', foot: 'Half-price small plates',
      back: [['bokeh', ['#ffd166', '#ff8fab', '#4cc9f0'], { opacity: 35 }]], art: [['cocktail'], ['wine'], ['lcocktail', ['$accent']]] } },

  { id: 'comm-airport-shuttle', name: 'Airport shuttle', cat: 'Hotels', color: 'teal', tags: 'airport shuttle,transport,schedule,hotel,guests,info',
    recipe: 'infoboard', palette: 'mint',
    o: { kick: 'The Wren Hotel', title: 'Airport shuttle', cards: [
      { label: 'Next shuttle', value: '10:30 AM', art: ['plane'] },
      { label: 'Ride time', value: 'About 25 min', art: ['clock', ['$paper', '$paperInk', '$accent2']] },
      { label: 'Pick-up', value: 'Main entrance', art: ['pin', ['$paper', '$accent', '$paperInk']] }],
      ticker: 'Shuttles leave every 30 minutes from 5 AM to 11 PM\nSign up at the front desk\nLuggage help is free', label: 'Shuttle' } },

  { id: 'comm-pool-rules', name: 'Pool rules', cat: 'Hotels', color: 'green', tags: 'pool rules,swimming,hotel,safety,checklist,guests',
    recipe: 'checklist', palette: 'citrus', fonts: 'poster',
    o: { kick: 'Rooftop pool', title: 'Pool rules', items: ['Shower before you swim', 'No glass by the pool', 'No lifeguard on duty', 'Kids swim with an adult', 'Pool closes at 10 PM'],
      big: ['umbrella'] } },

  { id: 'comm-concierge-team', name: 'Your concierge team', cat: 'Hotels', color: 'purple', tags: 'concierge,team,staff,hotel,help,meet the team',
    recipe: 'team', palette: 'lavender', fonts: 'elegant',
    o: { kick: 'Here to help', title: 'Your concierge team', people: [{ name: 'Elena V.', role: 'Head concierge' }, { name: 'Marcus T.', role: 'Tours and tickets' },
      { name: 'Yuki S.', role: 'Dining and tables' }] } },

  { id: 'comm-share-your-stay', name: 'Share your stay', cat: 'Hotels', color: 'coral', tags: 'social media,share,hotel,hashtag,reviews,guests',
    recipe: 'social', palette: 'coral', fonts: 'friendly',
    o: { kick: 'Loving your stay?', title: 'Share your stay', handles: [['iconcamera', '@thewrenhotel'], ['iconhash', '#WrenStay'], ['iconchat', 'Text the front desk'],
      ['iconthumb', 'Leave us a review']], big: ['bell'] } },

  { id: 'comm-guest-parking', name: 'Guest parking', cat: 'Hotels', color: 'green', tags: 'parking,garage,hotel,directions,map,guests',
    recipe: 'findus', palette: 'forest', fonts: 'friendly',
    o: { kick: 'Guest parking', title: 'Park with us', address: ['Garage entrance on Oak Street', 'Levels P1 and P2', 'Show your room key at the gate'], hours: 'Open day and night',
      foot: '$15 a night' } },

  { id: 'comm-late-checkout', name: 'Late checkout offer', cat: 'Hotels', color: 'pink', tags: 'late checkout,hotel,offer,guests,stay,coupon',
    recipe: 'coupon', palette: 'blush',
    o: { kick: 'The Wren Hotel', deal: '1 PM', title: 'Late checkout', sub: 'Sleep in on us when you stay two nights or more', code: 'Ask at the desk', until: 'When rooms allow',
      foot: 'Dial 0 from your room', art: [['bed'], ['key']] } },

  { id: 'comm-guest-welcome', name: 'Personal guest welcome', cat: 'Hotels', color: 'brown', tags: 'welcome,guest,vip,hotel,personal,arrival',
    recipe: 'arch', palette: 'espresso', fonts: 'elegant',
    o: { kick: 'Welcome', title: 'Mr. and Mrs.\nRivera', sub: 'We are so glad you are here. Enjoy your stay!', foot: 'Room 412', big: ['key'],
      art: [['sparkle', [], { motion: 'twinkle' }], ['star'], ['sparkle']] } },

  { id: 'comm-rooftop-nye', name: 'New Year\'s Eve rooftop party', cat: 'Hotels', color: 'purple', tags: 'new years eve,party,rooftop,ticket,hotel,celebration',
    when: 'nye', recipe: 'admit', palette: 'lavender',
    o: { kick: 'New Year\'s Eve', title: 'Rooftop Party', admit: 'Admit one', details: [['Date', 'Dec 31'], ['Time', '9 PM'], ['Place', 'Rooftop']],
      sub: 'Live band, bubbly at midnight and city views', stub: '031', stubLabel: 'Table', foot: 'Tickets at the front desk',
      art: [['champagne'], ['firework', [], { motion: 'pulse' }]], fx: ['fireworks', { amount: 2, speed: 2 }] } },

  { id: 'comm-thanksgiving-dinner', name: 'Thanksgiving dinner', cat: 'Hotels', color: 'red', tags: 'thanksgiving,dinner,hotel restaurant,holiday,turkey,november',
    when: 'thanksgiving', recipe: 'stamp', palette: 'ruby', fonts: 'elegant',
    o: { ring: 'Thanksgiving dinner', center: '$45', kick: 'The Wren Restaurant', title: 'Give thanks with us', sub: 'Roast turkey, all the sides and pumpkin pie. Kids eat for $20.',
      foot: 'Book a table at the desk', art: [['pumpkin'], ['wheat'], ['leaves']], fx: ['leaves', { amount: 2, speed: 2 }] } },

  { id: 'comm-reuse-towels', name: 'Reuse your towels', cat: 'Hotels', color: 'green', tags: 'towels,save water,green,hotel,environment,guests',
    recipe: 'diagonal', palette: 'forest', fonts: 'friendly',
    o: { kick: 'Help us save water', title: 'Reuse your towels', sub: 'Hang up towels you will use again. Leave them on the floor for fresh ones.', foot: 'Thank you for caring',
      big: ['drop', ['$accent2']], art: [['leaf', ['$accent2']], ['recycle', ['$accent2']]] } },

  // ===================================================================== Travel
  { id: 'comm-travel-cover', name: 'Where to next', cat: 'Travel', color: 'blue', tags: 'travel agency,trips,vacation,destinations,holidays,travel',
    recipe: 'magazine', palette: 'ocean', fonts: 'modern',
    o: { mast: 'WANDER', kick: 'Sailwind Travel', title: 'Where to next?', sub: 'Trips for every kind of traveler', lines: ['Island hopping', 'City breaks', 'Mountain lodges'],
      badge: 'Book early', big: ['suitcase'] } },

  { id: 'comm-tour-prices', name: 'Tour prices', cat: 'Travel', color: 'yellow', tags: 'tours,prices,food tour,city tour,day trip,travel',
    recipe: 'prices', palette: 'sunshine', fonts: 'friendly',
    o: { kick: 'Kestrel Tours', title: 'Pick your tour', plans: [
      { name: 'City walk', price: '$29', per: 'per person', lines: ['Two hours', 'Local guide'] },
      { name: 'Food tour', price: '$59', per: 'per person', lines: ['Three hours', 'Eight tastings', 'Small groups'], hot: true, tag: 'Top rated' },
      { name: 'Day trip', price: '$89', per: 'per person', lines: ['Full day', 'Lunch included', 'Hotel pickup'] }] } },

  { id: 'comm-boarding-pass', name: 'Boarding pass deal', cat: 'Travel', color: 'green', tags: 'boarding pass,flight,vacation,island,travel deal,trip',
    recipe: 'admit', palette: 'citrus', fonts: 'slab',
    o: { kick: 'Sailwind Travel', title: 'Island Escape', admit: 'Boarding pass', details: [['From', 'Home'], ['To', 'Sunvale'], ['Board', '9:40 AM']],
      sub: 'Seven nights with flights and hotel from $899', stub: 'B12', stubLabel: 'Gate', foot: 'Book by Friday',
      art: [['plane', [], { motion: 'float' }], ['palm']] } },

  { id: 'comm-departures', name: 'Departures board', cat: 'Travel', color: 'purple', tags: 'departures,flights,airport,gates,board,travel',
    recipe: 'directory', palette: 'lavender', fonts: 'modern',
    o: { kick: 'Elmsbury Regional Airport', title: 'Departures', clock: true, rows: [['09:45 Port Alder', 'Gate 3'], ['10:20 Sunvale', 'Gate 1'], ['11:05 Lake Corvin', 'Gate 4'],
      ['12:30 Brightwater', 'Gate 2'], ['13:15 Mistral Bay', 'Gate 5'], ['14:40 North Pines', 'Gate 3'], ['16:00 Elm Harbor', 'Gate 1'], ['17:25 Westvale', 'Gate 2']] } },

  { id: 'comm-packing-list', name: 'Packing list', cat: 'Travel', color: 'coral', tags: 'packing list,checklist,travel,vacation,trip,reminder',
    recipe: 'checklist', palette: 'coral', fonts: 'handmade',
    o: { kick: 'Before you go', title: 'Packing list', items: ['Passport and tickets', 'Phone charger', 'Sunscreen', 'Comfy shoes', 'Snacks for the trip'], done: 2,
      big: ['suitcase'] } },

  { id: 'comm-vacation-countdown', name: 'Vacation countdown', cat: 'Travel', color: 'navy', tags: 'countdown,vacation,trip,travel,holiday,departure',
    recipe: 'countdown', palette: 'midnight', fonts: 'retro',
    o: { kick: 'Pack your bags', title: 'Vacation countdown', label: 'We leave in', done: 'Bon voyage!', days: true, foot: 'Sailwind Travel',
      art: [['plane', [], { motion: 'float' }], ['palm'], ['suitcase'], ['sun']] } },

  { id: 'comm-trip-plan', name: 'Trip plan', cat: 'Travel', color: 'teal', tags: 'itinerary,trip plan,tour,travel,days,vacation',
    recipe: 'timeline', palette: 'mint', fonts: 'slab',
    o: { kick: 'Five days in the hills', title: 'Your trip plan', steps: [{ label: 'Day 1', text: 'Arrive and settle in' }, { label: 'Day 2', text: 'Old town walk' },
      { label: 'Day 3', text: 'Boat on the lake' }, { label: 'Day 4', text: 'A free day' }, { label: 'Day 5', text: 'Fly home' }], foot: 'Hotels and transfers included' } },

  { id: 'comm-visitor-center', name: 'Visitor center', cat: 'Travel', color: 'green', tags: 'visitor center,tourism,map,information,directions,travel',
    recipe: 'findus', palette: 'forest', fonts: 'friendly',
    o: { kick: 'Visitor center', title: 'Start here', address: ['Port Alder Visitor Center', '1 Harbor Square', 'Free maps and local tips'], hours: 'Open daily, 9 AM to 5 PM',
      foot: 'Restrooms and Wi-Fi inside' } },

  { id: 'comm-walking-map', name: 'Free walking map', cat: 'Travel', color: 'purple', tags: 'walking tour,map,qr,scan,sightseeing,visitors',
    recipe: 'scan', palette: 'berry', fonts: 'modern',
    o: { kick: 'Explore on foot', title: 'Free walking map', steps: ['Scan the code', 'Open the map', 'Follow the blue line'], codeLabel: 'Scan for the map',
      foot: 'Ten stops, about 90 minutes' } },

  { id: 'comm-postcards', name: 'Postcards from you', cat: 'Travel', color: 'green', tags: 'photos,travelers,trips,memories,travel agency,postcards',
    recipe: 'polaroids', palette: 'citrus', fonts: 'handmade',
    o: { kick: 'Our travelers', title: 'Postcards from you', sub: 'Send us your trip photos', captions: ['Island sunset', 'Market day', 'Mountain top'], art: [['camera']] } },

  { id: 'comm-tour-review', name: 'Tour review', cat: 'Travel', color: 'blue', tags: 'review,testimonial,tour,guide,travelers,stars',
    recipe: 'testimonial', palette: 'ocean', fonts: 'elegant',
    o: { kick: 'Five-star trips', quote: 'Our guide made the old town come alive. It was the best day of the whole trip!', who: 'The Moreno family', role: 'Food and history tour',
      foot: 'Book your tour today', art: [['compass', [], { motion: 'spin' }]] } },

  { id: 'comm-trips-made-easy', name: 'Trips made easy', cat: 'Travel', color: 'blue', tags: 'travel agency,tours,guides,booking,why us,travel',
    recipe: 'features', palette: 'slate', fonts: 'modern',
    o: { kick: 'Why travel with us', title: 'Trips made easy', features: [
      { art: ['people'], title: 'Small groups', text: 'Never more than 12' },
      { art: ['pin'], title: 'Local guides', text: 'People who live there' },
      { art: ['check'], title: 'Easy booking', text: 'One price, no surprises' }], foot: 'Call 555-0166' } },

  { id: 'comm-early-bird', name: 'Early bird travel offer', cat: 'Travel', color: 'pink', tags: 'early bird,discount,coupon,summer trips,booking,travel',
    when: { kind: 'year', month: 1, day: 15, span: 60, label: 'Early booking season' }, recipe: 'coupon', palette: 'blush',
    o: { kick: 'Sailwind Travel', deal: '15% OFF', title: 'Book early', sub: 'For summer trips booked by March 31', code: 'Code: EARLYBIRD', until: 'Ends March 31',
      foot: 'Ask any of our agents', art: [['plane'], ['sun', [], { motion: 'spin' }]] } },

  { id: 'comm-travel-experts', name: 'Our travel experts', cat: 'Travel', color: 'purple', tags: 'travel agents,team,experts,staff,travel agency,meet the team',
    recipe: 'team', palette: 'lavender', fonts: 'elegant',
    o: { kick: 'Ask us anything', title: 'Our travel experts', people: [{ name: 'Sofia G.', role: 'Islands and beaches' }, { name: 'Ken W.', role: 'Mountains and trails' },
      { name: 'Amira H.', role: 'City breaks' }, { name: 'Leo P.', role: 'Family trips' }] } },

  { id: 'comm-share-adventure', name: 'Share your adventure', cat: 'Travel', color: 'yellow', tags: 'social media,share,travel,hashtag,photos,follow',
    recipe: 'social', palette: 'sunshine', fonts: 'retro',
    o: { kick: 'Tag us on your trip', title: 'Share your adventure', handles: [['iconcamera', '@sailwindtravel'], ['iconhash', '#SailwindTrips'], ['iconplay', 'Sailwind Travel TV'],
      ['iconmail', 'Trip deals by email']], big: ['camera'] } },

  { id: 'comm-travel-night', name: 'Travel night', cat: 'Travel', color: 'red', tags: 'travel night,event,info evening,trips,prizes,travel agency',
    recipe: 'gig', palette: 'ruby', fonts: 'poster',
    o: { title: 'Travel\nNight', day: 'Thursday', date: '20', month: 'February', lines: ['Meet our guides, see trip photos', 'Free snacks and a prize draw', '10% off trips booked that night'],
      strip: 'Sailwind Travel, 6 to 8 PM', art: [['globe', [], { motion: 'spin' }]] } },

  { id: 'comm-summer-getaways', name: 'Summer getaways', cat: 'Travel', color: 'coral', tags: 'summer,beach,vacation,travel deals,getaway,holidays',
    when: { kind: 'year', month: 4, day: 1, span: 60, label: 'Summer booking season' }, recipe: 'banner', palette: 'coral', fonts: 'retro',
    o: { kick: 'Summer getaways', title: 'Sun, sea\nand you', sub: 'Beach trips from $499 a person', foot: 'Book now, pay later',
      art: [['palm'], ['umbrella'], ['sun', [], { motion: 'spin' }]] } },

  { id: 'comm-how-to-book', name: 'How to book a trip', cat: 'Travel', color: 'teal', tags: 'how to book,steps,travel agency,booking,trip,easy',
    recipe: 'steps', palette: 'mint', fonts: 'friendly',
    o: { kick: 'Booking is easy', title: 'Three steps away', steps: [{ title: 'Pick a trip', text: 'Browse our trips or ask us' }, { title: 'Pay a deposit', text: 'Just $100 holds your spot' },
      { title: 'Pack your bags', text: 'We send your tickets and plan' }], foot: 'Questions? Call 555-0166' } },

  { id: 'comm-then-and-now', name: 'Then and now', cat: 'Travel', color: 'brown', tags: 'history,then and now,photos,visitor center,heritage,town',
    recipe: 'beforeafter', palette: 'espresso', fonts: 'elegant',
    o: { kick: 'Port Alder history', title: 'Then and now', sub: 'The harbor, a hundred years apart', before: 'Then', after: 'Now' } },

  { id: 'comm-ferry-times', name: 'Ferry times', cat: 'Travel', color: 'blue', tags: 'ferry,schedule,boat,times,departures,island',
    recipe: 'schedule', palette: 'slate', fonts: 'poster',
    o: { kick: 'Pine Island Ferry', title: 'Ferry times', sub: 'Buy tickets at the kiosk. Bikes ride free.', big: ['compass'],
      rows: [['7:00', 'To Pine Island', 'Pier 2'], ['8:30', 'To Harbor Town', 'Pier 1'], ['10:00', 'To Pine Island', 'Pier 2'], ['12:30', 'To Harbor Town', 'Pier 1'],
        ['3:00', 'To Pine Island', 'Pier 2'], ['5:30', 'To Harbor Town', 'Pier 1'], ['7:00', 'Last boat back', 'Pier 1']] } },

  { id: 'comm-trip-quote', name: 'Trip quote receipt', cat: 'Travel', color: 'pink', tags: 'trip quote,vacation package,prices,travel agency,island,budget',
    recipe: 'receipt', palette: 'blush',
    o: { kick: 'All in one', title: 'Island week', sub: 'Flights, hotel and a boat tour for one price', shop: 'Sailwind Travel', shopSub: 'Trip quote',
      items: 'Flights | 420\nHotel stay | 380\nBoat tour | 60\nAirport rides | 40', total: ['Per person', '$900'], thanks: 'Bon voyage!', foot: 'Ask for your own quote',
      art: [['passport'], ['suitcase']] } },

  { id: 'comm-trips-this-month', name: 'Trips this month', cat: 'Travel', color: 'brown', tags: 'travel deals,trips,vacation,photos,packages,offers',
    recipe: 'dishes', palette: 'espresso', fonts: 'friendly',
    o: { kick: 'Hot deals', title: 'Trips this month', dishes: [
      { name: 'Beach week', note: 'Sunvale Island', price: 'From $899' },
      { name: 'City break', note: 'Three nights in Elm Harbor', price: 'From $399' },
      { name: 'Cabin weekend', note: 'By Lake Corvin', price: 'From $249' }] } }
];

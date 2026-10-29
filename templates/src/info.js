// Info and safety: info screens, safety signs and split screens.
// See README.md in this folder for how a spec works. Every name, place, phone number and handle here is made up.
// Safety words are general and calm: they never replace a building's own emergency plan.

// A widget on a card in the palette's colors (so "Make it yours" recolors it too)
const onCard = { theme: 'paper', bg: 'color', bgColor: '$paper', cText: '$paperInk', cAccent: '$accent' };
// A typed table on such a card
const table = data => ({ title: '', source: 'typed', data, header: true, zebra: true, rows: 0, pageSec: 10, font: 'geo', ...onCard });

module.exports = [
  // ===================================================================== Info screens
  { id: 'info-welcome-lobby', name: 'Office lobby welcome', cat: 'Info screens', color: 'navy', tags: 'welcome,lobby,reception,weather,clock,wifi',
    recipe: 'lobby', palette: 'midnight', fonts: 'elegant',
    o: { kick: 'Welcome to', title: 'Northgate Commons', sub: 'Offices, studios and a little cafe', panel: 'glass',
      ticker: 'Visitors, please sign in at reception\nThe cafe on level 1 is open 7 AM to 3 PM\nBike room is on level B1', label: 'Today',
      back: [['mesh', ['$accent', '$bg2', '$accent2'], { opacity: 18 }]] } },

  { id: 'info-room-finder', name: 'Room finder', cat: 'Info screens', color: 'blue', tags: 'directory,rooms,wayfinding,school,find your way,floor guide',
    recipe: 'directory', palette: 'ocean', fonts: 'slab',
    o: { kick: 'Find your way', title: 'Room finder', clock: true, rows: [
      ['Main office', 'Room 101'], ['Nurse', 'Room 105'], ['Counselor', 'Room 108'], ['Library', 'Room 120'], ['Science lab', 'Room 204'],
      ['Art studio', 'Room 210'], ['Music room', 'Room 215'], ['Gym', 'East wing'], ['Cafeteria', 'Ground floor'], ['Auditorium', 'West wing']] } },

  { id: 'info-visitor-info', name: 'Visitor info', cat: 'Info screens', color: 'teal', tags: 'visitors,wifi,parking,restrooms,info board,welcome',
    recipe: 'infoboard', palette: 'mint', fonts: 'modern',
    o: { kick: 'Welcome, visitors', title: 'Quick guide', cards: [
      { label: 'Wi-Fi', value: 'Guest network', art: ['wifi'] }, { label: 'Parking', value: 'Free in lot B', art: ['parking'] },
      { label: 'Restrooms', value: 'Past the elevators', art: ['restroom'] }],
      ticker: 'Please sign in at the front desk\nWear your visitor badge at all times\nAsk us if you need anything', label: 'Visitors' } },

  { id: 'info-today-in-the-building', name: 'Today in the building', cat: 'Info screens', color: 'blue', tags: 'today,schedule,building,events,office,announcements',
    recipe: 'schedule', palette: 'slate', fonts: 'modern',
    o: { kick: 'Riverside Plaza', title: 'Today in the building', sub: 'Have a good day!', big: ['building'], rows: [
      ['8:30 AM', 'Coffee and pastries', 'Lobby'], ['10 AM', 'Fire alarm test', 'All floors'], ['12 PM', 'Lunch and learn', 'Room 2B'],
      ['3 PM', 'Window cleaning', 'East side'], ['6 PM', 'Main doors lock', 'Use your badge']] } },

  { id: 'info-event-program', name: 'Event program', cat: 'Info screens', color: 'purple', tags: 'agenda,program,conference,event,schedule,timeline',
    recipe: 'timeline', palette: 'berry', fonts: 'poster',
    o: { kick: 'Spring Summit', title: 'Today\'s program', steps: [
      { label: '9 AM', text: 'Welcome and coffee' }, { label: '10:30 AM', text: 'Morning workshops' }, { label: '12:30 PM', text: 'Lunch in the atrium' },
      { label: '2 PM', text: 'Panel: the year ahead' }, { label: '4 PM', text: 'Closing and prizes' }], foot: 'Wi-Fi: Summit-Guest' } },

  { id: 'info-how-to-check-in', name: 'How to check in', cat: 'Info screens', color: 'green', tags: 'check in,visitors,sign in,front desk,how it works,waiting room',
    recipe: 'steps', palette: 'citrus', fonts: 'friendly',
    o: { kick: 'New here?', title: 'How to check in', steps: [
      { title: 'Sign in', text: 'At the screen by the door' }, { title: 'Get your badge', text: 'Wear it where we can see it' },
      { title: 'Take a seat', text: 'We will call your name' }], foot: 'Questions? Ask the front desk' } },

  { id: 'info-notice-board', name: 'Notice board', cat: 'Info screens', color: 'yellow', tags: 'notices,announcements,notice board,building,news,reminders',
    recipe: 'corkboard', palette: 'sunshine',
    o: { title: 'Notice board', notes: ['Lost and found is at the front desk', 'Elevator service on Tuesday', 'Food truck Friday at noon!', 'New bike room code'],
      sub: 'Want a notice up? Ask the office', art: [['megaphone'], ['bulb']] } },

  { id: 'info-stay-in-the-loop', name: 'Stay in the loop', cat: 'Info screens', color: 'purple', tags: 'social media,newsletter,news,updates,follow,community',
    recipe: 'social', palette: 'lavender', fonts: 'friendly',
    o: { kick: 'Never miss an event', title: 'Stay in the loop', handles: [['iconcamera', '@oakfieldlibrary'], ['iconmail', 'Newsletter sign-up at the desk'], ['iconchat', 'Text EVENTS to 555-0123']],
      big: ['megaphone'] } },

  { id: 'info-we-have-moved', name: 'We have moved', cat: 'Info screens', color: 'green', tags: 'we moved,new address,find us,map,directions,office',
    recipe: 'findus', palette: 'forest', fonts: 'poster',
    o: { kick: 'Our office has moved', title: 'Find us here now', address: ['200 Harbor Street, Suite 5', 'Two blocks north of here', 'Parking in the garage'],
      hours: 'Open weekdays 9 AM to 5 PM', foot: 'Same phone: 555-0150' } },

  { id: 'info-on-this-floor', name: 'On this floor', cat: 'Info screens', color: 'coral', tags: 'amenities,wifi,charging,water,coworking,floor',
    recipe: 'features', palette: 'coral', fonts: 'modern',
    o: { kick: 'On this floor', title: 'Here for you', features: [
      { art: ['wifi'], title: 'Free Wi-Fi', text: 'Join the network called Guest' }, { art: ['plug'], title: 'Charging spots', text: 'By the windows and sofas' },
      { art: ['drop'], title: 'Water station', text: 'Fill up next to the kitchen' }], foot: 'Please keep it tidy' } },

  { id: 'info-parking-rates', name: 'Parking rates', cat: 'Info screens', color: 'navy', tags: 'parking,rates,garage,prices,monthly parking,cars',
    recipe: 'prices', palette: 'midnight', fonts: 'slab',
    o: { kick: 'Garage parking', title: 'Parking rates', plans: [
      { name: 'Hourly', price: '$3', per: 'per hour', lines: ['Pay at the machine'] },
      { name: 'All day', price: '$12', per: 'up to 24 hours', lines: ['Pay at the machine', 'In and out once'], hot: true, tag: 'Best value' },
      { name: 'Monthly', price: '$90', per: 'per month', lines: ['Your own spot', 'Ask at the office'] }] } },

  { id: 'info-the-bulletin', name: 'Monthly bulletin', cat: 'Info screens', color: 'black', tags: 'newsletter,bulletin,news,monthly,announcements,magazine',
    recipe: 'magazine', palette: 'mono', fonts: 'elegant',
    o: { mast: 'BULLETIN', kick: 'This month', title: 'New around\nhere', sub: 'News from your building team', badge: 'Free',
      lines: ['Bike room opens on B1', 'Rooftop garden is back', 'Meet our new neighbors'] } },

  { id: 'info-photo-wall', name: 'Community photo wall', cat: 'Info screens', color: 'pink', tags: 'photos,community,memories,events,gallery,team',
    recipe: 'polaroids', palette: 'blush', fonts: 'handmade',
    o: { kick: 'Our community', title: 'Moments we loved', captions: ['Spring fair', 'Volunteer day', 'Team picnic'], art: [['heart', ['$accent']]] } },

  { id: 'info-lobby-update', name: 'Lobby update', cat: 'Info screens', color: 'brown', tags: 'renovation,before and after,construction,new look,update,lobby',
    recipe: 'beforeafter', palette: 'espresso', fonts: 'elegant',
    o: { kick: 'Pardon our dust', title: 'A brighter lobby', before: 'Before', after: 'After' } },

  { id: 'info-on-duty-today', name: 'On duty today', cat: 'Info screens', color: 'coral', tags: 'staff,on duty,team,front desk,security,help',
    recipe: 'team', palette: 'coral', fonts: 'slab',
    o: { kick: 'Here to help today', title: 'Who is on duty', people: [
      { name: 'Dana', role: 'Front desk' }, { name: 'Luis', role: 'Security' }, { name: 'Mei', role: 'Facilities' }, { name: 'Ravi', role: 'IT help' }] } },

  { id: 'info-phones-on-silent', name: 'Phones on silent', cat: 'Info screens', color: 'purple', tags: 'quiet,phones,silent,library,quiet floor,calls',
    recipe: 'diagonal', palette: 'lavender', fonts: 'poster',
    o: { kick: 'Quiet floor', title: 'Phones on silent', sub: 'Please take calls in the phone booths by the stairs.', big: ['phone', ['$accent', '#1f2937', '#ffffff']],
      foot: 'Thank you', art: [['speech', ['$accent', '$paper']], ['lsparkle', ['$bg1']]] } },

  { id: 'info-lost-and-found', name: 'Lost and found', cat: 'Info screens', color: 'green', tags: 'lost and found,lost,found,front desk,keys,items',
    recipe: 'stamp', palette: 'citrus', fonts: 'slab',
    o: { ring: 'Lost and found', center: 'Ask us', kick: 'Missing something?', title: 'Lost and found', sub: 'Keys, scarves, phones and more wait at the front desk for 30 days.',
      foot: 'Bring a photo ID', art: [['key'], ['umbrella'], ['glasses']] } },

  { id: 'info-map-on-your-phone', name: 'Map on your phone', cat: 'Info screens', color: 'blue', tags: 'map,qr,scan,wayfinding,phone,visitors',
    recipe: 'scan', palette: 'ocean',
    o: { kick: 'Find your way', title: 'Map on\nyour phone', steps: ['Scan the code', 'Open the map', 'Tap where you want to go'], foot: 'Or ask at the front desk' } },

  { id: 'info-opening-hours-list', name: 'Opening hours list', cat: 'Info screens', color: 'pink', tags: 'hours,opening hours,office hours,open,closed,week',
    recipe: 'directory', palette: 'blush', fonts: 'poster',
    o: { kick: 'Front office', title: 'Opening hours', rows: [
      ['Monday', '8 AM to 6 PM'], ['Tuesday', '8 AM to 6 PM'], ['Wednesday', '8 AM to 8 PM'], ['Thursday', '8 AM to 6 PM'],
      ['Friday', '8 AM to 4 PM'], ['Saturday', '10 AM to 2 PM'], ['Sunday', 'Closed']] } },

  { id: 'info-closed-memorial-day', name: 'Closed for Memorial Day', cat: 'Info screens', color: 'blue', tags: 'memorial day,closed,holiday hours,may,long weekend,office',
    when: { kind: 'nth', month: 5, nth: -1, weekday: 1, offset: -7, span: 8, label: 'The week before Memorial Day' },
    recipe: 'banner', palette: 'slate', fonts: 'slab',
    o: { kick: 'Memorial Day', title: 'Closed\nMonday', sub: 'We reopen Tuesday at 8 AM. Enjoy the long weekend.', foot: 'See you Tuesday',
      art: [['star', ['#e63946']], ['star', ['#e63946']], ['star', ['$accent']]] } },

  { id: 'info-elevator-out', name: 'Elevator out of service', cat: 'Info screens', color: 'yellow', tags: 'elevator,out of service,stairs,maintenance,notice,building',
    recipe: 'alert', palette: 'sunshine',
    o: { title: 'Elevator out of service', sub: 'Our team is fixing it today. Please use the stairs next to the lobby, or ask us for help.', tone: 'info', icon: 'info',
      foot: 'Thank you, building team', big: ['elevator'], back: [['dotsbg', ['$accent'], { opacity: 18 }]] } },

  { id: 'info-shuttle-times', name: 'Shuttle times', cat: 'Info screens', color: 'red', tags: 'shuttle,bus,times,schedule,transport,departures',
    recipe: 'board', palette: 'ruby', fonts: 'slab',
    o: { title: 'Free shuttle', sub: 'Every 45 minutes from the main door', mark: ['plane', ['$accent', '$ink2', '$paper']], kind: 'table',
      cfg: table('Leaves, Going to, Stop\n7:30 AM, Central Station, A\n8:15 AM, Central Station, A\n9:00 AM, Airport, B\n12:00 PM, Old Town, A\n5:15 PM, Central Station, A'),
      side: { kind: 'clock', cfg: { style: 'digital', showDate: false, theme: 'clear', bg: 'none', font: 'geo', cText: '$ink', cAccent: '$accent' } },
      tallH: 50, tallArt: ['car', [], { motion: 'drift' }] } },

  { id: 'info-service-counter', name: 'Service counter queue', cat: 'Info screens', color: 'teal', tags: 'now serving,queue,ticket,counter,waiting,numbers',
    recipe: 'duo', palette: 'mint', fonts: 'modern',
    o: { title: 'Service counter', sub: 'Take a ticket and we will call your number', mark: ['bell'],
      a: { kind: 'queue', cfg: { label: 'Now serving', prefix: 'B', digits: 3, showNext: 2, wait: 'About 8 minutes', counter: 'Counter 2', theme: 'paper' } },
      b: { kind: 'text', cfg: { text: 'While you wait\nHave your ticket and ID ready. Forms are on the table by the window.', style: 'card', icon: 'doc', theme: 'paper', font: 'geo' } }, split: 52 } },

  { id: 'info-quiet-hours', name: 'Quiet hours', cat: 'Info screens', color: 'purple', tags: 'quiet hours,apartments,dorm,noise,night,neighbors',
    recipe: 'note', palette: 'berry', fonts: 'elegant',
    o: { kick: 'Good neighbors', title: 'Quiet hours', sub: 'From 10 PM to 7 AM, please keep music and voices low so everyone can rest.', big: ['moon'], foot: 'Thank you',
      art: [['star', ['$accent2']], ['star', ['$accent']]], back: [['starsbg', ['$accent2'], { opacity: 40 }]] } },

  { id: 'info-outside-today', name: 'Outside today', cat: 'Info screens', color: 'green', tags: 'air quality,sunrise,sunset,outdoors,weather,school',
    recipe: 'duo', palette: 'forest', fonts: 'poster',
    o: { title: 'Outside today', sub: 'Air quality and daylight where you are', mark: ['sun', [], { motion: 'spin' }],
      a: { kind: 'air', cfg: { here: true, scale: 'us', showParts: true, theme: 'glass' } }, b: { kind: 'sun', cfg: { here: true, showMoon: true, hour12: 'auto', theme: 'glass' } }, split: 50 } },

  { id: 'info-green-building', name: 'Our green building', cat: 'Info screens', color: 'teal', tags: 'green building,energy,sustainability,bikes,water,numbers',
    recipe: 'bigstats', palette: 'mint', fonts: 'slab',
    o: { kick: 'Thanks to everyone here', title: 'Our green building', stats: [
      { value: '35%', label: 'Less energy used', art: ['bulb'] }, { value: '2,300', label: 'Bottles saved', art: ['drop'] },
      { value: '48', label: 'Bike spots', art: ['bicycle'] }], foot: 'Every small step counts' } },

  { id: 'info-visitor-guidelines', name: 'Visitor guidelines', cat: 'Info screens', color: 'green', tags: 'visitors,rules,guidelines,badge,sign in,office',
    recipe: 'checklist', palette: 'citrus', fonts: 'modern',
    o: { kick: 'Welcome, guests', title: 'Visitor guidelines', items: ['Sign in at reception', 'Wear your visitor badge', 'Stay with your host', 'Ask before taking photos', 'Sign out when you leave'],
      big: ['idcard'] },
    tall: { title: 'Visitor\nguidelines' } },

  // ===================================================================== Safety
  { id: 'info-wet-floor', name: 'Caution: wet floor', cat: 'Safety', color: 'yellow', tags: 'wet floor,caution,slippery,cleaning,floor,safety sign',
    recipe: 'diagonal', palette: 'sunshine', fonts: 'poster',
    o: { kick: 'Caution', title: 'Wet floor', sub: 'Please walk carefully. We are cleaning this area.', big: ['warning', [], { motion: 'pulse' }],
      foot: 'Thank you for your patience', art: [['cone'], ['drop', ['$bg1']]] } },

  { id: 'info-if-the-alarm-sounds', name: 'If the fire alarm sounds', cat: 'Safety', color: 'red', tags: 'fire alarm,evacuation,emergency,exit,fire safety,procedure',
    recipe: 'checklist', palette: 'ruby', fonts: 'slab',
    o: { kick: 'If the fire alarm sounds', title: 'Leave calmly', sub: 'Know your nearest exit before you need it',
      items: ['Stop what you are doing', 'Leave by the nearest exit', 'Do not use the elevators', 'Close doors behind you', 'Go to the meeting point'],
      big: ['exitsign'] } },

  { id: 'info-meeting-point', name: 'Emergency meeting point', cat: 'Safety', color: 'teal', tags: 'assembly point,meeting point,evacuation,fire drill,emergency,map',
    recipe: 'findus', palette: 'mint', fonts: 'poster',
    o: { kick: 'In an emergency', title: 'Our meeting point', address: ['North parking lot', 'Next to the flag pole', 'Wait for the all clear'],
      hours: 'Go back in only when told it is safe', foot: 'Know your way out' } },

  { id: 'info-extinguisher-pass', name: 'Fire extinguisher: PASS', cat: 'Safety', color: 'coral', tags: 'fire extinguisher,pass,fire safety,training,how to,emergency',
    recipe: 'timeline', palette: 'coral', fonts: 'slab',
    o: { kick: 'Using a fire extinguisher', title: 'Remember PASS', steps: [
      { label: 'Pull', text: 'Pull the pin' }, { label: 'Aim', text: 'Aim low, at the base of the fire' },
      { label: 'Squeeze', text: 'Squeeze the handle slowly' }, { label: 'Sweep', text: 'Sweep from side to side' }],
      foot: 'If in doubt, get out' } },

  { id: 'info-hand-washing', name: 'Hand washing steps', cat: 'Safety', color: 'blue', tags: 'hand washing,hygiene,wash hands,kitchen,restroom,health',
    recipe: 'steps', palette: 'ocean', fonts: 'friendly',
    o: { kick: 'Clean hands keep everyone well', title: 'Wash your hands', steps: [
      { title: 'Wet and soap', text: 'Clean running water and soap' }, { title: 'Scrub 20 seconds', text: 'Backs, thumbs and between fingers' },
      { title: 'Rinse and dry', text: 'Use a clean towel or the dryer' }], foot: 'Before food, after the restroom', fx: ['bubbles', { amount: 2, speed: 2 }] } },

  { id: 'info-first-aid-map', name: 'First aid and AED locations', cat: 'Safety', color: 'blue', tags: 'first aid,aed,defibrillator,eye wash,locations,safety equipment',
    recipe: 'directory', palette: 'slate', fonts: 'modern',
    o: { kick: 'Know where they are', title: 'First aid and AED', rows: [
      ['First aid kit', 'Front desk'], ['First aid kit', 'Break room'], ['First aid kit', 'Workshop door'], ['AED', 'By the elevators'],
      ['Eye wash station', 'Lab sink'], ['Fire blanket', 'Kitchen'], ['Fire extinguisher', 'Every stairwell']] } },

  { id: 'info-wear-your-gear', name: 'Wear your safety gear', cat: 'Safety', color: 'green', tags: 'ppe,hard hat,safety glasses,ear protection,construction,warehouse',
    recipe: 'features', palette: 'forest', fonts: 'slab',
    o: { kick: 'Beyond this point', title: 'Wear your gear', features: [
      { art: ['hardhat'], title: 'Hard hat', text: 'On your head, strap snug' },
      { art: ['glasses', ['#1f2937', '#bde0fe']], title: 'Safety glasses', text: 'Even for a quick job' },
      { art: ['headphones', ['#1f2937', '#ff8f1c']], title: 'Ear protection', text: 'In every loud area' }],
      foot: 'No gear, no entry', back: [['hazard', ['$accent', '$bg1'], { opacity: 8 }]] } },

  { id: 'info-hard-hat-area', name: 'Hard hat area', cat: 'Safety', color: 'black', tags: 'hard hat,construction,site safety,ppe,warning,boots',
    recipe: 'alert', palette: 'mono',
    o: { tape: ['#ffc300', '#1f2937'], big: ['hardhat'], title: 'Hard hat area', sub: 'Hard hats and safety boots are required past this sign.', tone: 'warning',
      foot: 'Ask the site office for gear' } },

  { id: 'info-earthquake', name: 'Earthquake: drop, cover, hold on', cat: 'Safety', color: 'purple', tags: 'earthquake,drop cover hold on,emergency,drill,school,preparedness',
    recipe: 'steps', palette: 'lavender', fonts: 'poster',
    o: { kick: 'If the ground shakes', title: 'Drop, cover, hold on', steps: [
      { title: 'Drop', text: 'Get down on your hands and knees' }, { title: 'Cover', text: 'Get under a sturdy table, cover your head' },
      { title: 'Hold on', text: 'Hold on until the shaking stops' }], foot: 'Stay away from windows' } },

  { id: 'info-smoke-free', name: 'Smoke-free building', cat: 'Safety', color: 'navy', tags: 'no smoking,smoke free,vaping,policy,building,sign',
    recipe: 'note', palette: 'midnight',
    o: { kick: 'Thank you for not smoking', title: 'Smoke-free building', sub: 'Smoking and vaping are not allowed inside or near the doors. Please use the marked area outside.',
      big: ['nosmoking'], foot: 'Thank you', art: [['sparkle', ['$accent']], ['leaf', ['$accent2']]] } },

  { id: 'info-stay-home-if-sick', name: 'Please stay home if sick', cat: 'Safety', color: 'pink', tags: 'stay home,sick,unwell,health,workplace,policy',
    recipe: 'hero', palette: 'blush', fonts: 'elegant',
    o: { kick: 'Feeling unwell?', title: 'Please stay\nhome', sub: 'Rest up and let your team know. Feel better soon!', foot: 'Take care of yourself',
      art: [['mug'], ['bed'], ['heart', ['$accent']], ['sparkle', ['$accent2']], ['star', ['$accent2']], ['heart', ['$accent2']]] } },

  { id: 'info-cameras-in-use', name: 'Security cameras in use', cat: 'Safety', color: 'purple', tags: 'security cameras,cctv,recording,security,surveillance,notice',
    recipe: 'ribbon', palette: 'berry', fonts: 'poster',
    o: { kick: 'For everyone\'s safety', title: 'Cameras in use', sub: 'This area is recorded 24 hours a day', foot: 'Thank you',
      art: [['camera'], ['camera', [], { flip: true }]] } },

  { id: 'info-staff-only', name: 'Staff only', cat: 'Safety', color: 'brown', tags: 'staff only,authorized,private,no entry,door sign,employees',
    recipe: 'arch', palette: 'espresso', fonts: 'elegant',
    o: { kick: 'Sorry, no entry', title: 'Staff only', sub: 'Please ask a team member if you need help.', big: ['door'], foot: 'Thank you',
      art: [['idcard'], ['key'], ['sparkle', ['$accent']]] } },

  { id: 'info-keep-exits-clear', name: 'Keep exits clear', cat: 'Safety', color: 'teal', tags: 'fire exits,keep clear,exit,fire safety,doors,warehouse',
    recipe: 'bigtype', palette: 'mint',
    o: { lines: ['KEEP', 'EXITS', 'CLEAR'], kick: 'Fire safety', sub: 'Never block doors, halls or stairs, not even for a minute', art: [['exitsign']] },
    tall: { sub: 'Never block doors, halls or stairs' } },

  { id: 'info-who-to-call', name: 'Who to call', cat: 'Safety', color: 'purple', tags: 'emergency contacts,phone numbers,security,facilities,who to call,help',
    recipe: 'directory', palette: 'lavender', fonts: 'slab',
    o: { title: 'Who to call', sub: 'In an emergency, call your local emergency number first', rows: [
      ['Security desk', '555-0110'], ['Facilities', '555-0142'], ['Building manager', '555-0175'], ['First aid team', 'Ext. 220'], ['IT help', 'Ext. 300'], ['After hours', '555-0199']] } },

  { id: 'info-first-aiders', name: 'Our first aiders', cat: 'Safety', color: 'green', tags: 'first aiders,first aid,team,safety team,staff,help',
    recipe: 'team', palette: 'citrus', fonts: 'friendly',
    o: { kick: 'Trained and ready to help', title: 'Our first aiders', people: [
      { name: 'Grace O.', role: 'Floor 1' }, { name: 'Peter N.', role: 'Floor 2' }, { name: 'Amira S.', role: 'Floor 3' }, { name: 'Jon T.', role: 'Warehouse' }] } },

  { id: 'info-safety-scoreboard', name: 'Safety scoreboard', cat: 'Safety', color: 'navy', tags: 'safety stats,days without accident,scoreboard,workplace,team,numbers',
    recipe: 'bigstats', palette: 'midnight', fonts: 'poster',
    o: { kick: 'Thank you, team', title: 'Safety this month', stats: [
      { value: '42', label: 'Days without an injury', art: ['check'] }, { value: '100%', label: 'Team trained', art: ['hardhat'] },
      { value: '3', label: 'Drills done', art: ['bell'] }], foot: 'Keep it up' } },

  { id: 'info-safety-training', name: 'Safety training week', cat: 'Safety', color: 'yellow', tags: 'safety training,schedule,training,workshop,safety week,staff',
    recipe: 'schedule', palette: 'sunshine', fonts: 'slab',
    o: { kick: 'Safety week', title: 'Training schedule', sub: 'Each session takes 30 minutes', big: ['clipboard'], rows: [
      ['Mon 9 AM', 'Fire safety', 'Room 2'], ['Tue 9 AM', 'First aid basics', 'Room 2'], ['Wed 2 PM', 'Safe lifting', 'Warehouse'],
      ['Thu 9 AM', 'Ladder safety', 'Yard'], ['Fri 11 AM', 'Evacuation drill', 'All floors']] } },

  { id: 'info-report-a-hazard', name: 'Report a hazard', cat: 'Safety', color: 'coral', tags: 'report hazard,qr,safety report,near miss,scan,maintenance',
    recipe: 'scan', palette: 'coral', fonts: 'poster',
    o: { kick: 'See something unsafe?', title: 'Report it\nfast', steps: ['Scan the code', 'Add a photo and a note', 'We fix it'], foot: 'Or tell your supervisor' } },

  { id: 'info-watch-for-ice', name: 'Watch for ice', cat: 'Safety', color: 'blue', tags: 'ice,winter,slippery,snow,walkway,caution',
    when: { kind: 'year', month: 12, day: 1, span: 60, label: 'December and January' },
    recipe: 'paper', palette: 'ocean', fonts: 'friendly',
    o: { land: 'snowground', kick: 'Winter safety', title: 'Watch for ice', sub: 'Walk slowly, take small steps and hold the handrails',
      art: [['snowflake', ['$accent']], ['cloud'], ['snowman'], ['snowflake', ['$accent2']], ['snowflake', ['$accent']]], fx: ['snow', { amount: 2, speed: 2 }] } },

  { id: 'info-beat-the-heat', name: 'Beat the heat', cat: 'Safety', color: 'red', tags: 'heat,summer,hydration,outdoor work,heat safety,water',
    when: { kind: 'year', month: 6, day: 15, span: 60, label: 'Summer' },
    recipe: 'features', palette: 'ruby', fonts: 'poster',
    o: { kick: 'Hot days ahead', title: 'Beat the heat', features: [
      { art: ['drop'], title: 'Drink water', text: 'A cup every 15 to 20 minutes' }, { art: ['umbrella'], title: 'Rest in the shade', text: 'Take short breaks out of the sun' },
      { art: ['people'], title: 'Watch each other', text: 'Dizzy or confused? Tell someone' }], foot: 'Look out for each other' } },

  { id: 'info-lift-safely', name: 'Lift the safe way', cat: 'Safety', color: 'blue', tags: 'lifting,back safety,manual handling,warehouse,ergonomics,training',
    recipe: 'timeline', palette: 'slate', fonts: 'modern',
    o: { kick: 'Protect your back', title: 'Lift the safe way', steps: [
      { label: 'Plan', text: 'Check the weight and the path' }, { label: 'Get close', text: 'Feet apart, load close to you' },
      { label: 'Lift', text: 'Bend your knees, not your back' }, { label: 'Turn', text: 'Move your feet, do not twist' }], foot: 'Too heavy? Ask for help' } },

  { id: 'info-pool-rules', name: 'Pool rules', cat: 'Safety', color: 'blue', tags: 'pool rules,swimming,pool,hotel,safety rules,summer',
    recipe: 'checklist', palette: 'ocean', fonts: 'friendly',
    o: { kick: 'For everyone\'s safety', title: 'Pool rules', items: ['No running on the deck', 'Shower before you swim', 'Watch children at all times', 'No glass near the pool', 'No diving in the shallow end'],
      big: ['umbrella'], back: [['wavesbg', ['$accent', '$accent2', '$bg2'], { opacity: 12 }]] } },

  { id: 'info-test-smoke-alarms', name: 'Test your smoke alarms', cat: 'Safety', color: 'purple', tags: 'smoke alarm,fire safety,batteries,daylight saving,home safety,reminder',
    when: { kind: 'nth', month: 11, nth: 1, weekday: 0, offset: -3, span: 7, label: 'When the clocks change in November' },
    recipe: 'banner', palette: 'berry', fonts: 'slab',
    o: { kick: 'Clocks change this weekend', title: 'Test your\nsmoke alarms', sub: 'Press the test button on each alarm and change old batteries', foot: 'It takes one minute',
      art: [['clock'], ['bell'], ['check', ['$accent']]] } },

  { id: 'info-aed-inside', name: 'AED inside', cat: 'Safety', color: 'pink', tags: 'aed,defibrillator,first aid,heart,emergency,cpr',
    recipe: 'split', palette: 'blush', fonts: 'slab',
    o: { kick: 'Heart emergency?', title: 'AED inside', sub: 'Call for help, then grab the AED at the front desk. It talks you through each step.', foot: 'Anyone can use it',
      big: ['heartpulse'], art: [['medcross'], ['heart', ['$accent']], ['sparkle', ['$accent2']]] } },

  { id: 'info-safety-at-a-glance', name: 'Safety at a glance', cat: 'Safety', color: 'green', tags: 'emergency info,exits,meeting point,first aid,safety board,evacuation',
    recipe: 'infoboard', palette: 'forest', fonts: 'modern',
    o: { kick: 'Safety at a glance', title: 'Know your way out', cards: [
      { label: 'Nearest exit', value: 'Behind you, left', art: ['exitsign'] }, { label: 'Meeting point', value: 'North lot', art: ['pin'] },
      { label: 'First aid', value: 'Front desk', art: ['firstaid'] }],
      ticker: 'In an emergency, follow staff instructions\nDo not use the elevators during a fire alarm\nReport any hazard to your supervisor', label: 'Safety' } },

  { id: 'info-storm-shelter', name: 'Severe weather shelter', cat: 'Safety', color: 'black', tags: 'severe weather,tornado,shelter,storm,emergency,basement',
    recipe: 'swiss', palette: 'mono', fonts: 'poster',
    o: { num: 'B12', kick: 'Severe weather shelter', title: 'Go to room B12', sub: 'Take the stairs to the basement. Stay away from windows and doors.', foot: 'Follow the green signs',
      art: [['cloud']] } },

  // ===================================================================== Split screens
  { id: 'info-split-restaurant', name: 'Restaurant: menu and video', cat: 'Split screens', color: 'brown', tags: 'split screen,two areas,restaurant,menu,video,live',
    recipe: 'split2', palette: 'espresso',
    o: { title: 'Harbor Grill', titleStyle: { font: 'fashion' }, labels: ['Menu', 'Chef video'], label: 'Tonight',
      ticker: 'Happy hour 4 to 6 PM\nAsk about our gluten-free menu\nPrivate room for parties up to 40', back: [['grain', []]] } },

  { id: 'info-split-ops-room', name: 'Operations room: two screens', cat: 'Split screens', color: 'blue', tags: 'split screen,dashboard,calendar,office,operations,two areas',
    recipe: 'split2', palette: 'slate',
    o: { title: 'Operations room', titleStyle: { font: 'wide', weight: '700' }, labels: ['Live dashboard', 'Team calendar'], back: [['gridbg', ['$ink2'], { opacity: 40 }]] } },

  { id: 'info-split-hotel', name: 'Hotel lobby: film and events', cat: 'Split screens', color: 'navy', tags: 'split screen,hotel,lobby,events,welcome video,guests',
    recipe: 'split2', palette: 'midnight',
    o: { title: 'The Willow Hotel', titleStyle: { font: 'fashion' }, labels: ['Welcome film', 'Today\'s events'], label: 'Guests',
      ticker: 'Breakfast 6:30 to 10 AM in the Garden Room\nLate checkout on request\nAsk the concierge about city tours', back: [['bokeh', ['$accent', '$accent2', '$ink2'], { opacity: 25 }]] } },

  { id: 'info-split-church', name: 'Church: live service and news', cat: 'Split screens', color: 'purple', tags: 'split screen,church,live stream,worship,announcements,two areas',
    recipe: 'split2', palette: 'lavender',
    o: { title: 'Grace Valley Church', titleStyle: { font: 'fashion' }, labels: ['Live service', 'This week'], label: 'Welcome',
      ticker: 'Coffee hour after every service\nYouth group Fridays at 6:30 PM\nAll are welcome here', back: [['mesh', ['$accent', '$accent2', '$bg2'], { opacity: 14 }]] } },

  { id: 'info-split-transit', name: 'Transit station board', cat: 'Split screens', color: 'black', tags: 'split screen,transit,departures,trains,station,updates',
    recipe: 'split2', palette: 'mono',
    o: { title: 'Bayside Transit Center', titleStyle: { font: 'tall' }, labels: ['Departures', 'Service updates'], label: 'Updates',
      ticker: 'Trains every 10 minutes until 9 PM\nThe platform 2 elevator is working\nKeep your ticket until you exit', back: [['cityline', ['$bg2', '$bg1', '$accent'], { opacity: 35 }]] },
    tall: { title: 'Bayside Transit' } },

  { id: 'info-split-campus', name: 'Campus news and events', cat: 'Split screens', color: 'purple', tags: 'split screen,college,campus,student center,events,news',
    recipe: 'split2', palette: 'berry',
    o: { title: 'Student Center', titleStyle: { font: 'heavyslab' }, labels: ['Campus news', 'Events this week'], label: 'Campus',
      ticker: 'Free coffee in the lounge until 10 AM\nClubs fair on Thursday, on the lawn\nThe library is open until midnight', back: [['memphis', ['$accent', '$accent2', '$ink2'], { opacity: 22 }]] } },

  { id: 'info-split-salon', name: 'Salon: our work and booking', cat: 'Split screens', color: 'pink', tags: 'split screen,salon,beauty,portfolio,booking,two areas',
    recipe: 'split2', palette: 'blush',
    o: { title: 'Studio Bloom', titleStyle: { font: 'script', weight: '400' }, labels: ['Our work', 'Book a visit'], back: [['dotsbg', ['$accent'], { opacity: 20 }]] } },

  { id: 'info-split-museum', name: 'Museum: film and tours', cat: 'Split screens', color: 'green', tags: 'split screen,museum,gallery,tours,exhibit,video',
    recipe: 'split2', palette: 'forest',
    o: { title: 'Harbor History Museum', titleStyle: { font: 'fashion' }, labels: ['Exhibit film', 'Tours today'], label: 'Museum',
      ticker: 'Free entry on the first Sunday of the month\nAudio guides at the front desk', back: [['aurora', ['$accent', '$accent2', '$ink2'], { opacity: 18 }]] },
    tall: { title: 'Harbor Museum' } },

  { id: 'info-split-library', name: 'Library: events and new books', cat: 'Split screens', color: 'green', tags: 'split screen,library,events,new books,community,two areas',
    recipe: 'split2', palette: 'citrus',
    o: { title: 'Maple Grove Library', titleStyle: { font: 'bubbly' }, labels: ['What is on', 'New books'], label: 'Library',
      ticker: 'Story time Saturday at 10 AM\nReturn bins are open 24 hours\nAsk about free museum passes', back: [['leavesbg', ['$accent', '$accent2', '$ink2'], { opacity: 20 }]] } },

  { id: 'info-split-credit-union', name: 'Bank: rates and tips', cat: 'Split screens', color: 'blue', tags: 'split screen,bank,credit union,rates,finance,two areas',
    recipe: 'split2', palette: 'ocean',
    o: { title: 'Cedar Valley Credit Union', titleStyle: { font: 'wide', weight: '700' }, labels: ['Rates today', 'Money tips'], back: [['rings2', ['$accent'], { opacity: 10 }]] },
    tall: { title: 'Cedar Valley' } },

  { id: 'info-split3-gym', name: 'Gym: video, classes and tips', cat: 'Split screens', color: 'red', tags: 'split screen,gym,fitness,classes,video,three areas',
    recipe: 'split3', palette: 'ruby',
    o: { title: 'Ironline Gym', titleStyle: { font: 'tall', caps: true }, labels: ['Workout video', 'Class times', 'Tip of the day'], label: 'Gym',
      ticker: 'New spin bikes in studio B\nFresh towels at the front desk\nPlease wipe down after every set', back: [['stripes', ['$ink'], { opacity: 30 }]] } },

  { id: 'info-split3-school', name: 'School: news, lunch and weather', cat: 'Split screens', color: 'yellow', tags: 'split screen,school,announcements,lunch menu,weather,three areas',
    recipe: 'split3', palette: 'sunshine',
    o: { title: 'Maple Ridge Middle School', titleStyle: { font: 'bubbly' }, labels: ['Announcements', 'Lunch menu', 'Weather'], label: 'Today',
      ticker: 'Picture day is Thursday\nBook fair in the library all week\nGo, Owls!', back: [['dotsbg', ['$accent'], { opacity: 25 }]] },
    tall: { title: 'Maple Ridge' } },

  { id: 'info-split3-shop', name: 'Shop: arrivals, deals and social', cat: 'Split screens', color: 'coral', tags: 'split screen,retail,shop,deals,new arrivals,three areas',
    recipe: 'split3', palette: 'coral',
    o: { title: 'Juniper and Co.', titleStyle: { font: 'fashion' }, labels: ['New arrivals', 'Deal of the day', 'Follow us'], label: 'Shop',
      ticker: 'Free gift wrap at the counter\nReturns within 30 days with your receipt', back: [['terrazzo', ['$accent', '$accent2', '$ink2'], { opacity: 25 }]] } },

  { id: 'info-split3-clinic', name: 'Clinic waiting room', cat: 'Split screens', color: 'teal', tags: 'split screen,clinic,waiting room,health,queue,three areas',
    recipe: 'split3', palette: 'mint',
    o: { title: 'Riverside Family Clinic', labels: ['Health video', 'Now seeing', 'Check in'], back: [['mesh', ['$accent', '$bg2', '$accent2'], { opacity: 12 }]] },
    tall: { title: 'Riverside Clinic' } },

  { id: 'info-split3-sports-bar', name: 'Sports bar: two games', cat: 'Split screens', color: 'brown', tags: 'split screen,sports bar,games,scores,drink specials,three areas',
    recipe: 'split3', palette: 'espresso',
    o: { title: 'The Dugout', titleStyle: { font: 'heavyslab' }, labels: ['Main game', 'Second game', 'Drink specials'], label: 'Game on',
      ticker: 'Pitchers $14 during every game\nWings 50 cents on Mondays', back: [['brick', [], { opacity: 45 }]] } },

  { id: 'info-split3-factory', name: 'Factory floor board', cat: 'Split screens', color: 'blue', tags: 'split screen,factory,production,safety,shift,three areas',
    recipe: 'split3', palette: 'slate',
    o: { title: 'Line 4', titleStyle: { font: 'tall' }, labels: ['Production board', 'Safety message', 'Shift notes'], label: 'Floor',
      ticker: 'Hard hats and glasses past the yellow line\nShift change at 2 PM', back: [['hazard', ['$accent', '$bg1'], { opacity: 6 }]] } },

  { id: 'info-split3-realty', name: 'Real estate window', cat: 'Split screens', color: 'purple', tags: 'split screen,real estate,listings,open house,homes,three areas',
    recipe: 'split3', palette: 'lavender',
    o: { title: 'Hillside Realty', titleStyle: { font: 'fashion' }, labels: ['Featured home', 'Open houses', 'Contact us'], clock: false, back: [['geo', ['$accent', '$accent2', '$ink2'], { opacity: 8 }]] } },

  { id: 'info-split3-auto', name: 'Car dealer showroom', cat: 'Split screens', color: 'blue', tags: 'split screen,car dealer,showroom,service,financing,three areas',
    recipe: 'split3', palette: 'ocean',
    o: { title: 'Summit Auto', titleStyle: { font: 'wide', weight: '700' }, labels: ['Showroom', 'Service specials', 'Financing'], label: 'Service',
      ticker: 'Free car wash with every service\nOpen Saturdays 9 AM to 5 PM' } },

  { id: 'info-split3-conference', name: 'Conference: stage and sponsors', cat: 'Split screens', color: 'purple', tags: 'split screen,conference,event,main stage,sponsors,three areas',
    recipe: 'split3', palette: 'berry',
    o: { title: 'Spring Summit', titleStyle: { font: 'tall' }, labels: ['Main stage', 'Up next', 'Sponsors'], label: 'Live',
      ticker: 'Lunch is served in the atrium at 12:30\nWi-Fi: Summit-Guest', back: [['confettibg', ['$accent', '$accent2', '$ink2'], { opacity: 30 }]] } },

  { id: 'info-split3-gaming', name: 'Gaming lounge', cat: 'Split screens', color: 'navy', tags: 'split screen,gaming,esports,stream,leaderboard,three areas',
    recipe: 'split3', palette: 'midnight',
    o: { title: 'Respawn Lounge', titleStyle: { font: 'wide', weight: '700' }, labels: ['Live match', 'Leaderboard', 'Chat'], clock: false,
      back: [['starfield', ['$ink2', '$accent'], { opacity: 60 }]] } },

  { id: 'info-duo-welcome-clock', name: 'Welcome with a wall clock', cat: 'Split screens', color: 'pink', tags: 'welcome,clock,photo,lobby,two areas,split screen',
    recipe: 'duo', palette: 'blush', fonts: 'elegant',
    o: { title: 'Welcome', sub: 'We are so glad you are here', mark: ['sparkles', ['$accent', '$accent2', '$accent']],
      a: { kind: 'clock', cfg: { style: 'analog', face: 'classic', seconds: true, showDate: true, dateStyle: 'long', ...onCard } }, b: { kind: 'zone' }, split: 44 } },

  { id: 'info-duo-weather-photo', name: 'Weather and a photo', cat: 'Split screens', color: 'yellow', tags: 'weather,forecast,photo,lobby,two areas,split screen',
    recipe: 'duo', palette: 'sunshine', fonts: 'friendly',
    o: { title: 'Today outside', sub: 'Plan your day', mark: ['sun', [], { motion: 'spin' }],
      a: { kind: 'weather', cfg: { theme: 'livesky', here: true, layout: 'auto' } }, b: { kind: 'zone' }, split: 54 } },

  { id: 'info-duo-reopening-countdown', name: 'Countdown and a photo', cat: 'Split screens', color: 'red', tags: 'countdown,reopening,grand opening,photo,two areas,split screen',
    recipe: 'duo', palette: 'ruby', fonts: 'poster',
    o: { title: 'Grand reopening', sub: 'New look, same friendly faces', mark: ['balloons', [], { motion: 'float' }],
      a: { kind: 'countdown', cfg: { mode: 'down', label: 'Doors open in', done: 'We are open!', style: 'tiles', units: 'days', seconds: false, theme: 'glass' } }, b: { kind: 'zone' }, split: 52 } },

  { id: 'info-duo-pharmacy-queue', name: 'Pharmacy queue and video', cat: 'Split screens', color: 'green', tags: 'now serving,pharmacy,queue,video,waiting,split screen',
    recipe: 'duo', palette: 'citrus', fonts: 'modern',
    o: { title: 'Pharmacy counter', sub: 'Thank you for waiting', mark: ['pill'],
      a: { kind: 'queue', cfg: { label: 'Now serving', prefix: 'P', digits: 3, showNext: 2, wait: 'About 10 minutes', counter: 'Pickup window', ...onCard } }, b: { kind: 'zone' }, split: 46 } },

  { id: 'info-duo-meetings-today', name: 'Today\'s meetings and a photo', cat: 'Split screens', color: 'purple', tags: 'meetings,agenda,office,schedule,two areas,split screen',
    recipe: 'duo', palette: 'lavender', fonts: 'slab',
    o: { title: 'Today\'s meetings', sub: 'Book a room at reception', mark: ['calendar'],
      a: { kind: 'table', cfg: table('Time, Meeting, Room\n9:00, Stand-up, Room 1\n10:00, Planning, Room 3\n12:30, Lunch talk, Kitchen\n3:00, Client call, Room 2') },
      b: { kind: 'zone' }, split: 58 } },

  { id: 'info-duo-fundraiser-goal', name: 'Fundraiser goal and a photo', cat: 'Split screens', color: 'brown', tags: 'fundraiser,goal,donations,progress,community,split screen',
    recipe: 'duo', palette: 'espresso', fonts: 'friendly',
    o: { title: 'Help us build it', sub: 'Every gift brings the new playground closer', mark: ['hearthands'],
      a: { kind: 'goal', cfg: { title: 'Playground fund', current: '7400', goal: '10000', source: 'typed', prefix: '$', suffix: '', style: 'bar', note: 'Thank you for giving!', ...onCard } },
      b: { kind: 'zone' }, split: 50 } },

  { id: 'info-duo-world-teams', name: 'Our teams around the world', cat: 'Split screens', color: 'black', tags: 'world clock,time zones,offices,teams,global,split screen',
    recipe: 'duo', palette: 'mono', fonts: 'modern',
    o: { title: 'Our teams', sub: 'Local time in each office', mark: ['globe'],
      a: { kind: 'worldclock', cfg: { zones: 'Denver = America/Denver\nLondon = Europe/London\nSingapore = Asia/Singapore', style: 'cards', hour12: 'auto', showDay: true, dayNight: true, theme: 'glass' } },
      b: { kind: 'zone' }, split: 52 } }
];

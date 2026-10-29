// Work: templates for offices, teams and small businesses (Business, Office life, Numbers and charts, Marketing and social).
// See README.md in this folder for how a spec works. Every name, place, handle and phone number here is made up.
module.exports = [
  // ===================================================================== Business
  { id: 'work-visitor-pass', name: 'Visitor pass', cat: 'Business', color: 'blue', tags: 'visitor,guest pass,check in,reception,front desk,lobby,welcome,badge',
    recipe: 'admit', palette: 'slate', fonts: 'modern',
    o: { kick: 'Welcome to Bluefinch Partners', admit: 'Visitor pass', title: 'Welcome, guest', details: [['Sign in', 'Front desk'], ['Wi-Fi', 'Guest'], ['Coffee', 'Floor 2']], stub: '042', stubLabel: 'Visitor',
      sub: 'Your host will meet you in the lobby', foot: 'Please wear your badge', art: [['idcard', ['#ffffff', '$accent', '#cbd5e1']], ['coffee']], back: [['dotsbg', ['$accent'], { opacity: 12 }]] } },

  { id: 'work-floor-guide', name: 'Floor guide', cat: 'Business', color: 'blue', tags: 'floor guide,directory,departments,wayfinding,office,building,lobby,map',
    recipe: 'directory', palette: 'ocean', fonts: 'poster',
    o: { kick: 'Floor guide', title: 'Find your team', clock: true, rows: [['Reception', 'Ground'], ['Sales', 'Floor 2'], ['Marketing', 'Floor 2'], ['Finance', 'Floor 3'], ['People team', 'Floor 3'], ['Engineering', 'Floor 4'], ['Board room', 'Floor 5'], ['Cafe and lounge', 'Floor 5']],
      back: [['gridbg', ['$accent'], { opacity: 22 }]] } },

  { id: 'work-design-studio', name: 'Design studio ad', cat: 'Business', color: 'coral', tags: 'services,agency,studio,design,branding,websites,about us,free quote',
    recipe: 'diagonal', palette: 'coral', fonts: 'slab',
    o: { kick: 'Willowmere Studio', title: 'Design that\nworks', sub: 'Logos, websites and campaigns for small businesses', big: ['bulb', ['$accent2', '#94a3b8', '#ffffff']], foot: 'Ask us for a free quote',
      art: [['sparkle', ['$accent', '#ffffff', '$accent2'], { motion: 'twinkle' }], ['laptop', ['$accent', '#1f2937', '#ffffff']]] } },

  { id: 'work-service-packages', name: 'Service packages', cat: 'Business', color: 'purple', tags: 'packages,prices,plans,pricing,services,agency,design,branding',
    recipe: 'prices', palette: 'lavender', fonts: 'modern',
    o: { kick: 'Willowmere Studio', title: 'Pick your package', plans: [{ name: 'Starter', price: '$499', per: 'one time', lines: ['Logo design', 'Two rounds of changes', 'Brand colors'] }, { name: 'Growth', price: '$1,499', per: 'one time', lines: ['Logo and website', 'Up to five pages', 'Three months of help'], hot: true, tag: 'Most popular' }, { name: 'Premium', price: '$2,999', per: 'one time', lines: ['Everything in Growth', 'Social media kit', 'Photo shoot'] }],
      back: [['halftone', ['$accent'], { opacity: 10 }]] } },

  { id: 'work-client-review', name: 'Client review', cat: 'Business', color: 'brown', tags: 'review,testimonial,client,feedback,quote,stars,customer,happy client',
    recipe: 'testimonial', palette: 'espresso', fonts: 'elegant',
    o: { kick: 'Kind words from a client', quote: 'They listened, made a clear plan and delivered a week early. The best partner we have ever had.', who: 'Martina V.', role: 'Owner, Marlow Street Bakery',
      foot: 'Thank you for trusting us', art: [['laurel', ['$accent', '$accent2']]], back: [['grain', ['#ffffff'], { opacity: 30 }]] } },

  { id: 'work-leadership-team', name: 'Leadership team', cat: 'Business', color: 'teal', tags: 'leadership,team,management,executives,people,about us,meet the team,staff',
    recipe: 'team', palette: 'mint', fonts: 'elegant',
    o: { kick: 'Meet our', title: 'Leadership team', people: [{ name: 'Ana Ruiz', role: 'Chief executive' }, { name: 'Marcus Lee', role: 'Operations' }, { name: 'Priya Desai', role: 'Finance' }, { name: 'Tom Okafor', role: 'Sales' }],
      back: [['rings2', ['$accent'], { opacity: 8 }]] } },

  { id: 'work-our-story', name: 'Our story', cat: 'Business', color: 'yellow', tags: 'our story,history,about us,timeline,milestones,company,since,journey',
    recipe: 'timeline', palette: 'sunshine', fonts: 'slab',
    o: { kick: 'Ridgeway Supply Co.', title: 'Our story so far', steps: [{ label: 'Day one', text: 'Two friends and one garage' }, { label: 'Year 3', text: 'Our first real shop' }, { label: 'Year 7', text: '100 clients and counting' }, { label: 'Today', text: '40 people, one big family' }],
      foot: 'Thank you for being part of it', back: [['raysup', ['$accent2', '$accent'], { opacity: 10 }]] } },

  { id: 'work-our-values', name: 'Our values', cat: 'Business', color: 'black', tags: 'values,mission,culture,company,principles,team,purpose,how we work',
    recipe: 'bigtype', palette: 'mono', fonts: 'poster',
    o: { kick: 'Our values', lines: ['Kind.', 'Bold.', 'Curious.'], sub: 'This is how we work, every single day', back: [['halftone', ['#ffffff'], { opacity: 8 }]] } },

  { id: 'work-open-roles', name: 'Open roles', cat: 'Business', color: 'pink', tags: 'hiring,jobs,careers,open roles,positions,join us,recruiting,vacancy,work here',
    recipe: 'directory', palette: 'blush', fonts: 'modern',
    o: { kick: 'Join our team', title: "We're hiring", rows: [['Sales associate', 'Full time'], ['Delivery driver', 'Part time'], ['Office assistant', 'Full time'], ['Customer support', 'Remote'], ['Warehouse lead', 'Nights']],
      back: [['blob2', ['$bg2', '$bg2'], { opacity: 80 }]] } },

  { id: 'work-book-a-call', name: 'Book a free call', cat: 'Business', color: 'green', tags: 'book,appointment,consultation,call,qr,scan,schedule,free',
    recipe: 'scan', palette: 'citrus', fonts: 'poster',
    o: { kick: 'Free 20-minute call', title: "Let's talk", sub: 'About your goals, your plans and your next step', steps: ['Scan the code', 'Pick a time', 'We call you'], codeLabel: 'Scan to book a call', foot: 'No pressure, just ideas',
      back: [['blob3', ['$bg2', '$bg2'], { opacity: 80 }]] } },

  { id: 'work-portfolio', name: 'Recent projects', cat: 'Business', color: 'green', tags: 'portfolio,projects,our work,photos,gallery,clients,design,results',
    recipe: 'polaroids', palette: 'forest', fonts: 'elegant',
    o: { kick: 'Portfolio', title: 'Our recent work', sub: 'Ask us about your next project', captions: ['Kitchen remodel', 'Cafe branding', 'Garden office'],
      art: [['star', ['$accent']]], back: [['grain', ['#ffffff'], { opacity: 20 }]] } },

  { id: 'work-trade-show-booth', name: 'Visit our booth', cat: 'Business', color: 'red', tags: 'trade show,booth,expo,conference,demo,event,visit us,fair',
    recipe: 'gig', palette: 'ruby', fonts: 'poster',
    o: { title: 'Booth 214', day: 'Thu', date: '12', month: 'Sep', lines: ['Live demos every hour', 'Free coffee and stickers', 'Win a smart speaker'], strip: 'Hall C, Riverside Expo Center',
      art: [['megaphone', ['$accent2', '#ffffff', '$accent'], { motion: 'float' }]], back: [['mesh', ['$accent2', '$bg2', '$accent'], { opacity: 25 }]] } },

  { id: 'work-webinar-ticket', name: 'Free webinar', cat: 'Business', color: 'purple', tags: 'webinar,online,workshop,training,event,ticket,free,learn',
    recipe: 'admit', palette: 'berry', fonts: 'poster',
    o: { kick: 'Free webinar', admit: 'Free webinar', title: 'Grow your small business', details: [['Date', 'Tue, March 4'], ['Time', '12 PM'], ['Where', 'Online']], stub: '108', stubLabel: 'Seat',
      sub: 'Ask at the front desk to save a seat', foot: 'Bring your questions', art: [['laptop', ['$accent', '$paperInk', '#ffffff']], ['bulb', ['$accent2', '#94a3b8', '#ffffff']]],
      back: [['aurora', ['$accent', '$accent2', '$bg2'], { opacity: 30 }]] } },

  { id: 'work-summit-countdown', name: 'Summit countdown', cat: 'Business', color: 'navy', tags: 'conference,summit,countdown,event,business,doors open,timer,networking',
    recipe: 'countdown', palette: 'midnight', fonts: 'modern',
    o: { kick: 'Small Business Summit', title: 'See you there', label: 'Doors open in', done: 'Welcome to the summit!', foot: 'Riverside Expo Center, Hall A',
      art: [['people', ['$accent', '$accent2', '#ffd166']], ['megaphone', ['$accent2', '#ffffff', '$accent']], ['star', ['$accent2']], ['sparkle', ['$accent', '#ffffff', '$accent2'], { motion: 'twinkle' }]],
      back: [['aurora', ['$accent', '$accent2', '$bg2'], { opacity: 28 }]] } },

  { id: 'work-annual-report', name: 'Annual report cover', cat: 'Business', color: 'purple', tags: 'annual report,results,year,company,report,growth,news,magazine',
    recipe: 'magazine', palette: 'lavender', fonts: 'elegant',
    o: { mast: 'REPORT', kick: 'A year at Bluefinch', title: 'A year of\ngrowth', sub: 'Our results, our people and what comes next', lines: ['Sales up 24%', 'Three new offices', '1,200 new clients'], badge: 'New',
      big: ['linechart', ['$accent', '#ffffff', '$paperInk']] } },

  { id: 'work-award-winner', name: 'Award winner', cat: 'Business', color: 'gold', tags: 'award,winner,best of,thank you,voted,recognition,proud,number one',
    recipe: 'stamp', palette: 'espresso', fonts: 'elegant',
    o: { ring: 'Best in town', center: '#1', kick: 'Voted by our customers', title: 'Thanks for\nvoting!', sub: 'Best local business, three years running', foot: 'We could not do it without you',
      art: [['laurel', ['$accent', '#7bd389']], ['star', ['$accent']], ['trophy', ['$accent', '#3d2c1e', '#ffffff']]], back: [['rays', ['$accent', '$bg2'], { opacity: 8 }]], fx: ['sparkles', { amount: 2, speed: 2 }] } },

  { id: 'work-front-desk-today', name: 'Today at the front desk', cat: 'Business', color: 'navy', tags: 'front desk,reception,today,info,visitors,wifi,meeting rooms,lobby',
    recipe: 'infoboard', palette: 'midnight', fonts: 'modern',
    o: { kick: 'Bluefinch Partners', title: 'Good morning', cards: [{ label: 'Visitors today', value: '14', art: ['people'] }, { label: 'Guest Wi-Fi', value: 'Bluefinch', art: ['wifi'] }, { label: 'Rooms free', value: '3 of 6', art: ['door'] }],
      ticker: 'Welcome to our guests\nCoffee and tea are in the lounge\nAsk us for a phone charger', label: 'Today', back: [['mesh', ['$accent', '$bg2', '$accent2'], { opacity: 22 }]] } },

  { id: 'work-lobby-two-areas', name: 'Lobby screen with two areas', cat: 'Business', color: 'purple', tags: 'split screen,lobby,video,two areas,live,office,news,reception',
    recipe: 'split2', palette: 'berry', fonts: 'modern',
    o: { title: 'Welcome to Larkspur Advisors', labels: ['Our video', 'Today'], ticker: 'Welcome to our guests\nTeam lunch on Friday\nFree parking in the back lot', label: 'News' },
    tall: { title: 'Larkspur Advisors' } },

  { id: 'work-hq-three-areas', name: 'Headquarters screen', cat: 'Business', color: 'black', tags: 'split screen,three areas,headquarters,live,video,office,dashboard,lobby',
    recipe: 'split3', palette: 'mono', fonts: 'poster',
    o: { title: 'Ridgeway Supply Co.', labels: ['Company video', 'Weather', 'Photos'], ticker: 'Record week in the warehouse\nNew hires start Monday\nThe kitchen gets a new coffee machine', label: 'Inside' } },

  { id: 'work-visitor-parking', name: 'Visitor parking', cat: 'Business', color: 'green', tags: 'parking,visitors,directions,map,lot,car,find us,guests',
    recipe: 'findus', palette: 'forest', fonts: 'poster',
    o: { kick: 'Coming by car?', title: 'Visitor parking', address: ['Lot B, behind the building', 'First two hours are free', 'Ask us to stamp your ticket'], hours: 'Gate open 7 AM to 7 PM', foot: 'Bikes go in the front rack' } },

  { id: 'work-we-moved', name: 'Moving announcement', cat: 'Business', color: 'orange', tags: 'we moved,new address,moving,relocation,new office,location,news,find us',
    recipe: 'banner', palette: 'sunshine', fonts: 'poster',
    o: { kick: 'Big news', title: 'We moved!', sub: 'Find us at 210 Cedar Avenue, 2nd floor', foot: 'Same team, more room',
      art: [['house', ['$accent', '$accent2', '#ffffff']], ['housekey', ['$accent2', '$accent', '#ffffff']], ['sparkle', ['$accent', '#ffffff', '$accent2'], { motion: 'twinkle' }]],
      back: [['confettibg', ['$accent', '$accent2', '#ffffff'], { opacity: 40 }]] } },

  { id: 'work-office-closed', name: 'Office closed', cat: 'Business', color: 'blue', tags: 'closed,office closed,holiday,hours,team day,notice,back soon,closure',
    recipe: 'datestamp', palette: 'ocean', fonts: 'poster',
    o: { month: 'June', day: '14', kick: 'Heads up', title: 'Office closed', sub: 'Our team is out for a planning day. We are back Tuesday at 9 AM.', foot: 'Urgent? Call 555-0186',
      art: [['calendar', ['#ffffff', '$accent', '$ink']], ['sun', ['$accent2', '$accent', '#ffffff']], ['clock', ['#ffffff', '$ink', '$accent']]], back: [['dotsbg', ['$accent'], { opacity: 14 }]] } },

  { id: 'work-appointment-only', name: 'By appointment only', cat: 'Business', color: 'pink', tags: 'appointment,by appointment,booking,notice,call ahead,office,schedule,visit',
    recipe: 'alert', palette: 'blush',
    o: { title: 'Please book ahead', sub: 'We see visitors by appointment only. Call 555-0142 or ask at the front desk.', tone: 'info', icon: 'calendar', foot: 'Larkspur Advisors', theme: 'paper', tape: '',
      big: ['calendar', ['#ffffff', '$accent', '$ink']], back: [['blob2', ['$bg2', '$bg2'], { opacity: 80 }]] } },

  { id: 'work-our-sponsors', name: 'Sponsor logos', cat: 'Business', color: 'blue', tags: 'sponsors,partners,thank you,logos,event,support,community,supporters',
    recipe: 'dishes', palette: 'slate', fonts: 'modern',
    o: { kick: 'With thanks to', title: 'Our event sponsors', dishes: [{ name: 'Lakeside Print Co.', note: 'Printing and signs', price: 'Gold' }, { name: 'Hilltop Roasters', note: 'Coffee all day', price: 'Silver' }, { name: 'Pine Valley Bank', note: 'Prizes and gifts', price: 'Silver' }],
      back: [['dotsbg', ['$accent'], { opacity: 10 }]] } },

  { id: 'work-thanks-great-year', name: 'Thanks for a great year', cat: 'Business', color: 'red', tags: 'thank you,clients,year end,holidays,greetings,gratitude,december,season',
    when: { kind: 'year', month: 12, day: 10, span: 22, label: 'The end of the year' },
    recipe: 'arch', palette: 'ruby', fonts: 'elegant',
    o: { kick: 'From all of us', title: 'Thank you\nfor everything', sub: 'We are grateful for every client and partner this year', foot: 'See you in the new year', big: ['gift', ['$accent2', '$accent', '#ffffff']],
      art: [['sparkle', ['$accent', '#ffffff', '$accent2'], { motion: 'twinkle' }], ['star', ['$accent']], ['star', ['$accent2']]], fx: ['snow', { amount: 2, speed: 2 }] } },

  { id: 'work-our-promise', name: 'Our service promise', cat: 'Business', color: 'teal', tags: 'promise,service,customers,values,quality,guarantee,care,commitment',
    recipe: 'checklist', palette: 'mint', fonts: 'friendly',
    o: { kick: 'Our promise to you', title: 'Count on us', items: ['We answer every call', 'We reply within one day', 'We fix it right the first time', 'We treat you like family'],
      big: ['hearthands', ['$accent2', '$accent', '#ffffff']], back: [['blob2', ['$bg2', '$bg2'], { opacity: 80 }]] } },

  { id: 'work-reach-us', name: 'Ways to reach us', cat: 'Business', color: 'orange', tags: 'contact,phone,text,visit,get in touch,customer service,help,info',
    recipe: 'features', palette: 'coral', fonts: 'poster',
    o: { kick: 'We are here to help', title: 'Get in touch', features: [{ art: ['iconphone', ['$accent', '#ffffff', '#ffffff']], title: 'Call', text: '555-0123, weekdays 9 to 5' }, { art: ['iconchat', ['$accent', '#ffffff', '#ffffff']], title: 'Text', text: '555-0124, any time' }, { art: ['pin', ['$accent', '#ffffff', '#1f2937']], title: 'Visit', text: '48 Market Street' }],
      foot: 'We reply within one day', back: [['blob1', ['$bg2', '$bg2'], { opacity: 80 }]] } },

  { id: 'work-new-owners', name: 'Under new ownership', cat: 'Business', color: 'green', tags: 'new owners,new ownership,announcement,welcome,small business,local,news,party',
    recipe: 'ribbon', palette: 'citrus', fonts: 'poster',
    o: { kick: 'Same great service', title: 'New owners!', sub: 'Say hello to Mia and Theo, the new faces behind the counter', foot: 'Welcome party on Saturday',
      art: [['housekey', ['$accent2', '$accent', '#ffffff']], ['hearthands', ['$accent', '$accent2', '#ffffff']], ['sparkle', ['$accent2', '#ffffff', '$accent'], { motion: 'twinkle' }], ['star', ['$accent2']]],
      back: [['confettibg', ['$accent', '$accent2', '#ffffff'], { opacity: 20 }]] } },

  // ===================================================================== Office life
  { id: 'work-kitchen-manners', name: 'Kitchen manners', cat: 'Office life', color: 'yellow', tags: 'kitchen,break room,rules,manners,fridge,dishes,shared space,clean up',
    recipe: 'features', palette: 'sunshine', fonts: 'friendly',
    o: { kick: 'Shared kitchen', title: 'Kitchen manners', features: [{ art: ['coffee', ['#ffffff', '#e2e8f0', '$accent']], title: 'Rinse your mug', text: 'And put it back on the rack' }, { art: ['tag', ['$accent2', '#ffffff', '$ink']], title: 'Label your food', text: 'Your name and the date, please' }, { art: ['spraybottle', ['$accent2', '$ink', '#ffffff']], title: 'Wipe it down', text: 'Counters, table and microwave' }],
      foot: 'Fridge clean-out every Friday at 4', back: [['dotsbg', ['$accent'], { opacity: 12 }]] } },

  { id: 'work-birthdays-month', name: 'Team birthdays banner', cat: 'Office life', color: 'pink', tags: 'birthday,birthdays,celebrate,team,cake,party,office,happy birthday',
    recipe: 'banner', palette: 'blush', fonts: 'friendly',
    o: { kick: 'This month we celebrate', title: 'Happy\nbirthday!', sub: 'Jada, Leo, Sofia and Ben', foot: 'Cake in the kitchen at 3 PM',
      art: [['cake', ['$accent', '#ffffff', '$accent2']], ['balloons', ['$accent', '$accent2', '#4cc9f0'], { motion: 'float' }], ['partyhat', ['$accent', '$accent2', '#4cc9f0']]],
      fx: ['balloons', { amount: 2, speed: 2 }] } },

  { id: 'work-new-faces', name: 'New faces', cat: 'Office life', color: 'coral', tags: 'new hires,welcome,new team members,onboarding,staff,introductions,people,photos',
    recipe: 'polaroids', palette: 'coral', fonts: 'handmade',
    o: { kick: 'Please welcome', title: 'New faces', sub: 'Say hi when you see them around the office', captions: ['Maya, Design', 'Chris, Sales', 'Ines, Support'],
      art: [['sparkle', ['$accent', '#ffffff', '$accent2'], { motion: 'twinkle' }]] } },

  { id: 'work-anniversaries', name: 'Work anniversaries', cat: 'Office life', color: 'purple', tags: 'work anniversary,years of service,milestone,team,celebrate,recognition,staff,thank you',
    recipe: 'team', palette: 'lavender', fonts: 'elegant',
    o: { kick: 'Happy work anniversary', title: 'Cheers to you!', people: [{ name: 'Rosa M.', role: '10 years' }, { name: 'Kenji T.', role: '5 years' }, { name: 'Amara O.', role: '3 years' }, { name: 'Luis P.', role: '1 year' }],
      back: [['confettibg', ['$accent', '$accent2', '#ffffff'], { opacity: 30 }]] } },

  { id: 'work-kudos-board', name: 'Kudos board', cat: 'Office life', color: 'brown', tags: 'kudos,thank you,shout out,recognition,appreciation,notes,team,praise',
    recipe: 'corkboard', palette: 'espresso', fonts: 'handmade',
    o: { title: 'Kudos board', notes: ['Thanks, Sam, for staying late to help!', 'Nina made the best slides ever', 'Huge win, sales team!', 'Welcome back, Jo!'], sub: 'Grab a note and thank someone today',
      art: [['heart', ['$accent2']], ['star', ['$accent']]] } },

  { id: 'work-shout-out', name: 'Shout-out of the week', cat: 'Office life', color: 'green', tags: 'shout out,kudos,thank you,recognition,teammate,appreciation,praise,hero',
    recipe: 'testimonial', palette: 'citrus', fonts: 'elegant',
    o: { kick: 'Shout-out of the week', quote: 'Priya fixed the order system before anyone noticed it was down. Our customers never missed a beat.', who: 'To Priya S.', role: 'From the whole support team',
      foot: 'Want to thank someone? Tell your manager', art: [['raisedhand', ['$accent2', '$accent', '#ffffff']]], back: [['dotsbg', ['$accent'], { opacity: 12 }]] } },

  { id: 'work-employee-spotlight', name: 'Employee spotlight', cat: 'Office life', color: 'red', tags: 'employee spotlight,meet,teammate,profile,staff,people,feature,team member',
    recipe: 'magazine', palette: 'ruby', fonts: 'elegant',
    o: { mast: 'SPOTLIGHT', kick: 'Meet a teammate', title: 'Carlos\nMendez', sub: 'Warehouse lead, six years with us', lines: ['Loves hiking and salsa', 'Calm in any rush', 'Speaks three languages'], badge: 'Star' } },

  { id: 'work-lunch-and-learn', name: 'Lunch and learn', cat: 'Office life', color: 'purple', tags: 'lunch and learn,workshop,training,talk,lunch,learning,event,session',
    recipe: 'admit', palette: 'lavender', fonts: 'poster',
    o: { kick: 'Lunch and learn', admit: 'Lunch and learn', title: 'Better slides', details: [['Date', 'Wed, May 7'], ['Time', '12:15 PM'], ['Room', 'Maple room']], stub: '24', stubLabel: 'Seats',
      sub: 'A 30-minute talk. Lunch is on us!', foot: 'Sign up by Monday', art: [['laptop', ['$accent', '$paperInk', '#ffffff']], ['pizza']], back: [['blob3', ['$bg2', '$bg2'], { opacity: 80 }]] } },

  { id: 'work-quiz-lunch', name: 'Office quiz lunch', cat: 'Office life', color: 'purple', tags: 'quiz,trivia,lunch,team building,game,fun,prizes,office',
    recipe: 'gig', palette: 'berry', fonts: 'poster',
    o: { title: 'Quiz\nlunch', day: 'Thu', date: '18', month: 'Apr', lines: ['Teams of four', 'Pizza and prizes', 'Sign up in the kitchen'], strip: 'Break room, 12:30 PM',
      art: [['bulb', ['$accent2', '#94a3b8', '#ffffff'], { motion: 'pulse' }]], back: [['dotsbg', ['$accent'], { opacity: 10 }]] } },

  { id: 'work-team-potluck', name: 'Team potluck', cat: 'Office life', color: 'green', tags: 'potluck,lunch,food,team,sign up,party,share,office party',
    recipe: 'dishes', palette: 'citrus', fonts: 'friendly',
    o: { kick: 'Friday at noon', title: 'Team potluck', dishes: [{ name: 'Bring a main', note: 'Pasta, chili or curry', price: '4 spots left', art: ['bowl'] }, { name: 'Bring a side', note: 'Salad, bread or rice', price: '2 spots left', art: ['bread'] }, { name: 'Bring a sweet', note: 'Cookies, fruit or cake', price: '5 spots left', art: ['cupcake'] }] } },

  { id: 'work-whos-in-today', name: "Who's in today", cat: 'Office life', color: 'blue', tags: 'who is in,hybrid,remote,in office,team status,attendance,today,schedule',
    recipe: 'directory', palette: 'slate', fonts: 'modern',
    o: { kick: 'Team status', title: "Who's in today", clock: true, rows: [['Ana R.', 'In office'], ['Ben T.', 'Remote'], ['Chloe W.', 'In office'], ['Dev P.', 'On leave'], ['Eli S.', 'Remote'], ['Farah N.', 'In office'], ['Gabe L.', 'Client visit'], ['Hana K.', 'In office']] } },

  { id: 'work-what-goes-where', name: 'What goes where', cat: 'Office life', color: 'blue', tags: 'recycling,trash,bins,sorting,green office,compost,waste,environment',
    recipe: 'directory', palette: 'ocean', fonts: 'friendly',
    o: { kick: 'Sort it right', title: 'What goes where', rows: [['Paper and cardboard', 'Blue bin'], ['Cans and bottles', 'Yellow bin'], ['Food scraps', 'Green bin'], ['Batteries', 'Front desk'], ['Everything else', 'Gray bin']],
      back: [['dotsbg', ['$accent2'], { opacity: 14 }]] } },

  { id: 'work-meeting-room-manners', name: 'Meeting room manners', cat: 'Office life', color: 'navy', tags: 'meeting room,rules,booking,etiquette,conference room,office,tidy,manners',
    recipe: 'checklist', palette: 'midnight', fonts: 'modern',
    o: { kick: 'Meeting rooms', title: 'Room manners', sub: 'Help the next team start on time', items: ['Book the room first', 'Start and end on time', 'Wipe the whiteboard', 'Chairs back in place', 'Lights off when you go'],
      big: ['clock', ['#ffffff', '$bg1', '$accent']], back: [['gridbg', ['#ffffff'], { opacity: 30 }]] } },

  { id: 'work-spot-fake-email', name: 'Spot a fake email', cat: 'Office life', color: 'black', tags: 'security,phishing,email,scam,it,cyber,safety,awareness',
    recipe: 'steps', palette: 'mono', fonts: 'modern',
    o: { kick: 'Stay safe online', title: 'Spot a fake email', steps: [{ title: 'Check the sender', text: 'A strange name or address? Stop.' }, { title: 'Do not click', text: 'Links and files can hide traps' }, { title: 'Report it', text: 'Forward it to the IT team' }],
      foot: 'When in doubt, ask IT', back: [['gridbg', ['#ffffff'], { opacity: 25 }]] } },

  { id: 'work-coffee-machine', name: 'Coffee machine 101', cat: 'Office life', color: 'brown', tags: 'coffee,coffee machine,how to,kitchen,break room,espresso,instructions,steps',
    recipe: 'steps', palette: 'espresso', fonts: 'slab',
    o: { kick: 'Break room', title: 'Coffee machine 101', steps: [{ title: 'Fill', text: 'Water up to the line on the tank' }, { title: 'Pick', text: 'Choose your drink on the screen' }, { title: 'Clean', text: 'Empty the tray when it blinks' }],
      foot: 'Out of beans? Tell the front desk', back: [['grain', ['#ffffff'], { opacity: 25 }]] } },

  { id: 'work-snack-shelf', name: 'Snack shelf prices', cat: 'Office life', color: 'yellow', tags: 'snacks,honor system,prices,break room,kitchen,vending,treats,pay',
    recipe: 'receipt', palette: 'sunshine', fonts: 'handmade',
    o: { kick: 'Honor system', title: 'Snack shelf prices', sub: 'Drop cash in the jar or tap the card reader', shop: 'Break room snacks', shopSub: 'Pay at the jar', items: 'Granola bar | 1.00\nChips | 1.00\nSparkling water | 1.50\nDark chocolate | 2.00\nTrail mix | 2.50',
      thanks: 'Thanks for keeping it fair!', foot: 'New snacks every Monday', art: [['donut'], ['juice']] } },

  { id: 'work-volunteer-day', name: 'Volunteer day', cat: 'Office life', color: 'green', tags: 'volunteer,give back,community,team day,charity,park,cleanup,outreach',
    recipe: 'paper', palette: 'forest', fonts: 'friendly',
    o: { land: 'hills', landCols: ['$bg2', '$accent2', '#2b9348'], kick: 'Give back day', title: 'Volunteer day', sub: 'Saturday at River Park. Gloves and lunch for all.',
      art: [['sun', ['$accent', '#fb8500', '#ffffff']], ['cloud'], ['seedling', ['$accent2', '#8b5a2b', '#ffffff']], ['hearthands', ['$accent', '$accent2', '#ffffff']], ['butterfly', ['$accent', '$accent2', '#1f2937'], { motion: 'float' }]] } },

  { id: 'work-retirement', name: 'Retirement party', cat: 'Office life', color: 'red', tags: 'retirement,farewell,celebration,party,thank you,congratulations,career,goodbye',
    recipe: 'sunburst', palette: 'ruby', fonts: 'poster',
    o: { kick: 'Happy retirement', title: 'Thank you,\nLinda!', sub: '32 years of wisdom and kindness', foot: 'Cake and toasts on Friday at 4 PM',
      art: [['champagne', ['$accent', '#ffffff', '$accent']], ['balloons', ['$accent2', '$accent', '#ffffff'], { motion: 'float' }], ['star', ['$accent']], ['sparkle', ['$accent', '#ffffff', '$accent2'], { motion: 'twinkle' }], ['confetti']],
      fx: ['confetti', { amount: 2, speed: 2 }] } },

  { id: 'work-farewell', name: 'Farewell and good luck', cat: 'Office life', color: 'pink', tags: 'farewell,goodbye,good luck,leaving,last day,party,miss you,send off',
    recipe: 'arch', palette: 'blush', fonts: 'elegant',
    o: { kick: 'Good luck, Omar', title: "We'll miss you", sub: 'Coffee and cake on Friday at 3 PM in the lounge', foot: 'Sign the card at the front desk', big: ['plane', ['#ffffff', '$accent', '#cbd5e1']],
      art: [['heart', ['$accent']], ['sparkle', ['$accent2', '#ffffff', '$accent']], ['star', ['$accent2']]] } },

  { id: 'work-happy-friday', name: 'Happy Friday', cat: 'Office life', color: 'navy', tags: 'friday,weekend,happy friday,end of week,fun,team,tgif,break',
    when: { kind: 'week', days: [5], label: 'Fridays' },
    recipe: 'neon', palette: 'midnight', fonts: 'glow',
    o: { kick: 'You made it', title: 'Happy Friday', sub: 'Wrap it up and enjoy the weekend', foot: 'Snacks in the kitchen at 4',
      art: [['lcocktail', ['$accent2']], ['lstar', ['$accent']], ['lsparkle', ['$accent2']]], back: [['brick', ['$bg2', '#14203a', '$bg1'], { opacity: 60 }]] } },

  { id: 'work-monday-kickoff', name: 'Monday kick-off', cat: 'Office life', color: 'coral', tags: 'monday,kick off,stand up,new week,motivation,team meeting,goals,morning',
    when: { kind: 'week', days: [1], start: '06:00', end: '12:00', label: 'Monday mornings' },
    recipe: 'diagonal', palette: 'coral', fonts: 'poster',
    o: { kick: 'New week, fresh start', title: 'Monday\nkick-off', sub: 'Stand-up at 9:30 in the big room. Bring your top three.', big: ['coffee', ['#ffffff', '#e2e8f0', '#6b3e26']], foot: "Let's make it count",
      art: [['sparkle', ['$accent2', '#ffffff', '$accent'], { motion: 'twinkle' }], ['sun', ['$accent2', '$accent', '#ffffff']]] } },

  { id: 'work-quiet-zone', name: 'Quiet zone', cat: 'Office life', color: 'teal', tags: 'quiet,focus,quiet zone,silence,deep work,calls,open office,concentration',
    recipe: 'split', palette: 'mint', fonts: 'elegant',
    o: { kick: 'Focus area', title: 'Quiet zone', sub: 'Please take calls and chats to the lounge. Thank you!', foot: 'Phone booths are on floor 2', big: ['headphones', ['$accent', '$accent2', '#ffffff']],
      art: [['lsparkle', ['$accent']], null, ['lstar', ['$accent2']]] } },

  { id: 'work-gift-swap', name: 'Gift swap', cat: 'Office life', color: 'green', tags: 'gift swap,gift exchange,holiday party,christmas,december,office party,game,fun',
    when: 'christmasseason', recipe: 'admit', palette: 'mint', fonts: 'friendly',
    o: { kick: 'Holiday party', admit: 'Holiday party game', title: 'Gift swap', details: [['Date', 'Fri, Dec 19'], ['Time', '3 PM'], ['Bring', 'A $20 gift']], stub: '12', stubLabel: 'Your no.',
      sub: 'Draw a number, open a gift or steal one!', foot: 'Wrap it, no name on it', art: [['gift', ['$accent', '$accent2', '#ffffff']], ['ornament', ['#e63946', '$accent2', '#ffd166'], { motion: 'swing' }]],
      fx: ['snow', { amount: 2, speed: 2 }] } },

  { id: 'work-costume-contest', name: 'Costume contest vote', cat: 'Office life', color: 'purple', tags: 'halloween,costume,contest,vote,october,office,photos,fun',
    when: 'halloween', recipe: 'polaroids', palette: 'berry', fonts: 'handmade',
    o: { kick: 'Halloween costume contest', title: 'Vote for the best!', sub: 'Drop your vote in the jar by 3 PM', captions: ['No. 1: The robot', 'No. 2: Night owl', 'No. 3: Sea witch'],
      art: [['jackolantern', ['#f77f00', '#386641', '$accent2'], { motion: 'float' }]], back: [['web', ['#ffffff'], { opacity: 8 }]], fx: ['leaves', { amount: 1, speed: 2 }] } },

  { id: 'work-appreciation-day', name: 'Employee Appreciation Day', cat: 'Office life', color: 'blue', tags: 'employee appreciation,thank you,team,march,recognition,staff,gratitude,celebrate',
    when: { kind: 'nth', month: 3, nth: 1, weekday: 5, label: 'Employee Appreciation Day' },
    recipe: 'stamp', palette: 'ocean', fonts: 'slab',
    o: { ring: 'Thank you team', center: 'A+', kick: 'Employee Appreciation Day', title: 'You make\nit work', sub: 'Treats in the kitchen all day, on us', foot: 'Thank you for everything',
      art: [['star', ['$accent2']], ['heart', ['$accent']], ['sparkle', ['$accent', '#ffffff', '$accent2'], { motion: 'twinkle' }]], fx: ['confetti', { amount: 1, speed: 2 }] } },

  { id: 'work-wellness-week', name: 'Wellness at work', cat: 'Office life', color: 'blue', tags: 'wellness,health,week,yoga,stretch,self care,activities,schedule',
    recipe: 'schedule', palette: 'slate', fonts: 'friendly',
    o: { kick: 'Wellness at work', title: 'Feel-good week', sub: 'Join any session. No sign-up needed.', big: ['yogamat', ['$accent', '#ffffff', '#ffffff']],
      rows: [['Mon', 'Desk stretches', 'Room 2'], ['Tue', 'Fruit bar', 'Kitchen'], ['Wed', 'Walking meeting', 'Lobby'], ['Thu', 'Chair massage', 'Lounge'], ['Fri', 'Yoga at lunch', 'Roof deck']] } },

  { id: 'work-team-photo-day', name: 'Team photo day', cat: 'Office life', color: 'black', tags: 'photo day,team photo,picture,headshots,smile,camera,staff,portraits',
    recipe: 'photo', palette: 'mono', fonts: 'elegant',
    o: { kick: 'Smile!', title: 'Team photo day', sub: 'Thursday at 11 AM in the courtyard. Wear something blue!', caption: 'Last time, we looked great', foot: 'Headshots after, 1 to 3 PM',
      art: [['camera', ['#e2e8f0', '#94a3b8', '$accent2']], ['sparkle', ['#ffffff', '#ffffff', '#ffffff'], { motion: 'twinkle' }]] } },

  { id: 'work-bike-to-work', name: 'Bike to Work Day', cat: 'Office life', color: 'green', tags: 'bike,cycling,commute,bike to work,may,green,health,breakfast',
    when: { kind: 'nth', month: 5, nth: 3, weekday: 5, label: 'Bike to Work Day' },
    recipe: 'hero', palette: 'forest', fonts: 'friendly',
    o: { kick: 'Bike to Work Day', title: 'Pedal in\nwith us', sub: 'Free breakfast at the bike rack, 7 to 9 AM', foot: 'Helmets on, everyone!',
      art: [['bicycle', ['$accent', '#ffffff', '#ffffff']], ['sun', ['$accent', '#fb8500', '#ffffff']], ['leaf', ['$accent2', '#2d6a4f', '#ffffff']], ['coffee'], ['seedling', ['$accent2', '#8b5a2b', '#ffffff']], ['cloud']] } },

  // ===================================================================== Numbers and charts
  { id: 'work-orders-by-channel', name: 'Orders by channel', cat: 'Numbers and charts', color: 'navy', tags: 'orders,channels,online,in store,charts,donut,sales,week',
    recipe: 'duo', palette: 'midnight', fonts: 'modern',
    o: { title: 'Where orders come from', sub: 'This week, 1,284 orders in all', mark: ['cart', ['#ffffff', '$accent', '#ffffff']], split: 50,
      a: { kind: 'chart', cfg: { kind: 'donut', title: 'By channel', data: 'In store, 616\nOnline, 475\nPhone, 193', labels: true, theme: 'glass', cAccent: '$accent' } },
      b: { kind: 'chart', cfg: { kind: 'bar', title: 'By day', data: 'Mon, 160\nTue, 172\nWed, 181\nThu, 190\nFri, 236\nSat, 205\nSun, 140', labels: true, theme: 'glass', cAccent: '$accent' } },
      back: [['mesh', ['$accent', '$bg2', '$accent2'], { opacity: 25 }]] } },

  { id: 'work-production-floor', name: 'Production floor', cat: 'Numbers and charts', color: 'green', tags: 'production,factory,warehouse,kpi,units,quality,shipping,dashboard',
    recipe: 'stats', palette: 'forest', fonts: 'poster',
    o: { title: 'Production today', theme: 'glass',
      kpis: [{ title: 'Units made', value: '3420', prefix: '', compare: '3180', icon: 'cube', series: '2900,3050,3100,2980,3180,3300,3420', source: 'typed', cAccent: '$accent' },
        { title: 'Defect rate', value: '0.8', prefix: '', suffix: '%', decimals: 1, compare: '1.1', goodWhen: 'down', icon: 'target', series: '1.6,1.4,1.3,1.2,1.1,0.9,0.8', source: 'typed', cAccent: '$accent' },
        { title: 'Shipped on time', value: '98', prefix: '', suffix: '%', compare: '96', icon: 'speed', series: '93,94,96,95,96,97,98', source: 'typed', cAccent: '$accent' }],
      chart: { kind: 'bar', title: 'Units by shift', data: 'Early, 1240\nDay, 1310\nLate, 870', cAccent: '$accent' },
      back: [['gridbg', ['#ffffff'], { opacity: 30 }]] } },

  { id: 'work-budget-split', name: 'Where the money goes', cat: 'Numbers and charts', color: 'purple', tags: 'budget,money,spending,pie chart,donut,costs,finance,breakdown',
    recipe: 'board', palette: 'lavender', fonts: 'modern',
    o: { title: 'Where the money goes', sub: 'Our budget for this year', mark: ['calculator', ['$accent', '#ffffff', '$accent2']], kind: 'chart',
      cfg: { kind: 'donut', title: '', data: 'Staff, 52\nRent, 18\nAds, 12\nTools, 10\nOther, 8', suffix: '%', labels: true, theme: 'paper', cAccent: '$accent', cText: '$paperInk' },
      tallH: 44, tallArt: ['piggybank', ['$accent2', '$accent', '$paperInk'], { motion: 'float' }], back: [['blob2', ['$bg2', '$bg2'], { opacity: 70 }]] } },

  { id: 'work-website-visits', name: 'Website visitors', cat: 'Numbers and charts', color: 'blue', tags: 'website,visitors,traffic,online,line chart,analytics,week,numbers',
    recipe: 'board', palette: 'ocean', fonts: 'poster',
    o: { title: 'Website visitors', sub: 'This week, day by day', mark: ['iconweb', ['$accent', '#ffffff', '#ffffff']], kind: 'chart',
      cfg: { kind: 'line', title: '', data: 'Mon, 820\nTue, 940\nWed, 1010\nThu, 980\nFri, 1240\nSat, 760\nSun, 690', labels: true, theme: 'paper', cAccent: '$accent', cText: '$paperInk' },
      foot: 'Best day: Friday\nMost visited page: Gift cards\nNew visitors: 61%', footLabel: 'This week', footAccent: '$accent', tallH: 46, tallArt: ['laptop', ['$accent', '$ink', '#ffffff']] } },

  { id: 'work-survey-results', name: 'Survey results', cat: 'Numbers and charts', color: 'yellow', tags: 'survey,results,feedback,customers,bar chart,poll,rating,how did we do',
    recipe: 'board', palette: 'sunshine', fonts: 'slab',
    o: { title: 'You told us', sub: 'How did we do? 860 customer answers this month', mark: ['speech', ['#ffffff', '$accent', '#ffffff']], kind: 'chart',
      cfg: { kind: 'hbar', title: '', data: 'Loved it, 64\nLiked it, 25\nIt was okay, 8\nNot great, 3', suffix: '%', labels: true, theme: 'paper', cAccent: '$accent', cText: '$paperInk' },
      tallH: 40, tallArt: ['stars5', ['$accent', '$accent2', '#ffffff']], back: [['dotsbg', ['$accent'], { opacity: 12 }]] } },

  { id: 'work-monthly-target', name: 'Monthly target', cat: 'Numbers and charts', color: 'blue', tags: 'target,goal,sales,progress,ring,chart,month,team',
    recipe: 'duo', palette: 'slate', fonts: 'modern',
    o: { title: 'Monthly target', sub: 'We are almost there!', mark: ['target', ['$accent', '#ffffff', '$ink']], split: 44,
      a: { kind: 'goal', cfg: { title: 'Sales so far', current: '72', goal: '100', prefix: '$', suffix: 'k', style: 'ring', note: 'Keep going, team!', source: 'typed', theme: 'paper', cAccent: '$accent' } },
      b: { kind: 'chart', cfg: { kind: 'bar', title: 'Sales by week', data: 'Week 1, 14\nWeek 2, 17\nWeek 3, 19\nWeek 4, 22', prefix: '$', suffix: 'k', labels: true, theme: 'paper', cAccent: '$accent' } },
      back: [['gridbg', ['$accent'], { opacity: 18 }]] } },

  { id: 'work-quarter-results', name: 'Quarter results', cat: 'Numbers and charts', color: 'blue', tags: 'quarter,results,numbers,stats,growth,sales,clients,update',
    recipe: 'bigstats', palette: 'slate', fonts: 'poster',
    o: { kick: 'Quarterly update', title: 'Q3 results', sub: 'A strong quarter, thanks to all of you', stats: [{ value: '$2.4M', label: 'Sales', art: ['coins'] }, { value: '312', label: 'New clients', art: ['people'] }, { value: '87%', label: 'Repeat clients', art: ['hearthands', ['$accent', '$accent2', '#ffffff']] }, { value: '+18%', label: 'Growth', art: ['chart', ['$accent', '$accent2', '$ink']] }],
      back: [['halftone', ['$accent'], { opacity: 8 }]] } },

  { id: 'work-energy-use', name: 'Energy use', cat: 'Numbers and charts', color: 'green', tags: 'energy,electricity,green,savings,bar chart,sustainability,monthly,environment',
    recipe: 'board', palette: 'citrus', fonts: 'friendly',
    o: { title: 'Our energy use', sub: 'Down 18% since we switched to LED lights', mark: ['bolt', ['$accent2', '#ffffff', '#ffffff']], kind: 'chart',
      cfg: { kind: 'bar', title: 'Kilowatt hours each month', data: 'Jan, 420\nFeb, 405\nMar, 380\nApr, 360\nMay, 345\nJun, 330', labels: true, theme: 'paper', cAccent: '$accent', cText: '$paperInk' },
      tallH: 44, tallArt: ['seedling', ['$accent', '#8b5a2b', '#ffffff'], { motion: 'float' }], back: [['leavesbg', ['$accent', '$bg2', '$accent2'], { opacity: 12 }]] } },

  { id: 'work-team-in-numbers', name: 'Our team in numbers', cat: 'Numbers and charts', color: 'coral', tags: 'team,numbers,stats,fun facts,people,company,culture,coffee',
    recipe: 'bigstats', palette: 'coral', fonts: 'slab',
    o: { kick: 'Bluefinch Partners', title: 'Our team in numbers', stats: [{ value: '64', label: 'Teammates', art: ['people'] }, { value: '12', label: 'New this year', art: ['sparkle', ['$accent2', '#ffffff', '$accent']] }, { value: '9', label: 'Languages', art: ['globe'] }, { value: '3,200', label: 'Cups of coffee', art: ['coffee'] }],
      foot: 'And counting!', back: [['dotsbg', ['$accent'], { opacity: 10 }]] } },

  { id: 'work-customer-happiness', name: 'Customer happiness', cat: 'Numbers and charts', color: 'purple', tags: 'customer happiness,satisfaction,survey,percent,score,feedback,thank you,results',
    recipe: 'swiss', palette: 'berry', fonts: 'poster',
    o: { num: '97%', kick: 'Customer happiness', title: 'Happy customers this month', sub: 'From 1,240 survey answers. Thank you for every one.', foot: 'Our goal: 98%', art: [['heart', ['$accent']]],
      back: [['gridbg', ['#ffffff'], { opacity: 18 }]] } },

  { id: 'work-record-day', name: 'Record day', cat: 'Numbers and charts', color: 'brown', tags: 'record,orders,best day,milestone,sales,celebrate,team,numbers',
    recipe: 'swiss', palette: 'espresso', fonts: 'slab',
    o: { num: '1,284', numFx: 'outline', kick: 'New record', title: 'Orders in one day', sub: 'Our busiest day ever. Pizza is on us Friday!', foot: 'Thank you, team', art: [['trophy', ['$accent', '#3d2c1e', '#ffffff']]],
      back: [['grain', ['#ffffff'], { opacity: 25 }]] } },

  { id: 'work-milestone-customers', name: 'Customer milestone', cat: 'Numbers and charts', color: 'red', tags: 'milestone,customers,thank you,celebrate,record,10000,big number,proud',
    recipe: 'bigtype', palette: 'ruby', fonts: 'poster',
    o: { kick: 'We did it', lines: ['10,000', 'happy', 'customers'], sub: 'Thank you for every visit, every order and every kind word', fx: ['confetti', { amount: 2, speed: 2 }] } },

  { id: 'work-roadmap', name: 'Our roadmap', cat: 'Numbers and charts', color: 'teal', tags: 'roadmap,plan,goals,quarters,timeline,strategy,future,company',
    recipe: 'timeline', palette: 'mint', fonts: 'modern',
    o: { kick: 'Where we are going', title: 'Our roadmap', steps: [{ label: 'Q1', text: 'New ordering app' }, { label: 'Q2', text: 'A second warehouse' }, { label: 'Q3', text: 'Same-day delivery' }, { label: 'Q4', text: 'Two new cities' }],
      foot: 'Questions? Bring them to the town hall', back: [['gridbg', ['$accent'], { opacity: 16 }]] } },

  { id: 'work-project-progress', name: 'Project progress', cat: 'Numbers and charts', color: 'brown', tags: 'project,progress,status,milestones,checklist,launch,team,update',
    recipe: 'checklist', palette: 'espresso', fonts: 'poster',
    o: { kick: 'Project Falcon', title: 'Where we are', sub: 'Three of five steps done. Launch is in sight!', items: ['Research', 'Design', 'Build', 'Test', 'Launch'], done: 3,
      big: ['rocket', ['#ffffff', '$accent', '$accent2']], back: [['grain', ['#ffffff'], { opacity: 25 }]] } },

  { id: 'work-hiring-funnel', name: 'Hiring this quarter', cat: 'Numbers and charts', color: 'pink', tags: 'hiring,recruiting,funnel,applications,interviews,new hires,numbers,team growth',
    recipe: 'steps', palette: 'blush', fonts: 'friendly',
    o: { kick: 'Hiring this quarter', title: 'From hello to hired', steps: [{ title: '240 applied', text: 'For six open roles' }, { title: '48 interviews', text: 'Over three busy weeks' }, { title: '6 hired', text: 'Welcome aboard, everyone!' }],
      foot: 'Know someone great? Refer them', back: [['blob1', ['$bg2', '$bg2'], { opacity: 80 }]] } },

  { id: 'work-support-desk', name: 'Support today', cat: 'Numbers and charts', color: 'blue', tags: 'support,help desk,tickets,customer service,wait time,today,team,numbers',
    recipe: 'infoboard', palette: 'ocean', fonts: 'poster',
    o: { kick: 'Customer support', title: 'Support today', cards: [{ label: 'Open tickets', value: '12', art: ['speech'] }, { label: 'Solved today', value: '48', art: ['check'] }, { label: 'Average wait', value: '3 min', art: ['clock'] }],
      ticker: 'Great work, team!\nNew help articles are live\nBusiest hours: 10 AM to 1 PM', label: 'Support', back: [['dotsbg', ['$accent'], { opacity: 12 }]] } },

  { id: 'work-star-rating', name: 'Star rating', cat: 'Numbers and charts', color: 'yellow', tags: 'rating,stars,reviews,customers,score,feedback,thank you,five stars',
    recipe: 'stamp', palette: 'sunshine', fonts: 'slab',
    o: { ring: 'Customer rating', center: '4.9', kick: 'Out of 5 stars', title: '2,300 reviews', sub: 'Thank you for every kind word and every star', foot: 'Leave yours at the counter',
      art: [['star', ['$accent']], ['heart', ['$accent2']], ['sparkle', ['$accent', '#ffffff', '$accent2'], { motion: 'twinkle' }]], back: [['starsbg', ['$accent', '$accent2', '#ffffff'], { opacity: 16 }]] } },

  { id: 'work-quarter-countdown', name: 'End of quarter countdown', cat: 'Numbers and charts', color: 'navy', tags: 'quarter,countdown,deadline,goal,sales,finish strong,timer,target',
    recipe: 'countdown', palette: 'midnight', fonts: 'poster',
    o: { kick: 'Finish strong', title: 'End of quarter', label: 'Time left to hit our goal', done: 'Quarter closed. Great work!', foot: 'We are at 86% of our goal',
      art: [['target', ['$accent2', '#ffffff', '$bg1']], ['chart', ['$accent', '$accent2', '#ffffff']], ['rocket', ['#ffffff', '$accent', '$accent2']], ['star', ['$accent2']]],
      back: [['gridbg', ['#ffffff'], { opacity: 22 }]] } },

  { id: 'work-store-scoreboard', name: 'Store scoreboard', cat: 'Numbers and charts', color: 'purple', tags: 'scoreboard,ranking,stores,branches,sales,leaderboard,competition,month',
    recipe: 'directory', palette: 'lavender', fonts: 'poster',
    o: { kick: 'Sales this month', title: 'Store scoreboard', rows: [['1. Riverside', '$128,400'], ['2. Oak Hill', '$114,900'], ['3. Cedar Park', '$102,300'], ['4. Pine Valley', '$96,700'], ['5. Lakeview', '$88,100'], ['6. Westgate', '$79,500']],
      back: [['halftone', ['$accent'], { opacity: 10 }]] } },

  { id: 'work-dollar-breakdown', name: 'Where your dollar goes', cat: 'Numbers and charts', color: 'green', tags: 'money,where it goes,breakdown,transparency,local,prices,costs,receipt',
    recipe: 'receipt', palette: 'citrus', fonts: 'slab',
    o: { kick: 'Where your money goes', title: 'Every dollar,\nexplained', sub: 'We think you should know', shop: 'Your $1 at work', shopSub: 'Fennel and Fig Cafe', items: 'Food from farmers | 0.38\nOur team | 0.32\nRent and power | 0.18\nOur savings | 0.07\nRepairs | 0.05',
      total: ['Total', '$1.00'], thanks: 'Thank you for eating local!', foot: 'Ask us anything', art: [['seedling', ['$accent', '#8b5a2b', '#ffffff']], ['coins']] } },

  { id: 'work-numbers-notes', name: 'Numbers on the board', cat: 'Numbers and charts', color: 'coral', tags: 'numbers,this week,notes,results,wins,team,board,update',
    recipe: 'corkboard', palette: 'coral', fonts: 'handmade',
    o: { title: 'Week in numbers', notes: ['3 new clients', '98% on time', '12 happy reviews', '0 safety incidents'], sub: 'Great work, everyone!', art: [['chart', ['$accent', '$accent2', '$ink']], ['star', ['$accent2']]] } },

  { id: 'work-monthly-report', name: 'Monthly report', cat: 'Numbers and charts', color: 'purple', tags: 'monthly report,results,numbers,growth,update,magazine,cover,sales',
    recipe: 'magazine', palette: 'berry', fonts: 'elegant',
    o: { mast: 'MONTHLY', kick: 'The numbers issue', title: 'Our best\nmonth yet', sub: 'Every number went the right way', lines: ['Sales up 12%', 'Costs down 4%', 'Record week: 2,140 orders'], badge: '+12%',
      big: ['barchart', ['$accent2', '$paperInk', '$paperInk']] } },

  { id: 'work-goal-reached', name: 'Goal reached', cat: 'Numbers and charts', color: 'red', tags: 'goal reached,target,celebrate,sales,quarter,win,thank you,party',
    recipe: 'banner', palette: 'ruby', fonts: 'poster',
    o: { kick: 'We did it!', title: 'Goal\nreached!', sub: '$100,000 in sales this quarter. Thank you, team!', foot: 'Party on Friday at 4',
      art: [['trophy', ['$accent', '#3d2c1e', '#ffffff']], ['target', ['$accent2', '#ffffff', '$bg1']], ['confetti', ['$accent', '$accent2', '#ffffff']]], fx: ['confetti', { amount: 3, speed: 3 }] } },

  { id: 'work-live-dashboard', name: 'Live dashboard screen', cat: 'Numbers and charts', color: 'black', tags: 'dashboard,live,split screen,sales floor,charts,two areas,kpi,office',
    recipe: 'split2', palette: 'mono', fonts: 'modern',
    o: { title: 'Sales floor', labels: ['Live sales', 'Team goals'], ticker: 'New record: 84 orders before noon\nTeam North leads the week\nCall-backs due by 3 PM', label: 'Live' } },

  { id: 'work-uptime-count', name: 'Days without downtime', cat: 'Numbers and charts', color: 'green', tags: 'uptime,it,systems,count up,days,record,servers,reliability',
    recipe: 'countdown', palette: 'forest', fonts: 'modern',
    o: { kick: 'All systems go', title: 'Days without downtime', up: true, days: true, cstyle: 'big', label: 'Days in a row', foot: 'Thank you, IT team',
      art: [['laptop', ['$accent2', '$bg1', '#ffffff']], ['check', ['$accent2', '#ffffff', '#ffffff']], ['bolt', ['$accent']], ['star', ['$accent']]], back: [['gridbg', ['#ffffff'], { opacity: 22 }]] } },

  { id: 'work-delivery-glance', name: 'Delivery at a glance', cat: 'Numbers and charts', color: 'teal', tags: 'delivery,shipping,orders,numbers,at a glance,service,on time,stats',
    recipe: 'features', palette: 'mint', fonts: 'poster',
    o: { kick: 'Our delivery promise', title: 'Delivery at a glance', features: [{ art: ['clock', ['#ffffff', '$ink', '$accent']], title: '2 days', text: 'Average time to your door' }, { art: ['check', ['$accent', '#ffffff', '#ffffff']], title: '99.2%', text: 'Orders packed just right' }, { art: ['recycle', ['$accent', '#ffffff', '#ffffff']], title: '100%', text: 'Boxes made from recycled paper' }],
      foot: 'Track your order at the counter', back: [['blob3', ['$bg2', '$bg2'], { opacity: 80 }]] } },

  { id: 'work-top-performers', name: 'Top performers', cat: 'Numbers and charts', color: 'pink', tags: 'top performers,sales stars,leaderboard,recognition,ranking,photos,team,month',
    recipe: 'team', palette: 'blush', fonts: 'poster',
    o: { kick: 'Top sellers this month', title: 'Our sales stars', people: [{ name: 'Maya R.', role: '$48,200 sold' }, { name: 'Jordan P.', role: '$41,750 sold' }, { name: 'Priya S.', role: '$39,900 sold' }, { name: 'Leo M.', role: '$37,300 sold' }],
      back: [['starsbg', ['$accent', '$accent2', '#ffffff'], { opacity: 30 }]], fx: ['sparkles', { amount: 1, speed: 2 }] } },

  // ===================================================================== Marketing and social
  { id: 'work-follow-along', name: 'See what we are baking', cat: 'Marketing and social', color: 'yellow', tags: 'follow us,social media,online,photos,videos,handles,bakery,connect',
    recipe: 'social', palette: 'sunshine', fonts: 'elegant',
    o: { kick: 'Follow along', title: "See what's baking", handles: [['iconcamera', '@marlowbakery'], ['iconplay', 'Marlow Street Bakery'], ['iconthumb', 'Marlow Street Bakery'], ['iconchat', 'Text us: 555-0137']],
      big: ['croissant'], foot: 'New treats every morning', back: [['grain', ['#ffffff'], { opacity: 25 }]] } },

  { id: 'work-new-episode', name: 'New podcast episode', cat: 'Marketing and social', color: 'pink', tags: 'podcast,episode,listen,audio,show,stories,new,social',
    recipe: 'diagonal', palette: 'blush', fonts: 'elegant',
    o: { kick: 'New episode every Tuesday', title: 'Listen in', sub: 'Small business stories from right here in Riverside', big: ['mic', ['#94a3b8', '#1f2937', '$accent']], foot: 'Look for Main Street Talks',
      art: [null, ['music', ['#ffffff', '$accent2', '#ffffff']]] } },

  { id: 'work-newsletter-signup', name: 'Newsletter sign-up', cat: 'Marketing and social', color: 'teal', tags: 'newsletter,email,sign up,subscribe,qr,scan,list,news',
    recipe: 'scan', palette: 'mint', fonts: 'poster',
    o: { kick: 'Join 4,000 neighbors', title: 'Get our\nnewsletter', steps: ['Scan the code', 'Type your email', 'Get 10% off'], codeLabel: 'Scan to sign up', foot: 'One email a week. No spam.',
      back: [['dotsbg', ['$accent'], { opacity: 12 }]] } },

  { id: 'work-review-request', name: 'Scan to review us', cat: 'Marketing and social', color: 'yellow', tags: 'review,reviews,feedback,stars,rating,qr,scan,customers',
    recipe: 'scan', palette: 'sunshine', fonts: 'slab',
    o: { kick: 'Enjoyed your visit?', title: 'Leave us\na review', steps: ['Scan the code', 'Tap the stars', 'Say a few words'], codeLabel: 'Scan to leave a review', foot: 'It means the world to us',
      back: [['starsbg', ['$accent', '$accent2', '#ffffff'], { opacity: 22 }]] } },

  { id: 'work-get-our-app', name: 'Get our app', cat: 'Marketing and social', color: 'blue', tags: 'app,download,order ahead,mobile,qr,scan,phone,rewards',
    recipe: 'scan', palette: 'ocean', fonts: 'poster',
    o: { kick: 'Skip the line', title: 'Get our\nfree app', steps: ['Scan the code', 'Get the free app', 'Order ahead, pick up'], codeLabel: 'Scan to get the app', foot: 'Earn points on every order',
      back: [['blob2', ['$bg2', '$bg2'], { opacity: 80 }]] } },

  { id: 'work-wedding-cake-review', name: 'Wedding cake review', cat: 'Marketing and social', color: 'coral', tags: 'review,testimonial,wedding,cake,bakery,happy customers,quote,stars',
    recipe: 'testimonial', palette: 'coral', fonts: 'elegant',
    o: { kick: 'Real words from real customers', quote: 'Our wedding cake was even better than we dreamed. Every single guest asked where it came from!', who: 'Hannah and Theo', role: 'Married in June',
      foot: 'Book your tasting today', art: [['cake', ['$accent2', '#ffffff', '$accent']]], back: [['heartsbg', ['$accent'], { opacity: 10 }]] } },

  { id: 'work-neighbor-review', name: 'Neighbor review', cat: 'Marketing and social', color: 'green', tags: 'review,testimonial,neighbors,local,customers,quote,word of mouth,stars',
    recipe: 'testimonial', palette: 'citrus', fonts: 'friendly',
    o: { kick: 'Why neighbors love us', quote: 'Fast, friendly and fair. I send all my friends here, and they all thank me later.', who: 'Rosa M.', role: 'A customer for six years',
      foot: 'Thank you, Riverside!', art: [['hearthands', ['$accent2', '$accent', '#ffffff']]], back: [['blob3', ['$bg2', '$bg2'], { opacity: 80 }]] } },

  { id: 'work-loved-by-locals', name: 'Loved by locals', cat: 'Marketing and social', color: 'navy', tags: 'reviews,rating,customers,social proof,numbers,stars,recommend,local',
    recipe: 'bigstats', palette: 'midnight', fonts: 'modern',
    o: { kick: 'Thank you, neighbors', title: 'Loved by locals', stats: [{ value: '12,000', label: 'Happy customers', art: ['people'] }, { value: '18', label: 'Years in town', art: ['house', ['$accent2', '$accent', '#ffffff']] }, { value: '98%', label: 'Would recommend us', art: ['iconthumb', ['#ffffff', '$accent']] }],
      foot: 'Join the family', back: [['aurora', ['$accent', '$accent2', '$bg2'], { opacity: 25 }]] } },

  { id: 'work-refer-a-friend', name: 'Refer a friend', cat: 'Marketing and social', color: 'coral', tags: 'referral,refer a friend,share,discount,rewards,word of mouth,code,save',
    recipe: 'steps', palette: 'coral', fonts: 'friendly',
    o: { kick: 'Share the love', title: 'Refer a friend', steps: [{ title: 'Share', text: 'Give a friend your code' }, { title: 'They save', text: '$10 off their first visit' }, { title: 'You save', text: '$10 off your next visit' }],
      foot: 'Ask for your code at the counter', back: [['heartsbg', ['$accent'], { opacity: 10 }]] } },

  { id: 'work-signup-coupon', name: 'Sign-up coupon', cat: 'Marketing and social', color: 'purple', tags: 'coupon,sign up,email list,discount,code,welcome offer,subscribe,save',
    recipe: 'coupon', palette: 'lavender', fonts: 'poster',
    o: { kick: 'Join our list', deal: '10% OFF', title: 'Your next order', sub: 'Sign up for our emails and save today', code: 'Code: HELLO10', until: 'For new subscribers', foot: 'Ask us how to join at the register',
      art: [['envelope', ['#ffffff', '$bg2', '$accent2']], ['sparkles', ['$accent', '#ffffff', '$accent2']]] } },

  { id: 'work-giveaway', name: 'Big giveaway', cat: 'Marketing and social', color: 'purple', tags: 'giveaway,contest,win,prize,gift card,social media,enter,free',
    recipe: 'gig', palette: 'berry', fonts: 'poster',
    o: { title: 'Big\ngiveaway', day: 'Ends', date: '30', month: 'June', lines: ['Win a $100 gift card', 'Follow us and tag a friend', 'Winner picked live'], strip: 'No purchase needed. Ask us for details.',
      art: [['giftcard', ['$accent', '$accent2', '#ffffff'], { motion: 'float' }]], back: [['confettibg', ['$accent', '$accent2', '#ffffff'], { opacity: 30 }]] } },

  { id: 'work-giveaway-winner', name: 'Giveaway winner', cat: 'Marketing and social', color: 'yellow', tags: 'winner,giveaway,contest,congratulations,prize,announcement,social,celebrate',
    recipe: 'banner', palette: 'sunshine', fonts: 'poster',
    o: { kick: 'Giveaway', title: 'We have\na winner!', sub: 'Congrats, Jamie L.! Your prize is waiting at the counter.', foot: 'Next giveaway starts Monday',
      art: [['trophy', ['$accent', '#3d2c1e', '#ffffff']], ['giftcard', ['$accent2', '$accent', '#ffffff']], ['confetti', ['$accent', '$accent2', '#ff6b5e']]], fx: ['confetti', { amount: 3, speed: 3 }] } },

  { id: 'work-photo-wall', name: 'Customer photo wall', cat: 'Marketing and social', color: 'black', tags: 'photos,photo wall,customers,tag us,social,selfie,share,community',
    recipe: 'polaroids', palette: 'mono', fonts: 'handmade',
    o: { kick: 'Snap, tag, share', title: 'You, in our shop', sub: 'Tag us to see your photo up here', captions: ['Your photo here', 'Best day ever', 'Hi from table 4'], art: [['iconcamera', ['#ffffff', '$accent2', '#ffffff']]],
      back: [['grain', ['#ffffff'], { opacity: 20 }]] } },

  { id: 'work-new-collection', name: 'New collection', cat: 'Marketing and social', color: 'pink', tags: 'new collection,new arrivals,launch,spring,fashion,boutique,magazine,in store',
    recipe: 'magazine', palette: 'blush', fonts: 'elegant',
    o: { mast: 'NEW IN', kick: 'The spring edit', title: 'Fresh colors\nhave landed', sub: 'Light layers for warm days', lines: ['Linen shirts', 'Bright sneakers', 'Sun hats'], badge: 'Just in' } },

  { id: 'work-new-flavor', name: 'New flavor alert', cat: 'Marketing and social', color: 'teal', tags: 'new flavor,launch,ice cream,new,limited,summer,try it,product',
    recipe: 'diagonal', palette: 'mint', fonts: 'friendly',
    o: { kick: 'Just dropped', title: 'Mango\nchili swirl', sub: 'Sweet, a little spicy, and only here for the summer', big: ['icecream', ['#ffb340', '#f4b942', '#ff6b5e']], foot: 'Free taste at the counter',
      art: [['chili', ['#e63946', '$accent', '#ffffff']], ['sparkle', ['$accent2', '#ffffff', '$accent'], { motion: 'twinkle' }]] } },

  { id: 'work-live-now', name: 'Live now', cat: 'Marketing and social', color: 'red', tags: 'live,live stream,on air,video,watch,stream,social,now',
    recipe: 'neon', palette: 'ruby', fonts: 'glow',
    o: { kick: 'On air', title: 'Live now', sub: 'Watch us decorate cakes on the big screen', foot: 'Say hi in the chat: @marlowbakery',
      art: [['iconplay', ['#ffffff', '$accent2', '#ffffff']], ['lstar', ['$accent']], ['lsparkle', ['$accent2']]], back: [['brick', ['$bg2', '#3a0b10', '#1a0508'], { opacity: 70 }]] },
    wide: { art: [null, ['iconplay', ['#ffffff', '$accent2', '#ffffff']], ['lsparkle', ['$accent2']]] } },

  { id: 'work-flavor-poll', name: 'Pick our next flavor', cat: 'Marketing and social', color: 'blue', tags: 'poll,vote,flavor,customers,choose,fun,engagement,ice cream',
    recipe: 'features', palette: 'slate', fonts: 'friendly',
    o: { kick: 'You decide', title: 'Pick our next flavor', features: [{ art: ['icecream', ['#86efac', '#f4b942', '#7bdff2']], title: 'A: Mint chip', text: 'Cool and creamy' }, { art: ['icecream', ['#f9a8d4', '#f4b942', '#e63946']], title: 'B: Berry swirl', text: 'Sweet and tangy' }, { art: ['icecream', ['#d6a35c', '#f4b942', '#7c4a2d']], title: 'C: Salted caramel', text: 'Rich and smooth' }],
      foot: 'Vote at the counter by Sunday', back: [['dotsbg', ['$accent'], { opacity: 10 }]] } },

  { id: 'work-why-people-love-us', name: 'Why people love us', cat: 'Marketing and social', color: 'green', tags: 'why us,about,local,friendly,fast,reasons,brand,customers',
    recipe: 'features', palette: 'forest', fonts: 'slab',
    o: { kick: 'Fennel and Fig Cafe', title: 'Why people love us', features: [{ art: ['seedling', ['$accent2', '#8b5a2b', '#ffffff']], title: 'Local', text: 'Made fresh with food from nearby farms' }, { art: ['hearthands', ['$accent', '$accent2', '#ffffff']], title: 'Friendly', text: 'We know your name and your order' }, { art: ['bolt', ['$accent', '#ffffff', '#ffffff']], title: 'Fast', text: 'Ready in ten minutes or less' }],
      foot: 'Thank you for choosing us', back: [['leavesbg', ['$accent2', '$bg2', '$accent'], { opacity: 10 }]] } },

  { id: 'work-pop-up-shop', name: 'Find our pop-up', cat: 'Marketing and social', color: 'blue', tags: 'pop up,pop-up shop,find us,map,weekend,market,location,event',
    recipe: 'findus', palette: 'ocean', fonts: 'slab',
    o: { kick: 'This weekend only', title: 'Find our pop-up', address: ['Corner of 5th and Pine', 'Next to the fountain', 'Look for the yellow tent'], hours: 'Saturday and Sunday, 10 AM to 4 PM', foot: 'Cash and cards welcome' } },

  { id: 'work-rewards-club', name: 'Join the club', cat: 'Marketing and social', color: 'navy', tags: 'rewards,loyalty,membership,club,perks,plans,members,join',
    recipe: 'prices', palette: 'midnight', fonts: 'poster',
    o: { kick: 'Marlow Street Bakery', title: 'Join the club', plans: [{ name: 'Member', price: 'Free', per: 'to join', lines: ['A birthday treat', 'Member news'] }, { name: 'Gold', price: '$5', per: 'a month', lines: ['10% off always', 'Free coffee Fridays', 'Early access'], hot: true, tag: 'Best value' }, { name: 'VIP', price: '$12', per: 'a month', lines: ['20% off always', 'Free delivery', 'A gift each month'] }],
      back: [['starsbg', ['$accent', '$accent2', '#ffffff'], { opacity: 18 }]] } },

  { id: 'work-vip-night', name: 'VIP night', cat: 'Marketing and social', color: 'blue', tags: 'vip,customer appreciation,event,invite,ticket,night,shopping,perks',
    recipe: 'admit', palette: 'slate', fonts: 'elegant',
    o: { kick: 'Customer appreciation', admit: 'VIP guest', title: 'VIP night', details: [['Date', 'Thu, Nov 6'], ['Time', '6 to 8 PM'], ['Perk', '20% off']], stub: '050', stubLabel: 'Guest',
      sub: 'Bubbly, snacks and a first look at new arrivals', foot: 'Show this at the door', art: [['champagne', ['$accent2', '#ffffff', '$accent']], ['sparkles', ['$accent2', '#ffffff', '$accent']]],
      back: [['bokeh', ['$accent', '$accent2', '#ffffff'], { opacity: 20 }]] } },

  { id: 'work-real-results', name: 'Real results', cat: 'Marketing and social', color: 'brown', tags: 'before and after,results,makeover,transformation,photos,customers,proof,show',
    recipe: 'beforeafter', palette: 'espresso', fonts: 'elegant',
    o: { kick: 'Real results', title: 'See the difference', sub: 'One visit. Book yours today.', before: 'Before', after: 'After' } },

  { id: 'work-customer-wall', name: 'You said it', cat: 'Marketing and social', color: 'green', tags: 'reviews,customer notes,feedback,wall,kind words,comments,community,love',
    recipe: 'corkboard', palette: 'citrus', fonts: 'handmade',
    o: { title: 'You said it!', notes: ['Best tacos in town!', 'Kind staff, fast service', 'My Friday treat', 'Love the new patio'], sub: 'Leave a note. We read every one.', art: [['heart', ['$accent2']], ['speech', ['#ffffff', '$accent', '#ffffff']]] } },

  { id: 'work-social-wall', name: 'Social wall', cat: 'Marketing and social', color: 'purple', tags: 'social wall,split screen,feed,reviews,live,two areas,follow,online',
    recipe: 'split2', palette: 'berry', fonts: 'poster',
    o: { title: 'Follow @harborcafe', labels: ['Our feed', 'Your reviews'], ticker: 'Tag us for a chance to be on screen\nNew menu drops Monday\nFree cookie for every review', label: 'Social' } },

  { id: 'work-like-share-tag', name: 'Like, share, tag', cat: 'Marketing and social', color: 'black', tags: 'like,share,tag us,social media,follow,engagement,handle,online',
    recipe: 'bigtype', palette: 'mono', fonts: 'poster',
    o: { kick: 'Love it here?', lines: ['Snap it.', 'Tag us.'], sub: '@harborcafe', foot: 'We share our favorite photos every week', back: [['halftone', ['#ffffff'], { opacity: 8 }]] } },

  { id: 'work-vote-for-us', name: 'Vote for us', cat: 'Marketing and social', color: 'green', tags: 'vote,nominated,best of,award,poll,support,local,contest',
    recipe: 'stamp', palette: 'forest', fonts: 'slab',
    o: { ring: 'Best of Riverside', center: 'Vote', kick: 'We are nominated!', title: 'Vote for us', sub: 'The best bakery poll closes Friday. Ask us how to vote.', foot: 'Thank you for your support',
      art: [['star', ['$accent']], ['heart', ['$accent2']], ['laurel', ['$accent', '$accent2']]], back: [['rays', ['$accent', '$bg2'], { opacity: 8 }]] } },

  { id: 'work-launch-week', name: 'Launch week', cat: 'Marketing and social', color: 'purple', tags: 'launch,launch week,campaign,new,schedule,events,product,promo',
    recipe: 'timeline', palette: 'lavender', fonts: 'modern',
    o: { kick: 'Launch week', title: 'Big things all week', steps: [{ label: 'Mon', text: 'Sneak peek online' }, { label: 'Wed', text: 'Live demo in store' }, { label: 'Fri', text: 'Doors open at 9' }, { label: 'Sat', text: 'Free gift with orders' }],
      foot: 'Follow us for updates', back: [['confettibg', ['$accent', '$accent2', '#ffffff'], { opacity: 22 }]] } }
];

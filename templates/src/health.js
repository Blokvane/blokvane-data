// Health and fitness: templates for clinics, dentists, pharmacies, gyms, studios, wellness centers and sports clubs.
// See README.md in this folder for how a spec works. Every name, place, handle and phone number here is made up.
module.exports = [
  // ===================================================================== Healthcare
  { id: 'health-check-in-steps', name: 'Checking in is easy', cat: 'Healthcare', color: 'blue', tags: 'check in,clinic,front desk,waiting room,patients,doctor',
    recipe: 'steps', palette: 'midnight', fonts: 'friendly',
    o: { kick: 'Fernhill Family Clinic', title: 'Checking in is easy', steps: [
      { title: 'Sign in', text: 'At the front desk or on the tablet' },
      { title: 'Show your cards', text: 'Photo ID and insurance card' },
      { title: 'Have a seat', text: 'We will call your name soon' }], foot: 'Questions? Just ask us',
      back: [['dotsbg', ['$accent'], { opacity: 14 }]] } },

  { id: 'health-clinic-hours', name: 'Clinic opening hours', cat: 'Healthcare', color: 'green', tags: 'hours,opening hours,clinic,walk in,schedule,doctor',
    recipe: 'schedule', palette: 'citrus', fonts: 'modern',
    o: { kick: 'Fernhill Family Clinic', title: 'Opening hours', sub: 'Walk-ins welcome until one hour before we close', big: ['medcross', ['$accent', '$paper']],
      rows: [['Mon', '8 AM to 6 PM', 'Walk-ins until 5'], ['Tue', '8 AM to 6 PM', 'Walk-ins until 5'], ['Wed', '8 AM to 8 PM', 'Late clinic'], ['Thu', '8 AM to 6 PM', 'Walk-ins until 5'],
        ['Fri', '8 AM to 5 PM', 'Walk-ins until 4'], ['Sat', '9 AM to 1 PM', 'Walk-ins only'], ['Sun', 'Closed', 'Rest day']] } },

  { id: 'health-meet-doctors', name: 'Meet our doctors', cat: 'Healthcare', color: 'blue', tags: 'doctors,team,staff,providers,clinic,meet the team',
    recipe: 'team', palette: 'slate', fonts: 'elegant',
    o: { kick: 'Your care team', title: 'Meet our doctors', people: [{ name: 'Dr. Amara Okafor', role: 'Family medicine' }, { name: 'Dr. Luis Romero', role: 'Children\'s health' },
      { name: 'Nina Patel', role: 'Nurse practitioner' }, { name: 'Sam Whitfield', role: 'Physician assistant' }] } },

  { id: 'health-phone-check-in', name: 'Check in by phone', cat: 'Healthcare', color: 'purple', tags: 'check in,qr,scan,phone,clinic,waiting room',
    recipe: 'scan', palette: 'lavender',
    o: { kick: 'Skip the line', title: 'Check in\nby phone', steps: ['Open your phone camera', 'Scan the code', 'Fill in the short form'], codeLabel: 'Scan to check in',
      foot: 'Need help? Ask at the desk' } },

  { id: 'health-clinic-today', name: 'Today at the clinic', cat: 'Healthcare', color: 'navy', tags: 'wait time,urgent care,clinic,today,info,waiting room',
    recipe: 'infoboard', palette: 'coral',
    o: { kick: 'Copperleaf Urgent Care', title: 'Today at the clinic', cards: [
      { label: 'Wait time', value: 'About 15 min', art: ['clock', ['$paper', '$paperInk', '$accent2']] },
      { label: 'Providers in', value: '4 today', art: ['stethoscope', ['$paperInk', '$paper', '$accent2']] },
      { label: 'Open until', value: '9 PM', art: ['medcross', ['$paper', '$accent']] }],
      ticker: 'Walk-ins welcome\nFlu shots at the front desk\nPlease tell us if you have a fever', label: 'Today' } },

  { id: 'health-medical-plaza', name: 'Medical building directory', cat: 'Healthcare', color: 'green', tags: 'directory,medical building,suites,floors,lobby,clinic',
    recipe: 'directory', palette: 'ocean', fonts: 'elegant',
    o: { kick: 'Welcome to', title: 'Riverside Medical Plaza', clock: true, rows: [['Check-in desk', 'Lobby'], ['Family medicine', 'Suite 110'], ['Children\'s clinic', 'Suite 120'],
      ['Lab and blood draw', 'Suite 140'], ['X-ray and imaging', 'Suite 200'], ['Physical therapy', 'Suite 210'], ['Eye care', 'Suite 230'], ['Dental', 'Suite 300'],
      ['Billing office', 'Suite 310'], ['Pharmacy', 'Lobby']] } },

  { id: 'health-patient-review', name: 'What patients say', cat: 'Healthcare', color: 'pink', tags: 'review,testimonial,patients,clinic,thank you,stars',
    recipe: 'testimonial', palette: 'blush', fonts: 'elegant',
    o: { kick: 'Kind words from our patients', quote: 'Everyone here is so patient with my kids. We always leave smiling.', who: 'Maria L.', role: 'Patient for six years',
      foot: 'Thank you for trusting us', art: [['heart', ['$accent']]] } },

  { id: 'health-dental-cover', name: 'Family dentist cover', cat: 'Healthcare', color: 'teal', tags: 'dentist,dental,teeth,smile,new patients,family',
    recipe: 'magazine', palette: 'mint', fonts: 'elegant',
    o: { mast: 'SMILE', kick: 'Stonebridge Dental', title: 'Healthy family smiles', sub: 'Gentle care for every age', lines: ['Cleanings and checkups', 'Kids love our team', 'Late hours on Wednesday'],
      badge: 'New patients' } },

  { id: 'health-whitening-coupon', name: 'Teeth whitening coupon', cat: 'Healthcare', color: 'blue', tags: 'dentist,whitening,coupon,smile,dental,discount',
    recipe: 'coupon', palette: 'ocean',
    o: { kick: 'Stonebridge Dental', deal: '20% OFF', title: 'Teeth whitening', sub: 'For new and current patients. Ask at the front desk.', code: 'Code: BRIGHT20',
      until: 'Until the end of the month', foot: 'Call 555-0148 to book', art: [['tooth'], ['sparkles', [], { motion: 'twinkle' }]] } },

  { id: 'health-flu-shot-day', name: 'Flu shot day', cat: 'Healthcare', color: 'yellow', tags: 'flu shot,vaccine,walk in,clinic,pharmacy,fall',
    when: { kind: 'year', month: 9, day: 15, span: 60, label: 'Flu shot season' }, recipe: 'gig', palette: 'sunshine', fonts: 'slab',
    o: { title: 'Flu Shot Day', day: 'Saturday', date: '18', month: 'October', lines: ['Walk in, no appointment needed', 'Bring your insurance card', 'Stickers for brave kids'],
      strip: 'Fernhill Family Clinic, 9 AM to 2 PM', art: [['syringe']], fx: ['leaves', { amount: 2, speed: 2 }] } },

  { id: 'health-doctors-day', name: 'Thank you, doctors', cat: 'Healthcare', color: 'coral', tags: 'doctors day,thank you,doctors,staff,appreciation,march',
    when: { kind: 'year', month: 3, day: 30, span: 1, label: 'Doctors\' Day (March 30)' }, recipe: 'banner', palette: 'coral', fonts: 'retro',
    o: { kick: 'Happy Doctors\' Day', title: 'Thank you,\ndoctors', sub: 'For every early morning, late night and kind word', foot: 'With love from your team',
      art: [['stethoscope'], ['heartpulse'], ['heart', ['$accent2']]], fx: ['hearts', { amount: 2, speed: 2 }] } },

  { id: 'health-pink-october', name: 'Breast Cancer Awareness Month', cat: 'Healthcare', color: 'pink', tags: 'breast cancer,awareness,pink ribbon,october,screening,health',
    when: { kind: 'year', month: 10, day: 1, span: 31, label: 'October' }, recipe: 'diagonal', palette: 'berry',
    o: { kick: 'October is', title: 'Breast Cancer\nAwareness Month', sub: 'Ask our front desk about booking a screening', foot: 'We are here for you',
      big: ['awareness', ['$accent']], art: [['heart', ['$accent'], { motion: 'pulse' }], ['sparkle', ['$accent2'], { motion: 'twinkle' }]] } },

  { id: 'health-quiet-phones', name: 'Phones on silent', cat: 'Healthcare', color: 'black', tags: 'quiet,phones,silent,waiting room,sign,clinic',
    recipe: 'note', palette: 'mono', fonts: 'friendly',
    o: { kick: 'Waiting room', title: 'Phones on silent', sub: 'Please take calls outside so everyone can rest.', big: ['phone', ['$accent2', '$bg1', '$paper']], foot: 'Thank you!' } },

  { id: 'health-video-visits', name: 'Video visits', cat: 'Healthcare', color: 'teal', tags: 'telehealth,video visit,online,doctor,from home,appointments',
    recipe: 'features', palette: 'mint', fonts: 'modern',
    o: { kick: 'See us from home', title: 'Video visits', features: [
      { art: ['calendar', ['$bg1', '$accent', '$paperInk']], title: 'Book', text: 'Pick a time that works for you' },
      { art: ['phone', ['$accent', '$paperInk', '$paper']], title: 'Join', text: 'Tap the link we send you' },
      { art: ['stethoscope', ['$paperInk', '$accent2', '$accent']], title: 'Talk', text: 'Meet your provider from home' }], foot: 'Ask us how to start' } },

  { id: 'health-healthy-habits', name: 'Healthy habits', cat: 'Healthcare', color: 'pink', tags: 'hygiene,hand washing,cough,masks,health,waiting room',
    recipe: 'checklist', palette: 'blush', fonts: 'friendly',
    o: { kick: 'Help us keep everyone well', title: 'Healthy habits', items: ['Clean your hands at the door', 'Cover coughs and sneezes', 'Masks are at the front desk', 'Keep a little space'],
      big: ['bubbles', ['$paper', '$bg2', '$accent'], { motion: 'float' }] } },

  { id: 'health-pharmacy-picks', name: 'Pharmacy picks', cat: 'Healthcare', color: 'coral', tags: 'pharmacy,drugstore,first aid,sale,health,shop',
    recipe: 'dishes', palette: 'ruby',
    o: { kick: 'Larkspur Pharmacy', title: 'This week\'s picks', dishes: [
      { name: 'First aid kits', note: 'Home, car and travel sizes', price: '$12', art: ['firstaid'] },
      { name: 'Hand cream', note: 'Gentle and unscented', price: '$7', art: ['lotion'] },
      { name: 'Thermometers', note: 'Quick and easy to read', price: '$15', art: ['thermometer'] }] } },

  { id: 'health-easy-refills', name: 'Refills made easy', cat: 'Healthcare', color: 'blue', tags: 'pharmacy,refills,prescriptions,pick up,steps,drugstore',
    recipe: 'timeline', palette: 'slate', fonts: 'modern',
    o: { kick: 'Larkspur Pharmacy', title: 'Refills made easy', steps: [
      { label: 'Call or scan', text: 'Give us your refill number' },
      { label: 'We fill it', text: 'We text you when it is ready' },
      { label: 'Pick it up', text: 'At the window by the door' }], foot: 'Open 8 AM to 9 PM' } },

  { id: 'health-self-pay', name: 'Self-pay prices', cat: 'Healthcare', color: 'navy', tags: 'prices,self pay,visit,sports physical,urgent care,clinic',
    recipe: 'prices', palette: 'midnight',
    o: { kick: 'Copperleaf Urgent Care', title: 'Clear, simple prices', plans: [
      { name: 'Office visit', price: '$95', per: 'per visit', lines: ['Exam and advice', 'Same-day visits'] },
      { name: 'Sports physical', price: '$40', per: 'per visit', lines: ['School forms filled in', 'About 20 minutes'], hot: true, tag: 'Back to school' },
      { name: 'Flu shot', price: '$30', per: 'per shot', lines: ['No appointment', 'Walk-ins welcome'] }] } },

  { id: 'health-new-patients', name: 'Now taking new patients', cat: 'Healthcare', color: 'brown', tags: 'new patients,doctor,clinic,welcome,family,book',
    recipe: 'split', palette: 'espresso', fonts: 'elegant',
    o: { photo: true, kick: 'Good news', title: 'Now taking\nnew patients', sub: 'Kids, adults and whole families. Call 555-0137 to book.', foot: 'Same-week visits' } },

  { id: 'health-brave-kids', name: 'You were so brave', cat: 'Healthcare', color: 'yellow', tags: 'kids,children,pediatric,stickers,brave,doctor',
    recipe: 'kids', palette: 'sunshine', fonts: 'friendly',
    o: { kick: 'High five!', title: 'You were\nso brave!', sub: 'Pick a sticker at the front desk', foot: 'Bluebird Pediatrics',
      art: [['teddy'], ['star'], ['bandage'], ['balloon', ['$accent2']]], fx: ['confetti', { amount: 2, speed: 2 }] } },

  { id: 'health-new-frames', name: 'New frames are in', cat: 'Healthcare', color: 'red', tags: 'glasses,eye care,optician,frames,eyewear,vision',
    recipe: 'polaroids', palette: 'forest', fonts: 'elegant',
    o: { kick: 'Quillfield Eye Care', title: 'New frames are in', sub: 'Try on a pair after your eye exam', captions: ['Classic', 'Bold', 'For kids'],
      art: [['glasses', ['$accent', '$paper']]] } },

  { id: 'health-lab-opens', name: 'Lab opens early', cat: 'Healthcare', color: 'purple', tags: 'lab,blood draw,tests,hours,clinic,walk in',
    recipe: 'stamp', palette: 'lavender', fonts: 'slab',
    o: { ring: 'Lab opens at', center: '7 AM', kick: 'Blood draw and lab tests', title: 'Just walk in', sub: 'No appointment needed. Please bring your lab order and a photo ID.', foot: 'Suite 140',
      art: [['syringe'], ['drop', ['$accent']], ['clock']] } },

  { id: 'health-follow-clinic', name: 'Follow our clinic', cat: 'Healthcare', color: 'green', tags: 'social media,follow,clinic,health tips,online,stay in touch',
    recipe: 'social', palette: 'citrus', fonts: 'modern',
    o: { kick: 'Stay in touch', title: 'Follow our clinic', handles: [['iconcamera', '@fernhillclinic'], ['iconplay', 'Fernhill Health Tips'], ['iconchat', 'Text us: 555-0137'],
      ['iconthumb', 'Fernhill Family Clinic']], big: ['heartpulse', ['$accent', '$paper']] } },

  { id: 'health-heart-month', name: 'Heart Month', cat: 'Healthcare', color: 'red', tags: 'heart month,february,heart health,blood pressure,awareness,clinic',
    when: { kind: 'year', month: 2, day: 1, span: 28, label: 'February' }, recipe: 'arch', palette: 'ruby', fonts: 'elegant',
    o: { kick: 'February is', title: 'Heart Month', sub: 'Free blood pressure checks at the front desk, all month', foot: 'No appointment needed',
      big: ['heartpulse', ['$accent2', '$paper'], { motion: 'pulse' }], art: [['heart', ['$accent2']], ['heart', ['$accent']], ['sparkle', ['$accent'], { motion: 'twinkle' }]] } },

  { id: 'health-new-location', name: 'Our new clinic', cat: 'Healthcare', color: 'green', tags: 'new location,moving,clinic,address,map,directions',
    recipe: 'findus', palette: 'forest', fonts: 'friendly',
    o: { kick: 'We have moved!', title: 'Our new clinic', address: ['480 Alder Avenue', 'Second floor, Suite 200', 'Free parking behind the building'],
      hours: 'Mon to Fri, 8 AM to 6 PM', foot: 'Same phone: 555-0137' } },

  { id: 'health-waiting-room-screen', name: 'Waiting room screen', cat: 'Healthcare', color: 'brown', tags: 'waiting room,split screen,clinic,news,video,lobby',
    recipe: 'split2', palette: 'espresso',
    o: { title: 'Fernhill Family Clinic', labels: ['Health tips', 'Today'], ticker: 'Welcome! Please check in at the front desk\nFlu shots available today\nAsk us about video visits', label: 'News' } },

  { id: 'health-year-of-care', name: 'A year of care', cat: 'Healthcare', color: 'black', tags: 'numbers,stats,clinic,thank you,patients,community',
    recipe: 'bigstats', palette: 'mono', fonts: 'poster',
    o: { kick: 'Thank you, neighbors', title: 'A year of care', stats: [
      { value: '18,000', label: 'Patient visits', art: ['stethoscope', ['$accent', '$accent2', '$paper']] },
      { value: '2,400', label: 'Flu shots given', art: ['syringe', ['$paper', '$accent2', '$accent2']] },
      { value: '640', label: 'New patients', art: ['heart', ['$accent']] }], foot: 'Here for you every day' } },

  { id: 'health-talk-ticket', name: 'Free health talk', cat: 'Healthcare', color: 'purple', tags: 'health talk,event,free,community,ticket,heart health',
    recipe: 'admit', palette: 'berry',
    o: { kick: 'Free community talk', title: 'Healthy Heart Talk', admit: 'Free entry', details: [['Date', 'Thu, Feb 12'], ['Time', '6 PM'], ['Place', 'Room 2']],
      sub: 'Light snacks and tea. Bring your questions.', stub: '025', stubLabel: 'Seat', foot: 'Save your seat at the desk', art: [['heartpulse', [], { motion: 'pulse' }], ['heart', ['$accent2']]] } },
  // ===================================================================== Fitness
  { id: 'health-class-packs', name: 'Class packs', cat: 'Fitness', color: 'green', tags: 'class pass,prices,studio,membership,classes,fitness',
    recipe: 'prices', palette: 'citrus', fonts: 'modern',
    o: { kick: 'Peak Point Studio', title: 'Class packs', plans: [
      { name: 'Starter', price: '$60', per: '5 classes', lines: ['Any class', 'Use within 2 months'] },
      { name: 'Regular', price: '$110', per: '10 classes', lines: ['Any class', 'Use within 4 months', 'Free mat rental'], hot: true, tag: 'Most popular' },
      { name: 'Unlimited', price: '$149', per: 'a month', lines: ['Every class', 'Bring a friend once', 'Towel service'] }] } },

  { id: 'health-pool-schedule', name: 'Pool schedule', cat: 'Fitness', color: 'blue', tags: 'pool,swimming,lap swim,schedule,aquatic center,lanes',
    recipe: 'schedule', palette: 'ocean',
    o: { kick: 'Aqua center', title: 'Pool schedule', sub: 'Kids under 12 swim with an adult. Please shower before you swim.', big: ['drop', ['$accent', '$paper']],
      rows: [['6:00', 'Lap swim', 'Lanes 1 to 6'], ['9:00', 'Water aerobics', 'Shallow end'], ['11:00', 'Family swim', 'Whole pool'], ['1:00', 'Swim lessons', 'Lanes 1 to 3'],
        ['4:00', 'Swim team', 'Lanes 1 to 6'], ['7:00', 'Adult lap swim', 'Lanes 4 to 6']] } },

  { id: 'health-meet-trainers', name: 'Meet the trainers', cat: 'Fitness', color: 'blue', tags: 'trainers,coaches,team,gym,staff,personal trainer',
    recipe: 'team', palette: 'slate', fonts: 'modern',
    o: { kick: 'Coaches who care', title: 'Meet the trainers', people: [{ name: 'Jordan Reyes', role: 'Strength coach' }, { name: 'Mei Tanaka', role: 'Yoga and mobility' },
      { name: 'Andre Watts', role: 'Boxing coach' }] } },

  { id: 'health-free-week', name: 'Free week coupon', cat: 'Fitness', color: 'red', tags: 'free trial,coupon,gym,new members,classes,offer',
    recipe: 'coupon', palette: 'blush', fonts: 'slab',
    o: { kick: 'Iron Oak Gym', deal: 'FREE WEEK', title: 'Try any class', sub: 'For new members. Bring a friend if you like.', code: 'Code: FIRSTWEEK', until: 'Good for 30 days',
      foot: 'Sign up at the front desk', art: [['dumbbell'], ['bolt', [], { motion: 'pulse' }]] } },

  { id: 'health-gym-rules', name: 'Gym house rules', cat: 'Fitness', color: 'black', tags: 'gym rules,etiquette,gym floor,checklist,members,weights',
    recipe: 'checklist', palette: 'coral', fonts: 'poster',
    o: { kick: 'Gym floor', title: 'House rules', items: ['Wipe down after use', 'Put weights back', 'Share the machines', 'Bring a towel', 'Cheer each other on'],
      big: ['kettlebell', ['$accent2', '$accent']] } },

  { id: 'health-workout-board', name: 'Workout of the day', cat: 'Fitness', color: 'coral', tags: 'workout of the day,wod,circuit,exercise,gym,training',
    recipe: 'corkboard', palette: 'coral', fonts: 'handmade',
    o: { title: 'Workout of the day', notes: ['20 squats', '15 push-ups', '10 lunges each leg', 'Repeat 4 rounds'], sub: 'Rest one minute between rounds',
      art: [['stopwatch'], ['dumbbell']] } },

  { id: 'health-glow-ride', name: 'Glow ride night', cat: 'Fitness', color: 'purple', tags: 'spin,cycling,indoor cycling,dj,class,event',
    recipe: 'gig', palette: 'berry', fonts: 'glow',
    o: { title: 'Glow Ride', titleStyle: { effect: 'neon', c1: '$accent' }, day: 'Friday', date: '24', month: 'May', lines: ['Spin in the dark with a live DJ', 'All levels welcome', 'Book a bike at the desk'],
      strip: 'Peak Point Studio, 7 PM, Room B', art: [['bicycle', ['$accent', '$ink']]], fx: ['sparkles', { amount: 2, speed: 2 }] } },

  { id: 'health-open-24-7', name: 'Open 24/7 neon', cat: 'Fitness', color: 'navy', tags: 'open 24 hours,gym,neon,hours,always open,members',
    recipe: 'neon', palette: 'midnight',
    o: { kick: 'Iron Oak Gym', title: 'Open 24/7', sub: 'Train on your time', foot: 'Use your member key after 10 PM',
      back: [['brick'], ['vignette', ['#000000'], { opacity: 60 }]], art: [['dumbbell', ['$accent', '$accent2']], ['bolt', ['$accent2']], ['lbolt', ['$accent']]] } },

  { id: 'health-bootcamp-plan', name: 'Bootcamp plan', cat: 'Fitness', color: 'yellow', tags: 'bootcamp,outdoor,workout,schedule,park,training',
    recipe: 'timeline', palette: 'sunshine', fonts: 'slab',
    o: { kick: 'Saturday in the park', title: 'Bootcamp plan', steps: [{ label: '8:00', text: 'Warm up and stretch' }, { label: '8:10', text: 'Circuit stations' },
      { label: '8:35', text: 'Partner drills' }, { label: '8:50', text: 'Cool down together' }], foot: 'Meet at the park gate' } },

  { id: 'health-member-wins', name: 'Member wins this month', cat: 'Fitness', color: 'green', tags: 'stats,members,gym,milestones,numbers,community',
    recipe: 'bigstats', palette: 'forest', fonts: 'poster',
    o: { kick: 'This month at Iron Oak', title: 'Member wins', stats: [
      { value: '1,250', label: 'Workouts logged', art: ['dumbbell', ['$accent', '$paper']] },
      { value: '86', label: 'New members', art: ['people'] },
      { value: '4,300', label: 'Miles run', art: ['sneaker', ['$accent2', '$paper', '$bg1']] }], foot: 'Proud of you all' } },

  { id: 'health-challenge-countdown', name: '30-day challenge countdown', cat: 'Fitness', color: 'purple', tags: 'challenge,countdown,30 days,gym,goals,sign up',
    recipe: 'countdown', palette: 'lavender', fonts: 'slab',
    o: { kick: 'Get ready', title: '30-day challenge', label: 'Starts in', done: 'Day one is here!', days: true, ctheme: 'paper', foot: 'Sign up at the front desk',
      art: [['flame', [], { motion: 'pulse' }], ['trophy'], ['stopwatch'], ['bolt']] } },

  { id: 'health-stronger-type', name: 'Stronger than yesterday', cat: 'Fitness', color: 'red', tags: 'motivation,quote,gym,strength,inspiration,big words',
    recipe: 'bigtype', palette: 'mono',
    o: { lines: ['STRONGER', 'THAN', 'YESTERDAY'], kick: 'Iron Oak Gym', sub: 'Every rep counts', art: [['dumbbell', ['$accent', '$ink2']]] } },

  { id: 'health-smoothie-bar', name: 'Smoothie bar', cat: 'Fitness', color: 'green', tags: 'smoothies,juice bar,protein,drinks,gym cafe,menu',
    recipe: 'dishes', palette: 'citrus', fonts: 'friendly',
    o: { kick: 'After your workout', title: 'Smoothie bar', dishes: [
      { name: 'Berry Blast', note: 'Berries, yogurt, honey', price: '$7', art: ['juice', ['#e64980', '#e0f2fe', '$accent']] },
      { name: 'Green Power', note: 'Spinach, apple, ginger', price: '$7', art: ['juice', ['$accent', '#e0f2fe', '$accent2']] },
      { name: 'Mango Sunrise', note: 'Mango, banana, oat milk', price: '$8', art: ['juice'] }] } },

  { id: 'health-refuel-combo', name: 'Refuel combo receipt', cat: 'Fitness', color: 'brown', tags: 'protein shake,cafe,combo,snack,gym,deal',
    recipe: 'receipt', palette: 'espresso',
    o: { kick: 'Gym cafe', title: 'Refuel right', sub: 'A shake, a piece of fruit and water for one low price', shop: 'Iron Oak Cafe', shopSub: 'Next to the front desk',
      items: 'Protein shake | 6.50\nBanana | 1.00\nWater bottle | 1.50', total: ['Combo price', '$8'], thanks: 'Fuel up!', foot: 'Every day', art: [['juice'], ['lemon']] } },

  { id: 'health-book-class-scan', name: 'Scan to book a class', cat: 'Fitness', color: 'purple', tags: 'book a class,qr,scan,phone,studio,reserve',
    recipe: 'scan', palette: 'espresso', fonts: 'modern',
    o: { kick: 'Save your spot', title: 'Book a class', steps: ['Open your phone camera', 'Scan the code', 'Pick a class and a time'], codeLabel: 'Scan to book',
      foot: 'Classes fill up fast' } },

  { id: 'health-follow-gym', name: 'Follow the gym', cat: 'Fitness', color: 'yellow', tags: 'social media,follow,gym,workouts,online,community',
    recipe: 'social', palette: 'sunshine', fonts: 'friendly',
    o: { kick: 'Daily workouts and tips', title: 'Follow the gym', handles: [['iconcamera', '@ironoakgym'], ['iconplay', 'Iron Oak Workouts'], ['iconchat', 'Members chat group'],
      ['iconhash', '#IronOakStrong']], big: ['kettlebell', ['$ink', '$accent']] } },

  { id: 'health-member-month', name: 'Member of the month', cat: 'Fitness', color: 'blue', tags: 'member of the month,testimonial,gym,review,members,shout out',
    recipe: 'testimonial', palette: 'slate', fonts: 'elegant',
    o: { kick: 'Member of the month', quote: 'I came for the classes and stayed for the people. I feel stronger every week.', who: 'Dana K.', role: 'Member since spring',
      foot: 'Way to go, Dana!', art: [['medal']] } },

  { id: 'health-how-far', name: 'How far you came', cat: 'Fitness', color: 'navy', tags: 'before and after,transformation,progress,members,gym,results',
    recipe: 'beforeafter', palette: 'midnight', fonts: 'modern',
    o: { kick: 'Member stories', title: 'How far you came', sub: 'Shared with permission. Your story could be next.', before: 'Week 1', after: 'Week 12' } },

  { id: 'health-train-one-on-one', name: 'Train one on one', cat: 'Fitness', color: 'blue', tags: 'personal training,trainer,coaching,one on one,goals,gym',
    recipe: 'features', palette: 'ocean',
    o: { kick: 'Personal training', title: 'Train one on one', features: [
      { art: ['target'], title: 'Your goals', text: 'A plan made just for you' },
      { art: ['clipboard', ['$paper', '$accent2', '$accent']], title: 'Real progress', text: 'Check-ins every two weeks' },
      { art: ['stopwatch', ['$paper', '$paperInk', '$accent']], title: 'Your schedule', text: 'Early, late or on weekends' }], foot: 'First session free' } },

  { id: 'health-gym-directory', name: 'Gym floor guide', cat: 'Fitness', color: 'black', tags: 'directory,gym,floors,studios,pool,find your way',
    recipe: 'directory', palette: 'lavender', fonts: 'modern',
    o: { kick: 'Find your way', title: 'Iron Oak Gym', clock: true, rows: [['Free weights', 'Floor 1'], ['Boxing ring', 'Floor 1'], ['Kids club', 'Floor 1'], ['Cardio deck', 'Floor 2'],
      ['Studio A: yoga', 'Floor 2'], ['Studio B: cycling', 'Floor 2'], ['Pool', 'Lower level'], ['Sauna and steam', 'Lower level'], ['Lockers', 'Lower level']] } },

  { id: 'health-class-photos', name: 'Sweat with friends', cat: 'Fitness', color: 'coral', tags: 'photos,classes,community,gym,friends,group fitness',
    recipe: 'polaroids', palette: 'ruby', fonts: 'handmade',
    o: { kick: 'Our classes', title: 'Sweat with friends', sub: 'Tag us in your class photos', captions: ['Sunrise yoga', 'Spin crew', 'Boxing night'],
      art: [['sneaker']] } },

  { id: 'health-join-january', name: 'Join in January', cat: 'Fitness', color: 'purple', tags: 'new year,january,join,membership,goals,resolutions',
    when: { kind: 'year', month: 1, day: 1, span: 31, label: 'January' }, recipe: 'banner', palette: 'berry', fonts: 'retro',
    o: { kick: 'New year, new goals', title: 'Join in\nJanuary', sub: 'No joining fee all month long', foot: 'Ask at the front desk',
      art: [['dumbbell', ['$accent', '$paper']], ['sneaker'], ['star', ['$accent2']]], fx: ['confetti', { amount: 2, speed: 2 }] } },

  { id: 'health-summer-shape-up', name: 'Summer shape-up', cat: 'Fitness', color: 'teal', tags: 'summer,outdoor classes,park,bootcamp,fitness,season',
    when: { kind: 'year', month: 5, day: 1, span: 45, label: 'Late spring' }, recipe: 'diagonal', palette: 'mint', fonts: 'poster',
    o: { kick: 'Summer is coming', title: 'Summer shape-up', sub: 'Six weeks of outdoor classes in Willow Park', foot: 'Starts June 1', big: ['sun', [], { motion: 'spin' }],
      art: [['sneaker'], ['drop', ['$accent']]] } },

  { id: 'health-yoga-cover', name: 'Yoga studio cover', cat: 'Fitness', color: 'pink', tags: 'yoga,studio,classes,balance,stretch,first class free',
    recipe: 'magazine', palette: 'blush', fonts: 'elegant',
    o: { mast: 'FLOW', kick: 'Lotus Lane Yoga', title: 'Find your balance', sub: 'Classes for every body', lines: ['Morning vinyasa', 'Gentle evening flow', 'New: hot yoga'],
      badge: 'First class free', big: ['yogamat', ['$accent']] } },

  { id: 'health-day-lockers', name: 'Day lockers only', cat: 'Fitness', color: 'green', tags: 'lockers,locker room,gym,sign,rules,reminder',
    recipe: 'note', palette: 'forest', fonts: 'friendly',
    o: { kick: 'Locker room', title: 'Day lockers only', sub: 'Please empty your locker before you go. Locks left overnight will be removed.', big: ['key', [], { motion: 'swing' }], foot: 'Thank you' } },

  { id: 'health-run-club', name: 'Run club meeting point', cat: 'Fitness', color: 'teal', tags: 'run club,running,meet up,park,group run,map',
    recipe: 'findus', palette: 'mint', fonts: 'friendly',
    o: { kick: 'Run club', title: 'Meet us here', address: ['Willow Park, north gate', 'Every Tuesday at 6 PM', '5 km, every pace welcome'], hours: 'Rain or shine',
      foot: 'Free for members' } },

  { id: 'health-express-class', name: 'Lunch express class', cat: 'Fitness', color: 'brown', tags: 'express class,lunch,45 minutes,workout,full body,gym',
    recipe: 'swiss', palette: 'mono',
    o: { num: '45', kick: 'Lunch express', title: 'Minutes,\nfull body', sub: 'Strength and cardio, then back to work on time', foot: 'Daily at 12:15', art: [['stopwatch', [], { motion: 'pulse' }]] } },

  { id: 'health-join-sale', name: 'Spring membership sale', cat: 'Fitness', color: 'pink', tags: 'sale,membership,join,discount,gym,spring',
    when: { kind: 'year', month: 3, day: 20, span: 45, label: 'Spring' }, recipe: 'poster', palette: 'ruby',
    o: { kick: 'Spring sale', title: 'Join\nnow', deal: '50%\nOFF', badgeMotion: 'pulse', sub: 'Your first month of membership', foot: 'Ends Sunday',
      art: [['sneaker'], ['dumbbell'], ['bolt']] } },
  // ===================================================================== Wellness
  { id: 'health-take-a-breath', name: 'Take a breath', cat: 'Wellness', color: 'teal', tags: 'breathing,calm,mindfulness,stress,relax,pause',
    recipe: 'steps', palette: 'mint', fonts: 'elegant',
    o: { kick: 'A one-minute pause', title: 'Take a breath', steps: [{ title: 'Breathe in', text: 'Slowly, for four counts' }, { title: 'Hold', text: 'Softly, for four counts' },
      { title: 'Breathe out', text: 'Gently, for six counts' }], foot: 'Repeat three times', back: [['aurora', ['$accent', '$bg2', '$accent2'], { opacity: 22 }]] } },

  { id: 'health-mindful-moments', name: 'Mindful moments schedule', cat: 'Wellness', color: 'purple', tags: 'meditation,schedule,mindfulness,classes,wellness center,calm',
    recipe: 'schedule', palette: 'lavender', fonts: 'elegant',
    o: { kick: 'Stillwater Wellness', title: 'Mindful moments', sub: 'Drop in, no sign-up needed. Mats and cushions are ready for you.', big: ['lotus'],
      rows: [['7:00', 'Morning sit', 'Quiet room'], ['8:00', 'Gentle stretch', 'Studio 1'], ['12:30', 'Lunch meditation', 'Garden'], ['5:30', 'Sound bath', 'Studio 2'], ['7:00', 'Breathwork', 'Quiet room']] } },

  { id: 'health-wellness-week', name: 'Wellness week at work', cat: 'Wellness', color: 'green', tags: 'workplace wellness,office,wellness week,employees,healthy habits,team',
    recipe: 'timeline', palette: 'citrus', fonts: 'friendly',
    o: { kick: 'At the office', title: 'Wellness week', steps: [{ label: 'Mon', text: 'Walk at lunch' }, { label: 'Tue', text: 'Healthy snack day' }, { label: 'Wed', text: 'Desk stretch break' },
      { label: 'Thu', text: 'Gratitude wall' }, { label: 'Fri', text: 'Fruit and smoothie bar' }], foot: 'Join in any day' } },

  { id: 'health-step-challenge', name: 'Step challenge results', cat: 'Wellness', color: 'purple', tags: 'step challenge,walking,workplace wellness,team,stats,milestones',
    recipe: 'bigstats', palette: 'berry', fonts: 'poster',
    o: { kick: 'Team step challenge', title: 'We walked so far', stats: [{ value: '1,240', label: 'Miles walked', art: ['sneaker'] },
      { value: '86', label: 'Walkers joined', art: ['heart', ['$accent']] }, { value: '12', label: 'Teams', art: ['trophy'] }], foot: 'Thank you for joining' } },

  { id: 'health-snack-smart', name: 'Snack smart', cat: 'Wellness', color: 'coral', tags: 'healthy snacks,cafe,menu,fruit,nutrition,food',
    recipe: 'dishes', palette: 'coral', fonts: 'friendly',
    o: { kick: 'Wellness cafe', title: 'Snack smart', dishes: [{ name: 'Apple slices', note: 'With almond butter', price: '$4', art: ['apple'] },
      { name: 'Fruit cup', note: 'Melon, berries and mint', price: '$4', art: ['watermelon'] }, { name: 'Yogurt parfait', note: 'Berries and granola', price: '$5' }] } },

  { id: 'health-self-care', name: 'Self-care today', cat: 'Wellness', color: 'pink', tags: 'self care,checklist,wellbeing,reminder,mental health,break',
    recipe: 'checklist', palette: 'blush', fonts: 'handmade',
    o: { kick: 'Quick check-in', title: 'Self-care today', items: ['Drink some water', 'Step outside', 'Stretch for five minutes', 'Call a friend', 'Rest your eyes'], done: 2,
      big: ['plant'] } },

  { id: 'health-gratitude-board', name: 'Gratitude board', cat: 'Wellness', color: 'yellow', tags: 'gratitude,thankful,notes,office,positivity,team',
    recipe: 'corkboard', palette: 'sunshine', fonts: 'handmade',
    o: { title: 'We are grateful for', notes: ['Sunny mornings', 'Good coffee', 'This team', 'Fresh starts'], sub: 'Add your own note to the board!',
      art: [['heart', ['$accent'], { motion: 'pulse' }], ['sun']] } },

  { id: 'health-sound-bath', name: 'Sound bath ticket', cat: 'Wellness', color: 'blue', tags: 'sound bath,relaxation,event,ticket,meditation,evening',
    recipe: 'admit', palette: 'ocean',
    o: { kick: 'Relax and listen', title: 'Sound Bath', admit: 'Admit one', details: [['Day', 'Sunday'], ['Time', '7 PM'], ['Room', 'Studio 2']],
      sub: 'Bring a blanket. Mats are provided.', stub: '108', stubLabel: 'Mat', foot: 'Space is limited', art: [['music', ['$accent', '$accent2'], { motion: 'float' }], ['moon']] } },

  { id: 'health-massage-menu', name: 'Massage menu', cat: 'Wellness', color: 'brown', tags: 'massage,prices,spa,relax,menu,wellness',
    recipe: 'prices', palette: 'espresso', fonts: 'elegant',
    o: { kick: 'Massage menu', title: 'Time to unwind', plans: [
      { name: '30 minutes', price: '$45', per: 'Back and shoulders', lines: ['A quick reset', 'Warm towels'] },
      { name: '60 minutes', price: '$80', per: 'Full body', lines: ['Our most booked', 'Warm stones', 'Tea after'], hot: true, tag: 'Favorite' },
      { name: '90 minutes', price: '$110', per: 'Full body, slow pace', lines: ['Extra time', 'Foot massage', 'Tea after'] }] } },

  { id: 'health-calm-cover', name: 'Calm cover', cat: 'Wellness', color: 'green', tags: 'meditation,calm,wellness center,classes,relax,mindfulness',
    recipe: 'magazine', palette: 'forest', fonts: 'elegant',
    o: { mast: 'CALM', kick: 'Stillwater Wellness', title: 'Slow down, breathe', sub: 'A quiet hour just for you', lines: ['Morning sits', 'Quiet hours', 'Tea after class'],
      badge: 'New', big: ['lotus', [], { motion: 'float' }] } },

  { id: 'health-not-alone', name: 'You are not alone', cat: 'Wellness', color: 'blue', tags: 'mental health,awareness,may,support,kindness,wellbeing',
    when: { kind: 'year', month: 5, day: 1, span: 31, label: 'May' }, recipe: 'note', palette: 'slate', fonts: 'elegant',
    o: { kick: 'Mental Health Awareness Month', kickStyle: { font: 'geo', weight: '700', caps: true, spacing: 3 }, title: 'You are not alone', sub: 'It is okay to ask for help. Talk to someone you trust. Our door is always open.',
      big: ['hearthands'], foot: 'Ask us about support' } },

  { id: 'health-world-health-day', name: 'World Health Day', cat: 'Wellness', color: 'navy', tags: 'world health day,april,health,community,wellbeing,awareness',
    when: { kind: 'year', month: 4, day: 7, span: 1, label: 'World Health Day (April 7)' }, recipe: 'paper', palette: 'midnight', fonts: 'friendly',
    o: { land: 'hills', landCols: ['#2b9348', '#55a630', '#aacc00'], kick: 'World Health Day', title: 'Health for all', sub: 'Take a walk, drink water and rest well',
      art: [['globe'], ['moon'], ['seedling'], ['heart', ['$accent2']], ['star']], fx: ['stars', { amount: 2, speed: 1 }] } },

  { id: 'health-wellness-fair', name: 'Wellness fair', cat: 'Wellness', color: 'brown', tags: 'wellness fair,event,community,free,health,family',
    recipe: 'datestamp', palette: 'espresso', fonts: 'slab',
    o: { month: 'June', day: '7', head: '$accent2', kick: 'Free and open to all', title: 'Wellness fair', sub: 'Blood pressure checks, healthy snacks and a kids corner',
      foot: '10 AM to 2 PM', art: [['heartpulse'], ['apple'], ['leaf']] } },

  { id: 'health-unplug-hour', name: 'Unplug hour', cat: 'Wellness', color: 'navy', tags: 'screen time,unplug,digital detox,phones,evening,family',
    recipe: 'hero', palette: 'midnight', fonts: 'friendly',
    o: { kick: 'Unplug hour', title: 'Phones down,\neyes up', sub: 'Every evening from 8 to 9 PM', foot: 'Read, walk or talk instead',
      art: [['moon', [], { motion: 'float' }], ['books'], ['phone'], ['plant'], ['star', ['$accent'], { motion: 'twinkle' }], ['sparkle', [], { motion: 'twinkle' }]] } },

  { id: 'health-massage-coupon', name: 'First massage coupon', cat: 'Wellness', color: 'pink', tags: 'massage,coupon,discount,spa,relax,first visit',
    recipe: 'coupon', palette: 'blush',
    o: { kick: 'Stillwater Wellness', deal: '15% OFF', title: 'Your first massage', sub: 'Any length, any day of the week', code: 'Code: RELAX15', until: 'This month only',
      foot: 'Book at the front desk', art: [['lotion'], ['candle']] } },

  { id: 'health-retreat-photos', name: 'Weekend retreat photos', cat: 'Wellness', color: 'green', tags: 'retreat,photos,yoga,nature,weekend,memories',
    recipe: 'polaroids', palette: 'forest', fonts: 'handmade',
    o: { kick: 'Weekend retreat', title: 'Two days of calm', sub: 'Add your favorite photos from the weekend', captions: ['Sunrise flow', 'Forest walk', 'Tea circle'],
      art: [['leaf', ['$accent2', '$accent']]], fx: ['leaves', { amount: 2, speed: 1 }] } },

  { id: 'health-walk-review', name: 'Walking club review', cat: 'Wellness', color: 'green', tags: 'testimonial,review,walking club,members,community,wellness',
    recipe: 'testimonial', palette: 'citrus', fonts: 'elegant',
    o: { kick: 'From our walking club', quote: 'Our Tuesday walks are the best part of my week. I always come home smiling.', who: 'Grace H.', role: 'Walking club member',
      foot: 'Walk with us on Tuesdays', art: [['sneaker']] } },

  { id: 'health-wellness-team', name: 'Our wellness team', cat: 'Wellness', color: 'purple', tags: 'team,staff,therapists,coaches,wellness center,meet the team',
    recipe: 'team', palette: 'lavender', fonts: 'elegant',
    o: { kick: 'Here to help you relax', title: 'Our wellness team', people: [{ name: 'Lena Brooks', role: 'Massage therapist' }, { name: 'Ravi Shah', role: 'Yoga teacher' },
      { name: 'Clara Nunez', role: 'Nutrition coach' }, { name: 'Theo Grant', role: 'Meditation guide' }] } },

  { id: 'health-calm-scan', name: 'Five-minute calm', cat: 'Wellness', color: 'teal', tags: 'guided meditation,qr,scan,calm,break,audio',
    recipe: 'scan', palette: 'mint',
    o: { kick: 'Need a moment?', title: 'Five-minute calm', steps: ['Scan the code', 'Put on your headphones', 'Close your eyes and listen'], codeLabel: 'Scan for a guided break',
      foot: 'Free for everyone' } },

  { id: 'health-follow-calm', name: 'Follow for daily calm', cat: 'Wellness', color: 'red', tags: 'social media,follow,wellness,online,newsletter,calm',
    recipe: 'social', palette: 'ruby', fonts: 'retro',
    o: { kick: 'A little calm every day', title: 'Follow along', handles: [['iconcamera', '@stillwaterwellness'], ['iconplay', 'Stillwater Calm'], ['iconmail', 'Weekly calm letter'],
      ['iconchat', 'Ask a coach']], big: ['lotus'] } },

  { id: 'health-wellness-directory', name: 'Wellness center directory', cat: 'Wellness', color: 'blue', tags: 'directory,wellness center,spa,rooms,floors,lobby',
    recipe: 'directory', palette: 'slate', fonts: 'elegant',
    o: { kick: 'Welcome to', title: 'Stillwater Wellness', clock: true, rows: [['Massage rooms', 'Level 1'], ['Sauna', 'Level 1'], ['Steam room', 'Level 1'], ['Changing rooms', 'Level 1'],
      ['Yoga studio', 'Level 2'], ['Quiet room', 'Level 2'], ['Tea lounge', 'Level 2']] } },

  { id: 'health-five-minutes', name: 'Five minutes of quiet', cat: 'Wellness', color: 'purple', tags: 'mindfulness,meditation,break,calm,breathing,pause',
    recipe: 'swiss', palette: 'berry',
    o: { num: '5', kick: 'Mindful minute', title: 'Minutes of quiet', sub: 'Close your eyes, relax your shoulders and just breathe', foot: 'Anytime you need it',
      art: [['lotus', [], { motion: 'float' }]] } },

  { id: 'health-tea-bar', name: 'Tea bar receipt', cat: 'Wellness', color: 'coral', tags: 'tea,herbal tea,cafe,drinks,menu,relax',
    recipe: 'receipt', palette: 'coral',
    o: { kick: 'Tea bar', title: 'Warm up with tea', sub: 'Herbal teas, made fresh all day', shop: 'Stillwater Tea Bar', shopSub: 'Calm in a cup',
      items: 'Chamomile | 3.50\nPeppermint | 3.50\nGinger lemon | 4.00\nHoney oat latte | 4.75', total: ['Any two teas', '$7'], thanks: 'Sip slowly', foot: 'Refills are free',
      art: [['teapot'], ['lemon']] } },

  { id: 'health-desk-stretches', name: 'Desk stretches', cat: 'Wellness', color: 'blue', tags: 'stretching,desk,office,break,posture,workplace wellness',
    recipe: 'features', palette: 'ocean', fonts: 'friendly',
    o: { kick: 'Desk break', title: 'Stretch it out', features: [
      { art: ['stopwatch', ['$paper', '$paperInk', '$accent']], title: 'Neck rolls', text: 'Slow circles, five each way' },
      { art: ['people'], title: 'Shoulder shrugs', text: 'Lift, hold, then let go' },
      { art: ['raisedhand', ['$accent2', '$accent']], title: 'Wrist circles', text: 'Ten each way, then shake out' }], foot: 'Once an hour' } },

  { id: 'health-spring-wellness', name: 'Spring into wellness', cat: 'Wellness', color: 'teal', tags: 'spring,wellness,classes,season,fresh start,april',
    when: { kind: 'year', month: 3, day: 20, span: 45, label: 'Spring' }, recipe: 'banner', palette: 'mint', fonts: 'retro',
    o: { kick: 'New season, fresh start', title: 'Spring into\nwellness', sub: 'Free intro classes all April', foot: 'Sign up at the desk',
      art: [['tulip'], ['flower'], ['butterfly']], fx: ['petals', { amount: 2, speed: 2 }] } },

  { id: 'health-sauna-rules', name: 'Sauna and steam rules', cat: 'Wellness', color: 'blue', tags: 'sauna,steam room,rules,spa,safety,relax',
    recipe: 'checklist', palette: 'slate', fonts: 'poster',
    o: { kick: 'Sauna and steam', title: 'Relax safely', items: ['Shower first', 'Sit on a towel', 'Stay 15 minutes at most', 'Drink water after', 'Keep voices low'],
      big: ['drop', ['$accent'], { motion: 'float' }], fx: ['bubbles', { amount: 2, speed: 1 }] } },

  { id: 'health-wellness-wednesday', name: 'Wellness Wednesday', cat: 'Wellness', color: 'yellow', tags: 'wellness wednesday,weekly,office,healthy habits,fruit,walk',
    when: { kind: 'week', days: [3], label: 'Wednesdays' }, recipe: 'sunburst', palette: 'sunshine', fonts: 'friendly',
    o: { kick: 'Every week', title: 'Wellness\nWednesday', sub: 'Free fruit in the kitchen', foot: 'Take a walk at lunch',
      art: [['apple'], ['heart', ['$accent']], ['leaf', ['$accent2']], ['sun'], ['sparkle']] } },

  { id: 'health-rest-reset', name: 'Rest, reset, repeat', cat: 'Wellness', color: 'black', tags: 'motivation,rest,self care,big words,quote,calm',
    recipe: 'bigtype', palette: 'mono',
    o: { lines: ['REST.', 'RESET.', 'REPEAT.'], kick: 'Stillwater Wellness', sub: 'Your weekly reminder to slow down', art: [['lotus', ['$accent', '$accent2', '$ink2']]] } },

  // ===================================================================== Sports
  { id: 'health-home-opener', name: 'Home opener ticket', cat: 'Sports', color: 'blue', tags: 'game,ticket,home game,football,season opener,fans',
    recipe: 'admit', palette: 'slate', fonts: 'slab',
    o: { kick: 'Riverside Otters', title: 'Home Opener', admit: 'Admit one', details: [['Date', 'Sat, Sept 6'], ['Time', '7 PM'], ['Gate', 'North gate']],
      sub: 'Wear blue and bring your loudest cheer!', stub: '012', stubLabel: 'Row', foot: 'Kids under 6 get in free', art: [['football'], ['whistle']] } },

  { id: 'health-match-poster', name: 'Match day poster', cat: 'Sports', color: 'red', tags: 'soccer,match,game day,poster,youth league,fixture',
    recipe: 'gig', palette: 'ruby', fonts: 'poster',
    o: { title: 'Otters vs Hawks', day: 'Saturday', date: '14', month: 'June', lines: ['Kickoff at 3 PM', 'Riverside Field', 'Free entry, bring a chair'],
      strip: 'Riverside Youth Soccer League', art: [['soccer', [], { motion: 'spin' }]] } },

  { id: 'health-tryouts', name: 'Tryouts this week', cat: 'Sports', color: 'purple', tags: 'tryouts,soccer,youth sports,team,sign up,kids',
    recipe: 'banner', palette: 'berry', fonts: 'slab',
    o: { kick: 'Riverside Otters', title: 'Tryouts\nthis week', sub: 'Ages 8 to 14. Bring cleats, shin guards and water.', foot: 'Mon to Wed, 5 PM',
      art: [['soccer'], ['whistle'], ['star', ['$accent2']]] } },

  { id: 'health-league-table', name: 'League table', cat: 'Sports', color: 'blue', tags: 'standings,league table,points,teams,league,results',
    recipe: 'directory', palette: 'ocean', fonts: 'modern',
    o: { kick: 'Spring league', title: 'League table', rows: [['1. Riverside Otters', '24 pts'], ['2. Hillside Hawks', '21 pts'], ['3. Bay City Comets', '18 pts'],
      ['4. Northside Foxes', '15 pts'], ['5. Lakeview Lions', '12 pts'], ['6. Pinewood Owls', '9 pts']] } },

  { id: 'health-game-schedule', name: 'Game schedule', cat: 'Sports', color: 'navy', tags: 'schedule,games,fixtures,basketball,season,home and away',
    recipe: 'schedule', palette: 'midnight', fonts: 'poster',
    o: { kick: 'Hillside Hawks', title: 'Game schedule', sub: 'Home games at Hillside Park. Carpool from the gym for away games.', big: ['basketball'],
      rows: [['Sat 6', 'vs Comets', 'Home'], ['Sat 13', 'at Foxes', 'Away'], ['Sat 20', 'vs Lions', 'Home'], ['Sat 27', 'at Owls', 'Away'], ['Sat 3', 'vs Otters', 'Home'],
        ['Sat 10', 'Playoffs', 'To be set']] } },

  { id: 'health-season-numbers', name: 'Season by the numbers', cat: 'Sports', color: 'black', tags: 'season stats,numbers,team,wins,basketball,results',
    recipe: 'bigstats', palette: 'mono', fonts: 'poster',
    o: { kick: 'Season wrap-up', title: 'Hawks by the numbers', stats: [{ value: '18', label: 'Wins', art: ['trophy'] }, { value: '3', label: 'Losses', art: ['whistle'] },
      { value: '612', label: 'Points scored', art: ['basketball'] }, { value: '1', label: 'League title', art: ['medal'] }], foot: 'Thank you, fans' } },

  { id: 'health-swim-lessons', name: 'Swim lesson prices', cat: 'Sports', color: 'teal', tags: 'swim lessons,swimming,kids,prices,pool,classes',
    recipe: 'prices', palette: 'mint', fonts: 'friendly',
    o: { kick: 'Aqua center', title: 'Swim lessons', plans: [
      { name: 'Guppies', price: '$60', per: 'Ages 3 to 5', lines: ['Water play', '30 minutes', 'Parent in the pool'] },
      { name: 'Minnows', price: '$70', per: 'Ages 6 to 9', lines: ['Floats and strokes', '45 minutes', 'Six kids a class'], hot: true, tag: 'Most booked' },
      { name: 'Sharks', price: '$80', per: 'Ages 10 and up', lines: ['All four strokes', '45 minutes', 'Dives and turns'] }] } },

  { id: 'health-sports-camp', name: 'Summer sports camp', cat: 'Sports', color: 'yellow', tags: 'sports camp,summer camp,kids,soccer,basketball,tennis',
    when: { kind: 'year', month: 4, day: 1, span: 60, label: 'Camp sign-up season' }, recipe: 'features', palette: 'sunshine', fonts: 'friendly',
    o: { kick: 'Summer sports camp', title: 'Play all summer', features: [{ art: ['soccer'], title: 'Soccer', text: 'Mondays and Wednesdays' },
      { art: ['basketball'], title: 'Basketball', text: 'Tuesdays and Thursdays' }, { art: ['tennisball'], title: 'Tennis', text: 'Every Friday' }], foot: 'Ages 7 to 13. Sign up now!' } },

  { id: 'health-easy-sign-up', name: 'Easy sign-up', cat: 'Sports', color: 'coral', tags: 'registration,sign up,soccer,youth sports,steps,fall',
    recipe: 'steps', palette: 'coral', fonts: 'slab',
    o: { kick: 'Fall soccer', title: 'Easy sign-up', steps: [{ title: 'Pick a team', text: 'By age and skill level' }, { title: 'Fill in the form', text: 'At the front desk' },
      { title: 'Get your jersey', text: 'At the first practice' }], foot: 'Sign-ups close August 31' } },

  { id: 'health-fan-shop', name: 'Fan shop coupon', cat: 'Sports', color: 'purple', tags: 'fan shop,team gear,coupon,jerseys,discount,merch',
    recipe: 'coupon', palette: 'berry', fonts: 'poster',
    o: { kick: 'Otters Fan Shop', deal: '20% OFF', title: 'All team gear', sub: 'Jerseys, scarves and caps', code: 'Code: GOOTTERS', until: 'Home game days only',
      foot: 'Next to gate B', art: [['soccer'], ['star']] } },

  { id: 'health-gear-rental', name: 'Gear rental', cat: 'Sports', color: 'purple', tags: 'rental,equipment,tennis,bikes,volleyball,rec center',
    recipe: 'dishes', palette: 'lavender', fonts: 'friendly',
    o: { kick: 'Lakeside Rec Center', title: 'Gear rental', dishes: [{ name: 'Tennis racquet', note: 'Balls included', price: '$5/hr', art: ['tennisball'] },
      { name: 'Bike', note: 'Helmet included', price: '$8/hr', art: ['bicycle'] }, { name: 'Volleyball', note: 'For the sand courts', price: '$4/hr', art: ['volleyball'] }] } },

  { id: 'health-game-combo', name: 'Game day snack combo', cat: 'Sports', color: 'green', tags: 'concession stand,snacks,combo,game day,food,fans',
    recipe: 'receipt', palette: 'citrus',
    o: { kick: 'Game day', title: 'Snack like a fan', sub: 'A hot dog, popcorn and a drink for $7', shop: 'Field House Snacks', shopSub: 'Behind the home stands',
      items: 'Hot dog | 4.00\nPopcorn | 3.00\nLemonade | 2.00', total: ['Combo price', '$7'], thanks: 'Go Otters!', foot: 'Every home game', art: [['hotdog'], ['soccer']] } },

  { id: 'health-player-week', name: 'Player of the week', cat: 'Sports', color: 'green', tags: 'player of the week,mvp,athlete,team,spotlight,photo',
    recipe: 'magazine', palette: 'forest', fonts: 'slab',
    o: { mast: 'MVP', kick: 'Player of the week', title: 'Jamie Cole', sub: 'Two goals and a big save on Saturday', lines: ['Team captain', 'Number 9', 'Loves a rainy match'],
      badge: 'Week 6' } },

  { id: 'health-meet-coaches', name: 'Meet the coaches', cat: 'Sports', color: 'pink', tags: 'coaches,team,staff,youth sports,meet the team,soccer',
    recipe: 'team', palette: 'blush', fonts: 'slab',
    o: { kick: 'Riverside Otters', title: 'Meet the coaches', people: [{ name: 'Coach Rosa', role: 'Head coach' }, { name: 'Coach Ben', role: 'Goalkeepers' },
      { name: 'Coach Kemi', role: 'Fitness' }, { name: 'Coach Raj', role: 'Under 10s' }] } },

  { id: 'health-field-rules', name: 'Field rules', cat: 'Sports', color: 'green', tags: 'rules,field,park,sports,checklist,fans',
    recipe: 'checklist', palette: 'citrus', fonts: 'poster',
    o: { kick: 'At the field', title: 'Field rules', items: ['Cleats on the grass only', 'No glass bottles', 'Dogs on a leash', 'Pick up your trash', 'Cheer for both teams'],
      big: ['whistle'] } },

  { id: 'health-game-delayed', name: 'Game delayed', cat: 'Sports', color: 'blue', tags: 'weather delay,lightning,game,update,safety,field',
    recipe: 'diagonal', palette: 'slate', fonts: 'poster',
    o: { kick: 'Weather update', title: 'Game delayed', sub: 'Lightning nearby. Please wait in your car or the field house.', foot: 'Updates on this screen',
      big: ['bolt', ['$accent2'], { motion: 'pulse' }], art: [['cloud', [], { motion: 'drift' }], ['cloud', [], { motion: 'drift' }]] } },

  { id: 'health-champions', name: 'Champions!', cat: 'Sports', color: 'red', tags: 'champions,celebration,trophy,winners,team,congratulations',
    recipe: 'sunburst', palette: 'ruby', fonts: 'poster',
    o: { kick: 'Back to back', title: 'Champions!', sub: 'Congratulations, Lady Hawks', foot: 'Parade on Saturday at noon',
      art: [['trophy'], ['medal'], ['star', ['$accent']], ['star', ['$accent']], ['confetti']], fx: ['confetti', { amount: 3, speed: 3 }] } },

  { id: 'health-fun-run', name: '5K fun run', cat: 'Sports', color: 'coral', tags: '5k,fun run,race,running,community,family',
    recipe: 'datestamp', palette: 'coral', fonts: 'slab',
    o: { month: 'May', day: '18', kick: 'Fun run', title: '5K for everyone', sub: 'Walk, jog or run. Kids dash at 9 AM, main race at 10.', foot: 'Sign up at the rec center',
      art: [['sneaker'], ['medal', [], { motion: 'swing' }], ['flame']] } },

  { id: 'health-big-game-countdown', name: 'Big game countdown', cat: 'Sports', color: 'navy', tags: 'countdown,big game,kickoff,watch party,football,fans',
    recipe: 'countdown', palette: 'midnight', fonts: 'poster',
    o: { kick: 'The big game', title: 'Kickoff countdown', label: 'Kickoff in', done: 'Game on!', foot: 'Watch it here on the big screen',
      art: [['football', [], { motion: 'float' }], ['trophy'], ['star', ['$accent'], { motion: 'twinkle' }], ['whistle']] } },

  { id: 'health-golf-day', name: 'Charity golf day', cat: 'Sports', color: 'green', tags: 'golf,tournament,charity,scramble,club,event',
    recipe: 'stamp', palette: 'forest', fonts: 'elegant',
    o: { ring: 'Charity golf day', center: '9 AM', sealMotion: 'pulse', kick: 'Pinecrest Golf Club', title: 'Tee off with us', sub: 'Teams of four. Lunch and prizes after.', foot: 'Sign up at the pro shop',
      art: [['golf'], ['trophy'], ['sun']] } },

  { id: 'health-reserve-court', name: 'Reserve a court', cat: 'Sports', color: 'teal', tags: 'tennis,pickleball,court booking,qr,scan,reserve',
    recipe: 'scan', palette: 'mint', fonts: 'modern',
    o: { kick: 'Tennis and pickleball', title: 'Reserve a court', steps: ['Scan the code', 'Pick a court and a time', 'Show your booking at the gate'], codeLabel: 'Scan to book',
      foot: 'Courts open 7 AM to 10 PM' } },

  { id: 'health-ride-with-us', name: 'Group ride meeting point', cat: 'Sports', color: 'blue', tags: 'cycling,bike ride,group ride,meet up,club,map',
    recipe: 'findus', palette: 'ocean', fonts: 'friendly',
    o: { kick: 'Saturday ride', title: 'Ride with us', address: ['Meet at Harbor Cycles', '22 Dockside Road', '25 miles, coffee stop halfway'], hours: 'Saturdays, 8 AM sharp',
      foot: 'Helmets required' } },

  { id: 'health-season-highlights', name: 'Season highlights', cat: 'Sports', color: 'brown', tags: 'photos,season,team,memories,highlights,soccer',
    recipe: 'polaroids', palette: 'espresso', fonts: 'handmade',
    o: { kick: 'Season highlights', title: 'What a season', captions: ['First win', 'Muddy match', 'Trophy day'], art: [['soccer']] } },

  { id: 'health-game-day-screen', name: 'Game day screen', cat: 'Sports', color: 'black', tags: 'split screen,game day,live,scores,stadium,screen',
    recipe: 'split3', palette: 'mono',
    o: { title: 'Otter Field Game Day', labels: ['Live game', 'Scores', 'Up next'], ticker: 'Halftime show by the youth band\nSnack stand open by gate B\nThanks for cheering!',
      label: 'Today' } },

  { id: 'health-little-kickers', name: 'Little Kickers', cat: 'Sports', color: 'yellow', tags: 'kids,soccer,toddlers,classes,youth sports,saturday',
    recipe: 'kids', palette: 'sunshine', fonts: 'friendly',
    o: { kick: 'Ages 3 to 6', title: 'Little Kickers', sub: 'Fun soccer games every Saturday morning', foot: 'First class free',
      art: [['soccer', [], { motion: 'float' }], ['star', [], { motion: 'twinkle' }], ['sneaker'], ['sun']] } },

  { id: 'health-train-hard', name: 'Train hard, play fair', cat: 'Sports', color: 'brown', tags: 'sportsmanship,motivation,team,fair play,big words,coach',
    recipe: 'bigtype', palette: 'espresso',
    o: { lines: ['TRAIN HARD', 'PLAY FAIR'], kick: 'Our team promise', sub: 'The Riverside Otters way', art: [['whistle']] } },

  { id: 'health-helpers-wanted', name: 'Team helpers wanted', cat: 'Sports', color: 'pink', tags: 'volunteers,parents,helpers,sign up,team,youth sports',
    recipe: 'corkboard', palette: 'blush', fonts: 'handmade',
    o: { title: 'Team helpers wanted', notes: ['Snack duty', 'Line judge', 'Score keeper', 'Team photos'], sub: 'Sign up on the sheet by the door',
      art: [['whistle'], ['raisedhand']] } },

  { id: 'health-coach-says', name: 'Coach says', cat: 'Sports', color: 'purple', tags: 'coach,quote,sportsmanship,team,youth sports,values',
    recipe: 'testimonial', palette: 'lavender', fonts: 'elegant',
    o: { kick: 'Coach says', quote: 'Win or lose, we play hard, we play fair and we always shake hands.', who: 'Coach Rosa', role: 'Riverside Otters', foot: 'Go Otters!',
      art: [['whistle']] } },

  { id: 'health-field-status', name: 'Field status board', cat: 'Sports', color: 'blue', tags: 'field status,park,closures,sports complex,updates,info',
    recipe: 'infoboard', palette: 'slate',
    o: { kick: 'Riverside Sports Park', title: 'Field status', cards: [{ label: 'Field 1', value: 'Open', art: ['soccer'] },
      { label: 'Field 2', value: 'Closed, too wet', art: ['cloud', ['$paper', '$bg2']] }, { label: 'Courts', value: 'Open until 10 PM', art: ['tennisball'] }],
      ticker: 'Lights come on at dusk\nSnack stand open on weekends\nPlease park in the north lot', label: 'Updates' } }

];

// Learning: templates for schools, colleges, libraries, camps and kids' programs (Education, College, Kids and youth).
// See README.md in this folder for how a spec works. Every name, place, handle and phone number here is made up.
module.exports = [
  // ===================================================================== Education
  { id: 'learn-first-day-checklist', name: 'First day checklist', cat: 'Education', color: 'green', tags: 'first day,back to school,checklist,students,ready,backpack,school year,september',
    when: { kind: 'year', month: 8, day: 10, span: 40, label: 'Back to school season' },
    recipe: 'checklist', palette: 'citrus', fonts: 'friendly',
    o: { kick: 'Back to school', title: 'First day checklist', items: ['Backpack packed', 'Lunch and a water bottle', 'Know your bus number', 'Supplies labeled', 'A good night of sleep'], done: 0,
      big: ['backpack', ['$accent', '$accent2', '$ink']], back: [['dotsbg', ['$accent'], { opacity: 12 }]] } },

  { id: 'learn-welcome-back', name: 'Welcome back, students', cat: 'Education', color: 'coral', tags: 'welcome back,back to school,first day,students,school,school year,hello,september',
    when: { kind: 'year', month: 8, day: 15, span: 30, label: 'The first weeks of school' },
    recipe: 'banner', palette: 'coral', fonts: 'friendly',
    o: { kick: 'Hello again!', title: 'Welcome\nback!', sub: "We missed you. Let's make this a great year!", foot: 'First bell at 8:15',
      art: [['apple', ['$accent', '#2b9348', '#ffffff']], ['books', ['$accent', '$accent2', '#2a9d8f']], ['pencil', ['$accent2', '#ff8fab', '#94a3b8']]], fx: ['confetti', { amount: 2, speed: 2 }] } },

  { id: 'learn-bell-schedule', name: 'Bell schedule', cat: 'Education', color: 'blue', tags: 'bell schedule,periods,school day,timetable,classes,times,lunch,students',
    recipe: 'schedule', palette: 'slate', fonts: 'poster',
    o: { kick: 'Oak Hill Middle School', title: 'Bell schedule', sub: 'Monday to Thursday. On Fridays we end at 1:30.', big: ['clock', ['#ffffff', '$ink', '$accent']],
      rows: [['8:15', 'Homeroom', 'Your room'], ['8:30', 'Period 1', ''], ['9:25', 'Period 2', ''], ['10:20', 'Break', 'Courtyard'], ['10:35', 'Period 3', ''], ['11:30', 'Lunch', 'Cafeteria'], ['12:15', 'Period 4', ''], ['1:10', 'Period 5', '']] } },

  { id: 'learn-lunch-today', name: "Today's lunch", cat: 'Education', color: 'green', tags: 'school lunch,cafeteria,menu,today,food,students,lunch menu,healthy',
    recipe: 'dishes', palette: 'citrus', fonts: 'friendly',
    o: { kick: 'Cafeteria', title: "Today's lunch", dishes: [{ name: 'Cheese pizza', note: 'With a side salad', price: '$2.75', art: ['pizza'] }, { name: 'Chicken tacos', note: 'Beans and rice', price: '$2.75', art: ['taco'] }, { name: 'Fruit cup', note: 'Free with any lunch', price: 'Free', art: ['watermelon'] }] } },

  { id: 'learn-new-books', name: 'New in the library', cat: 'Education', color: 'purple', tags: 'library,new books,reading,books,check out,school library,covers,shelf',
    recipe: 'dishes', palette: 'lavender', fonts: 'elegant',
    o: { kick: 'Fresh on the shelf', title: 'New in the library', dishes: [{ name: 'The Moon Garden', note: 'Ages 8 to 12', price: 'Shelf B' }, { name: 'Robots Rule!', note: 'Fun with science', price: 'Shelf D' }, { name: 'Ocean Friends', note: 'A picture book', price: 'Shelf A' }],
      back: [['dotsbg', ['$accent'], { opacity: 10 }]] } },

  { id: 'learn-reading-race', name: 'Reading race', cat: 'Education', color: 'blue', tags: 'reading,books,grades,contest,chart,library,challenge,school',
    recipe: 'board', palette: 'ocean', fonts: 'friendly',
    o: { title: 'Reading race', sub: 'Books read so far, by grade', mark: ['books', ['$accent', '$accent2', '#e76f51']], kind: 'chart',
      cfg: { kind: 'hbar', title: '', data: 'Grade 4, 302\nGrade 2, 265\nGrade 3, 248\nGrade 5, 225\nGrade 1, 210', labels: true, theme: 'paper', cAccent: '$accent', cText: '$paperInk' },
      foot: 'Grade 4 is in the lead!\nEvery book counts\nThe winning grade gets a pizza party', footLabel: 'Go readers', footAccent: '$accent',
      tallH: 44, tallArt: ['trophy', ['#ffd166', '#3d2c1e', '#ffffff'], { motion: 'float' }] } },

  { id: 'learn-book-of-the-month', name: 'Book of the month', cat: 'Education', color: 'pink', tags: 'book of the month,library,reading,recommendation,books,read,pick,students',
    recipe: 'magazine', palette: 'blush', fonts: 'elegant',
    o: { mast: 'READ', kick: 'Library pick', title: 'Book of\nthe month', sub: "The Lighthouse Keeper's Cat", lines: ['Ages 7 and up', 'Funny and kind', 'Ask at the desk'], badge: 'Pick' } },

  { id: 'learn-spelling-bee', name: 'Spelling bee', cat: 'Education', color: 'yellow', tags: 'spelling bee,contest,words,students,school event,competition,grades,ticket',
    recipe: 'admit', palette: 'sunshine', fonts: 'slab',
    o: { kick: 'Grades 3 to 5', admit: 'Families welcome', title: 'Spelling bee', details: [['Date', 'Fri, Feb 6'], ['Time', '1 PM'], ['Place', 'Gym']], stub: '026', stubLabel: 'Seat',
      sub: 'Come and cheer for our best spellers!', foot: 'Good luck, spellers!', art: [['books', ['$accent', '$accent2', '#2a9d8f']], ['pencil', ['$accent', '#ff8fab', '#94a3b8']]] } },

  { id: 'learn-stem-night', name: 'STEM night', cat: 'Education', color: 'navy', tags: 'stem,science,math,family night,robots,school event,experiments,technology',
    recipe: 'gig', palette: 'midnight', fonts: 'poster',
    o: { title: 'STEM\nnight', day: 'Thu', date: '20', month: 'Mar', lines: ['Robots, rockets and slime', 'Hands-on fun for all ages', 'Free pizza at 6'], strip: 'Cafeteria, 5:30 to 7:30 PM',
      art: [['atom', ['$accent', '$accent2', '#ffd166'], { motion: 'spin' }]], back: [['gridbg', ['#ffffff'], { opacity: 22 }]] } },

  { id: 'learn-conferences', name: 'Parent-teacher conferences', cat: 'Education', color: 'teal', tags: 'parent teacher conferences,parents,meetings,teachers,sign up,school,families,fall',
    recipe: 'infoboard', palette: 'mint', fonts: 'modern',
    o: { kick: 'Parent-teacher', title: 'Conferences', cards: [{ label: 'Dates', value: 'Nov 12 and 13', art: ['calendar'] }, { label: 'Time', value: '3 to 7 PM', art: ['clock'] }, { label: 'Sign up', value: 'Front office', art: ['clipboard'] }],
      ticker: 'Translators are available\nChildcare in the library\nEach meeting is 15 minutes', label: 'Families', back: [['blob3', ['$bg2', '$bg2'], { opacity: 80 }]] } },

  { id: 'learn-field-trip', name: 'Field trip checklist', cat: 'Education', color: 'blue', tags: 'field trip,checklist,permission slip,lunch,bus,students,reminder,school trip',
    recipe: 'checklist', palette: 'ocean', fonts: 'friendly',
    o: { kick: 'Zoo trip on Friday', title: 'Field trip checklist', items: ['Signed permission slip', 'Packed lunch', 'Water bottle', 'Comfy shoes', 'A light jacket'], done: 0,
      big: ['schoolbus', ['#ffc300', '$ink', '#bde0fe']], back: [['blob1', ['$bg2', '$bg2'], { opacity: 80 }]] } },

  { id: 'learn-study-smarter', name: 'Study smarter', cat: 'Education', color: 'purple', tags: 'study tips,studying,exams,tests,learning,students,homework,focus',
    recipe: 'features', palette: 'berry', fonts: 'poster',
    o: { kick: 'Test week tips', title: 'Study smarter', features: [{ art: ['clock', ['#ffffff', '$bg1', '$accent']], title: 'Short sessions', text: '25 minutes, then a short break' }, { art: ['pencil', ['$accent2', '$accent', '#94a3b8']], title: 'Quiz yourself', text: 'Test yourself, do not just reread' }, { art: ['moon', ['$accent2', '#ffffff', '#ffffff']], title: 'Sleep well', text: 'Your brain saves it overnight' }],
      foot: 'You have got this!', back: [['starsbg', ['$accent2', '#ffffff', '$accent'], { opacity: 20 }]] } },

  { id: 'learn-spirit-week', name: 'Spirit week', cat: 'Education', color: 'red', tags: 'spirit week,dress up,school spirit,pajama day,theme days,students,fun,week',
    recipe: 'timeline', palette: 'ruby', fonts: 'slab',
    o: { kick: 'Show your school spirit', title: 'Spirit week', steps: [{ label: 'Mon', text: 'Pajama day' }, { label: 'Tue', text: 'Twin day' }, { label: 'Wed', text: 'Crazy hair day' }, { label: 'Thu', text: 'Jersey day' }, { label: 'Fri', text: 'School colors' }],
      foot: 'Go Hawks!', back: [['confettibg', ['$accent', '$accent2', '#ffffff'], { opacity: 20 }]] } },

  { id: 'learn-testing-quiet', name: 'Testing, quiet please', cat: 'Education', color: 'black', tags: 'testing,quiet,exams,do not disturb,hallway,silence,tests,students',
    recipe: 'stamp', palette: 'mono', fonts: 'elegant',
    o: { ring: 'Quiet please', center: 'Shh', kick: 'Testing today', title: 'Tests in progress', sub: 'Thank you for keeping the halls quiet until 11:30.', foot: 'Thank you for helping',
      art: [['pencil', ['#ffd166', '#ff8fab', '#94a3b8']], ['clock', ['#ffffff', '#1f2937', '#ff6b5e']], ['lsparkle', ['#ffffff']]] } },

  { id: 'learn-honor-roll', name: 'Honor roll', cat: 'Education', color: 'blue', tags: 'honor roll,students,achievement,grades,congratulations,awards,names,proud',
    recipe: 'directory', palette: 'slate', fonts: 'elegant',
    o: { kick: 'Congratulations', title: 'Honor roll', rows: [['Ava Thompson', 'Grade 8'], ['Liam Chen', 'Grade 8'], ['Sofia Ramos', 'Grade 7'], ['Noah Patel', 'Grade 7'], ['Mia Johnson', 'Grade 7'], ['Ethan Kim', 'Grade 6'], ['Zara Ali', 'Grade 6'], ['Lucas Brown', 'Grade 6'], ['Emma Davis', 'Grade 6'], ['Omar Haddad', 'Grade 6']],
      back: [['starsbg', ['$accent2', '$accent', '#ffffff'], { opacity: 22 }]], fx: ['sparkles', { amount: 1, speed: 2 }] } },

  { id: 'learn-after-school-clubs', name: 'After-school clubs', cat: 'Education', color: 'coral', tags: 'clubs,after school,activities,chess,art,robotics,choir,join',
    recipe: 'directory', palette: 'coral', fonts: 'friendly',
    o: { kick: 'Find your thing', title: 'Join a club', sub: 'Clubs meet 3:30 to 4:30 PM', rows: [['Chess club', 'Mondays'], ['Art club', 'Tuesdays'], ['Robotics', 'Wednesdays'], ['Choir', 'Thursdays'], ['Coding', 'Fridays']],
      back: [['blob2', ['$bg2', '$bg2'], { opacity: 80 }]] } },

  { id: 'learn-teacher-thanks', name: 'Teacher Appreciation Week', cat: 'Education', color: 'pink', tags: 'teacher appreciation,thank you,teachers,may,school,gratitude,staff,week',
    when: { kind: 'nth', month: 5, nth: 1, weekday: 1, span: 5, label: 'Teacher Appreciation Week' },
    recipe: 'arch', palette: 'blush', fonts: 'elegant',
    o: { kick: 'Teacher Appreciation Week', title: 'Thank you,\nteachers!', sub: 'For every lesson, every smile and every second chance', foot: 'Leave a note in the office', big: ['apple', ['$accent', '#2b9348', '#ffffff']],
      art: [['heart', ['$accent']], ['pencil', ['$accent2', '$accent', '#94a3b8']], ['star', ['$accent2']]], fx: ['hearts', { amount: 1, speed: 2 }] } },

  { id: 'learn-our-teachers', name: 'Meet our teachers', cat: 'Education', color: 'green', tags: 'teachers,staff,meet the teachers,school,classes,faculty,photos,welcome',
    recipe: 'team', palette: 'citrus', fonts: 'friendly',
    o: { kick: 'Say hello to', title: 'Our teachers', people: [{ name: 'Ms. Patel', role: 'Grade 3' }, { name: 'Mr. Ortiz', role: 'Grade 4' }, { name: 'Mrs. Chen', role: 'Grade 5' }, { name: 'Mr. Bell', role: 'Music' }],
      back: [['dotsbg', ['$accent'], { opacity: 10 }]] } },

  { id: 'learn-lunch-money', name: 'Add lunch money', cat: 'Education', color: 'teal', tags: 'lunch money,payment,cafeteria,parents,qr,scan,account,top up',
    recipe: 'scan', palette: 'mint', fonts: 'poster',
    o: { kick: 'For families', title: 'Add lunch\nmoney', steps: ['Scan the code', "Find your child's name", 'Add any amount'], codeLabel: 'Scan to add money', foot: 'Questions? Call 555-0176',
      back: [['dotsbg', ['$accent'], { opacity: 12 }]] } },

  { id: 'learn-find-your-bus', name: 'Find your bus', cat: 'Education', color: 'yellow', tags: 'bus,school bus,after school,dismissal,routes,doors,students,going home',
    recipe: 'directory', palette: 'sunshine', fonts: 'friendly',
    o: { kick: 'After school', title: 'Find your bus', rows: [['Bus 2: Maple Hill', 'Door A'], ['Bus 4: Riverside', 'Door A'], ['Bus 7: Oak Park', 'Door B'], ['Bus 9: Cedar Lane', 'Door B'], ['Bus 12: Lakeview', 'Door C'], ['Walkers', 'Front gate']],
      back: [['dotsbg', ['$accent'], { opacity: 12 }]] } },

  { id: 'learn-art-show', name: 'Student art show', cat: 'Education', color: 'black', tags: 'art show,student art,gallery,exhibit,photos,painting,families,school event',
    recipe: 'polaroids', palette: 'mono', fonts: 'handmade',
    o: { kick: 'Gallery night, Thursday at 6', title: 'Student art show', sub: 'All week in the front hall', captions: ['Grade 2: Self-portraits', 'Grade 4: City at night', 'Grade 6: Clay pots'],
      art: [['artpalette']], back: [['grain', ['#ffffff'], { opacity: 20 }]] } },

  { id: 'learn-graduation-countdown', name: 'Graduation countdown', cat: 'Education', color: 'navy', tags: 'graduation,countdown,class of,seniors,ceremony,may,june,timer',
    when: { kind: 'year', month: 4, day: 15, span: 60, label: 'Before graduation' },
    recipe: 'countdown', palette: 'midnight', fonts: 'elegant',
    o: { kick: 'Almost there, graduates', title: 'Graduation day', label: 'The big day is in', done: 'Congratulations, graduates!', days: true, foot: 'Caps and gowns are ready in the office',
      art: [['gradcap', ['$ink', '#ffd166', '#1f2937'], { motion: 'float' }], ['diploma'], ['star', ['$accent2']], ['sparkle', ['#ffd166', '#ffffff', '$accent2'], { motion: 'twinkle' }]],
      back: [['starfield', ['#ffffff', '#ffd166']]], fx: ['stars', { amount: 2, speed: 2 }] } },

  { id: 'learn-word-of-the-day', name: 'Word of the day', cat: 'Education', color: 'green', tags: 'word of the day,vocabulary,words,reading,learning,english,definition,classroom',
    recipe: 'note', palette: 'forest', fonts: 'elegant',
    o: { big: ['books', ['$accent', '$accent2', '#e76f51']], kick: 'Word of the day', title: 'Curious', sub: 'Wanting to learn or know more. "The curious kitten peeked inside the box."', foot: 'Use it today!',
      art: [['bulb', ['$accent', '#94a3b8', '#ffffff']], ['lsparkle', ['$accent2']]], back: [['leavesbg', ['$accent2', '$bg2', '$accent'], { opacity: 8 }]] } },

  { id: 'learn-tonights-homework', name: 'Homework board', cat: 'Education', color: 'green', tags: 'homework,chalkboard,assignments,classroom,due,reminders,teacher,students',
    recipe: 'chalk', palette: 'forest', fonts: 'handmade',
    o: { title: 'Homework', sub: 'Room 12, due tomorrow', cfg: { items: '# Tonight\nMath | Page 42\nSpelling | List 7\nReading | 20 minutes\n# This week\nScience | Bring 3 leaves', columns: '1', showDesc: false },
      side: 'Stuck? Ask me before class!', art: [['apple', ['#ff6b5e', '$accent2', '#ffffff']], ['pencil']] } },

  { id: 'learn-100th-day', name: '100th day of school', cat: 'Education', color: 'purple', tags: '100th day,100 days,celebration,school,students,milestone,february,smarter',
    recipe: 'swiss', palette: 'berry', fonts: 'friendly',
    o: { num: '100', kick: 'Hooray!', title: '100 days smarter', sub: 'Thank you for 100 days of learning, laughing and growing', foot: 'Wear 100 dots on Friday!', art: [['star', ['$accent2']]],
      back: [['confettibg', ['$accent', '$accent2', '#ffffff'], { opacity: 20 }]], fx: ['confetti', { amount: 2, speed: 2 }] } },

  { id: 'learn-yearbook', name: 'Yearbook orders', cat: 'Education', color: 'brown', tags: 'yearbook,order,memories,school,prices,photos,students,keepsake',
    recipe: 'prices', palette: 'espresso', fonts: 'slab',
    o: { kick: 'Order by December 1', title: 'Get your yearbook', plans: [{ name: 'Yearbook', price: '$30', per: 'until Dec 1', lines: ['Full color', 'Every student inside'] }, { name: 'Yearbook plus', price: '$40', per: 'until Dec 1', lines: ['Your name on the cover', 'Extra autograph pages', 'A clear cover sleeve'], hot: true, tag: 'Most picked' }],
      back: [['grain', ['#ffffff'], { opacity: 25 }]] } },

  { id: 'learn-skip-homework', name: 'Homework pass', cat: 'Education', color: 'pink', tags: 'homework pass,reward,classroom,coupon,students,prize,teacher,fun',
    recipe: 'coupon', palette: 'blush', fonts: 'friendly',
    o: { kick: 'Classroom reward', deal: 'NO\nHOMEWORK', title: 'Homework pass', sub: 'Good for one night off any homework', code: 'Ask your teacher to sign', until: 'Use it by Friday', foot: 'Great job this week!',
      art: [['star', ['$accent2']], ['pencil', ['$accent2', '$accent', '#94a3b8']]] } },

  { id: 'learn-school-store', name: 'School store prices', cat: 'Education', color: 'purple', tags: 'school store,prices,supplies,pencils,students,shop,before school,student council',
    recipe: 'receipt', palette: 'lavender', fonts: 'friendly',
    o: { kick: 'Open before school', title: 'School store', sub: 'Run by our student council', shop: 'Hawks school store', shopSub: 'Room 104, 7:45 to 8:10', items: 'Pencil | 0.25\nEraser | 0.50\nNotebook | 1.00\nFolder | 0.75\nHighlighter | 1.00',
      thanks: 'Thank you for shopping!', foot: 'Every cent goes to field trips', art: [['pencil'], ['crayon']] } },

  { id: 'learn-hallway-screen', name: 'School hallway screen', cat: 'Education', color: 'red', tags: 'split screen,hallway,announcements,school,two areas,live,news,video',
    recipe: 'split2', palette: 'ruby', fonts: 'poster',
    o: { title: 'Oak Hill Elementary', labels: ['Morning news', 'Photos'], ticker: 'Picture day is Thursday\nBook fair all next week\nGo Hawks!', label: 'Today' } },

  { id: 'learn-snow-day', name: 'Snow day', cat: 'Education', color: 'blue', tags: 'snow day,school closed,closure,winter,weather,no school,announcement,snow',
    when: { kind: 'year', month: 12, day: 1, span: 60, label: 'Winter' },
    recipe: 'diagonal', palette: 'ocean', fonts: 'friendly',
    o: { kick: 'No school today', title: 'Snow day!', sub: 'Stay warm, stay safe and read a good book', big: ['snowflake', ['$accent', '$accent2', '$accent']], foot: 'See you tomorrow!',
      art: [['snowman', ['#ffffff', '$ink', '#e63946']], ['snowflake', ['#ffffff', '$bg2', '#ffffff']]], fx: ['snow', { amount: 3, speed: 2 }] } },

  // ===================================================================== College
  { id: 'learn-campus-tour', name: 'Campus tour', cat: 'College', color: 'blue', tags: 'campus tour,visit,admissions,tour,college,university,prospective students,welcome center',
    recipe: 'steps', palette: 'ocean', fonts: 'modern',
    o: { kick: 'Visiting campus?', title: 'Take a campus tour', steps: [{ title: 'Meet us here', text: 'Tours leave the welcome center on the hour' }, { title: 'Walk with us', text: 'Library, labs, dorms and dining' }, { title: 'Ask anything', text: 'Our student guides know it all' }],
      foot: 'Tours run 10 AM to 4 PM', back: [['dotsbg', ['$accent'], { opacity: 12 }]] } },

  { id: 'learn-welcome-week', name: 'Welcome week', cat: 'College', color: 'purple', tags: 'welcome week,orientation,new students,freshmen,move in,events,schedule,fall',
    when: { kind: 'year', month: 8, day: 20, span: 30, label: 'Start of the fall term' },
    recipe: 'schedule', palette: 'lavender', fonts: 'poster',
    o: { kick: 'New students', title: 'Welcome week', sub: 'Everything is free with your student card', big: ['backpack', ['$accent', '$accent2', '$paperInk']],
      rows: [['Mon', 'Move-in day', 'Dorms'], ['Tue', 'Campus tours', 'Main quad'], ['Wed', 'Club fair', 'Student center'], ['Thu', 'Movie night', 'North lawn'], ['Fri', 'Welcome dance', 'Gym']] } },

  { id: 'learn-career-fair', name: 'Career fair', cat: 'College', color: 'blue', tags: 'career fair,jobs,internships,employers,students,resume,event,networking',
    recipe: 'admit', palette: 'slate', fonts: 'poster',
    o: { kick: 'All majors welcome', admit: 'Admit all students', title: 'Career fair', details: [['Date', 'Wed, Oct 8'], ['Time', '10 AM to 3 PM'], ['Where', 'Main hall']], stub: '60', stubLabel: 'Employers',
      sub: 'Bring your resume and your best handshake', foot: 'Dress to impress', art: [['briefcase', ['#7c4a2d', '$accent2', '#ffffff']], ['people', ['$accent', '$accent2', '#ff6b5e']]] } },

  { id: 'learn-career-checklist', name: 'Career fair checklist', cat: 'College', color: 'green', tags: 'career fair,checklist,resume,job search,students,prepare,interview,tips',
    recipe: 'checklist', palette: 'citrus', fonts: 'modern',
    o: { kick: 'Career fair ready?', title: 'Your checklist', items: ['Printed resumes', 'Your 30-second pitch', 'Questions for each booth', 'Comfy shoes', 'A big smile'], done: 2,
      big: ['briefcase', ['#7c4a2d', '$accent2', '#ffffff']], back: [['blob3', ['$bg2', '$bg2'], { opacity: 80 }]] } },

  { id: 'learn-study-spots', name: 'Find a study spot', cat: 'College', color: 'teal', tags: 'study spaces,library,quiet,campus,study rooms,where to study,students,map',
    recipe: 'directory', palette: 'mint', fonts: 'modern',
    o: { kick: 'Need a quiet place?', title: 'Find a study spot', rows: [['Library quiet floor', 'Floor 3'], ['Library group rooms', 'Floor 2'], ['Student center lounge', 'Open 24/7'], ['Computer lab, Hall B', 'Room 104'], ['Outdoor tables', 'North lawn']],
      back: [['gridbg', ['$accent'], { opacity: 16 }]] } },

  { id: 'learn-library-today', name: 'Library today', cat: 'College', color: 'coral', tags: 'library,hours,today,help desk,study rooms,printing,campus,info',
    recipe: 'infoboard', palette: 'coral', fonts: 'poster',
    o: { kick: 'Larkhaven College Library', title: 'Library today', cards: [{ label: 'Open', value: '7 AM to midnight', art: ['books'] }, { label: 'Help desk', value: 'Floor 1', art: ['info'] }, { label: 'Study rooms', value: 'Book at the desk', art: ['door'] }],
      ticker: 'Finals week: open 24 hours\nPrinting is 10 cents a page\nFloor 3 is the quiet floor', label: 'Library', back: [['dotsbg', ['$accent'], { opacity: 10 }]] } },

  { id: 'learn-finals-fuel', name: 'Finals week fuel', cat: 'College', color: 'brown', tags: 'finals,exams,study break,coffee,therapy dogs,students,stress relief,free food',
    recipe: 'features', palette: 'espresso', fonts: 'slab',
    o: { kick: 'Finals week', title: 'Finals week fuel', features: [{ art: ['coffee'], title: 'Free coffee', text: 'Student center, 8 PM to 2 AM' }, { art: ['dog'], title: 'Therapy dogs', text: 'Library lawn on Wednesday' }, { art: ['pizza'], title: 'Midnight pizza', text: 'Dorm lobbies on Thursday' }],
      foot: 'You have got this!', back: [['grain', ['#ffffff'], { opacity: 25 }]] } },

  { id: 'learn-office-hours', name: 'Office hours', cat: 'College', color: 'blue', tags: 'office hours,professors,faculty,help,department,schedule,students,questions',
    recipe: 'schedule', palette: 'slate', fonts: 'elegant',
    o: { kick: 'Biology department', title: 'Office hours', sub: 'Drop in, no appointment needed', big: ['atom', ['$accent', '$accent2', '#ffd166']],
      rows: [['Mon', 'Dr. Rivera, 2 to 4', 'A210'], ['Tue', 'Prof. Kim, 10 to 12', 'C118'], ['Wed', 'Dr. Osei, 1 to 3', 'Lab 4'], ['Thu', 'Prof. Laine, 3 to 5', 'A214'], ['Fri', 'Lab helpers, 9 to 5', 'Lab 2']] } },

  { id: 'learn-registration', name: 'Registration opens', cat: 'College', color: 'red', tags: 'registration,classes,sign up,courses,advisor,term,deadline,schedule',
    recipe: 'datestamp', palette: 'ruby', fonts: 'poster',
    o: { month: 'Nov', day: '3', kick: 'Spring classes', title: 'Registration opens', sub: 'Meet your advisor before you sign up. Seniors go first.', foot: 'Advisors are in Hall B',
      art: [['calendar', ['#ffffff', '$accent2', '#1f2937']], ['pencil', ['$accent', '#ff8fab', '#94a3b8']], ['clock', ['#ffffff', '#1f2937', '$accent2']]], back: [['dotsbg', ['$accent'], { opacity: 8 }]] } },

  { id: 'learn-scholarships', name: 'Apply for scholarships', cat: 'College', color: 'yellow', tags: 'scholarships,financial aid,apply,money,awards,students,deadline,tuition',
    recipe: 'steps', palette: 'sunshine', fonts: 'slab',
    o: { kick: 'Free money for college', title: 'Apply for scholarships', steps: [{ title: 'Find one', text: 'Over 200 awards on the student portal' }, { title: 'Write it', text: 'The writing center can help' }, { title: 'Send it', text: 'Most are due March 1' }],
      foot: 'Questions? Visit the aid office', back: [['raysup', ['$accent2', '$accent'], { opacity: 8 }]] } },

  { id: 'learn-club-fair', name: 'Club fair', cat: 'College', color: 'purple', tags: 'club fair,clubs,student groups,activities,quad,join,events,campus life',
    recipe: 'banner', palette: 'berry', fonts: 'friendly',
    o: { kick: 'Find your people', title: 'Club fair', sub: '120 clubs on the main quad, Wednesday 11 to 2', foot: 'Free snacks!',
      art: [['music', ['$accent2', '$accent', '#ffffff']], ['soccer'], ['artpalette']], fx: ['confetti', { amount: 2, speed: 2 }] } },

  { id: 'learn-dining-hall', name: 'Dining hall today', cat: 'College', color: 'coral', tags: 'dining hall,menu,food,campus dining,lunch,dinner,students,today',
    recipe: 'dishes', palette: 'coral', fonts: 'friendly',
    o: { kick: 'Larkhaven dining', title: 'Dining hall today', dishes: [{ name: 'Grain bowl', note: 'Build your own', price: '$7', art: ['bowl'] }, { name: 'Stone oven pizza', note: 'A slice and a salad', price: '$6', art: ['pizza'] }, { name: 'Taco bar', note: 'Every Tuesday', price: '$8', art: ['taco'] }] } },

  { id: 'learn-campus-shuttle', name: 'Campus shuttle', cat: 'College', color: 'navy', tags: 'shuttle,bus,campus,stops,transport,schedule,route,free ride',
    recipe: 'timeline', palette: 'midnight', fonts: 'modern',
    o: { kick: 'Every 20 minutes, 7 AM to 11 PM', title: 'Campus shuttle', steps: [{ label: ':00', text: 'Main gate' }, { label: ':05', text: 'Library' }, { label: ':10', text: 'Dorms' }, { label: ':15', text: 'Sports center' }],
      foot: 'Free with your student card', back: [['gridbg', ['#ffffff'], { opacity: 22 }]] } },

  { id: 'learn-guest-lecture', name: 'Guest lecture', cat: 'College', color: 'black', tags: 'guest lecture,talk,speaker,science,event,free,auditorium,space',
    recipe: 'diagonal', palette: 'mono', fonts: 'elegant',
    o: { kick: 'Guest lecture', title: 'Life on Mars?', sub: 'Dr. Amara Okafor, planetary scientist. Tuesday at 6 PM in Hall A.', big: ['rocket', ['#ffffff', '#4cc9f0', '#ff6b5e']], foot: 'Free and open to all',
      art: [['star', ['#ffffff']], ['sparkle', ['#ffffff', '#ffffff', '#ffd166'], { motion: 'twinkle' }]], back: [['starfield', ['#ffffff', '#ffd166'], { opacity: 60 }]] } },

  { id: 'learn-homecoming', name: 'Homecoming', cat: 'College', color: 'red', tags: 'homecoming,game,parade,alumni,football,school spirit,bonfire,fall',
    when: { kind: 'year', month: 9, day: 15, span: 45, label: 'Homecoming season' },
    recipe: 'sunburst', palette: 'ruby', fonts: 'poster',
    o: { kick: 'Go Owls!', title: 'Homecoming', sub: 'Parade at 10, game at 2, bonfire at 7', foot: 'Alumni welcome',
      art: [['football'], ['megaphone', ['$accent2', '#ffffff', '$accent']], ['star', ['$accent']], ['star', ['$accent']], ['confetti']], fx: ['confetti', { amount: 2, speed: 3 }] } },

  { id: 'learn-commencement-day', name: 'Commencement day', cat: 'College', color: 'purple', tags: 'commencement,graduation,ceremony,schedule,graduates,families,may,cap and gown',
    when: { kind: 'year', month: 5, day: 1, span: 45, label: 'Graduation season' },
    recipe: 'timeline', palette: 'lavender', fonts: 'elegant',
    o: { kick: 'Commencement day', title: 'The big day', steps: [{ label: '8 AM', text: 'Robes and photos' }, { label: '9 AM', text: 'Line up on the lawn' }, { label: '10 AM', text: 'The ceremony begins' }, { label: '12 PM', text: 'Family reception' }],
      foot: 'Congratulations, graduates!', back: [['confettibg', ['$accent', '$accent2', '#ffd166'], { opacity: 22 }]] } },

  { id: 'learn-campus-numbers', name: 'Campus by the numbers', cat: 'College', color: 'green', tags: 'campus,numbers,stats,admissions,students,programs,college facts,university',
    recipe: 'bigstats', palette: 'forest', fonts: 'poster',
    o: { kick: 'Larkhaven College', title: 'Campus by the numbers', stats: [{ value: '12,400', label: 'Students', art: ['people'] }, { value: '180', label: 'Programs', art: ['books'] }, { value: '94%', label: 'Grads with jobs', art: ['briefcase'] }, { value: '24', label: 'Class size', art: ['gradcap', ['#ffffff', '$accent', '#ffffff']] }],
      back: [['dots', ['#ffffff'], { opacity: 6 }]] } },

  { id: 'learn-support-is-here', name: 'Support is here', cat: 'College', color: 'teal', tags: 'mental health,support,counseling,wellbeing,help,students,peer support,care',
    recipe: 'features', palette: 'mint', fonts: 'friendly',
    o: { kick: 'You are not alone', title: 'Support is here', features: [{ art: ['speech', ['#ffffff', '$accent', '#ffffff']], title: 'Talk to someone', text: 'Free counseling in Hall D' }, { art: ['hearthands', ['$accent2', '$accent', '#ffffff']], title: 'Peer support', text: 'Students who get it' }, { art: ['iconphone', ['$accent', '#ffffff', '#ffffff']], title: 'Day or night', text: 'Call 555-0199' }],
      foot: 'Reaching out is a strong move', back: [['blob2', ['$bg2', '$bg2'], { opacity: 80 }]] } },

  { id: 'learn-campus-jobs', name: 'Campus jobs', cat: 'College', color: 'yellow', tags: 'campus jobs,work study,part time,jobs board,students,hiring,career center,apply',
    recipe: 'corkboard', palette: 'sunshine', fonts: 'handmade',
    o: { title: 'Campus jobs', notes: ['Library desk, 10 hours a week', 'Barista at the campus cafe', 'Tour guide on Saturdays', 'Lab helper in the science hall'], sub: 'Apply at the career center in Hall B',
      art: [['briefcase', ['#7c4a2d', '$accent', '#ffffff']], ['pushpin', ['$accent2', '#94a3b8', '#ffffff']]] } },

  { id: 'learn-lost-student-id', name: 'Replace your ID', cat: 'College', color: 'green', tags: 'student id,lost card,replace,id card,campus card,qr,scan,help',
    recipe: 'scan', palette: 'citrus', fonts: 'poster',
    o: { kick: 'Lost your card?', title: 'Replace\nyour ID', steps: ['Scan the code', 'Freeze your old card', 'Pick up a new one'], codeLabel: 'Scan to report it', foot: 'New cards ready in an hour',
      back: [['blob1', ['$bg2', '$bg2'], { opacity: 80 }]] } },

  { id: 'learn-spring-break', name: 'Spring break', cat: 'College', color: 'blue', tags: 'spring break,march,vacation,break,campus hours,beach,students,holiday',
    when: { kind: 'year', month: 3, day: 1, span: 31, label: 'March' },
    recipe: 'paper', palette: 'ocean', fonts: 'friendly',
    o: { land: 'wavesbg', kick: 'Spring break', title: 'Rest up, Owls!', sub: 'The library closes early. Dorms stay open.',
      art: [['sun', ['#ffb703', '#fb8500', '#ffffff']], ['palm'], ['sunglasses', ['$ink', '$accent', '#ffffff']], ['umbrella'], ['cloud']] } },

  { id: 'learn-move-out', name: 'Move-out checklist', cat: 'College', color: 'pink', tags: 'move out,dorm,checklist,end of year,housing,students,summer,keys',
    when: { kind: 'year', month: 5, day: 1, span: 30, label: 'End of the spring term' },
    recipe: 'checklist', palette: 'blush', fonts: 'friendly',
    o: { kick: 'Leaving for the summer?', title: 'Move-out checklist', items: ['Empty and clean the fridge', 'Take all your things', 'Leave the room clean', 'Return your key', 'Donate what you do not need'], done: 0,
      big: ['housekey', ['$accent2', '$accent', '#ffffff']], back: [['dotsbg', ['$accent'], { opacity: 10 }]] } },

  { id: 'learn-textbook-buyback', name: 'Textbook buyback', cat: 'College', color: 'blue', tags: 'textbooks,buyback,sell books,bookstore,cash,end of term,students,prices',
    recipe: 'receipt', palette: 'ocean', fonts: 'slab',
    o: { kick: 'End of term', title: 'Sell your books back', sub: 'Cash on the spot at the campus bookstore', shop: 'Campus bookstore', shopSub: 'This week we pay', items: 'Intro to Biology | 45.00\nCalculus I | 52.00\nWorld History | 30.00\nChemistry lab guide | 12.00',
      total: ['Up to', '50% back'], thanks: 'Bring your student card', foot: 'Monday to Friday, 9 to 5', art: [['books'], ['coins']] } },

  { id: 'learn-deans-list', name: "Dean's list", cat: 'College', color: 'navy', tags: "dean's list,honors,students,achievement,grades,congratulations,term,awards",
    recipe: 'magazine', palette: 'midnight', fonts: 'elegant',
    o: { mast: 'HONORS', kick: 'Fall term', title: "Dean's list", sub: 'Congratulations to 412 students', lines: ['Full list at the main office', 'Celebration on Friday', 'Free cupcakes at 3'], badge: 'Proud',
      big: ['diploma', ['#f8f1e5', '#e63946', '#ffd166']] } },

  { id: 'learn-hack-night', name: 'Hack night', cat: 'College', color: 'purple', tags: 'hackathon,coding,engineering,students,teams,prizes,event,build',
    recipe: 'gig', palette: 'berry', fonts: 'poster',
    o: { title: 'Hack\nnight', day: 'Fri', date: '7', month: 'Feb', lines: ['24 hours of building', 'Teams of one to four', 'Food, prizes and mentors'], strip: 'Engineering hall, 6 PM',
      art: [['laptop', ['$accent', '#1f2937', '#ffffff'], { motion: 'float' }]], back: [['gridbg', ['#ffffff'], { opacity: 20 }]] } },

  { id: 'learn-student-elections', name: 'Student elections', cat: 'College', color: 'black', tags: 'elections,vote,student government,campus,voting,student council,voice,polls',
    recipe: 'bigtype', palette: 'mono', fonts: 'poster',
    o: { kick: 'Student government elections', lines: ['Your voice.', 'Your vote.'], sub: 'Vote at the student center until Friday at 5 PM', back: [['halftone', ['#ffffff'], { opacity: 8 }]] } },

  { id: 'learn-lab-rules', name: 'Lab safety rules', cat: 'College', color: 'yellow', tags: 'lab safety,goggles,science lab,rules,chemistry,safety,students,warning',
    recipe: 'alert', palette: 'sunshine',
    o: { title: 'Goggles on, please', sub: 'Lab coats and closed-toe shoes too. No food or drinks near the benches.', tone: 'warning', icon: 'alert', foot: 'Safety first, science second', theme: 'paper',
      big: ['atom', ['$accent', '$accent2', '#ffd166']] } },

  { id: 'learn-student-center', name: 'Student center screen', cat: 'College', color: 'green', tags: 'split screen,student center,three areas,campus,live,events,weather,photos',
    recipe: 'split3', palette: 'forest', fonts: 'modern',
    o: { title: 'Larkhaven Commons', labels: ['Events', 'Weather', 'Photos'], ticker: 'Free coffee before 9 AM\nClub fair on Wednesday\nLost and found at the front desk', label: 'Today' } },

  { id: 'learn-alumni-weekend', name: 'Alumni weekend', cat: 'College', color: 'brown', tags: 'alumni,reunion,weekend,homecoming,graduates,campus,photos,welcome home',
    recipe: 'polaroids', palette: 'espresso', fonts: 'elegant',
    o: { kick: 'Welcome home, alumni', title: 'Alumni weekend', sub: 'Tours, games and a big picnic on the lawn', captions: ['Class reunions', 'Campus walk', 'Game day'],
      art: [['gradcap', ['#f8fafc', '$accent', '#1f2937']]], back: [['grain', ['#ffffff'], { opacity: 20 }]] } },

  { id: 'learn-free-tutoring', name: 'Free tutoring', cat: 'College', color: 'pink', tags: 'tutoring,homework help,learning center,study help,students,free,writing center,math help',
    recipe: 'findus', palette: 'blush', fonts: 'slab',
    o: { kick: 'Stuck on homework?', title: 'Free tutoring', address: ['Learning Commons', 'Library, floor 2', 'Next to the cafe'], hours: 'Monday to Thursday, 10 AM to 9 PM', foot: 'No appointment needed' } },

  // ===================================================================== Kids and youth
  { id: 'learn-puppet-show', name: 'Puppet show', cat: 'Kids and youth', color: 'pink', tags: 'puppet show,kids,show,library,family,saturday,fun,theater',
    recipe: 'kids', palette: 'blush', fonts: 'friendly',
    o: { kick: 'Saturday at 11', title: 'Puppet show', sub: 'Giggles guaranteed for ages 3 to 8', foot: 'Free, in the kids corner',
      art: [['teddy'], ['star', ['$accent2']], ['music', ['$accent', '$accent2', '#ffffff']], ['butterfly', ['$accent', '$accent2', '#1f2937'], { motion: 'float' }], ['sparkle', ['$accent2', '#ffffff', '$accent']]] } },

  { id: 'learn-camp-day', name: 'A day at camp', cat: 'Kids and youth', color: 'green', tags: 'summer camp,schedule,camp day,activities,kids,swimming,crafts,hiking',
    when: { kind: 'year', month: 6, day: 15, span: 60, label: 'Summer camp season' },
    recipe: 'schedule', palette: 'citrus', fonts: 'friendly',
    o: { kick: 'Camp Maple Ridge', title: 'A day at camp', sub: 'Sunscreen on before every outdoor activity!', big: ['sun', ['#ffb703', '#fb8500', '#ffffff']],
      rows: [['9:00', 'Morning circle', 'Big tent'], ['9:30', 'Arts and crafts', 'Cabin 2'], ['11:00', 'Swim time', 'Lake'], ['12:30', 'Lunch', 'Mess hall'], ['1:30', 'Nature hike', 'Trail'], ['3:00', 'Games', 'Field'], ['4:00', 'Pick-up', 'Front gate']] } },

  { id: 'learn-pack-for-camp', name: 'Pack for camp', cat: 'Kids and youth', color: 'yellow', tags: 'camp,packing,what to bring,summer,kids,sunscreen,swimsuit,reminder',
    when: { kind: 'year', month: 5, day: 15, span: 45, label: 'Before summer camp' },
    recipe: 'features', palette: 'sunshine', fonts: 'friendly',
    o: { kick: 'Camp Maple Ridge', title: 'Pack for camp', features: [{ art: ['sunglasses', ['$ink', '$accent', '#ffffff']], title: 'Sun gear', text: 'Hat, sunscreen and sunglasses' }, { art: ['drop', ['$accent2', '#ffffff', '#ffffff']], title: 'Water bottle', text: 'With your name on it' }, { art: ['backpack', ['$accent', '$accent2', '$ink']], title: 'Swim bag', text: 'Swimsuit, towel and sandals' }],
      foot: 'Label everything!', back: [['blob1', ['$bg2', '$bg2'], { opacity: 80 }]] } },

  { id: 'learn-camp-weeks', name: 'Summer camp weeks', cat: 'Kids and youth', color: 'blue', tags: 'summer camp,prices,sign up,weeks,kids,half day,full day,register',
    when: { kind: 'year', month: 3, day: 1, span: 60, label: 'Camp sign-up season' },
    recipe: 'prices', palette: 'ocean', fonts: 'friendly',
    o: { kick: 'Summer camp', title: 'Pick your camp week', plans: [{ name: 'Half day', price: '$120', per: 'a week', lines: ['9 AM to noon', 'Snack included'] }, { name: 'Full day', price: '$210', per: 'a week', lines: ['9 AM to 4 PM', 'Lunch included', 'Swim lessons'], hot: true, tag: 'Most popular' }, { name: 'Siblings', price: '10% off', per: 'each extra child', lines: ['Any week', 'Any program'] }],
      back: [['wavesbg', ['$bg2', '$accent2', '$accent'], { opacity: 10 }]] } },

  { id: 'learn-daycare-day', name: 'Our day together', cat: 'Kids and youth', color: 'coral', tags: 'daycare,preschool,daily schedule,routine,nap time,play,toddlers,parents',
    recipe: 'timeline', palette: 'coral', fonts: 'friendly',
    o: { kick: 'Bumblewood Daycare', title: 'Our day together', steps: [{ label: '8 AM', text: 'Hello and free play' }, { label: '10 AM', text: 'Circle time' }, { label: '12 PM', text: 'Lunch and nap' }, { label: '3 PM', text: 'Outside play' }, { label: '5 PM', text: 'Home time' }],
      back: [['dotsbg', ['$accent'], { opacity: 12 }]] } },

  { id: 'learn-snack-menu', name: 'Snacks this week', cat: 'Kids and youth', color: 'green', tags: 'snacks,menu,daycare,healthy,kids,fruit,this week,preschool',
    recipe: 'dishes', palette: 'citrus', fonts: 'friendly',
    o: { kick: 'Healthy and yummy', title: 'Snacks this week', dishes: [{ name: 'Apple slices', note: 'With sunflower butter', price: 'Mon', art: ['apple'] }, { name: 'Melon cups', note: 'Fresh and juicy', price: 'Wed', art: ['watermelon'] }, { name: 'Cheese crackers', note: 'Whole grain', price: 'Fri', art: ['bread'] }] } },

  { id: 'learn-pickup-time', name: 'Pick-up time', cat: 'Kids and youth', color: 'purple', tags: 'pick up,parents,daycare,sign out,safety,families,steps,after school',
    recipe: 'steps', palette: 'lavender', fonts: 'friendly',
    o: { kick: 'For families', title: 'Pick-up time', steps: [{ title: 'Sign out', text: 'At the tablet by the door' }, { title: 'Show your card', text: 'Every time, thank you!' }, { title: 'Big hugs', text: 'We bring your child to you' }],
      foot: 'Pick-up ends at 6 PM', back: [['heartsbg', ['$accent'], { opacity: 10 }]] } },

  { id: 'learn-star-of-the-week', name: 'Star of the week', cat: 'Kids and youth', color: 'yellow', tags: 'star of the week,student,classroom,kids,spotlight,photo,proud,award',
    recipe: 'magazine', palette: 'sunshine', fonts: 'friendly',
    o: { mast: 'STAR', kick: 'Room 5', title: 'Star of\nthe week', sub: 'Mia is kind, curious and always helps', lines: ['Favorite color: green', 'Loves dinosaurs', 'Wants to be a vet'], badge: 'Wow!' } },

  { id: 'learn-class-helpers', name: 'Class helpers', cat: 'Kids and youth', color: 'teal', tags: 'class jobs,helpers,classroom,kids,line leader,jobs chart,students,this week',
    recipe: 'directory', palette: 'mint', fonts: 'friendly',
    o: { kick: 'This week', title: 'Class helpers', rows: [['Line leader', 'Mia'], ['Plant waterer', 'Leo'], ['Door holder', 'Sam'], ['Paper passer', 'Ava'], ['Light helper', 'Noah'], ['Calendar keeper', 'Zoe'], ['Snack helper', 'Eli'], ['Book buddy', 'Ivy']],
      back: [['dotsbg', ['$accent'], { opacity: 12 }]] } },

  { id: 'learn-reading-stars', name: 'Reading stars', cat: 'Kids and youth', color: 'navy', tags: 'reading,books,kids,classroom,stars,reading log,minutes,readers',
    recipe: 'bigstats', palette: 'midnight', fonts: 'friendly',
    o: { kick: 'Room 5 reads!', title: 'Reading stars', stats: [{ value: '240', label: 'Books read', art: ['books'] }, { value: '4,800', label: 'Minutes read', art: ['moon'] }, { value: '26', label: 'Super readers', art: ['star', ['#ffd166']] }],
      back: [['starfield', ['#ffffff', '#ffd166']]], fx: ['stars', { amount: 2, speed: 2 }] } },

  { id: 'learn-little-artists', name: 'Little artists', cat: 'Kids and youth', color: 'coral', tags: 'kids art,art wall,gallery,photos,drawings,painting,classroom,proud',
    recipe: 'polaroids', palette: 'coral', fonts: 'handmade',
    o: { kick: 'Our art wall', title: 'Little artists', sub: 'Painted with lots of love', captions: ['Sunny day by Leo', 'My dog by Ava', 'Rocket by Sam'], art: [['artpalette']] } },

  { id: 'learn-wash-hands', name: 'Wash those hands', cat: 'Kids and youth', color: 'blue', tags: 'hand washing,hygiene,germs,kids,bathroom,health,soap,steps',
    recipe: 'features', palette: 'ocean', fonts: 'friendly',
    o: { kick: 'Keep germs away', title: 'Wash those hands!', features: [{ art: ['drop', ['$accent', '#ffffff', '#ffffff']], title: 'Wet and soap', text: 'Warm water and lots of bubbles' }, { art: ['bubbles', ['$accent', '$accent2', '#ffafcc']], title: 'Scrub', text: 'Sing the birthday song twice' }, { art: ['sparkle', ['$accent2', '$accent', '#ffd166']], title: 'Rinse and dry', text: 'Clean hands, happy kids!' }],
      back: [['dotsbg', ['$accent'], { opacity: 12 }]] } },

  { id: 'learn-class-rules', name: 'Our class rules', cat: 'Kids and youth', color: 'purple', tags: 'class rules,classroom,kids,behavior,kindness,listen,share,teacher',
    recipe: 'checklist', palette: 'lavender', fonts: 'friendly',
    o: { kick: 'Room 5', title: 'Our class rules', items: ['Listen when others talk', 'Raise your hand', 'Use kind words', 'Share and take turns', 'Clean up together'],
      big: ['star', ['$accent2', '$accent', '#ffffff']], back: [['starsbg', ['$accent', '$accent2', '#ffffff'], { opacity: 16 }]] } },

  { id: 'learn-feelings-check-in', name: 'Feelings check-in', cat: 'Kids and youth', color: 'pink', tags: 'feelings,emotions,check in,kids,classroom,wellbeing,mood,social emotional',
    recipe: 'features', palette: 'blush', fonts: 'friendly',
    o: { kick: 'Check in with yourself', title: 'How do you feel?', features: [{ art: ['sun', ['#ffb703', '#fb8500', '#ffffff']], title: 'Sunny', text: 'Happy and ready to go' }, { art: ['cloud', ['#94a3b8', '#cbd5e1', '#ffffff']], title: 'Cloudy', text: 'A little tired or sad' }, { art: ['rainbow', ['#ffffff', '#e2e8f0', '#ffffff']], title: 'Rainbow', text: 'Excited and full of ideas' }],
      foot: 'Every feeling is okay', back: [['heartsbg', ['$accent'], { opacity: 10 }]] } },

  { id: 'learn-soccer-signups', name: 'Youth soccer sign-ups', cat: 'Kids and youth', color: 'green', tags: 'youth soccer,sign up,sports,kids,league,registration,team,saturday',
    recipe: 'gig', palette: 'forest', fonts: 'poster',
    o: { title: 'Soccer\nsign-ups', day: 'Sat', date: '15', month: 'Mar', lines: ['Ages 5 to 12', 'All skill levels welcome', 'Free cleats swap table'], strip: 'Riverside Park field house, 9 AM to noon',
      art: [['soccer', [], { motion: 'float' }]], back: [['stripes', ['#ffffff'], { opacity: 6 }]] } },

  { id: 'learn-teen-night', name: 'Teen night', cat: 'Kids and youth', color: 'black', tags: 'teen night,teens,youth,games,music,friday,hangout,youth center',
    recipe: 'neon', palette: 'mono', fonts: 'glow',
    o: { kick: 'Fridays at 7', title: 'Teen night', sub: 'Games, music and snacks', foot: 'Ages 13 to 17. Free with your youth card.',
      art: [['lmusic', ['#ffffff']], ['lstar', ['#ffffff']], ['lsparkle', ['#ffffff']]], back: [['brick', ['$bg2', '#1c1c1c', '#0a0a0a'], { opacity: 80 }]] } },

  { id: 'learn-game-night', name: 'Family game night', cat: 'Kids and youth', color: 'red', tags: 'game night,family,board games,puzzles,kids,fun,popcorn,community',
    recipe: 'marquee', palette: 'ruby', fonts: 'retro',
    o: { kick: 'Family fun', title: 'Family game night', sub: 'Board games, puzzles and popcorn', foot: 'Thursday at 6 PM', art: [['dice'], ['puzzle', ['$accent', '#ffffff', '#ffffff']], ['star', ['$accent']]] } },

  { id: 'learn-robotics-club', name: 'Robotics club', cat: 'Kids and youth', color: 'blue', tags: 'robotics,club,stem,kids,coding,build,after school,members',
    recipe: 'admit', palette: 'slate', fonts: 'modern',
    o: { kick: 'Ages 9 to 14', admit: 'Club member', title: 'Robotics club', details: [['Day', 'Tuesdays'], ['Time', '3:30 PM'], ['Room', 'Lab 2']], stub: '012', stubLabel: 'Member',
      sub: 'Build, code and race your own robot', foot: 'New members welcome', art: [['robot'], ['bolt', ['$accent2', '#ffffff', '#ffffff']]] } },

  { id: 'learn-code-club', name: 'Code club', cat: 'Kids and youth', color: 'navy', tags: 'coding,code club,games,apps,kids,computers,after school,beginners',
    recipe: 'diagonal', palette: 'midnight', fonts: 'modern',
    o: { kick: 'New club', title: 'Code club', sub: 'Make your own games and apps. No experience needed.', big: ['laptop', ['$accent', '#1f2937', '#ffffff']], foot: 'Wednesdays at 4',
      art: [['puzzle', ['$accent2', '#ffffff', '#ffffff']], ['sparkle', ['$accent', '#ffffff', '$accent2'], { motion: 'twinkle' }]] } },

  { id: 'learn-pajama-day', name: 'Pajama day', cat: 'Kids and youth', color: 'blue', tags: 'pajama day,spirit day,kids,school,fun,stuffed animal,friday,dress up',
    recipe: 'banner', palette: 'slate', fonts: 'friendly',
    o: { kick: 'Wear your PJs', title: 'Pajama\nday!', sub: 'Bring your favorite stuffed animal too', foot: 'This Friday',
      art: [['teddy'], ['moon', ['#fff3c4', '#f4d58d', '#ffffff']], ['star', ['$accent2']]], back: [['starsbg', ['$accent2', '$accent', '#ffffff'], { opacity: 22 }]], fx: ['stars', { amount: 2, speed: 2 }] } },

  { id: 'learn-field-day', name: 'Field day', cat: 'Kids and youth', color: 'yellow', tags: 'field day,races,games,outdoor,kids,school,sports day,summer',
    when: { kind: 'year', month: 5, day: 15, span: 40, label: 'Late spring' },
    recipe: 'sunburst', palette: 'sunshine', fonts: 'poster',
    o: { kick: 'Ready, set, go!', title: 'Field day', sub: 'Races, relays and water games', foot: 'Wear sneakers and sunscreen',
      art: [['soccer'], ['whistle'], ['medal'], ['sun', ['#ffb703', '#fb8500', '#ffffff']], ['sneaker', ['$accent2', '#ffffff', '$ink']]] } },

  { id: 'learn-after-school-care', name: 'After-school care', cat: 'Kids and youth', color: 'teal', tags: 'after school,childcare,program,prices,kids,homework help,snack,care',
    recipe: 'prices', palette: 'mint', fonts: 'friendly',
    o: { kick: 'Bumblewood After School', title: 'After-school care', plans: [{ name: 'Two days', price: '$90', per: 'a month', lines: ['Homework help', 'Snack included'] }, { name: 'Five days', price: '$190', per: 'a month', lines: ['Homework help', 'Snack included', 'Games and crafts'], hot: true, tag: 'Best value' }, { name: 'Drop-in', price: '$25', per: 'a day', lines: ['Book a day ahead', 'Any weekday'] }],
      back: [['dotsbg', ['$accent'], { opacity: 10 }]] } },

  { id: 'learn-nut-free-zone', name: 'Nut-free zone', cat: 'Kids and youth', color: 'blue', tags: 'nut free,allergy,safe snacks,peanuts,classroom,daycare,kids,food safety',
    recipe: 'note', palette: 'slate', fonts: 'friendly',
    o: { big: ['apple', ['#e63946', '#2b9348', '#ffffff']], kick: 'Keep everyone safe', title: 'Nut-free zone', sub: 'Please do not bring snacks with peanuts or tree nuts. Thank you!', foot: 'Ask us about safe snacks',
      art: [['hearthands', ['$accent2', '$accent', '#ffffff']], ['check', ['$accent', '#ffffff', '#ffffff']]] } },

  { id: 'learn-riddle-time', name: 'Riddle time', cat: 'Kids and youth', color: 'purple', tags: 'riddle,joke,puzzle,kids,fun,brain teaser,classroom,library',
    recipe: 'hero', palette: 'berry', fonts: 'friendly',
    o: { kick: 'Riddle time', title: 'What am I?', sub: 'I have hands, but I cannot clap.', foot: 'Answer: a clock!',
      art: [['clock', ['#ffffff', '$bg1', '$accent']], ['puzzle', ['$accent2', '#ffffff', '#ffffff']], ['bulb', ['$accent2', '#94a3b8', '#ffffff'], { motion: 'pulse' }], ['star', ['$accent2']], ['sparkle', ['$accent', '#ffffff', '$accent2']], ['lstar', ['$accent']]] } },

  { id: 'learn-summer-countdown', name: 'Countdown to summer', cat: 'Kids and youth', color: 'coral', tags: 'summer,countdown,last day of school,summer break,kids,vacation,timer,june',
    when: { kind: 'year', month: 5, day: 1, span: 50, label: 'Before summer break' },
    recipe: 'countdown', palette: 'coral', fonts: 'friendly',
    o: { kick: 'Almost here!', title: 'Summer break', label: 'Days until summer', done: 'Happy summer!', days: true, ctheme: 'paper', foot: 'Keep reading over the summer!',
      art: [['sun', ['#ffb703', '#fb8500', '#ffffff']], ['icecream'], ['kite', ['$accent', '#4cc9f0', '#ffd166'], { motion: 'float' }], ['watermelon']] } },

  { id: 'learn-costume-parade', name: 'Costume parade', cat: 'Kids and youth', color: 'orange', tags: 'halloween,costume parade,kids,october,costumes,school,families,fun',
    when: 'halloween', recipe: 'ribbon', palette: 'espresso', fonts: 'friendly',
    o: { kick: 'Boo! Join the fun', title: 'Costume parade', sub: 'Friday at 2 PM around the playground', foot: 'Families welcome',
      art: [['jackolantern', [], { motion: 'float' }], ['ghost', [], { motion: 'float' }], ['bat', ['$ink2', '#ffd166', '#ffffff']], ['pumpkin']], fx: ['leaves', { amount: 2, speed: 2 }] } },

  { id: 'learn-valentine-cards', name: 'Valentine cards', cat: 'Kids and youth', color: 'red', tags: 'valentine,cards,classroom,kids,february,friends,hearts,party',
    when: 'valentine', recipe: 'corkboard', palette: 'ruby', fonts: 'handmade',
    o: { title: 'Valentine cards', notes: ['You are sweet!', 'Be my buddy', 'You rock!', 'Friends forever'], sub: 'Bring a card for every friend in class',
      art: [['heart', ['#ff4d6d', '#ffffff', '#c9184a']], ['hearts']], fx: ['hearts', { amount: 2, speed: 2 }] } },

  { id: 'learn-earth-day-kids', name: 'Love our planet', cat: 'Kids and youth', color: 'green', tags: 'earth day,planet,kids,nature,recycle,april,plant,environment',
    when: 'earthday', recipe: 'paper', palette: 'forest', fonts: 'friendly',
    o: { land: 'hills', landCols: ['#2b9348', '#55a630', '#aacc00'], kick: 'Earth Day', title: 'Love our planet', sub: 'Plant a seed, pick up litter, save water',
      art: [['sun', ['#ffb703', '#fb8500', '#ffffff']], ['globe'], ['seedling', ['$accent2', '#8b5a2b', '#ffffff']], ['butterfly', ['$accent', '$accent2', '#1f2937'], { motion: 'float' }], ['daisy']] } },

  { id: 'learn-winter-break', name: 'Winter break', cat: 'Kids and youth', color: 'blue', tags: 'winter break,holiday,school closed,december,snow,see you in january,kids,vacation',
    when: { kind: 'year', month: 12, day: 10, span: 25, label: 'Before winter break' },
    recipe: 'datestamp', palette: 'ocean', fonts: 'friendly',
    o: { month: 'Dec', day: '20', kick: 'Winter break', title: 'See you in January!', sub: 'Classes start again on Monday, January 5. Stay warm!', foot: 'Have a cozy break',
      art: [['snowman', ['#ffffff', '$ink', '#e63946']], ['snowflake', ['$accent', '#ffffff', '$accent']], ['mug', ['#e63946', '#ffffff', '#6b3e26']]], fx: ['snow', { amount: 2, speed: 2 }] } },

  { id: 'learn-lost-tooth-club', name: 'Lost tooth club', cat: 'Kids and youth', color: 'purple', tags: 'lost tooth,teeth,kids,classroom,sticker,club,dentist,celebrate',
    recipe: 'stamp', palette: 'berry', fonts: 'friendly',
    o: { ring: 'Lost tooth club', center: 'Wiggle', kick: 'Hooray for you!', title: 'Lost a tooth?', sub: 'Tell your teacher and pick a sticker from the jar!', foot: 'Smile big!',
      art: [['tooth', ['#ffffff', '#bde0fe', '$accent2']], ['sparkle', ['$accent2', '#ffffff', '$accent'], { motion: 'twinkle' }], ['star', ['$accent2']]] } }
];

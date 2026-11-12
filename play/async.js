// Blokvane party games: can this browser read an async function? A browser that can't (smart TVs from 2018 and 2019)
// stops reading this file at the word it doesn't know, so BV_ASYNC is never set, and boot.js loads the copies of the
// scripts made for older browsers. (The page used to find out by making a function from text, which a page's own
// safety rules now forbid, for good reason.)
window.BV_ASYNC = 1;
(async function () { await 0; });

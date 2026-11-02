// Blokvane party games: the languages every game speaks fully, on the TV and on the phones, with nothing to install
// and no translator needed: English, Mandarin Chinese, Hindi, Spanish, Arabic, French and Bengali. The words for each
// language are in lang/<code>.js and its questions, riddles, places and words in lang/<code>-packs.js (written for
// that language, not translated word for word). English is the source and needs no file. The TV loads both files of
// the game's language; a phone only loads the words. Other languages still work the old way: Chrome's own translator,
// when the game runs in Chrome on a computer.
var BVI18N = (() => {
  'use strict';
  const V = '2';
  // (in the order people see them, each in its own language)
  const LANGS = [['en', 'English'], ['zh', '中文（普通话）'], ['hi', 'हिन्दी'], ['es', 'Español'], ['ar', 'العربية'], ['fr', 'Français'], ['bn', 'বাংলা']];
  const FULL = new Set(LANGS.map(l => l[0]));
  // the other languages Chrome on a computer can translate the games into
  const MORE = [['de', 'Deutsch'], ['it', 'Italiano'], ['pt', 'Português'], ['nl', 'Nederlands'], ['pl', 'Polski'], ['sv', 'Svenska'], ['tr', 'Türkçe'], ['el', 'Ελληνικά'], ['ru', 'Русский'],
    ['uk', 'Українська'], ['he', 'עברית'], ['fa', 'فارسی'], ['ur', 'اردو'], ['ja', '日本語'], ['ko', '한국어'], ['vi', 'Tiếng Việt'], ['th', 'ไทย'], ['id', 'Bahasa Indonesia']];
  const RTL = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'yi']);
  // where this file came from (the TV loads it from play/, a phone from ../play/): the language files sit next to it
  const BASE = ((document.currentScript && document.currentScript.src) || '').replace(/[^/]*$/, '');
  const words = {}, packs = {}, loading = new Map();
  function add(code, w) { words[code] = Object.assign(words[code] || {}, w); }
  function addPacks(code, p) { packs[code] = p; }
  function script(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = () => res(); s.onerror = () => { s.remove(); rej(new Error('load')); };
      document.head.appendChild(s);
    });
  }
  const has = code => code === 'en' || !!(words[code] && Object.keys(words[code]).length);
  // load a language (its words; with packs: its questions and the rest too). true once it's ready.
  function load(code, withPacks) {
    if (code === 'en') return Promise.resolve(true);
    if (!FULL.has(code)) return Promise.resolve(false);
    const key = code + (withPacks ? '+' : '');
    if (!loading.has(key)) {
      loading.set(key, (async () => {
        if (!has(code)) await script(BASE + 'lang/' + code + '.js?v=' + V);
        if (withPacks && !packs[code]) await script(BASE + 'lang/' + code + '-packs.js?v=' + V);
        return true;
      })().catch(() => { loading.delete(key); return false; }));
    }
    return loading.get(key);
  }
  // a line in a language, with its {parts} filled in (a line that has no translation stays English)
  function t(code, s, vars) {
    let out = s == null ? '' : String(s);
    const w = words[code];
    if (w && Object.prototype.hasOwnProperty.call(w, out) && typeof w[out] === 'string') out = w[out];
    if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
    return out;
  }
  // the language this device would pick by itself (one of the seven, or English)
  function pick() {
    try { for (const l of navigator.languages || [navigator.language || 'en']) { const c = String(l || '').slice(0, 2).toLowerCase(); if (FULL.has(c)) return c; } } catch (e) {}
    return 'en';
  }
  const ok = c => typeof c === 'string' && /^[a-z]{2}$/.test(c) && (FULL.has(c) || MORE.some(m => m[0] === c));

  // ---------- speaking out loud (questions in Family mode, bingo numbers, Boo's commands) ----------
  const SPEECH = { en: 'en-US', zh: 'zh-CN', hi: 'hi-IN', es: 'es-ES', ar: 'ar-SA', fr: 'fr-FR', bn: 'bn-IN' };
  let voices = [];
  function readVoices() { try { voices = speechSynthesis.getVoices() || []; } catch (e) { voices = []; } }
  try { if (window.speechSynthesis) { readVoices(); speechSynthesis.addEventListener('voiceschanged', readVoices); } } catch (e) {}
  // a voice for the language, or null when this device has none (English: any voice will do)
  function voiceFor(code) {
    if (!voices.length) readVoices();
    const want = (SPEECH[code] || code).toLowerCase();
    const pre = want.slice(0, 2);
    const list = voices.filter(v => String(v.lang || '').toLowerCase().replace('_', '-').startsWith(pre));
    return list.find(v => String(v.lang).toLowerCase().replace('_', '-') === want) || list.find(v => v.localService) || list[0] || null;
  }
  function canSpeak(code) {
    if (!window.speechSynthesis) return false;
    if (code === 'en') return true;
    return !!voiceFor(code);
  }
  function speak(text, code) {
    try {
      if (!window.speechSynthesis || !text) return false;
      const v = voiceFor(code);
      if (!v && code !== 'en') return false;
      const u = new SpeechSynthesisUtterance(String(text));
      u.lang = SPEECH[code] || code || 'en';
      if (v) u.voice = v;
      u.rate = code === 'en' ? 0.95 : 0.92;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }
  // the letters on the answers, the way each language marks the choices of a quiz (أ ب ج د, क ख ग घ, ক খ গ ঘ)
  const LETTERS = { ar: ['أ', 'ب', 'ج', 'د', 'هـ', 'و'], hi: ['क', 'ख', 'ग', 'घ', 'ङ', 'च'], bn: ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'] };
  const letters = code => LETTERS[code] || ['A', 'B', 'C', 'D', 'E', 'F'];
  return { V, LANGS, FULL, MORE, RTL, BASE, add, addPacks, load, has, t, pick, ok, packs: code => packs[code] || null, SPEECH, voiceFor, canSpeak, speak, letters };
})();

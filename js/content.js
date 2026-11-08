/*
 * content.js: everything personal lives here.
 * Edit this file and the whole site (windows + terminal) updates.
 */
window.SITE = {
  name: "Clay Harding",
  handle: "",
  tagline: "WW",
  location: "Colorado",
  status: "reading",

  // Text drawn as the big block banner on the home screen.
  // Supports A-Z, 0-9, space and - . ! ? _  (keep it short, ~10 chars).
  bannerText: "CLAY HARDING",

  // One string per paragraph.
  bio: [
    "Coffee",
    "This site is a work in progress. Expect more windows to appear over time."
  ],

  // Contact rows. `url` is optional: rows without one copy `text` to the clipboard when clicked.
  // name: max ~8 chars, ext: max ~4 chars (it's a DOS file listing, after all).
  links: [
    { name: "EMAIL",   ext: "MAIL", url: "mailto:web@clayharding.com",         text: "web@clayharding.com" },
    { name: "GITHUB",  ext: "WEB",  url: "https://github.com/yourhandle",  text: "github.com/yourhandle" },
    { name: "MASTODON",ext: "SOC",  url: "https://example.social/@you",    text: "@you@example.social" },
    { name: "DISCORD", ext: "CHAT",                                         text: "yourhandle" }
  ],

  // `fortune` command pulls from this list.
  fortunes: [
    "Today's lucky number is the one you were thinking of.",
    "A clean desk is a sign of a full drawer.",
    "Your next bug will be in the line you were sure about.",
    "Fortune favors the person who saved before quitting.",
    "Somewhere, a floppy disk misses you.",
    "You will soon receive a message. Check your spam folder.",
    "The leftovers are still good. Probably.",
    "Have you tried turning it off and on again? (Type 'reboot'.)",
    "A rubber duck would like a word with you.",
    "Today is a good day to text a friend you haven't talked to in a while.",
    "Low battery? Same.",
    "The real treasure was the side quests you took along the way."
  ],

  // Shown by the hidden `secret` command. Tell your friends it exists. Or don't.
  secret: "You found the secret command! Tell me the code word FLOPPY next time we hang out."
};

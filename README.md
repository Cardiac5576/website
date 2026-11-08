# Personal homepage (DOS edition)

A no-build, dependency-free personal site styled like an MS-DOS setup screen, with a Linux-style terminal and a tiny game.

## Run locally
```sh
python3 -m http.server 8000   # then open http://localhost:8000
```
Deploy by uploading the folder as-is to GitHub Pages, Netlify or Cloudflare Pages. There is no build step.

## Edit your info
Everything personal is in **`js/content.js`**: name, banner text, bio, contact links, fortunes and the secret message. Also update `<title>` and the meta description in `index.html`, which search engines read before JS runs.

## Extend
- **New window**: add a `<section class="view" data-route="NAME" hidden>` with a `.window > .frame > .title` inside it to `index.html`. Link to it with `href="#NAME"`. Window colour variants: `panel`, `help`, `term`, `game`, or none for grey.
- **New terminal command**: add an entry to `commands` in `js/terminal.js`: `{ desc: "...", run(args) { print("hi") } }`. Set `hidden: true` for an easter egg.
- **Replay the boot screen**: type `reboot` in the terminal.

## Credits
Font: *Web437 IBM VGA 8x16* by VileR, from [The Ultimate Oldschool PC Font Pack](https://int10h.org/oldschool-pc-fonts/), licensed under CC BY-SA 4.0 (see `fonts/LICENSE-int10h.txt`).

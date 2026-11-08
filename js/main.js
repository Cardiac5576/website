/* main.js: routing, windows, keyboard, banner */
(() => {
  const S = window.SITE || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode etc. */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
  };

  /* ---------- block-letter banner ---------- */
  const GLYPHS = {
    A: ".###.|#...#|#####|#...#|#...#", B: "####.|#...#|####.|#...#|####.",
    C: ".####|#....|#....|#....|.####", D: "####.|#...#|#...#|#...#|####.",
    E: "#####|#....|####.|#....|#####", F: "#####|#....|####.|#....|#....",
    G: ".####|#....|#..##|#...#|.###.", H: "#...#|#...#|#####|#...#|#...#",
    I: "###|.#.|.#.|.#.|###",           J: "..###|...#.|...#.|#..#.|.##..",
    K: "#...#|#..#.|###..|#..#.|#...#", L: "#....|#....|#....|#....|#####",
    M: "#...#|##.##|#.#.#|#...#|#...#", N: "#...#|##..#|#.#.#|#..##|#...#",
    O: ".###.|#...#|#...#|#...#|.###.", P: "####.|#...#|####.|#....|#....",
    Q: ".###.|#...#|#.#.#|#..#.|.##.#", R: "####.|#...#|####.|#..#.|#...#",
    S: ".####|#....|.###.|....#|####.", T: "#####|..#..|..#..|..#..|..#..",
    U: "#...#|#...#|#...#|#...#|.###.", V: "#...#|#...#|#...#|.#.#.|..#..",
    W: "#...#|#...#|#.#.#|##.##|#...#", X: "#...#|.#.#.|..#..|.#.#.|#...#",
    Y: "#...#|.#.#.|..#..|..#..|..#..", Z: "#####|...#.|..#..|.#...|#####",
    0: ".###.|#..##|#.#.#|##..#|.###.", 1: ".#.|##.|.#.|.#.|###",
    2: "####.|....#|.###.|#....|#####", 3: "####.|....#|.###.|....#|####.",
    4: "#...#|#...#|#####|....#|....#", 5: "#####|#....|####.|....#|####.",
    6: ".###.|#....|####.|#...#|.###.", 7: "#####|....#|...#.|..#..|..#..",
    8: ".###.|#...#|.###.|#...#|.###.", 9: ".###.|#...#|.####|....#|.###.",
    " ": "...|...|...|...|...", "-": "...|...|###|...|...",
    "!": "#|#|#|.|#", ".": ".|.|.|.|#", "?": "###.|...#|.##.|....|.#..",
    _: ".....|.....|.....|.....|#####",
  };

  function bannerGrid(text) {
    const chars = [...String(text).toUpperCase()];
    const rows = ["", "", "", "", ""];
    chars.forEach((c, i) => {
      (GLYPHS[c] || GLYPHS[" "]).split("|").forEach((r, y) => {
        rows[y] += r + (i < chars.length - 1 ? "." : "");
      });
    });
    const w = rows[0].length + 1;
    const grid = Array.from({ length: 6 }, (_, y) =>
      Array.from({ length: w }, (_, x) => (rows[y] && rows[y][x] === "#" ? "B" : " ")));
    // drop shadow: one cell down-right of every block
    for (let y = 0; y < 5; y++)
      for (let x = 0; x < w - 1; x++)
        if (grid[y][x] === "B" && grid[y + 1][x + 1] === " ") grid[y + 1][x + 1] = "S";
    return grid;
  }

  /* draws the banner as SVG: each "pixel" is 1x2 like a text cell, scales crisply */
  const SVGNS = "http://www.w3.org/2000/svg";
  function renderBanner(host, text) {
    const grid = bannerGrid(text);
    const w = grid[0].length, h = grid.length;
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${w} ${h * 2}`);
    svg.setAttribute("shape-rendering", "crispEdges");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", text);
    svg.style.setProperty("--cols", w);
    for (const kind of ["S", "B"]) {
      const path = document.createElementNS(SVGNS, "path");
      let d = "";
      grid.forEach((row, y) => {
        for (let x = 0; x < w; x++) {
          if (row[x] !== kind) continue;
          let n = 1;
          while (row[x + n] === kind) n++;
          d += `M${x} ${y * 2}h${n}v2h-${n}z`;
          x += n - 1;
        }
      });
      path.setAttribute("d", d);
      path.setAttribute("class", kind === "B" ? "b" : "s");
      svg.append(path);
    }
    host.textContent = "";
    host.append(svg);
  }

  /* ---------- fill content from SITE ---------- */
  const binds = { year: new Date().getFullYear(), handle: S.handle || "home" };
  $$("[data-bind]").forEach((el) => {
    const k = el.dataset.bind;
    el.textContent = k in binds ? binds[k] : S[k] ?? "";
  });

  const banner = $("#banner");
  renderBanner(banner, S.bannerText || S.name || "HELLO");

  const facts = $("#facts");
  [["Name", S.name], ["Handle", S.handle], ["Location", S.location], ["Status", S.status]]
    .filter(([, v]) => v)
    .forEach(([k, v]) => {
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = k;
      dd.textContent = v;
      facts.append(dt, dd);
    });
  const bio = $("#bio");
  (S.bio || []).forEach((t) => {
    const p = document.createElement("p");
    p.textContent = t;
    bio.append(p);
  });

  const status = $("#contact-status");
  const links = S.links || [];
  const setStatus = (t) => { status.textContent = t; };
  const idleStatus = `${links.length} file(s) · select one to open`;
  setStatus(idleStatus);

  function copy(text) {
    const done = () => setStatus(`Copied "${text}" to clipboard`);
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => setStatus(text));
    else setStatus(text);
  }

  const list = $("#contact-list");
  links.forEach((l) => {
    const li = document.createElement("li");
    const el = document.createElement(l.url ? "a" : "button");
    el.className = "file";
    if (l.url) {
      el.href = l.url;
      if (/^https?:/i.test(l.url)) { el.target = "_blank"; el.rel = "noopener me"; }
    } else {
      el.type = "button";
      el.title = "Copy to clipboard";
      el.addEventListener("click", () => copy(l.text));
    }
    [l.name, l.ext, l.text].forEach((t) => {
      const s = document.createElement("span");
      s.textContent = t || "";
      el.append(s);
    });
    li.append(el);
    list.append(li);
  });

  /* ---------- router ---------- */
  const views = Object.fromEntries($$(".view").map((v) => [v.dataset.route, v]));
  const titles = { home: "", about: "About", contact: "Contact", terminal: "Terminal", game: "WORM.EXE", help: "Help" };
  const menuLinks = $$(".menubar a");
  let current = null;

  function route() {
    const want = decodeURIComponent(location.hash.slice(1));
    return views[want] ? want : "home";
  }

  function show() {
    const name = route();
    if (name === current) return;
    for (const [k, v] of Object.entries(views)) v.hidden = k !== name;
    menuLinks.forEach((a) => {
      const target = a.getAttribute("href").slice(1) || "home";
      if (target === name) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    document.title = (titles[name] ? titles[name] + " · " : "") + (S.name || "Home");
    current = name;
    document.dispatchEvent(new CustomEvent("route", { detail: name }));
    focusView();
  }

  function focusView() {
    if (document.documentElement.classList.contains("booting")) return;
    const v = views[current];
    const coarse = matchMedia("(pointer: coarse)").matches;
    const auto = !coarse && v.querySelector("[data-autofocus]");
    const t = auto || v.querySelector(".title");
    if (t) t.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function go(name) {
    if (name === "home") {
      if (location.hash) location.hash = "";
      else show();
    } else location.hash = name;
  }

  window.addEventListener("hashchange", show);
  document.addEventListener("booted", focusView);

  $$(".fkeys [data-go]").forEach((b) => b.addEventListener("click", () => go(b.dataset.go)));

  /* ---------- keyboard ---------- */
  const FKEYS = { F1: "help", F2: "contact", F3: "terminal", F4: "game" };
  const HOTKEYS = { h: "home", a: "about", c: "contact", t: "terminal", g: "game" };
  const ARROWS = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };

  document.addEventListener("keydown", (e) => {
    if (document.documentElement.classList.contains("booting")) return;
    const k = e.key;
    if (FKEYS[k]) { e.preventDefault(); go(FKEYS[k]); return; }
    if (k === "Escape") { if (current !== "home") { e.preventDefault(); go("home"); } return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target instanceof Element && e.target.matches("input, textarea, select")) return;
    if (current === "game") return;                   // the game owns the keys

    if (current === "terminal" && k.length === 1) {   // start typing anywhere
      $("#term-in").focus();
      return;
    }
    const hk = HOTKEYS[k.toLowerCase()];
    if (hk) { e.preventDefault(); go(hk); return; }

    if (ARROWS[k]) {
      const items = $$("a[href], button", views[current]).filter((el) => el.offsetParent);
      if (!items.length) return;
      e.preventDefault();
      const i = items.indexOf(document.activeElement);
      const n = i < 0 ? 0 : (i + ARROWS[k] + items.length) % items.length;
      items[n].focus();
    }
  });

  /* ---------- clock ---------- */
  const clock = $("#clock");
  clock.append(document.createTextNode(""), Object.assign(document.createElement("span"), { className: "zulu", textContent: "Z" }));
  const tick = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    clock.firstChild.nodeValue = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  };
  tick();
  setInterval(tick, 10000);

  window.UI = { site: S, store, go, renderBanner, reduceMotion, get route() { return current; } };
  show();
})();

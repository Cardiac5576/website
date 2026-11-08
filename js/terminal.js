/* terminal.js: a tiny command line. Add a command by adding an entry to `commands`. */
(() => {
  const UI = window.UI;
  const S = UI.site;
  const out = document.getElementById("term-out");
  const form = document.getElementById("term-form");
  const input = document.getElementById("term-in");
  const chips = document.getElementById("term-chips");
  const screen = document.getElementById("term-screen");
  const MAX_NODES = 300;
  const history = [];
  let hIndex = 0;

  /* ---------- output helpers ---------- */
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function add(node) {
    out.append(node);
    while (out.childNodes.length > MAX_NODES) out.firstChild.remove();
    form.scrollIntoView({ block: "nearest" });
    return node;
  }
  const print = (text = "", cls = "") => add(el("div", "ln " + cls, text));
  const pre = (text, cls = "") => add(el("pre", cls, text));
  function row(...parts) {                // parts: strings or nodes
    const d = el("div", "ln");
    parts.forEach((p) => d.append(p));
    return add(d);
  }
  function cmdLink(name, label = name) {
    const b = el("button", "cmd", label);
    b.type = "button";
    b.addEventListener("click", () => run(name));
    return b;
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, UI.reduceMotion.matches ? 0 : ms));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  /* ---------- the "filesystem" ---------- */
  const FILES = {
    "ABOUT.TXT":   { size: "1,024", run: () => commands.about.run() },
    "CONTACT.TXT": { size: "512",   run: () => commands.contact.run() },
    "WORM.EXE":    { size: "4,096", run: () => commands.play.run() },
  };
  const stamp = (() => {
    const d = new Date();
    return d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }) + " " + String(d.getUTCDate()).padStart(2, " ") + " " + d.getUTCFullYear();
  })();

  /* ---------- commands ---------- */
  const commands = {
    help: {
      desc: "list commands",
      run() {
        print("Available commands:");
        Object.entries(commands)
          .filter(([, c]) => !c.hidden)
          .forEach(([name, c]) => row("  ", cmdLink(name), " ".repeat(Math.max(1, 10 - name.length)) + c.desc));
      },
    },
    about: {
      desc: "who is this?",
      run() {
        print(S.handle ? `${S.name} (@${S.handle})` : S.name, "yellow");
        if (S.tagline) print(S.tagline, "dim");
        (S.bio || []).forEach((p) => { print(); print(p); });
      },
    },
    contact: {
      desc: "how to reach me",
      run() {
        (S.links || []).forEach((l) => {
          const label = (l.name || "").padEnd(10);
          if (l.url) {
            const a = el("a", "", l.text);
            a.href = l.url;
            if (/^https?:/i.test(l.url)) { a.target = "_blank"; a.rel = "noopener"; }
            row("  " + label, a);
          } else row("  " + label + l.text);
        });
      },
    },
    ls: {
      desc: "list files",
      run() {
        print(`total ${Object.keys(FILES).length}`);
        Object.entries(FILES).forEach(([f, m]) => {
          const x = f.endsWith(".EXE") ? "x" : "-";
          print(`-rw${x}r--r-- 1 guest guest ${m.size.replace(",", "").padStart(5)} ${stamp} ${f.toLowerCase()}`);
        });
      },
    },
    cat: {
      desc: "read a file",
      run(args) {
        const f = (args[0] || "").toUpperCase();
        if (!f) return print("usage: cat <file>   (try ls)");
        if (f === "WORM.EXE") return print("\u007fELF\u263a\u263b\u2665\u2666\u2663\u2660\u2022\u25d8\u25cb\u25d9\u2642\u2640\u266a\u266b\u263c\u25ba\u25c4 ...that's a binary. try `play`", "dim");
        if (FILES[f]) return FILES[f].run();
        print(`cat: ${args[0]}: No such file or directory`, "err");
      },
    },
    play: { desc: "launch WORM.EXE", run() { print("Loading WORM.EXE...", "dim"); setTimeout(() => UI.go("game"), 300); } },
    fortune: { desc: "receive wisdom", run() { print(pick(S.fortunes || ["No fortunes today."]), "yellow"); } },
    cowsay: {
      desc: "say something (no cows available)",
      run(args) { pre(computerSay(args.join(" ") || "Moo? I'm a PC.")); },
    },
    matrix: { desc: "enter the grid", run: matrix },
    banner: {
      desc: "big letters",
      run(args) {
        const d = add(el("div", "banner-out"));
        UI.renderBanner(d, (args.join(" ") || S.bannerText || S.name).slice(0, 16));
      },
    },
    date: { desc: "current date/time (UTC)", run() { print(new Date().toUTCString().replace("GMT", "UTC")); } },
    whoami: { desc: "who are you?", run() { print("guest"); print("(but a very welcome one)", "dim"); } },
    clear: { desc: "clear screen", run() { out.textContent = ""; const m = screen.querySelector(".motd"); if (m) m.remove(); } },
    reboot: { desc: "replay the boot", run() { window.Boot && window.Boot.run(); } },
    exit: { desc: "back to home", run() { UI.go("home"); } },

    /* hidden */
    sudo: { hidden: true, run() { print("guest is not in the sudoers file. This incident will be reported to my mom.", "err"); } },
    rm: { hidden: true, run: rm },
    secret: { hidden: true, run() { print("\u2605 " + (S.secret || "Shh."), "accent"); } },
    xyzzy: { hidden: true, run() { print("Nothing happens."); } },
    hello: { hidden: true, run() { print(`Hello, guest! Type ${"`help`"} to get started.`); } },
    uname: { hidden: true, run() { print(`Linux ${S.handle || "home"} 6.22.0-guest #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux`); } },
  };
  const ALIASES = { "?": "help", cls: "clear", dir: "ls", ll: "ls", type: "cat", worm: "play", quit: "exit", hi: "hello", ver: "uname", version: "uname", start: "play", run: "play" };

  function computerSay(msg) {
    const words = msg.split(/\s+/);
    const lines = [];
    let cur = "";
    words.forEach((w) => {
      if ((cur + " " + w).trim().length > 28) { if (cur) lines.push(cur); cur = w.slice(0, 28); }
      else cur = (cur + " " + w).trim();
    });
    if (cur) lines.push(cur);
    const w = Math.max(...lines.map((l) => l.length));
    const body = lines.length === 1
      ? [`< ${lines[0]} >`]
      : lines.map((l, i) => {
          const [a, b] = i === 0 ? ["/", "\\"] : i === lines.length - 1 ? ["\\", "/"] : ["|", "|"];
          return `${a} ${l.padEnd(w)} ${b}`;
        });
    return [
      " " + "_".repeat(w + 2),
      ...body,
      " " + "-".repeat(w + 2),
      "      \\",
      "       \\   .----------.",
      "           | .------. |",
      "           | | o  o | |",
      "           | |  \\__/| |",
      "           | '------' |",
      "           '---.__.---'",
      "          _/________\\_",
      "         [____________]",
    ].join("\n");
  }

  async function rm(args) {
    if (!args.includes("-rf")) return print("rm: permission denied (nice try)", "err");
    for (const f of ["/bin", "/home/guest/homework", "/usr/games/worm", "/var/snacks"]) {
      print(`rm: removing '${f}'...`, "err");
      await wait(350);
    }
    await wait(400);
    print("...just kidding. Nothing was deleted. Please don't do that on a real computer.", "ok");
  }

  async function matrix() {
    const p = add(el("pre", "matrix"));
    const cols = Math.max(20, Math.min(70, Math.floor(out.clientWidth / 8) - 2));
    const rows = 12;
    const glyphs = "01\u2591\u2592\u2593\u2502\u2524\u2561\u2562\u2556\u2555\u2563\u2551\u2557\u255d\u255c\u255b\u2510\u2514\u2534\u252c\u251c\u2500\u253c\u03b1\u03b2\u0393\u03c0\u03a3\u03c3\u00b5\u03c4\u03a6\u0398\u03a9\u03b4\u221e";
    const grid = Array.from({ length: rows }, () => Array(cols).fill(" "));
    const drops = Array.from({ length: cols }, () => (Math.random() < 0.4 ? Math.floor(Math.random() * rows) : -1));
    const still = UI.reduceMotion.matches;
    const frames = 40;
    for (let f = 0; f < frames; f++) {
      for (let x = 0; x < cols; x++) {
        for (let y = rows - 1; y > 0; y--) grid[y][x] = grid[y - 1][x] !== " " && Math.random() < 0.92 ? pick(glyphs) : " ";
        if (drops[x] >= 0 || Math.random() < 0.08) {
          grid[0][x] = Math.random() < 0.7 ? pick(glyphs) : " ";
          drops[x] = Math.random() < 0.85 ? 0 : -1;
        } else grid[0][x] = " ";
      }
      if (!still || f === frames - 1) p.textContent = grid.map((r) => r.join("")).join("\n");
      if (!still) await wait(70);
    }
    print("Follow the blinking cursor.", "ok");
  }

  /* ---------- run / input ---------- */
  async function run(raw, echo = true) {
    const line = raw.trim();
    if (echo) {
      const u = el("span", "u", `guest@${S.handle || "home"}`);
      const pth = el("span", "p", "~");
      row(u, ":", pth, "$ " + raw);
    }
    if (!line) return;
    const parts = line.split(/\s+/);
    let name = parts.shift().toLowerCase();
    name = ALIASES[name] || name;
    const cmd = Object.prototype.hasOwnProperty.call(commands, name) && commands[name];
    if (!cmd) {
      print(`${name}: command not found`, "err");
      row("Type ", cmdLink("help"), " for a list of commands.");
      return;
    }
    try { await cmd.run(parts); }
    catch (err) { print("Segmentation fault (core dumped)", "err"); console.error(err); }
    form.scrollIntoView({ block: "nearest" });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = input.value;
    input.value = "";
    if (v.trim()) { history.push(v); if (history.length > 50) history.shift(); }
    hIndex = history.length;
    run(v);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && history.length) {
      e.preventDefault();
      hIndex = Math.max(0, hIndex - 1);
      input.value = history[hIndex];
    } else if (e.key === "ArrowDown" && history.length) {
      e.preventDefault();
      hIndex = Math.min(history.length, hIndex + 1);
      input.value = history[hIndex] || "";
    } else if (e.key === "Tab") {
      const v = input.value.toLowerCase();
      if (!v || v.includes(" ")) return;
      e.preventDefault();
      const hits = Object.keys(commands).filter((c) => !commands[c].hidden && c.startsWith(v));
      if (hits.length === 1) input.value = hits[0] + " ";
      else if (hits.length > 1) print(hits.join("  "), "dim");
    }
  });

  /* clicking anywhere on the screen focuses the prompt (unless selecting text) */
  screen.addEventListener("click", (e) => {
    if (e.target.closest("a, button") || String(getSelection())) return;
    input.focus({ preventScroll: true });
  });

  /* tappable shortcuts (great on phones) */
  ["help", "about", "contact", "fortune", "cowsay hi!", "matrix", "ls", "play", "clear"].forEach((c) => {
    const b = el("button", "chip", c);
    b.type = "button";
    b.addEventListener("click", () => {
      run(c);
      if (!matchMedia("(pointer: coarse)").matches) input.focus();
    });
    chips.append(b);
  });

  window.Terminal = { run, commands };
})();

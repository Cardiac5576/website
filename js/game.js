/* game.js: WORM.EXE, a tiny text-mode worm game */
(() => {
  const UI = window.UI;
  const W = 20, H = 14;               // cells; each cell is 2 characters wide
  const board = document.getElementById("worm-board");
  const msg = document.getElementById("worm-msg");
  const scoreEl = document.getElementById("worm-score");
  const hiEl = document.getElementById("worm-hi");
  const pauseBtn = document.getElementById("worm-pause");
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const KEYS = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right",
  };

  let worm, dir, queue, food, score, state = "ready", stepMs, acc = 0, last = 0, raf = 0, crash = null;
  let hi = Number(UI.store.get("worm.hi")) || 0;
  hiEl.textContent = hi;

  function reset() {
    worm = [{ x: 6, y: 7 }, { x: 5, y: 7 }, { x: 4, y: 7 }];
    dir = DIRS.right;
    queue = [];
    score = 0;
    stepMs = 140;
    crash = null;
    scoreEl.textContent = 0;
    placeFood();
  }

  function placeFood() {
    const free = [];
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (!worm.some((s) => s.x === x && s.y === y)) free.push({ x, y });
    food = free[Math.floor(Math.random() * free.length)];
  }

  function render() {
    const cells = Array.from({ length: H }, () => Array(W).fill(null));
    worm.forEach((s, i) => { cells[s.y][s.x] = i === 0 ? "h" : "w"; });
    if (food) cells[food.y][food.x] = "f";
    if (crash) cells[crash.y] && (cells[crash.y][crash.x] = "x");
    const CH = { h: "██", w: "▓▓", f: "▐▌", x: "▒▒" };
    let html = "";
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const c = cells[y][x];
        html += c ? `<span class="${c}">${CH[c]}</span>` : "  ";
      }
      if (y < H - 1) html += "\n";
    }
    board.innerHTML = html;   // generated from fixed characters only
  }

  function say(lines) {
    msg.textContent = "";
    if (!lines) return;
    const box = document.createElement("div");
    lines.forEach((l, i) => {
      if (i) box.append(document.createElement("br"));
      box.append(l);
    });
    msg.append(box);
  }

  function step() {
    if (queue.length) dir = queue.shift();
    const head = { x: worm[0].x + dir[0], y: worm[0].y + dir[1] };
    const eating = food && head.x === food.x && head.y === food.y;
    const body = eating ? worm : worm.slice(0, -1);
    if (head.x < 0 || head.y < 0 || head.x >= W || head.y >= H || body.some((s) => s.x === head.x && s.y === head.y)) {
      return gameOver(head);
    }
    worm.unshift(head);
    if (eating) {
      score++;
      scoreEl.textContent = score;
      stepMs = Math.max(65, 140 - score * 4);
      placeFood();
    } else worm.pop();
  }

  function gameOver(at) {
    state = "over";
    crash = at.x >= 0 && at.y >= 0 && at.x < W && at.y < H ? at : worm[0];
    cancelAnimationFrame(raf);
    let line = `Score: ${score}`;
    if (score > hi) {
      hi = score;
      hiEl.textContent = hi;
      UI.store.set("worm.hi", hi);
      line = `NEW HIGH SCORE: ${score}!`;
    }
    render();
    say(["GAME OVER", line, coarse() ? "Tap to play again" : "Press SPACE to play again"]);
    pauseBtn.textContent = "Restart";
  }

  function loop(t) {
    if (state !== "run") return;
    acc += t - last;
    last = t;
    if (acc > 1000) acc = stepMs;           // tab was asleep, don't fast-forward
    while (acc >= stepMs && state === "run") {
      acc -= stepMs;
      step();
    }
    if (state === "run") { render(); raf = requestAnimationFrame(loop); }
  }

  function start() {
    if (state === "over" || state === "ready") reset();
    state = "run";
    say(null);
    pauseBtn.textContent = "Pause";
    acc = 0;
    last = performance.now();
    render();
    raf = requestAnimationFrame(loop);
  }

  function pause() {
    if (state !== "run") return;
    state = "pause";
    cancelAnimationFrame(raf);
    say(["PAUSED", coarse() ? "Tap to continue" : "Press SPACE to continue"]);
    pauseBtn.textContent = "Resume";
  }

  const toggle = () => (state === "run" ? pause() : start());
  const coarse = () => matchMedia("(pointer: coarse)").matches;

  function turn(name) {
    const d = DIRS[name];
    if (state !== "run") start();
    const prev = queue.length ? queue[queue.length - 1] : dir;
    if ((d[0] === -prev[0] && d[1] === -prev[1]) || d === prev) return;
    if (queue.length < 3) queue.push(d);
  }

  function ready() {
    state = "ready";
    reset();
    render();
    say(["WORM.EXE", "Eat the ▐▌, don't bite yourself.", coarse() ? "Tap or swipe to start" : "Press SPACE or an arrow key"]);
    pauseBtn.textContent = "Start";
  }

  /* ---------- input ---------- */
  document.addEventListener("keydown", (e) => {
    if (UI.route !== "game" || e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.documentElement.classList.contains("booting")) return;
    if (KEYS[e.key]) { e.preventDefault(); turn(KEYS[e.key]); }
    else if (e.key === " " || e.key === "Enter" || e.key === "p" || e.key === "P") {
      if (e.key === "Enter" && e.target instanceof Element && e.target.closest("button, a")) return;
      e.preventDefault();
      toggle();
    }
  });

  pauseBtn.addEventListener("click", () => { toggle(); pauseBtn.blur(); });

  document.querySelectorAll("#worm-dpad [data-dir]").forEach((b) => {
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); turn(b.dataset.dir); });
  });

  let tx = 0, ty = 0;
  const wrap = board.parentElement;
  wrap.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    tx = t.clientX; ty = t.clientY;
  }, { passive: true });
  wrap.addEventListener("touchend", (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - tx, dy = t.clientY - ty;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) { if (state !== "run") start(); return; }
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
  });
  wrap.addEventListener("click", () => { if (!coarse() && state !== "run") start(); });

  document.addEventListener("route", (e) => {
    if (e.detail !== "game") pause();
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });

  ready();
})();

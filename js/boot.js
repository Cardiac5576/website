/* boot.js: fake BIOS POST on first visit (skippable, replay with `reboot`) */
(() => {
  const UI = window.UI;
  const S = UI.site;
  const root = document.documentElement;
  const log = document.getElementById("boot-log");
  let timers = [], raf = 0, running = false;

  const later = (ms, fn) => timers.push(setTimeout(fn, ms));
  function line(text, cls) {
    const s = document.createElement("span");
    if (cls) s.className = cls;
    s.textContent = text;
    log.append(s);
    return s;
  }

  function finish() {
    if (!running) return;
    running = false;
    timers.forEach(clearTimeout);
    timers = [];
    cancelAnimationFrame(raf);
    root.classList.remove("booting");
    UI.store.set("booted", "1");
    removeEventListener("keydown", skip, true);
    removeEventListener("pointerdown", skip, true);
    document.dispatchEvent(new Event("booted"));
  }

  function skip(e) {
    e.preventDefault();
    e.stopPropagation();
    finish();
  }

  function run() {
    if (running) return;
    if (UI.reduceMotion.matches) { root.classList.remove("booting"); UI.store.set("booted", "1"); return; }
    running = true;
    root.classList.add("booting");
    log.textContent = "";
    addEventListener("keydown", skip, true);
    addEventListener("pointerdown", skip, true);

    const who = (S.handle || "HOME").toUpperCase();
    line(`${who} BIOS v1.0  (C) 1994-${new Date().getFullYear()}\n`, "w");
    line("CPU            : Imagination 486DX2-66\n");
    line("Memory Test    : ");
    const mem = line("0K");
    line("\n");

    // count memory up
    const t0 = performance.now();
    const MEM = 640;
    const count = (t) => {
      const k = Math.max(0, Math.min(MEM, Math.round(((t - t0) / 600) * MEM)));
      mem.textContent = `${k}K` + (k === MEM ? " OK" : "");
      if (k < MEM) raf = requestAnimationFrame(count);
      else steps();
    };
    raf = requestAnimationFrame(count);

    function steps() {
      const seq = [
        [150, "Video          : VGA 640x480, 16 colours\n"],
        [150, "Drive A:       : 1.44M floppy (empty, as usual)\n"],
        [200, "Drive C:       : big enough\n\n"],
        [250, "Loading HIMEM.SYS ......... ", "OK"],
        [200, "Loading FRIENDS.SYS ....... ", "OK"],
        [200, "Loading SNACKS.DRV ........ ", "OK"],
        [300, `\nStarting ${S.name || "homepage"}'s homepage`],
      ];
      let t = 0;
      seq.forEach(([ms, text, ok]) => {
        t += ms;
        later(t, () => {
          line(text);
          if (ok) line(ok + "\n", "ok");
        });
      });
      later(t + 50, () => { const c = line("_", "cursor"); c.setAttribute("aria-hidden", "true"); });
      later(t + 700, finish);
    }
  }

  window.Boot = { run };
  if (root.classList.contains("booting")) { running = false; run(); }
})();

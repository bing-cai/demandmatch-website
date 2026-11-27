/* #germany: the six points as a feature viewer. Hover (fine pointer, after a short intent delay) or click a name to show
   its text; the painting behind pans to a new place for each point. Arrow keys / Home / End move between the names
   (WAI-ARIA tabs). Without this script, or below 900px, all six are shown as cards (monet.css). */
(() => {
  const ge = document.querySelector('[data-ge]'); if (!ge) return;
  const tabs = [...ge.querySelectorAll('.ge-tab')], panels = [...ge.querySelectorAll('.ge-p')], art = ge.querySelector('.ge-art');
  // where the painting looks for each point (the zoom origin and the zoom): a slow walk across the river works
  const PAN = [['15% 40%', 1.04], ['40% 35%', 1.1], ['65% 40%', 1.08], ['90% 45%', 1.1], ['70% 55%', 1.06], ['35% 50%', 1.02]];
  let cur = 0, hoverT;
  function show(i, focus) {
    if (i === cur && !focus) return;
    cur = i;
    tabs.forEach((t, k) => { const on = k === i; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    panels.forEach((p, k) => p.classList.toggle('on', k === i));
    art.style.setProperty('--pan', PAN[i][0]); art.style.setProperty('--zoom', PAN[i][1]);
    if (focus) tabs[i].focus();
  }
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => show(i));
    t.addEventListener('pointerenter', () => { if (!fine.matches) return; clearTimeout(hoverT); hoverT = setTimeout(() => show(i), 120); });
    t.addEventListener('pointerleave', () => clearTimeout(hoverT));
    t.addEventListener('keydown', e => {
      const n = tabs.length, k = { ArrowDown: cur + 1, ArrowRight: cur + 1, ArrowUp: cur - 1, ArrowLeft: cur - 1, Home: 0, End: n - 1 }[e.key];
      if (k === undefined) return;
      e.preventDefault(); show((k + n) % n, true);
    });
  });
  art.style.setProperty('--pan', PAN[0][0]); art.style.setProperty('--zoom', PAN[0][1]);
  ge.classList.add('js');
})();

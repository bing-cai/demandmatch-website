/* The sales page: three small pieces of the product to touch.
   0. The laptop film (hero): a pause button for film.js.
   1. The list for today: Approve turns a row into "Draft in Outlook" and the open count goes down.
   2. The offer screen (#trust): "Change a number in the draft" swaps the price in our reply for one the offer does not
      contain; the check fails and approval locks, as in the product. Pressed again, it is undone.
   3. The three roles (#roles): a tab viewer like the Germany one; hover (fine pointer, short intent delay) or click,
      arrow keys / Home / End move between them; the painting pans to a new place for each role.
   All text comes from site.js (s_*), so the page stays in one language per file. */
(() => {
  const t = k => window.UI.t(k);

  // ---------------------------------------------------------------- 0. the laptop film (film.js plays it by itself and stops it
  // off screen): a pause button, since it runs longer than five seconds; with reduced motion it starts as a still frame
  const film = document.getElementById('film');
  const btn = document.querySelector('[data-film-toggle]');
  if (film && btn && film.hold) {
    let wanted = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sync = () => {
      film.hold(!wanted);
      btn.innerHTML = `<i class="ph-light ph-${wanted ? 'pause' : 'play'}" aria-hidden="true"></i>`;
      btn.setAttribute('aria-label', t(wanted ? 's_film_pause' : 's_film_play')); btn.title = btn.getAttribute('aria-label');
    };
    btn.addEventListener('click', () => { wanted = !wanted; sync(); });
    sync();
  }

  // ---------------------------------------------------------------- 1. the list for today
  const board = document.querySelector('[data-board]');
  if (board) {
    const open = board.querySelector('[data-open]');
    const count = () => {
      const n = board.querySelectorAll('.s-row:not(.done)').length;
      open.textContent = t('s_open').replace('{n}', n);
      open.classList.toggle('zero', n === 0);
    };
    board.addEventListener('click', e => {
      const b = e.target.closest('[data-ok]'); if (!b || b.classList.contains('done')) return;
      b.classList.add('done'); b.closest('.s-row').classList.add('done');
      b.innerHTML = `<i class="ph-light ph-check" aria-hidden="true"></i><span>${t('s_ok_done')}</span>`;
      count();
    });
    // phones show the first three rows (mobile.css); the button shows the rest and goes away
    const more = board.querySelector('[data-more]');
    more?.addEventListener('click', () => { board.classList.add('all'); more.remove(); board.querySelector('.s-row:nth-child(4) [data-ok]')?.focus(); });
  }

  // ---------------------------------------------------------------- 2. the checker
  const offer = document.querySelector('[data-offer]');
  if (offer) {
    const brk = offer.querySelector('[data-break]'), price = offer.querySelector('[data-price]'), chk = offer.querySelector('[data-chk]');
    const ok = offer.querySelector('[data-approve-demo]'), why = offer.querySelector('[data-why]');
    function set(broken) {
      offer.classList.toggle('broken', broken);
      brk.setAttribute('aria-pressed', String(broken));
      brk.querySelector('span').textContent = t(broken ? 's_of_fix' : 's_of_break');
      price.textContent = t(broken ? 's_of_pw' : 's_of_p');
      chk.innerHTML = `<i class="ph-light ph-${broken ? 'warning-circle' : 'check-circle'}" aria-hidden="true"></i><span>${t(broken ? 's_of_bad' : 's_of_ok')}</span>`;
      ok.disabled = broken; why.hidden = !broken;
      if (broken) { ok.classList.remove('done'); ok.innerHTML = `<span>${t('s_ok')}</span>`; }
    }
    brk.addEventListener('click', () => set(brk.getAttribute('aria-pressed') !== 'true'));
    ok.addEventListener('click', () => {
      if (ok.disabled || ok.classList.contains('done')) return;
      ok.classList.add('done');
      ok.innerHTML = `<i class="ph-light ph-check" aria-hidden="true"></i><span>${t('s_ok_done')}</span>`;
    });
  }

  // ---------------------------------------------------------------- 3. the roles
  const roles = document.querySelector('[data-roles]');
  if (roles) {
    const tabs = [...roles.querySelectorAll('.s-role-tab')], panels = [...roles.querySelectorAll('.s-role-p')], art = roles.querySelector('.s-role-art');
    // where the painting looks for each role: across the river works, left to right
    const PAN = [['15% 35%', 1.22], ['55% 30%', 1.3], ['90% 45%', 1.26]];
    let cur = 0, hoverT;
    const pan = i => { art.style.setProperty('--pan', PAN[i][0]); art.style.setProperty('--zoom', PAN[i][1]); };
    function show(i, focus) {
      if (i === cur && !focus) return;
      cur = i;
      tabs.forEach((b, k) => { const on = k === i; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
      panels.forEach((p, k) => p.classList.toggle('on', k === i));
      pan(i);
      if (focus) tabs[i].focus();
    }
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    tabs.forEach((b, i) => {
      b.addEventListener('click', () => show(i));
      b.addEventListener('pointerenter', () => { if (!fine.matches) return; clearTimeout(hoverT); hoverT = setTimeout(() => show(i), 120); });
      b.addEventListener('pointerleave', () => clearTimeout(hoverT));
      b.addEventListener('keydown', e => {
        const n = tabs.length, k = { ArrowDown: cur + 1, ArrowRight: cur + 1, ArrowUp: cur - 1, ArrowLeft: cur - 1, Home: 0, End: n - 1 }[e.key];
        if (k === undefined) return;
        e.preventDefault(); show((k + n) % n, true);
      });
    });
    pan(0);
    roles.classList.add('js');
  }
})();

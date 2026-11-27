/* #surplus: stock nobody has bought yet, and the customers it fits. The rows come from the page text (sp_rows),
   the lines are drawn from the lot card to each row (measured, so they follow any layout), and small pellets
   travel along the lines that fit. Plays once when the board is in view; pellets only run while it is on screen.
   Reduced motion: lines drawn, no pellets, nothing moves. */
(() => {
  const board = document.getElementById('sp-board'); if (!board) return;
  const svg = board.querySelector('.sp-flow'), list = board.querySelector('.sp-list'), lot = board.querySelector('.sp-lot');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wide = matchMedia('(min-width: 1001px)');
  const t = k => window.UI.t(k);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // the hero with the ship: each customer that fits gets a colour of the painting; a header counts them as they are found
  const COL = ['var(--navy)', 'var(--racing)', 'var(--bordeaux)']; // the tokens in freight.css; the lines read them back resolved
  function rows() {
    let c = 0;
    const head = sail ? `<li class="sp-found" aria-hidden="true"><b data-count>${board.classList.contains('play') ? t('sp_rows').filter(r => r[1] !== 'no').length : 0}</b><span>${esc(t('sp_list_label'))}</span></li>` : '';
    list.innerHTML = head + t('sp_rows').map(([name, k, why, src, qty], i) => `
      <li class="sp-row ${k}" style="--i:${i}; --c:${k === 'no' ? 'var(--ink-3)' : COL[c++ % 3]}">
        <span class="sp-pin" aria-hidden="true" data-n="${i + 1}"></span>
        <div class="sp-who"><b>${esc(name)}</b><p>${esc(why)}</p>${src ? `<small>${esc(src)}</small>` : ''}</div>
        <div class="sp-out">${qty ? `<b>${esc(qty)}</b>` : ''}<em>${esc(t('sp_' + k))}</em></div>
      </li>`).join('');
    requestAnimationFrame(draw);
  }

  // Where the painted container is, in the painting's own pixels, from the painting's data-art attribute (w h outX outY tieX tieY):
  // its right edge (where the pellets leave) and its lower right corner (where the lot tag's string is tied).
  const img = document.querySelector('.gallery-wallpaper img');
  // data-art="none": the painting is not behind the board; the lot stands on its own and the lines leave the lot card
  const free = img.dataset.art === 'none';
  const sail = !!img.closest('.sail');
  // sail: the container itself, in painting pixels (left top right bottom), framed as "your stock"
  const BOX = (img.dataset.box || '').split(' ').map(Number);
  function placeMark() {
    const [x1, y1] = fromArt([BOX[0], BOX[1]]), [x2, y2] = fromArt([BOX[2], BOX[3]]), f = n => n.toFixed(1);
    lot.style.transform = `translate3d(${f(x1)}px, ${f(y1)}px, 0)`;
    lot.style.width = `${f(x2 - x1)}px`; lot.style.height = `${f(y2 - y1)}px`;
    board.classList.add('anchored');
  }
  const [aw, ah, ox, oy, tx0, ty0] = (free ? '1536 1024 472 648 452 692' : img.dataset.art || '1536 1024 472 648 452 692').split(' ').map(Number);
  const ART = { w: aw, h: ah, out: [ox, oy], tie: [tx0, ty0] };
  // map a painting pixel to board coordinates, from where the image really is (object-fit: cover, its object-position in %)
  function fromArt([ax, ay]) {
    const r = img.getBoundingClientRect(), b = board.getBoundingClientRect(), fit = getComputedStyle(img).objectFit === 'contain' ? Math.min : Math.max, k = fit(r.width / ART.w, r.height / ART.h);
    const [px, py] = getComputedStyle(img).objectPosition.split(' ').map(v => (parseFloat(v) || 0) / 100);
    return [r.left - b.left + (r.width - ART.w * k) * px + ax * k, r.top - b.top + (r.height - ART.h * k) * py + ay * k];
  }
  // layout positions (offset*), so cards that are still sliding in do not bend the lines
  const pos = el => { let x = 0, y = 0; for (let n = el; n && n !== board; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; } return [x, y]; };

  // narrow screens: no lines; the tag sits in the flow under the container, on a short string (CSS)
  function placeNarrow() {
    lot.style.marginTop = lot.style.marginLeft = '';
    if (free) { board.classList.add('anchored'); return; }
    const [tx, ty] = pos(lot), [ax, ay] = fromArt(ART.tie), room = board.clientWidth - lot.offsetWidth - 2 * tx;
    lot.style.marginTop = `${Math.max(0, Math.round(ay + 34 - ty))}px`;
    lot.style.marginLeft = `${Math.max(0, Math.min(room, Math.round(ax - 22 - tx)))}px`;
    board.classList.add('anchored');
  }

  function draw() {
    lot.style.transform = '';
    if (sail) placeMark();
    if (!wide.matches) { svg.innerHTML = ''; if (!sail) placeNarrow(); return; }
    lot.style.marginTop = lot.style.marginLeft = '';
    svg.setAttribute('viewBox', `0 0 ${board.clientWidth} ${board.clientHeight}`);
    const f = n => n.toFixed(1);
    let html = '', x0, y0;
    if (free) {
      // the lot card on the left, level with the middle of the list; the lines leave its right edge
      const [, ly0] = pos(list), lx = parseFloat(getComputedStyle(board).paddingLeft) || 0, ly = Math.max(0, ly0 + (list.offsetHeight - lot.offsetHeight) / 2);
      lot.style.transform = `translate3d(${f(lx)}px, ${f(ly)}px, 0)`;
      x0 = lx + lot.offsetWidth; y0 = ly + lot.offsetHeight / 2;
    } else if (sail) {
      [x0, y0] = fromArt(ART.out);
      html += `<circle class="src-ring" cx="${f(x0)}" cy="${f(y0)}" r="6"/>`;
    } else {
      [x0, y0] = fromArt(ART.out);
      // the lot tag hangs below the container, its string tied to the container's lower corner
      const [kx, ky] = fromArt(ART.tie), lx = kx - 34, ly = ky + 46, hx = lx + 22, hy = ly + 14;
      lot.style.transform = `translate3d(${f(lx)}px, ${f(ly)}px, 0)`;
      html += `<path class="string" d=""M${f(kx)} ${f(ky)} Q${f((kx + hx) / 2 + 6)} ${f((ky + hy) / 2)} ${f(hx)} ${f(hy)}"/><circle class="knot" cx="${f(kx)}" cy="${f(ky)}" r="2.5"/>`;
    }
    [...list.querySelectorAll('.sp-row')].forEach((li, i) => {
      const pin = li.querySelector('.sp-pin'), [px, py] = pos(pin);
      const x1 = px + (sail ? -4 : pin.offsetWidth / 2), y1 = py + pin.offsetHeight / 2, mx = x0 + (x1 - x0) * .55;
      const d = `M${f(x0)} ${f(y0)} C${f(mx)} ${f(y0)} ${f(mx)} ${f(y1)} ${f(x1)} ${f(y1)}`;
      const k = li.classList.contains('no') ? 'no' : li.classList.contains('maybe') ? 'maybe' : 'fit';
      html += `<path class="ln ${k}" d="${d}" pathLength="1" style="--i:${i}${sail ? '; stroke: ' + getComputedStyle(li).getPropertyValue('--c') : ''}"/>`;
      if (sail && k !== 'no' && !reduced) {
        // small containers in the customer's colour travel from the ship to it
        const c = getComputedStyle(li).getPropertyValue('--c'), n = k === 'fit' ? 4 : 2;
        for (let j = 0; j < n; j++) html += `<rect class="pel box" x="-6" y="-3.5" width="12" height="7" rx="1.2" style="offset-path: path('${d}'); fill: ${c}; --j:${j}; --n:${n}; --i:${i}"/>`;
      } else if (k !== 'no' && !reduced) {
        // pellets: evenly spaced in time along the same curve (CSS offset-path)
        const n = k === 'fit' ? 5 : 3;
        for (let j = 0; j < n; j++) html += `<circle class="pel ${k}" r="${k === 'fit' ? 4 : 3.4}" style="offset-path: path('${d}'); --j:${j}; --n:${n}; --i:${i}"/>`;
      }
    });
    svg.innerHTML = html;
    board.classList.add('anchored');
  }

  rows();
  window.UI.onLang(rows);
  let tm; addEventListener('resize', () => { clearTimeout(tm); tm = setTimeout(draw, 120); });
  wide.addEventListener('change', draw);
  document.fonts?.ready.then(draw);
  if (!img.complete) img.addEventListener('load', draw, { once: true });

  // the ship sails in first (hero.css); the lines are measured and drawn once it has arrived
  const arrived = new Promise(res => {
    if (reduced || !img.closest('.sail')) return res();
    const done = () => { draw(); res(); };
    img.addEventListener('transitionend', e => { if (e.propertyName === 'transform') done(); }, { once: true });
    setTimeout(done, 3200);
  });
  // play once when well in view; pellets run only while the board is visible
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) arrived.then(() => {
      if (board.classList.contains('play')) return;
      board.classList.add('play');
      // the count goes up as each line reaches its customer
      const el = list.querySelector('[data-count]'); if (!el) return;
      [...list.querySelectorAll('.sp-row:not(.no)')].forEach((li, n) => {
        const i = +getComputedStyle(li).getPropertyValue('--i');
        setTimeout(() => { el.textContent = n + 1; el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); }, reduced ? 0 : 1150 + i * 170);
      });
    });
    board.classList.toggle('run', e.isIntersecting);
  }, { threshold: .2 }).observe(board);

  // "See it in the product": open the push screen with this very stock
  document.querySelector('[data-open-push]')?.addEventListener('click', e => {
    e.preventDefault();
    document.dispatchEvent(new CustomEvent('dm:open', { detail: { page: 'push', push: 'hdpe' } }));
  });
})();

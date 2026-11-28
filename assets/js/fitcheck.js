/* The fit check request. Every "Book a fit check" button ([data-mail], not the plain address in the footer) opens this short form in a dialog instead of a
   bare email: name, work email and company (required), the role, then industry, revenue, ERP and sales team as one tap
   each, and an optional note. Without scripts the buttons stay plain mailto links.
   Sending: if ENDPOINT is set (a form service that accepts a JSON POST, e.g. Formspree or Web3Forms), the request is
   posted there and the dialog thanks the visitor. Until then it opens the visitor's email app with everything filled
   in, addressed to hello@demandmatch.io, and offers to copy the details as a fallback. */
(() => {
  if (!window.UI) return;
  const ENDPOINT = '';
  const EMAIL = 'hello@demandmatch.io';
  const t = k => window.UI.t(k);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let dlg = null, opener = null;

  const field = (k, type, req, auto) => `<label class="fc-f"><span class="fc-l">${esc(t('fc_' + k))}${req ? '' : ` <em>${esc(t('fc_opt'))}</em>`}</span>
    <input name="${k}" type="${type}" ${req ? 'required' : ''} autocomplete="${auto}" ${type === 'email' ? 'inputmode="email"' : ''}></label>`;
  const chips = k => `<fieldset class="fc-c"><legend class="fc-l">${esc(t('fc_' + k))}</legend><div>
    ${t('fc_' + k + '_o').map(o => `<label><input type="radio" name="${k}" value="${esc(o)}"><span>${esc(o)}</span></label>`).join('')}</div></fieldset>`;

  function build() {
    dlg?.remove();
    dlg = document.createElement('dialog');
    dlg.className = 'fc-dlg';
    dlg.setAttribute('aria-labelledby', 'fc-h');
    dlg.innerHTML = `<div class="fc">
      <button class="fc-x" type="button" aria-label="${esc(t('fc_close'))}"><i class="ph-light ph-x" aria-hidden="true"></i></button>
      <form class="fc-form" novalidate>
        <p class="fc-tag"><i aria-hidden="true"></i>${esc(t('fc_tag'))}</p>
        <h2 class="fc-h" id="fc-h">${esc(t('fc_h'))}</h2>
        <p class="fc-lead">${esc(t('fc_lead'))}</p>
        <div class="fc-grid">${field('name', 'text', true, 'name')}${field('email', 'email', true, 'email')}${field('company', 'text', true, 'organization')}${field('role', 'text', false, 'organization-title')}</div>
        ${chips('ind')}${chips('rev')}${chips('erp')}${chips('team')}
        <label class="fc-f"><span class="fc-l">${esc(t('fc_msg'))} <em>${esc(t('fc_opt'))}</em></span><textarea name="msg" rows="3" placeholder="${esc(t('fc_msg_ph'))}"></textarea></label>
        <div class="fc-foot"><button class="fc-send" type="submit"><span>${esc(t('fc_send'))}</span><i class="ph-light ph-arrow-right" aria-hidden="true"></i></button>
          <p class="fc-note">${esc(t('fc_privacy'))}</p></div>
      </form>
      <div class="fc-done" hidden tabindex="-1"></div>
    </div>`;
    document.body.appendChild(dlg);
    const form = dlg.querySelector('form');
    dlg.querySelector('.fc-x').addEventListener('click', close);
    dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
    dlg.addEventListener('close', () => { document.documentElement.classList.remove('fc-open'); opener?.focus?.(); });
    form.addEventListener('submit', e => { e.preventDefault(); submit(form); });
  }

  // the details as plain lines, for the email body and the copy fallback
  function lines(form) {
    const d = new FormData(form), v = k => (d.get(k) || '').toString().trim();
    const rows = [['name', v('name')], ['email', v('email')], ['company', v('company')], ['role', v('role')],
      ['ind', v('ind')], ['rev', v('rev')], ['erp', v('erp')], ['team', v('team')]];
    const out = [t('fc_body'), '', ...rows.filter(r => r[1]).map(([k, x]) => `${t('fc_' + k)}: ${x}`)];
    if (v('msg')) out.push('', v('msg'));
    out.push('', location.origin + location.pathname);
    return { text: out.join('\n'), data: Object.fromEntries(rows.concat([['msg', v('msg')], ['page', location.pathname], ['lang', window.UI.lang]])) };
  }

  function done(html) {
    const box = dlg.querySelector('.fc-done');
    dlg.querySelector('form').hidden = true; box.hidden = false; box.innerHTML = html; box.focus();
  }

  async function submit(form) {
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const { text, data } = lines(form);
    const subject = `${t('fc_subject')}: ${data.company}`;
    if (ENDPOINT) {
      const b = form.querySelector('.fc-send'); b.disabled = true;
      try {
        const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ subject, ...data, message: text }) });
        if (!r.ok) throw new Error(r.status);
        done(`<p class="fc-tag ok"><i aria-hidden="true"></i>${esc(t('fc_tag_ok'))}</p><h2 class="fc-h">${esc(t('fc_ok_h'))}</h2><p class="fc-lead">${esc(t('fc_ok_p'))}</p>
          <button class="fc-send" type="button" data-fc-close><span>${esc(t('fc_close'))}</span></button>`);
      } catch {
        b.disabled = false;
        form.querySelector('.fc-note').innerHTML = `${esc(t('fc_err'))} <a href="mailto:${EMAIL}">${EMAIL}</a>.`;
        return;
      }
    } else {
      location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
      done(`<p class="fc-tag"><i aria-hidden="true"></i>${esc(t('fc_tag_mail'))}</p><h2 class="fc-h">${esc(t('fc_mail_h'))}</h2><p class="fc-lead">${esc(t('fc_mail_p'))}</p>
        <p class="fc-alt">${esc(t('fc_mail_alt'))} <a href="mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}">${EMAIL}</a>.</p>
        <div class="fc-acts"><button class="fc-copy" type="button"><i class="ph-light ph-copy" aria-hidden="true"></i><span>${esc(t('fc_copy'))}</span></button>
        <button class="fc-send" type="button" data-fc-close><span>${esc(t('fc_close'))}</span></button></div>`);
      const c = dlg.querySelector('.fc-copy');
      c.addEventListener('click', async () => { try { await navigator.clipboard.writeText(text); c.querySelector('span').textContent = t('fc_copied'); } catch {} });
    }
    dlg.querySelector('[data-fc-close]')?.addEventListener('click', close);
  }

  function open(e) {
    e.preventDefault();
    opener = e.currentTarget;
    build();
    document.documentElement.classList.add('fc-open');
    dlg.showModal();
    dlg.querySelector('input[name="name"]').focus();
  }
  function close() { dlg?.close(); }

  const wire = () => document.querySelectorAll('[data-mail]:not([data-email])').forEach(a => { if (!a.dataset.fc) { a.dataset.fc = '1'; a.addEventListener('click', open); } });
  wire();
  window.UI.onLang?.(() => { if (dlg && !dlg.open) { dlg.remove(); dlg = null; } });
})();

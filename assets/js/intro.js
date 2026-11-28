/* #intro: the founders' thirty seconds, one film in German and one in English. The frame holds a poster until they exist.
   To put them in, set on .in-frame (in src/index.html):
     data-src="assets/video/intro.{lang}.mp4"     (H.264 MP4, 1920x1080, about 8 MB each: intro.de.mp4, intro.en.mp4)
     data-vtt="assets/video/intro.{lang}.vtt"     (optional captions in the film's own language, for watching muted)
   {lang} becomes the page language (de or en), so each page plays its own film. The play button then swaps the poster
   for the video and plays it with sound; the "coming soon" stamp disappears. */
(() => {
  const f = document.querySelector('.in-frame'); if (!f) return;
  const lang = () => (window.UI?.lang || document.documentElement.lang || 'en').slice(0, 2) === 'de' ? 'de' : 'en';
  const fill = s => (s || '').replace(/\{lang\}/g, lang());
  const has = !!f.dataset.src;
  f.classList.toggle('has-video', has);
  const play = f.querySelector('.in-play');
  if (!has) { play.disabled = true; return; }
  play.addEventListener('click', () => {
    const vtt = fill(f.dataset.vtt);
    const track = vtt ? `<track kind="captions" srclang="${lang()}" label="${lang() === 'de' ? 'Deutsch' : 'English'}" src="${vtt}" default>` : '';
    f.querySelector('.in-video')?.remove();
    f.insertAdjacentHTML('beforeend', `<video class="in-video" src="${fill(f.dataset.src)}" controls autoplay playsinline preload="auto">${track}</video>`);
    f.classList.add('playing');
    f.querySelector('video').focus();
  });
  // switching the language while it plays puts the poster back, so the next play is the other film
  window.UI?.onLang?.(() => { f.querySelector('.in-video')?.remove(); f.classList.remove('playing'); });
})();

/* English, visitor-initiated narration. No microphone or recording service. */
(() => {
  'use strict';
  if (document.getElementById('care-listen')) return;
  const style = document.createElement('style');
  style.textContent = `
    #care-listen{position:fixed;right:16px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:40;font-family:inherit;color:#182d49}
    #care-listen button,#care-listen select{font:inherit;font-size:15px;min-height:44px;cursor:pointer}
    #care-listen button:focus-visible,#care-listen select:focus-visible{outline:3px solid #182d49;outline-offset:3px}
    #care-listen .listen-toggle{display:flex;align-items:center;gap:8px;border:0;border-radius:50px;padding:13px 17px;background:#e437a4;color:white;font-weight:800;box-shadow:0 3px 16px #182d4926;margin-left:auto}
    #care-listen .listen-panel{box-sizing:border-box;width:min(340px,calc(100vw - 32px));padding:18px;background:white;border:1px solid #dce1e8;border-radius:18px;box-shadow:0 6px 30px #182d4926;margin-bottom:12px}
    #care-listen [hidden]{display:none!important}
    #care-listen p{font-size:14px;line-height:1.45;margin:8px 0 12px;color:#182d49}
    #care-listen .listen-controls{display:flex;gap:10px;flex-wrap:wrap}
    #care-listen .listen-controls button{border:1px solid #dce1e8;background:#fff;border-radius:24px;padding:8px 17px;color:#182d49;font-weight:700}
    #care-listen .listen-controls button:first-child{background:#182d49;color:white}
    #care-listen label{display:flex;align-items:center;gap:10px;font-size:14px;margin-top:12px}
    #care-listen select{border:1px solid #dce1e8;border-radius:8px;background:white;color:#182d49;padding:6px}
    @media print{#care-listen{display:none}}
  `;
  document.head.appendChild(style);
  const root = document.createElement('aside');
  root.id = 'care-listen'; root.setAttribute('aria-label', 'Listen to this page');
  root.innerHTML = `<div class="listen-panel" id="care-listen-panel" hidden>
    <strong>Listen in English</strong>
    <p id="care-listen-status" role="status" aria-live="polite">Read the section currently in view.</p>
    <div class="listen-controls"><button type="button" id="care-listen-play">Play</button><button type="button" id="care-listen-stop">Stop</button></div>
    <label>Reading speed <select id="care-listen-rate"><option value="0.85">Slower</option><option value="1" selected>Normal</option><option value="1.15">Faster</option></select></label>
    <p style="margin-bottom:0;font-size:12px">Uses your device’s available English voice. Scroll, then press Play to read another section.</p>
    </div><button class="listen-toggle" type="button" aria-controls="care-listen-panel" aria-expanded="false" aria-label="Listen to the section in view">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></svg><span>Listen</span></button>`;
  document.body.appendChild(root);
  const panel = root.querySelector('.listen-panel');
  const toggle = root.querySelector('.listen-toggle');
  const play = root.querySelector('#care-listen-play');
  const stopButton = root.querySelector('#care-listen-stop');
  const status = root.querySelector('#care-listen-status');
  const rate = root.querySelector('select');
  const synth = window.speechSynthesis;
  let state = 'idle', generation = 0, chunks = [], index = 0, offset = 0, active = null, utterance = null;
  const charts = {
    'connecting-the-dots-problem.svg': 'The problem. The blue NHS pathway is straight and continuous: specialists work together, monitor continuously, hand over safely and intervene early. Below it, green dots fluctuate across the full time period. They represent fragmented care and support, with separate agencies, repeated information, missed handovers and preventable crises. Without change, this fragmentation continues.',
    'connecting-the-dots-hypothesis.svg': 'The hypothesis. Before the central fuchsia intervention, separate sage green dots fluctuate without a dependable direction. Connecting the dots means co-produced, coordinated support. After the intervention, the dots become a continuous mint pathway, rising through the blue economic break-even line. The pilot will test progress towards employment, training or education, where wanted and appropriate. This is an illustrative hypothesis, not measured results.',
    'connecting-the-dots-chart.svg': 'The opportunity. The same fragmented dots become a connected mint pathway after the fuchsia intervention. Where it crosses the blue economic break-even line, a fuchsia shaded area opens above that line. This represents potential public value: better outcomes, lower crisis costs, less fraud and error, and higher earnings and tax. The pilot must test whether these gains exceed the full cost of coordination.',
    'connecting-the-dots-state-benefits.svg': 'The state benefits. Better lives could also mean lower public costs and higher public revenues. This enlarged view shows the mint pathway crossing blue economic break-even and opening a fuchsia area of potential public value. Earlier support could prevent costly crises. Clearer shared records could reduce fraud and error. Employment could increase earnings and tax revenues. These are hypotheses. The pilot must test outcomes, full delivery costs and net public value.',
    'care-system-map.svg': 'The connected care system. The National Health Service and the proposed National Care Service connect at the centre. Health, social care, housing, benefits, employment and community services share responsibility around the carer and caree. Connections represent information, handovers and accountability. The family should not have to manage the system. The central link opens the National Care Service app concept.'
  };
  function visibleTarget() {
    const candidates = [...document.querySelectorAll('.trajectory-step, .sheet, main section, .hero, #full-proposal > .proposal-heading')]
      .filter(el => el.id !== 'pages' && !el.querySelector('.trajectory-step') && !el.closest('[hidden]'));
    const header = document.querySelector('header');
    const top = header ? Math.min(header.getBoundingClientRect().bottom, innerHeight * .48) : 0;
    const aim = top + (innerHeight - top) * .32;
    return candidates.map(el => {
      const r = el.getBoundingClientRect();
      const overlap = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, top));
      return {el, score: overlap > 0 ? Math.abs(Math.max(r.top, Math.min(aim, r.bottom)) - aim) - overlap / innerHeight : Infinity};
    }).filter(x => Number.isFinite(x.score)).sort((a,b) => a.score-b.score)[0]?.el || document.querySelector('main') || document.body;
  }
  function title(el) { return el.getAttribute('aria-label') || el.querySelector('h1,h2,h3,figcaption strong')?.textContent.trim() || 'This section'; }
  function getText(el) {
    if (el.matches('.sheet')) return el.dataset.listenText || '';
    const copy = el.cloneNode(true);
    copy.querySelectorAll('script,style,button,nav,form,input,textarea,select,dialog,[hidden],[aria-hidden="true"],.chart-actions,.chart-expand span,#care-listen').forEach(n => n.remove());
    copy.querySelectorAll('img,object,svg').forEach(n => {
      const src = n.getAttribute('src') || n.getAttribute('data') || '';
      const known = Object.keys(charts).find(key => src.split('?')[0].endsWith(key));
      const words = known ? charts[known] : n.getAttribute('alt') || n.getAttribute('aria-label') || n.querySelector('title')?.textContent || '';
      n.replaceWith(document.createTextNode(' ' + words + ' '));
    });
    copy.querySelectorAll('p,h1,h2,h3,h4,li,figcaption,blockquote,br').forEach(n => n.appendChild(document.createTextNode('\n')));
    return copy.textContent.replace(/[↗→]/g,' ').replace(/\s+/g,' ').trim();
  }
  function stop(message = 'Stopped. Press Play to read the section in view.') {
    generation++; if (synth) synth.cancel();
    state = 'idle'; utterance = null; play.textContent = 'Play'; status.textContent = message;
  }
  function speak() {
    const token = generation;
    if(index >= chunks.length) { stop('Finished. Scroll to another section and press Play.'); return; }
    utterance = new SpeechSynthesisUtterance(chunks[index].slice(offset));
    const baseOffset = offset;
    utterance.lang = 'en-GB'; utterance.rate = Number(rate.value);
    const voices = synth.getVoices();
    const voice = voices.find(v => v.lang.replace('_','-') === 'en-GB') || voices.find(v => /^en[-_]/i.test(v.lang));
    if(voice) utterance.voice = voice;
    utterance.onboundary = e => { if(token === generation && typeof e.charIndex === 'number') offset = baseOffset + e.charIndex; };
    utterance.onend = () => { if(token !== generation || state !== 'reading') return; index++; offset=0; speak(); };
    utterance.onerror = e => { if(token === generation && !['interrupted','canceled'].includes(e.error)) stop('Audio could not start. Try Play again, or open this page in Safari.'); };
    synth.speak(utterance);
  }
  function start() {
    if(!synth || !window.SpeechSynthesisUtterance) { status.textContent = 'Spoken audio is unavailable in this browser. Try opening this page in Safari or Chrome.'; play.disabled = true; return; }
    if(state === 'reading') {
      generation++; synth.cancel(); state='paused'; utterance=null; play.textContent='Resume'; status.textContent='Paused: ' + title(active); return;
    }
    const target = visibleTarget();
    if(state !== 'paused' || target !== active) {
      const text = getText(target);
      if(!text && target.matches('.sheet')) {
        stop('Preparing this proposal page. Press Play again when ready.');
        if(window.careReadPdfPage) window.careReadPdfPage(Number(target.dataset.page)).then(text => {
          if(text) {target.dataset.listenText=text; status.textContent='Page ready. Press Play to listen.';}
          else status.textContent='This page contains artwork without readable text.';
        }).catch(() => {status.textContent='This page could not be read. Try another section.';});
        return;
      }
      if(!text) {stop('There is no readable text in this section. Scroll to another section.'); return;}
      generation++; synth.cancel(); active=target; index=0; offset=0;
      chunks = text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [text];
      chunks = chunks.flatMap(s => s.length > 260 ? s.match(/.{1,220}(?:\s|$)|\S+/g) || [s] : [s]);
    }
    state='reading'; play.textContent='Pause'; status.textContent='Reading: ' + title(active); speak();
  }
  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden; toggle.setAttribute('aria-expanded', String(!panel.hidden));
    if(panel.hidden) stop(); else start();
  });
  play.addEventListener('click',start);
  stopButton.addEventListener('click',() => stop());
  rate.addEventListener('change',() => {
    if(state === 'reading') {generation++; synth.cancel(); speak();}
  });
  document.addEventListener('keydown',e => {if(e.key==='Escape'&&!panel.hidden){stop();panel.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus();}});
  window.addEventListener('pagehide',() => stop());
})();

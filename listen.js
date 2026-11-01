/* English, visitor-initiated narration. No microphone or recording service. */
(() => {
  'use strict';
  if (document.getElementById('care-listen')) return;
  const style = document.createElement('style');
  style.textContent = `
    #care-listen{position:fixed;right:16px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:40}
    #care-listen button{display:grid;place-items:center;width:52px;height:52px;border:0;border-radius:50%;background:#e437a4;color:white;box-shadow:0 3px 16px #182d4926;cursor:pointer}
    #care-listen button:focus-visible{outline:3px solid #182d49;outline-offset:4px}
    #care-listen button[aria-pressed="true"]{background:#182d49}
    #care-listen .listen-status{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
    @media print{#care-listen{display:none}}
  `;
  document.head.appendChild(style);
  const root = document.createElement('aside');
  root.id = 'care-listen'; root.setAttribute('aria-label', 'Listen to this page');
  root.innerHTML = `<p class="listen-status" id="care-listen-status" role="status" aria-live="polite"></p><button id="care-listen-play" type="button" aria-label="Listen to the section in view" aria-pressed="false"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></svg></button>`;
  document.body.appendChild(root);
  const play = root.querySelector('#care-listen-play');
  const status = root.querySelector('#care-listen-status');
  const synth = window.speechSynthesis;
  // Start loading the device's voice list before the first tap.
  if (synth) synth.getVoices();
  function isBritishVoice(v) {
    return /^en[-_]GB(?:[-_]|$)/i.test(v.lang || '');
  }
  function englishVoice() {
    const score = v => {
      const n = v.name || '';
      // Voice metadata has no gender field. Prefer recognised female voice
      // names when offered, then fall back to the best ordinary English voice.
      return (isBritishVoice(v) ? 500 : 0)
        + (/premium|enhanced|natural|neural|online/i.test(n) ? 800 : 0)
        + (/Serena|Kate|Martha|Stephanie|Sonia|Libby|Hazel|Susan|Google UK English Female|\bfemale\b/i.test(n) ? 650 : 0)
        - (/compact|eloquence|espeak|whisper|trinoids|zarvox|bad news|good news|bells|boing|bubbles|cellos|jester|organ|superstar|wobble/i.test(n) ? 1200 : 0);
    };
    return synth.getVoices().filter(v=>isBritishVoice(v)).sort((a,b)=>score(b)-score(a))[0];
  }
  function announce(message) {
    status.textContent = message;
    status.className = 'listen-status';
  }
  function waitForBritishVoice(timeout = 1500) {
    const ready = englishVoice();
    if (ready) return Promise.resolve(ready);
    return new Promise(resolve => {
      let timer;
      const finish = voice => {
        clearTimeout(timer);
        synth.removeEventListener('voiceschanged', changed);
        resolve(voice);
      };
      const changed = () => { const voice = englishVoice(); if (voice) finish(voice); };
      synth.addEventListener('voiceschanged', changed);
      timer = setTimeout(() => finish(englishVoice()), timeout);
      changed();
    });
  }
  function unavailableVoice() {
    stop();
    announce('British audio isn’t available here. Try opening this page in Safari.', true);
  }
  let state = 'idle', generation = 0, chunks = [], index = 0, offset = 0, active = null, utterance = null, readingVoice = null;
  const charts = {
    'connecting-the-dots-problem.svg': 'The problem. The blue NHS pathway is straight and continuous: specialists work together, monitor continuously, hand over safely and intervene early. Below it, green dots fluctuate across the full time period. They represent fragmented care and support, with separate agencies, repeated information, missed handovers and preventable crises. Without change, this fragmentation continues.',
    'connecting-the-dots-hypothesis.svg': 'The hypothesis. Before the central fuchsia intervention, separate sage green dots fluctuate without a dependable direction. Connecting the dots means co-produced, coordinated support. After the intervention, the dots become a continuous mint pathway, rising through the blue economic break-even line. The pilot will test progress towards employment, training or education, where wanted and appropriate. This is an illustrative hypothesis, not measured results.',
    'connecting-the-dots-chart.svg': 'The opportunity. The same fragmented dots become a connected mint pathway after the fuchsia intervention. Where it crosses the blue economic break-even line, a fuchsia shaded area opens above that line. This represents potential public value: better outcomes, lower crisis costs, less fraud and error, and higher earnings and tax. The pilot must test whether these gains exceed the full cost of coordination.',
    'connecting-the-dots-state-benefits.svg': 'How the state benefits. Better outcomes for people, lower public costs over time, and higher tax revenues when people enter paid work. This enlarged view shows the mint pathway crossing blue economic break-even and opening a fuchsia area of potential public value. Earlier support could reduce crisis costs over time. Clearer shared records could reduce fraud and error. Employment could increase earnings and tax revenues. These are hypotheses. The pilot must test outcomes, full delivery costs and net public value.',
    'care-system-map.svg': 'The connected care system. The National Health Service and the proposed National Care Service connect at the centre. Health, social care, housing, benefits, employment and community services share responsibility around the carer and caree. Connections represent information, handovers and accountability. The family should not have to manage the system. The central link opens the National Care Service app concept.'
  };
  function visibleTarget() {
    const candidates = [...document.querySelectorAll('.trajectory-step, .sheet, main section, .hero, #full-proposal > .proposal-heading')]
      .filter(el => el.id !== 'pages' && !el.querySelector('.trajectory-step') && !el.closest('[hidden]'));
    const header = document.querySelector('header');
    const top = header ? Math.max(0, Math.min(header.getBoundingClientRect().bottom, innerHeight * .65)) : 0;
    const aim = top + (innerHeight - top) * .32;
    return candidates.map(el => {
      const r = el.getBoundingClientRect();
      const overlap = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, top));
      return {el, score: overlap > 0 ? Math.abs(Math.max(r.top, Math.min(aim, r.bottom)) - aim) - overlap / innerHeight : Infinity};
    }).filter(x => Number.isFinite(x.score)).sort((a,b) => a.score-b.score)[0]?.el || null;
  }
  function title(el) { return el.getAttribute('aria-label') || el.querySelector('h1,h2,h3,figcaption strong')?.textContent.trim() || 'This section'; }
  function getText(el) {
    if (el.matches('.sheet')) return el.dataset.listenText || '';
    const opening = Boolean(el.querySelector('.service-dots'));
    const copy = el.cloneNode(true);
    copy.querySelectorAll('.service-dots').forEach(n => n.remove());
    copy.querySelectorAll('script,style,button,nav,form,input,textarea,select,dialog,[hidden],[aria-hidden="true"],.chart-actions,.chart-expand span,.sheet-label,.placeholder,.reader-meta,.status,#counter,#care-listen').forEach(n => n.remove());
    copy.querySelectorAll('img,object,svg').forEach(n => {
      const src = n.getAttribute('src') || n.getAttribute('data') || '';
      const known = Object.keys(charts).find(key => src.split('?')[0].endsWith(key));
      const words = known ? charts[known] : n.getAttribute('alt') || n.getAttribute('aria-label') || n.querySelector('title')?.textContent || '';
      n.replaceWith(document.createTextNode(' ' + words + ' '));
    });
    copy.querySelectorAll('p,h1,h2,h3,h4,li,figcaption,blockquote,br').forEach(n => n.appendChild(document.createTextNode('\n')));
    return (opening ? 'Connecting the Dots. The Care Collective. ' : '') + copy.textContent.replace(/[↗→]/g,' ').replace(/\s+/g,' ').trim();
  }
  function stop(message = 'Stopped. Tap the speaker to read the section in view.') {
    generation++; if (synth) synth.cancel();
    state = 'idle'; utterance = null; play.setAttribute('aria-pressed','false'); play.setAttribute('aria-label','Listen to the section in view'); announce(message);
  }
  function speak() {
    const token = generation;
    if(index >= chunks.length) { stop('Finished. Scroll to another section and tap the speaker.'); return; }
    utterance = new SpeechSynthesisUtterance(chunks[index].slice(offset));
    const baseOffset = offset;
    utterance.lang = 'en-GB'; utterance.rate = 0.93;
    const voice = readingVoice;
    if(!voice) {unavailableVoice();return;}
    utterance.voice = voice; utterance.lang = 'en-GB';
    utterance.onboundary = e => { if(token === generation && typeof e.charIndex === 'number') offset = baseOffset + e.charIndex; };
    utterance.onend = () => { if(token !== generation || state !== 'reading') return; index++; offset=0; speak(); };
    utterance.onerror = e => { if(token === generation && !['interrupted','canceled'].includes(e.error)) { stop(); announce('Audio could not start. Tap the speaker again, or try Safari.', true); } };
    synth.speak(utterance);
  }
  async function start() {
    if(!synth || !window.SpeechSynthesisUtterance) { announce('Spoken audio is unavailable in this browser. Try Safari or Chrome.', true); return; }
    if(state === 'reading' || state === 'loading') { stop(); return; }
    const target = visibleTarget();
    if(!target) {stop('Scroll to the content you want to hear, then tap the speaker.');return;}
    {
      const text = getText(target).replace(/\bPage\s+\d+\s+of\s+\d+\b/gi, '').trim();
      if(text.length < 40 && target.matches('.sheet')) {
        stop('Preparing this proposal page. Tap the speaker again when ready.');
        if(window.careReadPdfPage) window.careReadPdfPage(Number(target.dataset.page)).then(text => {
          if(text) {target.dataset.listenText=text; status.textContent='Page ready. Tap the speaker to listen.';}
          else status.textContent='This page contains artwork without readable text.';
        }).catch(() => {status.textContent='This page could not be read. Try another section.';});
        return;
      }
      if(!text) {stop('There is no readable text in this section. Scroll to another section.'); return;}
      generation++; synth.cancel(); active=target; index=0; offset=0;
      chunks = text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [text];
      chunks = chunks.flatMap(s => s.length > 260 ? s.match(/.{1,220}(?:\s|$)|\S+/g) || [s] : [s]);
      // Keep short sentences together so the voice retains natural phrasing.
      chunks = chunks.reduce((groups, sentence) => {
        const last = groups.length - 1;
        if(last >= 0 && groups[last].length + sentence.length < 420) groups[last] += sentence;
        else groups.push(sentence);
        return groups;
      }, []);
    }
    readingVoice = englishVoice();
    if(!readingVoice) {
      const token = generation;
      state = 'loading';
      play.setAttribute('aria-pressed', 'true');
      play.setAttribute('aria-label', 'Cancel audio preparation');
      announce('Checking British voices…');
      const voice = await waitForBritishVoice();
      if (token !== generation || state !== 'loading') return;
      if (!voice) { unavailableVoice(); return; }
      // A fresh tap preserves iPhone's requirement for user-initiated audio.
      stop();
      announce('British voice ready. Tap the speaker to listen.', true);
      return;
    }
    state='reading'; play.setAttribute('aria-pressed','true'); play.setAttribute('aria-label','Stop reading'); announce('Reading: ' + title(active)); speak();
  }
  play.addEventListener('click',start);
  document.addEventListener('keydown', e => {if(e.key === 'Escape') stop();});
  let scrollTimer;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      if(state === 'reading' && active && visibleTarget() !== active) stop('Section changed. Tap the speaker to read what is now in view.');
    }, 250);
  }, {passive:true});
  window.addEventListener('pagehide',() => stop());
})();

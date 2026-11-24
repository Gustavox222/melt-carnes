/* Melt Empório da Carne · interface e animações
   GSAP + ScrollTrigger + SplitText: entrada do hero, biografia que acende,
   capítulos da ciência em rolagem horizontal, contadores, revelação das fotos.
   Motion: molas nos botões, botões magnéticos, menu, leitura do termômetro, total da calculadora. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = doc.classList.contains('reduce');
  var M = window.Motion || null;
  var G = window.gsap || null;
  var ST = window.ScrollTrigger || null;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var spring = function (k, d) { return { type: 'spring', stiffness: k, damping: d }; };
  var fmt = function (n, d) { return n.toLocaleString('pt-BR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };

  if (G) {
    if (ST) G.registerPlugin(ST);
    if (window.SplitText) G.registerPlugin(window.SplitText);
  }

  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ------------------------------------------------------------ nav e menu */
  var nav = $('[data-nav]');
  var lastY = window.scrollY;
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 20);
    var menuOpen = doc.classList.contains('menu-open');
    nav.classList.toggle('is-hidden', !menuOpen && y > window.innerHeight * 0.9 && y > lastY + 2);
    if (y < lastY - 2 || y < window.innerHeight * 0.9) nav.classList.remove('is-hidden');
    lastY = y;
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  nav.addEventListener('focusin', function () { nav.classList.remove('is-hidden'); });

  var toggle = $('[data-menu-toggle]');
  var menu = $('[data-menu]');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.sr').textContent = open ? 'Fechar menu' : 'Abrir menu';
    doc.classList.toggle('menu-open', open);
    menu.hidden = !open;
    if (open) nav.classList.remove('is-hidden');
    if (open && M && !reduce) {
      M.animate(menu, { opacity: [0, 1] }, { duration: 0.25 });
      M.animate($$('nav a', menu), { opacity: [0, 1], x: [-28, 0] }, { delay: M.stagger(0.045), duration: 0.5, ease: [0.22, 0.8, 0.24, 1] });
    }
  }
  toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 1180 && !menu.hidden) setMenu(false); });

  if ('IntersectionObserver' in window) {
    var links = $$('.nav__links a');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('is-here', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['inicio', 'emporio', 'cortes', 'ciencia', 'churrasco', 'feed', 'avaliacoes', 'visite', 'redes'].forEach(function (id) {
      var s = document.getElementById(id); if (s) io.observe(s);
    });
  }

  /* ------------------------------------------------------------ vídeo do hero */
  var video = $('[data-hero-video]');
  var vToggle = $('[data-video-toggle]');
  var userPaused = reduce;
  function setVideoBtn(playing) {
    vToggle.setAttribute('aria-pressed', String(!playing));
    vToggle.querySelector('use').setAttribute('href', playing ? '#i-pause' : '#i-play');
    vToggle.querySelector('.sr').textContent = playing ? 'Pausar o vídeo' : 'Reproduzir o vídeo';
  }
  if (video) {
    var small = window.matchMedia('(max-width: 700px)').matches || (navigator.connection && navigator.connection.saveData);
    video.src = small ? video.getAttribute('data-src-sm') : video.getAttribute('data-src-lg');
    video.muted = true;
    if (reduce) { video.removeAttribute('autoplay'); video.pause(); setVideoBtn(false); }
    else {
      var p = video.play(); if (p && p.catch) p.catch(function () { setVideoBtn(false); });
    }
    video.addEventListener('play', function () { setVideoBtn(true); });
    video.addEventListener('pause', function () { setVideoBtn(false); });
    vToggle.addEventListener('click', function () {
      if (video.paused) { userPaused = false; video.play(); } else { userPaused = true; video.pause(); }
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        if (userPaused) return;
        if (en[0].isIntersecting) { var pp = video.play(); if (pp && pp.catch) pp.catch(function () {}); } else video.pause();
      }, { threshold: 0.05 }).observe(video);
    }
  }

  /* ------------------------------------------------------------ brasas subindo no hero */
  var cv = $('[data-embers]');
  if (cv && !reduce && cv.getContext) {
    var ctx = cv.getContext('2d');
    var parts = [], W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), running = true, raf = 0;
    var count = window.innerWidth < 700 ? 26 : 54;
    function size() { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function spawn(p, init) {
      p.x = W * (0.35 + Math.random() * 0.65); p.y = init ? Math.random() * H : H + 10;
      p.r = 0.6 + Math.random() * 2.2; p.vy = 0.35 + Math.random() * 1.1; p.vx = (Math.random() - 0.5) * 0.4;
      p.life = 0; p.max = 220 + Math.random() * 320; p.ph = Math.random() * 6.28; return p;
    }
    size(); for (var i = 0; i < count; i++) parts.push(spawn({}, true));
    window.addEventListener('resize', size);
    function tick() {
      ctx.clearRect(0, 0, W, H);
      for (var k = 0; k < parts.length; k++) {
        var p = parts[k]; p.life++; p.ph += 0.03;
        p.x += p.vx + Math.sin(p.ph) * 0.35; p.y -= p.vy;
        var a = Math.sin(Math.PI * Math.min(1, p.life / p.max));
        if (p.y < -10 || p.life > p.max) spawn(p, false);
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, 'rgba(255,200,120,' + (0.95 * a) + ')');
        g.addColorStop(0.35, 'rgba(255,110,40,' + (0.55 * a) + ')');
        g.addColorStop(1, 'rgba(208,32,46,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.283); ctx.fill();
      }
      if (running) raf = requestAnimationFrame(tick);
    }
    tick();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        var vis = en[0].isIntersecting;
        if (vis && !running) { running = true; tick(); } else if (!vis) { running = false; cancelAnimationFrame(raf); }
      }).observe(cv);
    }
  }

  /* ------------------------------------------------------------ entrada do hero */
  function heroEnter() {
    doc.classList.add('ready');
    if (!G || reduce) return;
    var title = $('[data-hero-title]');
    var tl = G.timeline({ defaults: { ease: 'power4.out' } });
    tl.fromTo('[data-hero-media]', { scale: 1.14, filter: 'brightness(.25)' }, { scale: 1, filter: 'brightness(1)', duration: 2.2, ease: 'power2.out' }, 0);
    if (window.SplitText) {
      var split = new window.SplitText(title, { type: 'lines,words', mask: 'lines', linesClass: 'ln' });
      tl.set(title, { opacity: 1 }, 0.2)
        .from(split.words, { yPercent: 115, rotate: 4, duration: 1.1, stagger: 0.05, onComplete: function () { split.revert(); } }, 0.25);
    } else {
      tl.fromTo(title, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1 }, 0.25);
    }
    tl.fromTo('[data-hero-eyebrow]', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8 }, 0.15)
      .fromTo('[data-hero-lead]', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9 }, 0.75)
      .fromTo('[data-hero-actions] > *', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 }, 0.9)
      .fromTo('[data-hero-facts] li', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 }, 1.05)
      .fromTo('[data-hero-facts]', { '--bw': 0 }, { '--bw': 1, duration: 1 }, 1.05);
    if (ST) {
      G.to('[data-hero-media]', { scale: 1.08, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }
  }
  if (document.fonts && document.fonts.ready) {
    var done = false;
    document.fonts.ready.then(function () { if (!done) { done = true; heroEnter(); } });
    setTimeout(function () { if (!done) { done = true; heroEnter(); } }, 1200);
  } else heroEnter();

  /* ------------------------------------------------------------ biografia que acende (momento 1) */
  var bio = $('[data-highlight]');
  if (bio && G && ST && !reduce) {
    var words = bio.textContent.trim().split(/\s+/);
    bio.innerHTML = words.map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
    var spans = $$('.w', bio);
    ST.create({
      trigger: bio, start: 'top 78%', end: 'bottom 45%', scrub: true,
      onUpdate: function (self) {
        var n = Math.round(self.progress * spans.length);
        for (var i = 0; i < spans.length; i++) spans[i].classList.toggle('is-on', i < n);
      }
    });
  }

  /* ------------------------------------------------------------ contadores */
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-count'));
    var d = parseInt(el.getAttribute('data-decimals') || '0', 10);
    if (reduce || !G) { el.textContent = fmt(to, d); return; }
    var o = { v: 0 };
    G.to(o, { v: to, duration: 1.6, ease: 'power3.out', onUpdate: function () { el.textContent = fmt(o.v, d); } });
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(function (el) { cio.observe(el); });
  }

  /* ------------------------------------------------------------ revelação das fotos */
  if (G && ST && !reduce) {
    $$('[data-reveal]').forEach(function (el, i) {
      var img = $('img', el);
      G.fromTo(el, { clipPath: 'inset(100% 0% 0% 0% round 14px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 1.2, ease: 'power3.inOut',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
      if (img) G.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 1.6, ease: 'power3.out', clearProps: 'transform', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
  }

  /* ------------------------------------------------------------ capítulos da ciência (momento 2) */
  var chapSec = $('[data-chapters]');
  var chapTrack = $('[data-chapter-track]');
  if (chapSec && chapTrack && G && ST && !reduce) {
    var mm = G.matchMedia();
    mm.add('(min-width: 1024px) and (min-height: 620px)', function () {
      // distância até o último capítulo encostar na margem direita (a mesma margem do primeiro à esquerda)
      var dist = function () {
        var last = chapTrack.lastElementChild;
        var pad = parseFloat(getComputedStyle(chapTrack).paddingLeft) || 0;
        return Math.max(0, last.offsetLeft + last.offsetWidth + pad - window.innerWidth);
      };
      var tween = G.to(chapTrack, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: {
          trigger: chapSec, start: 'top top', end: function () { return '+=' + dist(); },
          pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
          snap: { snapTo: 1 / ($$('.chap', chapTrack).length - 1), duration: { min: 0.2, max: 0.6 }, ease: 'power1.inOut' }
        }
      });
      $$('.chap', chapTrack).forEach(function (ch) {
        var media = $('.chap__media > img, .chap__media > video', ch);
        if (media) G.fromTo(media, { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: ch, containerAnimation: tween, start: 'left right', end: 'center center', scrub: true } });
        var n = $('.chap__n', ch);
        if (n) G.fromTo(n, { xPercent: 40 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: ch, containerAnimation: tween, start: 'left 85%', end: 'left 40%', scrub: true } });
      });
      return function () { G.set(chapTrack, { clearProps: 'transform' }); };
    });
  }
  // vídeos dos capítulos: carregam e tocam só quando aparecem
  if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) {
          if (!v.src) { v.src = v.getAttribute('data-src'); }
          if (!reduce) { var pp = v.play(); if (pp && pp.catch) pp.catch(function () {}); }
        } else if (!v.paused) v.pause();
      });
    }, { threshold: 0.25 });
    $$('[data-lazy-video]').forEach(function (v) { vio.observe(v); });
  }

  /* ------------------------------------------------------------ termômetro do ponto */
  var ponto = $('[data-ponto]');
  if (ponto) {
    var P = [
      { t: '50–52 °C', n: 'Mal passada', c: '#b3263a' },
      { t: '55–57 °C', n: 'Ao ponto para mal', c: '#c94a4f' },
      { t: '60–63 °C', n: 'Ao ponto', c: '#c9746a' },
      { t: '65–68 °C', n: 'Ao ponto para bem', c: '#ad8a78' },
      { t: '70 °C ou mais', n: 'Bem passada', c: '#83695b' }
    ];
    var range = $('[data-ponto-range]'), core = $('.ponto__slice', ponto), tEl = $('[data-ponto-temp]', ponto), nEl = $('[data-ponto-name]', ponto);
    var setP = function (animate) {
      var s = P[parseInt(range.value, 10)];
      core.style.setProperty('--core', s.c);
      tEl.textContent = s.t; nEl.textContent = s.n;
      range.setAttribute('aria-valuetext', s.t + ', ' + s.n.toLowerCase());
      if (animate && M && !reduce) M.animate(tEl, { scale: [0.85, 1], opacity: [0.4, 1] }, spring(420, 22));
    };
    range.addEventListener('input', function () { setP(true); });
    setP(false);
  }

  /* ------------------------------------------------------------ calculadora de churrasco */
  var calc = $('[data-calc]');
  if (calc) {
    var st = { adultos: 10, criancas: 2, estilo: 'classico' };
    var perfis = {
      classico: { g: 400, nome: 'clássico', cortes: [['Picanha', 0.30], ['Fraldinha', 0.20], ['Linguiça', 0.20], ['Coxinha da asa', 0.15], ['Cupim', 0.15]] },
      premium: { g: 450, nome: 'premium', cortes: [['Picanha', 0.25], ['Ancho (bife de chorizo)', 0.25], ['Fraldinha', 0.15], ['Carré de cordeiro', 0.10], ['Linguiça artesanal', 0.15], ['Queijo coalho', 0.10]] },
      leve: { g: 350, nome: 'mais leve', cortes: [['Maminha', 0.30], ['Filé de frango', 0.25], ['Linguiça de frango', 0.20], ['Fraldinha', 0.25]] }
    };
    var totalEl = $('[data-total]', calc), listEl = $('[data-list]', calc), extraEl = $('[data-extra]', calc), send = $('[data-calc-send]', calc);
    var shown = 0;
    var kg = function (g) { return g >= 1000 ? fmt(g / 1000, 1) + ' kg' : fmt(Math.round(g / 50) * 50) + ' g'; };
    function render(first) {
      var pf = perfis[st.estilo];
      var gramas = st.adultos * pf.g + st.criancas * (pf.g / 2);
      var total = Math.round(gramas / 100) / 10;
      listEl.innerHTML = pf.cortes.map(function (c) { return '<li><span>' + c[0] + '</span><b>' + kg(gramas * c[1]) + '</b></li>'; }).join('');
      var carvao = Math.max(3, Math.ceil(total));
      extraEl.textContent = 'Carvão: cerca de ' + carvao + ' kg. Sal grosso: 1 pacote.';
      if (G && !reduce && !first) {
        var o = { v: shown };
        G.to(o, { v: total, duration: 0.6, ease: 'power3.out', onUpdate: function () { totalEl.textContent = fmt(o.v, 1); } });
        if (M) M.animate(listEl.children, { opacity: [0, 1], x: [-10, 0] }, { delay: M.stagger(0.04), duration: 0.35 });
      } else totalEl.textContent = fmt(total, 1);
      shown = total;
      var msg = 'Olá, Melt! Montei meu churrasco pelo site:\n' +
        '• ' + st.adultos + ' adulto(s) e ' + st.criancas + ' criança(s), estilo ' + pf.nome + '\n' +
        '• Total: ' + fmt(total, 1) + ' kg de carne\n' +
        pf.cortes.map(function (c) { return '  - ' + c[0] + ': ' + kg(gramas * c[1]); }).join('\n') +
        '\n• Carvão: ~' + carvao + ' kg\nPodem confirmar disponibilidade e valores?';
      send.href = 'https://wa.me/5512982882176?text=' + encodeURIComponent(msg);
    }
    $$('[data-step]', calc).forEach(function (b) {
      b.addEventListener('click', function () {
        var p = b.getAttribute('data-step').split(':');
        var min = p[0] === 'adultos' ? 1 : 0;
        st[p[0]] = Math.max(min, Math.min(200, st[p[0]] + parseInt(p[1], 10)));
        var out = $('[data-val="' + p[0] + '"]', calc);
        out.textContent = st[p[0]];
        if (M && !reduce) M.animate(out, { y: [parseInt(p[1], 10) > 0 ? 10 : -10, 0], opacity: [0.3, 1] }, spring(500, 26));
        render(false);
      });
    });
    $$('input[name="estilo"]', calc).forEach(function (r) { r.addEventListener('change', function () { st.estilo = r.value; render(false); }); });
    calc.addEventListener('submit', function (e) { e.preventDefault(); });
    render(true);
    if (G && !reduce) G.to(calc, { '--beam': '360deg', duration: 3.6, ease: 'none', repeat: -1 });
  }

  /* ------------------------------------------------------------ horário: aberto agora */
  var statusEl = $('[data-status]');
  if (statusEl) {
    var HRS = { 0: [510, 810], 1: [510, 1140], 2: [510, 1140], 3: [510, 1140], 4: [510, 1140], 5: [510, 1140], 6: [510, 1140] };
    var hm = function (m) { return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
    var dias = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    function nowSP() {
      try {
        var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
        var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
        var wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday);
        return { d: wd, m: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
      } catch (e) { var n = new Date(); return { d: n.getDay(), m: n.getHours() * 60 + n.getMinutes() }; }
    }
    function upd() {
      var n = nowSP(), h = HRS[n.d], txt = $('[data-status-text]', statusEl);
      $$('[data-hours] tr').forEach(function (tr) { tr.classList.toggle('is-today', parseInt(tr.getAttribute('data-day'), 10) === n.d); });
      statusEl.classList.remove('is-open', 'is-closed');
      if (n.m >= h[0] && n.m < h[1]) {
        statusEl.classList.add('is-open'); txt.textContent = 'Aberto agora · fecha às ' + hm(h[1]);
      } else {
        statusEl.classList.add('is-closed');
        if (n.m < h[0]) txt.textContent = 'Fechado agora · abre hoje às ' + hm(h[0]);
        else { var nd = (n.d + 1) % 7; txt.textContent = 'Fechado agora · abre ' + (nd === (n.d + 1) % 7 ? 'amanhã' : dias[nd]) + ' às ' + hm(HRS[nd][0]); }
      }
    }
    upd(); setInterval(upd, 60000);
  }

  /* ------------------------------------------------------------ luz que segue o cursor nos cards */
  if (fine) {
    $$('[data-spot]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ------------------------------------------------------------ botões magnéticos (Motion) */
  if (M && fine && !reduce) {
    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.22, dy = (e.clientY - (r.top + r.height / 2)) * 0.3;
        M.animate(el, { x: dx, y: dy - 2 }, spring(260, 18));
      });
      el.addEventListener('pointerleave', function () { M.animate(el, { x: 0, y: 0 }, spring(320, 16)); });
    });
    if (M.press) {
      M.press('.btn, .stepper__btn, .tile, .socials a', function (el) {
        M.animate(el, { scale: 0.97 }, spring(600, 30));
        return function () { M.animate(el, { scale: 1 }, spring(500, 16)); };
      });
    }
  }

  /* ------------------------------------------------------------ título final */
  var closeT = $('[data-close-title]');
  if (closeT && G && ST && window.SplitText && !reduce) {
    var cs = new window.SplitText(closeT, { type: 'lines,words', mask: 'lines' });
    G.from(cs.words, { yPercent: 110, duration: 1, ease: 'power4.out', stagger: 0.04, onComplete: function () { cs.revert(); }, scrollTrigger: { trigger: closeT, start: 'top 80%', once: true } });
  }

  window.addEventListener('load', function () { if (ST) ST.refresh(); });
})();

/* ============================================================
   DOVA v2 — motion system
   Fresh animation layer: same brand tokens, different mechanics
   from the v1 build for the hero cycle and the "why DOVA" visual
   (see design-critique notes — those two were flagged as too
   close to a reference competitor site's implementation).
   ============================================================ */
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, Draggable);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 900px)').matches;

/* ---------- Lenis smooth scroll ---------- */
let lenis;
if (!reduceMotion) {
  lenis = new Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- helpers ---------- */
const qs = (s, ctx = document) => ctx.querySelector(s);
const qsa = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

/* ============================================================
   MARK MOTION — whole-image D-mark animation helpers (unchanged
   from v1: proven, not part of the similarity concern)
   ============================================================ */
function initMarkFloat(el, { amplitude = 7, duration = 2.6, wobble = 2.5 } = {}) {
  if (!el || reduceMotion) return;
  gsap.to(el, { y: -amplitude, duration, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  gsap.to(el, { rotation: wobble, duration: duration * 1.3, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: duration * .2 });
}

function initMarkHoverPop(link) {
  if (reduceMotion || isMobile) return;
  const mark = qs('img.mark', link) || qs('.mark', link);
  if (!mark) return;
  const tl = gsap.timeline({ paused: true, defaults: { duration: .45, ease: 'back.out(2.2)' } });
  tl.to(mark, { scale: 1.1, rotation: 6 });
  link.addEventListener('mouseenter', () => tl.play());
  link.addEventListener('mouseleave', () => tl.reverse());
}

function initMarkTilt(el, wrapEl) {
  if (!el || reduceMotion || isMobile) return;
  wrapEl.style.perspective = '600px';
  const rxTo = gsap.quickTo(el, 'rotationX', { duration: .6, ease: 'power3' });
  const ryTo = gsap.quickTo(el, 'rotationY', { duration: .6, ease: 'power3' });
  wrapEl.addEventListener('mousemove', (e) => {
    const r = wrapEl.getBoundingClientRect();
    const px = (e.clientX - r.left - r.width / 2) / (r.width / 2);
    const py = (e.clientY - r.top - r.height / 2) / (r.height / 2);
    ryTo(px * 16);
    rxTo(py * -16);
  });
  wrapEl.addEventListener('mouseleave', () => { rxTo(0); ryTo(0); });
}

function initMarkHovers() {
  qsa('.nav-logo').forEach(initMarkHoverPop);
}

/* ============================================================
   PRELOADER — mask reveal + progress bar, then the whole panel
   slides up and out (the same proven exit as v1 — a clip-path
   polygon wipe was tried here and dropped: tweening between
   mismatched-unit polygon points made GSAP silently fail to
   animate it, leaving a full-viewport black layer stuck on
   screen forever. Lesson: keep clip-path polygon keyframes in
   matching units on every coordinate, or avoid tweening them.)
   ============================================================ */
function runPreloader(onDone) {
  const pre = qs('#preloader');
  const mark = qs('#preloaderMark');
  const percentEl = qs('#preloaderPercent');
  const barFill = qs('#preloaderBarFill');
  const counter = { val: 0 };

  if (reduceMotion) {
    gsap.set(pre, { autoAlpha: 0, display: 'none' });
    onDone();
    return;
  }

  gsap.set(mark, { yPercent: 100 });

  const tl = gsap.timeline({
    onComplete: () => {
      gsap.to(pre, {
        yPercent: -100, duration: .9, ease: 'power4.inOut',
        onComplete: () => { pre.style.display = 'none'; onDone(); }
      });
    }
  });

  tl.to(mark, { yPercent: 0, duration: .8, ease: 'power4.out' }, 0)
    .to(counter, {
      val: 100, duration: 1.5, ease: 'power2.inOut',
      onUpdate: () => {
        const v = Math.round(counter.val);
        percentEl.textContent = v;
        barFill.style.width = v + '%';
      }
    }, 0)
    .to({}, { duration: .3 });
}

/* ============================================================
   CUSTOM CURSOR + SPOTLIGHT + MAGNETIC BUTTONS
   cursor now also carries a text label for elements tagged
   data-cursor-text, so interactive zones can hint at themselves
   ============================================================ */
function initCursor() {
  if (reduceMotion || isMobile) return;
  const cursor = qs('#cursor');
  const label = qs('#cursorLabel');
  const spotlight = qs('#spotlight');
  const xTo = gsap.quickTo(cursor, 'x', { duration: .5, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: .5, ease: 'power3' });
  const sxTo = gsap.quickTo(spotlight, 'x', { duration: 1, ease: 'power3' });
  const syTo = gsap.quickTo(spotlight, 'y', { duration: 1, ease: 'power3' });

  window.addEventListener('mousemove', (e) => {
    xTo(e.clientX); yTo(e.clientY);
    sxTo(e.clientX); syTo(e.clientY);
    spotlight.classList.add('visible');
  });
  window.addEventListener('mouseleave', () => spotlight.classList.remove('visible'));

  qsa('[data-hover]').forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
  });

  qsa('[data-cursor-text]').forEach((el) => {
    const text = el.getAttribute('data-cursor-text');
    el.addEventListener('mouseenter', () => { cursor.classList.add('labeled'); label.textContent = text; });
    el.addEventListener('mouseleave', () => { cursor.classList.remove('labeled'); label.textContent = ''; });
  });
}

function initMagnetic() {
  if (reduceMotion || isMobile) return;
  qsa('[data-magnetic]').forEach((btn) => {
    const xTo = gsap.quickTo(btn, 'x', { duration: .5, ease: 'power3' });
    const yTo = gsap.quickTo(btn, 'y', { duration: .5, ease: 'power3' });
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * .35);
      yTo((e.clientY - r.top - r.height / 2) * .35);
    });
    btn.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
  });
}

/* ============================================================
   NAV
   ============================================================ */
function initNav() {
  const nav = qs('#nav');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      nav.classList.toggle('scrolled', self.scroll() > 40);
      if (self.scroll() > 200) {
        if (self.direction === 1) gsap.to(nav, { yPercent: -100, duration: .4, ease: 'power2.inOut' });
        else gsap.to(nav, { yPercent: 0, duration: .4, ease: 'power2.inOut' });
      } else {
        gsap.to(nav, { yPercent: 0, duration: .3 });
      }
    }
  });

  const burger = qs('#navBurger');
  const menu = qs('#mobileMenu');
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    menu.classList.toggle('open');
  });
  qsa('a', menu).forEach((a) => a.addEventListener('click', () => {
    burger.classList.remove('open'); menu.classList.remove('open');
  }));
}

/* ============================================================
   SCROLL PROGRESS RAIL
   ============================================================ */
function initProgressRail() {
  const fill = qs('#progressFill');
  if (!fill) return;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => { fill.style.width = (self.progress * 100) + '%'; }
  });
}

/* ============================================================
   HERO
   ============================================================ */
function initHero() {
  const heroMark = qs('#heroMark');
  const heroMarkWrap = qs('.hero-mark-wrap');
  const heroMarkTilt = qs('#heroMarkTilt');
  const grid = qs('.hero-grid');
  const rings = qsa('.hero-mark-orbit-ring');

  if (reduceMotion) {
    gsap.set(['.hero-title .line', '.hero-sub', '.hero-actions', '.hero-tag', '.hero-mark-wrap'], { autoAlpha: 1, y: 0 });
    gsap.set(rings, { autoAlpha: 1, scale: 1 });
    initHeroMorph();
    return;
  }

  gsap.set('.hero-title .line-inner', { yPercent: 110 });
  gsap.set(['.hero-sub', '.hero-actions', '.hero-tag'], { autoAlpha: 0, y: 24 });
  gsap.set('.hero-mark-wrap', { autoAlpha: 0, scale: .8 });
  gsap.set(rings, { scale: .6, autoAlpha: 0 });

  window.__heroEnter = () => {
    const tl = gsap.timeline({
      defaults: { ease: 'power4.out' },
      onComplete: () => { gsap.set('.line-flow', { overflow: 'visible' }); initHeroMorph(); }
    });
    tl.to('.hero-mark-wrap', { autoAlpha: 1, scale: 1, duration: .9 })
      .to(rings, { scale: 1, autoAlpha: 1, duration: 1.1, stagger: .1 }, '-=.7')
      .to('.hero-tag', { autoAlpha: 1, y: 0, duration: .6 }, '-=.6')
      .to('.hero-title .line-inner', { yPercent: 0, duration: 1, stagger: .1 }, '-=.5')
      .to('.hero-sub', { autoAlpha: 1, y: 0, duration: .8 }, '-=.5')
      .to('.hero-actions', { autoAlpha: 1, y: 0, duration: .8 }, '-=.6');

    initMarkFloat(heroMark, { amplitude: 9, duration: 2.8, wobble: 3 });
    initMarkTilt(heroMarkTilt, heroMarkWrap);
    gsap.to(rings[0], { rotation: 360, duration: 60, repeat: -1, ease: 'none' });
    gsap.to(rings[1], { rotation: -360, duration: 90, repeat: -1, ease: 'none' });
  };

  gsap.fromTo('.hero-mark-wrap, .hero-title, .hero-sub, .hero-actions, .hero-tag',
    { autoAlpha: 1, y: 0 },
    {
      autoAlpha: 0, y: -40, ease: 'none', immediateRender: false,
      scrollTrigger: { trigger: '#hero', start: 'top top', end: '70% top', scrub: true }
    }
  );
  gsap.fromTo('.scroll-cue',
    { autoAlpha: 1 },
    {
      autoAlpha: 0, ease: 'none', immediateRender: false,
      scrollTrigger: { trigger: '#hero', start: 'top top', end: '15% top', scrub: true }
    }
  );
  if (grid) {
    gsap.fromTo(grid, { yPercent: 0 }, {
      yPercent: 15, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }
}

/* ============================================================
   HERO — morphing headline word (replaces the v1 type/erase
   cursor cycle). A liquid blur+squash crossfade inside a pill
   whose width tweens to match each new word, instead of a
   typewriter — deliberately a different technique from the
   reference site's character-by-character cycle.
   ============================================================ */
function initHeroMorph() {
  const pill = qs('#heroMorphPill');
  const wordEl = qs('#heroMorphWord');
  if (!pill || !wordEl) return;

  const phrases = ['you work.', 'you get paid.', 'you book.', 'you grow.'];
  let index = 0;

  const measurer = document.createElement('span');
  measurer.style.cssText = 'position:absolute; visibility:hidden; white-space:nowrap; pointer-events:none; top:-9999px;';
  measurer.style.font = getComputedStyle(wordEl).font;
  measurer.style.letterSpacing = getComputedStyle(wordEl).letterSpacing;
  document.body.appendChild(measurer);
  function widthOf(text) { measurer.textContent = text; return measurer.getBoundingClientRect().width; }

  gsap.set(pill, { width: widthOf(phrases[0]) });

  if (reduceMotion) return;

  function loop() {
    gsap.delayedCall(2.4, () => {
      const next = (index + 1) % phrases.length;
      const nextWidth = widthOf(phrases[next]);
      const tl = gsap.timeline({ onComplete: () => { index = next; loop(); } });
      tl.to(wordEl, {
        yPercent: -60, scaleY: 1.5, scaleX: .8, filter: 'blur(16px)', autoAlpha: 0,
        duration: .5, ease: 'power2.in'
      })
        .to(pill, { width: nextWidth, duration: .5, ease: 'power2.inOut' }, '<')
        .call(() => { wordEl.textContent = phrases[next]; })
        .fromTo(wordEl,
          { yPercent: 60, scaleY: 1.5, scaleX: .8, filter: 'blur(16px)', autoAlpha: 0 },
          { yPercent: 0, scaleY: 1, scaleX: 1, filter: 'blur(0px)', autoAlpha: 1, duration: .6, ease: 'power3.out' }
        );
    });
  }
  loop();
}

/* ============================================================
   SCENE REVEALS — generic section entrances (varied per section
   so no two sections use the identical choreography)
   ============================================================ */
function initSceneReveals() {
  if (reduceMotion) {
    qsa('.reveal-left, .reveal-right, .reveal-up, .reveal-scale, .reveal-clip').forEach((el) =>
      gsap.set(el, { autoAlpha: 1, x: 0, y: 0, scale: 1, rotation: 0, clipPath: 'none' })
    );
    return;
  }

  qsa('.reveal-left').forEach((el) => {
    gsap.fromTo(el, { autoAlpha: 0, x: -70, rotateY: 10 }, {
      autoAlpha: 1, x: 0, rotateY: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 82%', toggleActions: 'play none none reverse' }
    });
  });
  qsa('.reveal-right').forEach((el) => {
    gsap.fromTo(el, { autoAlpha: 0, x: 70, rotateY: -10 }, {
      autoAlpha: 1, x: 0, rotateY: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 82%', toggleActions: 'play none none reverse' }
    });
  });
  qsa('.reveal-up').forEach((el, i) => {
    gsap.fromTo(el, { autoAlpha: 0, y: 50 }, {
      autoAlpha: 1, y: 0, duration: .9, ease: 'power3.out', delay: (i % 6) * .06,
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' }
    });
  });
  qsa('.reveal-scale').forEach((el) => {
    gsap.fromTo(el, { autoAlpha: 0, scale: .75, rotation: -4 }, {
      autoAlpha: 1, scale: 1, rotation: 0, duration: 1.1, ease: 'back.out(1.5)',
      scrollTrigger: { trigger: el, start: 'top 80%', toggleActions: 'play none none reverse' }
    });
  });
  qsa('.reveal-clip').forEach((el, i) => {
    gsap.fromTo(el, { clipPath: 'inset(0% 0% 100% 0%)', autoAlpha: 1 }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: .9, ease: 'power4.out', delay: (i % 5) * .08,
      scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' }
    });
  });

  qsa('.what .split, .pricing-cards, .contact-form').forEach((inner) => {
    gsap.fromTo(inner, { scale: .96 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: inner, start: 'top bottom', end: 'top 55%', scrub: true }
    });
  });
}

/* ============================================================
   WHAT IS DOVA — engine diagram idle motion + pulse lines
   ============================================================ */
function initEngine() {
  const mark = qs('#engineMark');
  initMarkFloat(mark, { amplitude: 6, duration: 2.3, wobble: 2 });

  if (reduceMotion) return;
  ScrollTrigger.create({
    trigger: '.engine-diagram', start: 'top 80%', once: true,
    onEnter: () => {
      gsap.to('.engine-pulse-line', {
        opacity: .8, duration: 1.2, repeat: -1, yoyo: true, stagger: .5, ease: 'sine.inOut'
      });
    }
  });
}

/* ============================================================
   RUN A BIGGER BUSINESS — signal-network visual
   Replaces the v1 orbit (icons rotating around the mark with a
   CSS counter-rotation trick — the mechanic flagged as too close
   to the reference site). This uses SVG paths that draw
   themselves in on scroll, plus signal pulses that travel core →
   node along the path via GSAP MotionPath. Nodes are static and
   labelled, and light up their path on hover — a different
   metaphor (a small network) rather than a variant of orbiting.
   ============================================================ */
function initNetworkVisual() {
  const visual = qs('#networkVisual');
  if (!visual) return;
  const paths = qsa('.n-path', visual);
  const pulses = qsa('.n-pulse', visual);
  const nodes = qsa('.network-node', visual);
  const core = qs('.network-core', visual);

  paths.forEach((p) => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = reduceMotion ? 0 : len;
  });

  if (reduceMotion) {
    gsap.set(nodes, { autoAlpha: 1, scale: 1 });
    nodes.forEach((node) => {
      const idx = node.getAttribute('data-node');
      const path = paths[idx];
      node.addEventListener('mouseenter', () => path && path.classList.add('is-lit'));
      node.addEventListener('mouseleave', () => path && path.classList.remove('is-lit'));
    });
    return;
  }

  gsap.set(nodes, { autoAlpha: 0, scale: .4 });

  ScrollTrigger.create({
    trigger: visual, start: 'top 75%', once: true,
    onEnter: () => {
      paths.forEach((p, i) => {
        gsap.to(p, { strokeDashoffset: 0, duration: 1.1, ease: 'power3.inOut', delay: i * .12 });
      });
      nodes.forEach((n, i) => {
        gsap.to(n, { autoAlpha: 1, scale: 1, duration: .7, ease: 'back.out(2)', delay: .3 + i * .12 });
      });
      gsap.from(core, { scale: 0, rotation: -20, duration: .8, ease: 'back.out(1.8)' });

      pulses.forEach((pulse, i) => {
        gsap.set(pulse, { opacity: 1 });
        gsap.to(pulse, {
          motionPath: { path: paths[i], align: paths[i], alignOrigin: [0.5, 0.5] },
          duration: 1.8, repeat: -1, repeatDelay: .5, ease: 'power1.inOut', delay: 1.2 + i * .35
        });
      });
    }
  });

  gsap.to(visual, { scale: 1.025, duration: 3.4, yoyo: true, repeat: -1, ease: 'sine.inOut' });

  nodes.forEach((node) => {
    const idx = node.getAttribute('data-node');
    const path = paths[idx];
    node.addEventListener('mouseenter', () => path && path.classList.add('is-lit'));
    node.addEventListener('mouseleave', () => path && path.classList.remove('is-lit'));
  });
}

/* ============================================================
   TRUSTED BY — scattered cards settle into place, then
   straighten up on hover
   ============================================================ */
function initTrustedCards() {
  const cards = qsa('.trusted-card');
  if (!cards.length) return;

  const rest = [
    { rotation: -6, y: 6, x: 0 },
    { rotation: 4, y: -16, x: 0 },
    { rotation: -3, y: 10, x: 0 }
  ];
  const start = [
    { x: -160, y: -70, rotation: -35, scale: .7 },
    { x: 170, y: 90, rotation: 30, scale: .7 },
    { x: -120, y: 130, rotation: -28, scale: .7 }
  ];

  if (reduceMotion) {
    cards.forEach((card, i) => gsap.set(card, { ...rest[i], scale: 1, autoAlpha: 1 }));
    return;
  }

  cards.forEach((card, i) => gsap.set(card, { ...start[i], autoAlpha: 0 }));

  const tl = gsap.timeline({
    scrollTrigger: { trigger: '#trustedCards', start: 'top 85%', toggleActions: 'play none none reverse' }
  });
  cards.forEach((card, i) => {
    tl.to(card, { ...rest[i], scale: 1, autoAlpha: 1, duration: 1.1, ease: 'back.out(1.6)' }, i * .15);
  });

  cards.forEach((card, i) => {
    const hoverTl = gsap.timeline({ paused: true });
    hoverTl.to(card, { rotation: 0, y: rest[i].y - 14, scale: 1.05, duration: .5, ease: 'power3.out' });
    card.addEventListener('mouseenter', () => hoverTl.play());
    card.addEventListener('mouseleave', () => hoverTl.reverse());
  });
}

/* ============================================================
   PRESETS — horizontal pinned scroll with coverflow depth
   (cards blur/scale/tilt as they pass through the centre,
   instead of a flat scale-only reveal)
   ============================================================ */
function initPillars() {
  const track = qs('#pillarsTrack');
  const pillars = qsa('.pillar, .pillar-note', track || document);
  if (!track) return;

  if (reduceMotion || isMobile) {
    gsap.set(pillars, { autoAlpha: 1 });
    return;
  }

  const getDistance = () => track.scrollWidth - window.innerWidth + 20;

  const scrollTween = gsap.to(track, {
    x: () => -getDistance(),
    ease: 'none',
    scrollTrigger: {
      trigger: '.pillars-pin', start: 'top top', end: () => '+=' + getDistance(),
      pin: true, scrub: 1, invalidateOnRefresh: true
    }
  });

  pillars.forEach((pillar) => {
    gsap.fromTo(pillar,
      { scale: .88, autoAlpha: .35, filter: 'blur(6px)', rotateY: 8 },
      {
        scale: 1, autoAlpha: 1, filter: 'blur(0px)', rotateY: 0, ease: 'none',
        scrollTrigger: { trigger: pillar, containerAnimation: scrollTween, start: 'left 88%', end: 'left 40%', scrub: true }
      }
    );
    gsap.fromTo(pillar,
      { scale: 1, filter: 'blur(0px)', rotateY: 0 },
      {
        scale: .9, filter: 'blur(5px)', rotateY: -8, ease: 'none',
        scrollTrigger: { trigger: pillar, containerAnimation: scrollTween, start: 'left 30%', end: 'left -20%', scrub: true }
      }
    );
  });
}

/* ============================================================
   THE SPECIALISTS — cursor-tilt grid
   ============================================================ */
function initAgentTilt() {
  if (reduceMotion || isMobile) return;
  qsa('.agent-card').forEach((card) => {
    const rxTo = gsap.quickTo(card, 'rotationX', { duration: .4, ease: 'power3' });
    const ryTo = gsap.quickTo(card, 'rotationY', { duration: .4, ease: 'power3' });
    const liftTo = gsap.quickTo(card, 'y', { duration: .4, ease: 'power3' });
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left - r.width / 2) / (r.width / 2);
      const py = (e.clientY - r.top - r.height / 2) / (r.height / 2);
      ryTo(px * 8);
      rxTo(py * -8);
      liftTo(-6);
    });
    card.addEventListener('mouseleave', () => { rxTo(0); ryTo(0); liftTo(0); });
  });
}

/* ============================================================
   HOW A BUILD RUNS — pinned staggered reveal
   ============================================================ */
function initHelp() {
  const pairs = qsa('.notice-pair');
  if (reduceMotion) { gsap.set(pairs, { autoAlpha: 1 }); return; }

  gsap.set(pairs, { autoAlpha: 0 });
  pairs.forEach((pair) => {
    gsap.set(qs('.notice-we-notice', pair), { x: -40 });
    gsap.set(qs('.notice-we-say', pair), { x: 40 });
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.help-pin', start: 'top top', end: '+=' + (pairs.length * 500), pin: true, scrub: 1
    }
  });

  pairs.forEach((pair, i) => {
    tl.to(pair, { autoAlpha: 1, duration: .5, ease: 'sine.inOut' }, i)
      .to(qs('.notice-we-notice', pair), { x: 0, duration: .6, ease: 'sine.out' }, i)
      .to(qs('.notice-we-say', pair), { x: 0, duration: .6, ease: 'sine.out' }, i + .05);
  });
}

/* ============================================================
   SELECTED WORK — pinned 3D card stack
   Scroll still drives the card progression (the actual
   "animation" — a scrubbed timeline tied to the pinned scroll
   distance, same proven mechanic as v1). Drag is layered on top
   as a tactile bonus on whichever card is currently in front: it
   tilts with the pointer and springs back on release, it doesn't
   replace the scroll-driven advance.

   Bug fixed here: an earlier version replaced the scroll-scrub
   entirely with drag-only navigation, so scrolling through the
   section did nothing — it only looked "animated" if a visitor
   happened to drag the card, which most wouldn't discover. The
   scroll-scrub is the one that must always work; drag is extra.
   ============================================================ */
function initVerticals() {
  const cards = qsa('.vcard');
  const dots = qsa('.dot');
  if (!cards.length) return;

  if (reduceMotion || isMobile) {
    gsap.set(cards, { position: 'relative', marginBottom: 40, autoAlpha: 1 });
    return;
  }

  gsap.set(cards[0], { y: 0, scale: 1, rotate: 0, zIndex: 3, autoAlpha: 1, x: 0 });
  gsap.set(cards[1], { y: 26, scale: .94, rotate: 2, zIndex: 2, autoAlpha: 1, x: 0 });
  gsap.set(cards[2], { y: 52, scale: .88, rotate: 4, zIndex: 1, autoAlpha: 1, x: 0 });

  let dragInstance = null;
  let draggedEl = null;

  function attachDrag(el) {
    if (el === draggedEl) return;
    if (dragInstance) dragInstance.kill();
    draggedEl = el;
    dragInstance = Draggable.create(el, {
      type: 'x',
      onDrag: function () { gsap.set(el, { rotation: this.x * 0.03 }); },
      onDragEnd: function () {
        gsap.to(el, { x: 0, rotation: 0, duration: .6, ease: 'elastic.out(1,.6)' });
      }
    })[0];
  }
  attachDrag(cards[0]);

  gsap.timeline({
    scrollTrigger: {
      trigger: '.verticals-pin', start: 'top top', end: '+=2200',
      pin: true, scrub: 1,
      onUpdate: (self) => {
        const idx = self.progress < .25 ? 0 : self.progress < .75 ? 1 : 2;
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
        attachDrag(cards[idx]);
      }
    }
  })
    .to(cards[0], { rotateY: -18, x: -100, autoAlpha: 0, duration: 1, ease: 'power2.inOut' }, 0)
    .to(cards[1], { y: 0, scale: 1, rotate: 0, duration: 1, ease: 'power2.inOut' }, 0)
    .to(cards[2], { y: 26, scale: .94, rotate: 2, duration: 1, ease: 'power2.inOut' }, 0)
    .to(cards[1], { rotateY: -18, x: -100, autoAlpha: 0, duration: 1, ease: 'power2.inOut' }, 1)
    .to(cards[2], { y: 0, scale: 1, rotate: 0, duration: 1, ease: 'power2.inOut' }, 1);
}

/* ============================================================
   COUNT-UP NUMBERS
   ============================================================ */
function initCountUps() {
  qsa('[data-static]').forEach((el) => { el.textContent = el.getAttribute('data-static'); });

  qsa('[data-count-to]').forEach((el) => {
    const target = parseFloat(el.getAttribute('data-count-to'));
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';

    if (reduceMotion) {
      el.textContent = prefix + target.toLocaleString('en-US') + suffix;
      return;
    }

    const counter = { val: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => {
        gsap.to(counter, {
          val: target, duration: 1.7, ease: 'power2.out',
          onUpdate: () => { el.textContent = prefix + Math.round(counter.val).toLocaleString('en-US') + suffix; }
        });
      }
    });
  });
}

/* ============================================================
   AGENT LAYER — auto-scrolling "live" ticker
   ============================================================ */
function initAgentsLiveTicker() {
  const track = qs('#tickerTrack');
  const frame = qs('.ticker-frame');
  if (!track || !frame || reduceMotion) return;

  const originalItems = qsa('.ticker-item', track);
  const setHeight = originalItems.reduce((sum, el) => sum + el.offsetHeight, 0);
  track.insertAdjacentHTML('beforeend', track.innerHTML);

  const tween = gsap.to(track, { y: -setHeight, duration: 32, ease: 'none', repeat: -1 });
  frame.addEventListener('mouseenter', () => tween.timeScale(0.08));
  frame.addEventListener('mouseleave', () => tween.timeScale(1));
}

/* ============================================================
   FAQ — accordion
   ============================================================ */
function initFAQ() {
  qsa('.faq-item').forEach((item) => {
    const question = qs('.faq-question', item);
    const answer = qs('.faq-answer', item);
    gsap.set(answer, { height: 0 });

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      if (isOpen) {
        item.classList.remove('open');
        gsap.to(answer, { height: 0, duration: .4, ease: 'power2.inOut' });
        return;
      }
      item.classList.add('open');
      const naturalHeight = answer.scrollHeight;
      gsap.fromTo(answer, { height: 0 }, {
        height: naturalHeight, duration: .45, ease: 'power2.inOut',
        onComplete: () => { answer.style.height = 'auto'; }
      });
    });
  });
}

/* ============================================================
   CONTACT — heading split + a morphing check-mark success state
   (circle scales in, then the check path draws itself) instead
   of the v1 bouncing static mark
   ============================================================ */
function initContact() {
  gsap.set('.contact-heading .line-inner', { yPercent: 110 });
  ScrollTrigger.create({
    trigger: '.contact', start: 'top 70%',
    onEnter: () => {
      if (reduceMotion) { gsap.set('.contact-heading .line-inner', { yPercent: 0 }); return; }
      gsap.to('.contact-heading .line-inner', { yPercent: 0, duration: 1, stagger: .1, ease: 'power4.out' });
    },
    once: true
  });

  const form = qs('#contactForm');
  const success = qs('#contactSuccess');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    gsap.to(form, {
      autoAlpha: 0, y: -16, duration: .4, ease: 'power2.in',
      onComplete: () => {
        form.style.display = 'none';
        success.classList.add('visible');
        gsap.from(success, { autoAlpha: 0, y: 16, duration: .6, ease: 'power3.out' });
        gsap.fromTo('#successMorphPath',
          { scale: 0, rotation: -90, transformOrigin: '50% 50%' },
          { scale: 1, rotation: 0, duration: .6, ease: 'back.out(2)' }
        );
        gsap.to('#successCheckPath', { strokeDashoffset: 0, duration: .5, delay: .4, ease: 'power2.out' });
      }
    });
  });
}

/* ============================================================
   FOOTER MARQUEE
   ============================================================ */
function initMarquee() {
  const track = qs('.marquee-track');
  if (!track || reduceMotion) return;
  const clone = track.innerHTML;
  track.innerHTML += clone;
  gsap.to(track, { xPercent: -50, duration: 24, ease: 'none', repeat: -1 });
}

/* ============================================================
   INIT
   ============================================================ */
document.fonts.ready.then(() => {
  initCursor();
  initMagnetic();
  initMarkHovers();
  initNav();
  initProgressRail();
  initHero();
  initEngine();
  initNetworkVisual();
  initSceneReveals();
  initTrustedCards();
  initPillars();
  initAgentTilt();
  initHelp();
  initVerticals();
  initCountUps();
  initAgentsLiveTicker();
  initFAQ();
  initContact();
  initMarquee();
  initMarkFloat(qs('#footerMark'), { amplitude: 5, duration: 3, wobble: 2 });

  runPreloader(() => {
    ScrollTrigger.refresh();
    if (window.__heroEnter) window.__heroEnter();
  });

  window.addEventListener('resize', () => ScrollTrigger.refresh());
});

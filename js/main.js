/* ============================================================
   DOVA — motion system
   ============================================================ */
gsap.registerPlugin(ScrollTrigger);

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
   MARK MOTION — the D-mark is used as a single whole image
   everywhere (no splitting into pieces: that's what caused the
   seam artifacts in earlier iterations). Motion comes from
   animating the whole mark instead: a gentle idle float/breathe,
   and an interactive hover pop / cursor-tilt.
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

/* interactive cursor-tilt on the hero mark — subtle 3D parallax that
   follows the pointer, so the mark reads as alive without needing a
   two-piece seam animation to carry the "interactive" feeling */
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

/* ============================================================
   PRELOADER
   ============================================================ */
function runPreloader(onDone) {
  const pre = qs('#preloader');
  const mark = qs('#preloaderMark');
  const percentEl = qs('#preloaderPercent');
  const counter = { val: 0 };

  if (reduceMotion) {
    gsap.set(pre, { autoAlpha: 0, display: 'none' });
    onDone();
    return;
  }

  gsap.set(mark, { scale: 0, rotation: -8, transformOrigin: '50% 50%' });

  const tl = gsap.timeline({
    onComplete: () => {
      gsap.to(pre, {
        yPercent: -100, duration: .9, ease: 'power4.inOut',
        onComplete: () => { pre.style.display = 'none'; onDone(); }
      });
    }
  });

  tl.to(mark, { scale: 1, rotation: 0, duration: .8, ease: 'back.out(1.8)' }, 0)
    .to(counter, {
      val: 100, duration: 1.4, ease: 'power2.inOut',
      onUpdate: () => { percentEl.textContent = Math.round(counter.val); }
    }, 0)
    .to({}, { duration: .4 }); /* hold */
}

/* ============================================================
   CUSTOM CURSOR + SPOTLIGHT + MAGNETIC BUTTONS
   ============================================================ */
function initCursor() {
  if (reduceMotion || isMobile) return;
  const cursor = qs('#cursor');
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

function initMarkHovers() {
  qsa('.nav-logo').forEach(initMarkHoverPop);
}

/* ============================================================
   NAV
   ============================================================ */
function initNav() {
  const nav = qs('#nav');
  let lastY = 0;
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
   HERO
   ============================================================ */
function initHero() {
  const heroMark = qs('#heroMark');
  const heroMarkWrap = qs('.hero-mark-wrap');
  const heroMarkTilt = qs('#heroMarkTilt');

  if (reduceMotion) {
    gsap.set(['.hero-title .line', '.hero-sub', '.hero-actions', '.hero-tag', '.hero-mark-wrap'], { autoAlpha: 1, y: 0 });
    return;
  }

  gsap.set('.hero-title .line-inner', { yPercent: 110 });
  gsap.set(['.hero-sub', '.hero-actions', '.hero-tag'], { autoAlpha: 0, y: 24 });
  gsap.set('.hero-mark-wrap', { autoAlpha: 0, scale: .8 });

  window.__heroEnter = () => {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' }, onComplete: initHeroCycle });
    tl.to('.hero-mark-wrap', { autoAlpha: 1, scale: 1, duration: .9 })
      .to('.hero-tag', { autoAlpha: 1, y: 0, duration: .6 }, '-=.5')
      .to('.hero-title .line-inner', { yPercent: 0, duration: 1, stagger: .1 }, '-=.5')
      .to('.hero-sub', { autoAlpha: 1, y: 0, duration: .8 }, '-=.5')
      .to('.hero-actions', { autoAlpha: 1, y: 0, duration: .8 }, '-=.6');

    initMarkFloat(heroMark, { amplitude: 9, duration: 2.8, wobble: 3 });
    initMarkTilt(heroMarkTilt, heroMarkWrap);
  };

  /* No separate scroll-exit tween for the mark: `.hero-mark-wrap` is
     already included in the group fade-out just below, and the mark
     image's own `y` is driven by the idle float — adding a third tween
     touching either of those properties would just fight the others.

     Explicit fromTo (not `to`) so the start/end values are fixed no matter
     when ScrollTrigger first renders this tween. Using `to` here previously
     let ScrollTrigger capture each element's THEN-current value (already
     autoAlpha:0 from the gsap.set above, since refresh() runs before the
     entrance timeline plays) as the tween's start — collapsing the whole
     scrub range to 0→0, so scrolling back up never restored visibility. */
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
}

/* ============================================================
   HERO — cycling headline ("how you work." / "you get paid." / …)
   ============================================================ */
function initHeroCycle() {
  const el = qs('#heroCycle');
  if (!el || reduceMotion) return;

  const phrases = ['you work.', 'you get paid.', 'you book.', 'you grow.'];
  let index = 0;

  function type(word, onDone) {
    let pos = 0;
    (function step() {
      pos++;
      el.textContent = word.slice(0, pos);
      if (pos < word.length) setTimeout(step, 42);
      else onDone();
    })();
  }

  function erase(word, onDone) {
    let pos = word.length;
    (function step() {
      pos--;
      el.textContent = word.slice(0, pos);
      if (pos > 0) setTimeout(step, 26);
      else onDone();
    })();
  }

  function loop() {
    setTimeout(() => {
      erase(phrases[index], () => {
        index = (index + 1) % phrases.length;
        type(phrases[index], loop);
      });
    }, 2200);
  }

  loop();
}

/* ============================================================
   3D SCENE DEPTH — generic section entrances
   ============================================================ */
function initSceneReveals() {
  if (reduceMotion) {
    qsa('.reveal-left, .reveal-right, .reveal-up, .reveal-mask').forEach((el) => gsap.set(el, { autoAlpha: 1, x: 0, y: 0, clipPath: 'none' }));
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
      autoAlpha: 1, y: 0, duration: .9, ease: 'power3.out', delay: i * .08,
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' }
    });
  });
  qsa('.reveal-mask').forEach((el, i) => {
    gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)', autoAlpha: 1 }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: .9, ease: 'power4.inOut', delay: i * .1,
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' }
    });
  });

  /* depth tilt for non-pinned section inner content only — never transform
     a `.section` element itself: it would become a containing block for
     `position:fixed` and silently break every ScrollTrigger pin inside it */
  qsa('.what .split, .pricing-cards, .contact-form').forEach((inner) => {
    gsap.fromTo(inner, { scale: .96 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: inner, start: 'top bottom', end: 'top 55%', scrub: true }
    });
  });
}

/* ============================================================
   WHAT IS DOVA — engine diagram idle motion
   ============================================================ */
function initEngine() {
  const mark = qs('#engineMark');
  initMarkFloat(mark, { amplitude: 6, duration: 2.3, wobble: 2 });
}

/* ============================================================
   TRUSTED BY — scattered cards settle into place, then
   straighten up on hover ("un-scatter")
   ============================================================ */
function initTrustedCards() {
  const cards = qsa('.trusted-card');
  if (!cards.length) return;

  /* resting pose each card settles into — matches the tilted,
     overlapping "scattered on a table" layout */
  const rest = [
    { rotation: -6, y: 6, x: 0 },
    { rotation: 4, y: -16, x: 0 },
    { rotation: -3, y: 10, x: 0 }
  ];
  /* where each card flies in from */
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
    tl.to(card, {
      ...rest[i], scale: 1, autoAlpha: 1, duration: 1.1, ease: 'back.out(1.6)'
    }, i * .15);
  });

  /* hover: card straightens and lifts, then eases back to its
     scattered resting pose on mouseleave */
  cards.forEach((card, i) => {
    const hoverTl = gsap.timeline({ paused: true });
    hoverTl.to(card, { rotation: 0, y: rest[i].y - 14, scale: 1.05, duration: .5, ease: 'power3.out' });
    card.addEventListener('mouseenter', () => hoverTl.play());
    card.addEventListener('mouseleave', () => hoverTl.reverse());
  });
}

/* ============================================================
   PILLARS — horizontal pinned scroll
   ============================================================ */
function initPillars() {
  const track = qs('#pillarsTrack');
  const pillars = qsa('.pillar', track);
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
      trigger: '.pillars-pin',
      start: 'top top',
      end: () => '+=' + getDistance(),
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true
    }
  });

  pillars.forEach((pillar) => {
    gsap.fromTo(pillar, { scale: .92, autoAlpha: .5 }, {
      scale: 1, autoAlpha: 1, ease: 'none',
      scrollTrigger: {
        trigger: pillar, containerAnimation: scrollTween,
        start: 'left 85%', end: 'left 45%', scrub: true
      }
    });
  });
}

/* ============================================================
   HOW WE HELP — pinned staggered reveal (soft, human easing)
   ============================================================ */
function initHelp() {
  const pairs = qsa('.notice-pair');
  if (reduceMotion) { gsap.set(pairs, { autoAlpha: 1 }); return; }

  gsap.set(pairs, { autoAlpha: 0 });
  gsap.set(qsa('.notice-we-notice', pairs[0]?.parentElement), {});
  pairs.forEach((pair) => {
    gsap.set(qs('.notice-we-notice', pair), { x: -40 });
    gsap.set(qs('.notice-we-say', pair), { x: 40 });
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.help-pin',
      start: 'top top',
      end: '+=' + (pairs.length * 500),
      pin: true,
      scrub: 1
    }
  });

  pairs.forEach((pair, i) => {
    tl.to(pair, { autoAlpha: 1, duration: .5, ease: 'sine.inOut' }, i)
      .to(qs('.notice-we-notice', pair), { x: 0, duration: .6, ease: 'sine.out' }, i)
      .to(qs('.notice-we-say', pair), { x: 0, duration: .6, ease: 'sine.out' }, i + .05);
  });
}

/* ============================================================
   VERTICALS — pinned 3D card stack
   ============================================================ */
function initVerticals() {
  const cards = qsa('.vcard');
  const dots = qsa('.dot');
  if (!cards.length) return;

  if (reduceMotion || isMobile) {
    gsap.set(cards, { position: 'relative', marginBottom: 40, autoAlpha: 1 });
    return;
  }

  gsap.set(cards[0], { y: 0, scale: 1, rotate: 0, zIndex: 3, autoAlpha: 1 });
  gsap.set(cards[1], { y: 26, scale: .94, rotate: 2, zIndex: 2, autoAlpha: 1 });
  gsap.set(cards[2], { y: 52, scale: .88, rotate: 4, zIndex: 1, autoAlpha: 1 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.verticals-pin', start: 'top top', end: '+=2200',
      pin: true, scrub: 1,
      onUpdate: (self) => {
        const idx = self.progress < .25 ? 0 : self.progress < .75 ? 1 : 2;
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
      }
    }
  });

  tl.to(cards[0], { rotateY: -18, x: -100, autoAlpha: 0, duration: 1, ease: 'power2.inOut' }, 0)
    .to(cards[1], { y: 0, scale: 1, rotate: 0, duration: 1, ease: 'power2.inOut' }, 0)
    .to(cards[2], { y: 26, scale: .94, rotate: 2, duration: 1, ease: 'power2.inOut' }, 0)
    .to(cards[1], { rotateY: -18, x: -100, autoAlpha: 0, duration: 1, ease: 'power2.inOut' }, 1)
    .to(cards[2], { y: 0, scale: 1, rotate: 0, duration: 1, ease: 'power2.inOut' }, 1);
}

/* ============================================================
   COUNT-UP NUMBERS — pricing tiers + case-study stats
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
  if (!track || !frame) return;

  if (reduceMotion) return;

  const originalItems = qsa('.ticker-item', track);
  const setHeight = originalItems.reduce((sum, el) => sum + el.offsetHeight, 0);
  track.insertAdjacentHTML('beforeend', track.innerHTML);

  const tween = gsap.to(track, {
    y: -setHeight, duration: 32, ease: 'none', repeat: -1
  });
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
   CONTACT — heading split + form success state
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
        gsap.from('#successMark', { scale: 0, rotation: -10, duration: .6, ease: 'back.out(2)' });
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
  gsap.to(track, {
    xPercent: -50, duration: 24, ease: 'none', repeat: -1
  });
}

/* ============================================================
   INIT
   ============================================================ */
document.fonts.ready.then(() => {
  initCursor();
  initMagnetic();
  initMarkHovers();
  initNav();
  initHero();
  initEngine();
  initSceneReveals();
  initTrustedCards();
  initPillars();     /* now drives the 8-card "presets" horizontal scroll */
  initHelp();        /* now drives the "how a build runs" pinned steps */
  initVerticals();   /* now drives the "selected work" pinned card stack */
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

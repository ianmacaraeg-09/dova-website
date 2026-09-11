# DOVA Website — Session Handoff

This document is a full context transfer for continuing work on the DOVA
marketing website in a **new** Claude Code session (different account/login).
Paste this whole file into the new session's first message, along with the
project files (or point it at this same project folder), and it should be
able to pick up exactly where this session left off.

---

## 1. Where the project lives

- **Working directory:** `C:\Users\USER\Claude Projects\DOVA`
- **Not a git repo** (no version control set up — consider initializing one).
- **Static site, no build step.** Just `index.html` + `css/style.css` +
  `js/main.js`, with GSAP/ScrollTrigger/Lenis loaded from jsdelivr CDN and
  fonts from Fontshare. No npm, no bundler.
- **File structure:**
  ```
  index.html
  css/style.css
  js/main.js
  assets/
    dova-mark.png       — the D logo icon, used everywhere as one whole image
    dova-wordmark.png   — icon + "DOVA" wordmark, used only in the nav
    logo-icon.png        — raw original icon file the user saved (white-on-
                            transparent); dova-mark.png was cropped from this
  .claude/launch.json    — dev-server config so Claude Code's browser preview
                            tool can serve the site locally (python -m
                            http.server 5173)
  DOVA-website.zip        — a zip of the deliverable files, already sent to
                            the user once; regenerate if files change again
  ```
- **To preview locally:** `python -m http.server 5173` from the project root,
  then open `http://localhost:5173`. (Opening `index.html` directly via
  `file://` also works fine — no fetch/XHR dependencies.)

## 2. Who the client is / brand rules (hard constraints)

DOVA is a **founder-led, pre-launch-turned-live "systems studio"** based in
Angeles City, Pampanga, Philippines, building websites + business systems +
named AI agents for independent local businesses (cafés, courts, clinics,
leasing, etc.). The user (client-side) has been iterating the business
positioning across several reference sites over the course of this project;
the site has been kept in sync with the **latest** one each time.

**Brand rules that must never be broken:**
- **Pure black and white only.** No color, no gradients, anywhere. Grayscale
  tints/tones are fine (that's a value of black, not a hue). This was
  confirmed explicitly even though later reference sites use color — the
  user said "keep our design as is" and wants everything translated into the
  monochrome system, not copied literally.
- **The D-mark:** two overlapping rounded squares that read as a "D," with a
  visible seam/notch between them left on purpose ("one engine, two
  outputs"). This is the actual client-supplied logo asset now (see §4),
  not a hand-drawn approximation.
- **Letterform logic carried through the whole UI:** rounded corners = D/O =
  human-facing/operational; sharp/angular corners = V/A = engineered/AI/
  automation-facing. This shows up as a real design system rule across
  pillar cards, agent cards, etc. — not just the logo.
- **No fabricated content.** No fake testimonials, screenshots, client
  logos, or stats. Where the reference sites show real client data (Turté,
  Gray Kitchen, AeroTek), that's fine to use since it's the client's own
  published content — but never invent numbers, screenshots, or logos that
  haven't actually been seen/provided.
- **Voice:** plain, concrete, conversational. Every AI claim must be
  specific and falsifiable, never generic "AI-powered" hype.

## 3. Tech / design system reference

- **Fonts:** Clash Display (display/headings) + General Sans (body), both
  loaded via Fontshare CDN link tag in `<head>`.
- **Colors (CSS vars in `:root`):** `--bg:#060606`, `--black:#030303`,
  `--panel:#101010`, `--panel-2:#161616`, `--panel-sharp:#0c0c0c`,
  `--white:#f6f5f2`, `--grey-100/300/500`, `--line`/`--line-strong`
  (translucent whites for borders).
- **Radii:** `--radius-soft:32px` (rounded/human), `--radius-sharp:0px`
  (sharp/engineered), `--radius-btn:999px` (pills).
- **Motion stack:** GSAP 3.13.0 + ScrollTrigger + Lenis smooth scroll (all
  via jsdelivr CDN, pinned versions). Custom cursor, magnetic buttons,
  cursor-follow spotlight, a generic `.reveal-left/.reveal-right/.reveal-up/
  .reveal-mask` class system driven by one shared `initSceneReveals()`
  function (add these classes to any new element and it animates in for
  free — no per-element JS needed).
- **`isMobile`/`reduceMotion`** are computed **once** at script load via
  `matchMedia`, not reactively. Heavy interactive effects (cursor, magnetic,
  tilt) are skipped below 900px width. **Gotcha:** if you resize the browser
  viewport *after* the page has loaded (e.g. during testing), these flags
  go stale and desync from the live CSS media queries — always do a full
  page reload after changing viewport size, not just a resize.

## 4. The logo saga (read this before touching the mark again)

This took multiple rounds to get right — the lessons learned are important
if the mark ever needs to change again:

1. Originally the mark was a **hand-drawn SVG approximation** (two rounded-
   rect paths) since no source file existed. The user rejected this — it
   didn't match the real logo.
2. The user provided the **actual logo images** (pasted in chat, then saved
   to disk on request: `assets/logo-icon.png`, later `assets/dova-wordmark.png`
   for the nav wordmark). Lesson: when a user pastes brand images in chat,
   ask them to save the actual file to the project folder — pasted chat
   images aren't readable as files directly.
3. **`logo-icon.png` turned out to be white-on-transparent**, which rendered
   as blank/invisible when I first `Read` it (viewer defaults to white
   background). Always composite onto a black background before judging a
   "blank" image.
4. Long debugging saga trying to **split the mark into two animatable
   pieces** (for a "seam separates on scroll/hover" animation) kept
   producing a **faint seam line** no matter the technique tried:
   - CSS `clip-path` on two copies of the same image → seam (clip-path's
     own antialiasing doesn't sum to full coverage at a shared boundary
     between two separately-clipped elements — proven via direct canvas
     pixel sampling, not just visual inspection).
   - Pre-splitting into two alpha-punched PNGs, letting the browser scale
     each independently → seam (two independently-antialiased partial-
     coverage images don't recombine correctly under normal Porter-Duff
     "over" compositing).
   - **The fix that actually worked:** render both pieces into `<canvas>`
     elements at runtime and split them via raw `getImageData`/
     `putImageData` with a **hard integer pixel cutoff** — zero
     antialiasing possible, verified pixel-for-pixel identical to the
     source via a canvas diff (max diff 0).
5. **Then the user said the split-into-pieces approach itself was the wrong
   call** — "just use the logo directly, add floating animation instead."
   All of the above was ripped out. **Current final state: the mark is used
   as ONE whole `<img>` everywhere**, animated as a whole element (idle
   float/wobble, hover pop, cursor-tilt) rather than split into pieces. This
   is simpler, has zero seam risk, and is what's live now. **Do not
   reintroduce mark-splitting** — if a "separate on scroll" effect is
   wanted again, reconsider whether it's worth the complexity given this
   history.
6. `js/main.js` has `initMarkFloat()`, `initMarkHoverPop()`, and
   `initMarkTilt()` as the current, working, whole-image mark animation
   helpers. Reuse these for any new mark placements.

## 5. Content history — why the site says what it says

The site went through **three content generations**, each superseding the
last (the user pointed at progressively more mature reference sites and
said "match this"):

1. **Gen 1 (original brief, `DOVA_website_brief.md`):** pre-launch, four-
   pillar D-O-V-A backronym (Design/Optimization/Virtual Intelligence/
   Automation), soft-pitch tone, no pricing, no case studies ("coming
   soon" honest placeholder), verticals = café/restaurant/small sports
   facility.
2. **Gen 2 (`https://creative-blancmange-4d5c59.netlify.app/`):** business
   had moved to a live, priced "systems studio" model. Replaced the D-O-V-A
   pillars with **7 "presets"** (modular building blocks), introduced **6
   named AI agents** (Echo, Hora, Argo, Obol, Eos, Charis), a live-activity
   ticker ("a normal Tuesday"), **3 real case studies** (Turté café, Gray
   Kitchen Pickleball Courts, AeroTek drone services), full **pricing**
   (₱24,999 install / ₱2,500 mo maintenance / ₱7,999–₱29,999 agent tiers),
   and an FAQ. Hard CTAs ("Book a demo", "Start free trial") replaced the
   soft-pitch tone. This is the generation the site is currently built on.
3. **Gen 3 (`https://dovastudios.netlify.app/`):** incremental additions on
   top of Gen 2 — see §6 for exactly what was added. **Credentials section
   was analyzed but deliberately NOT built** (see §7, open item).

**Verified facts worth knowing** (pulled by directly triggering the
reference sites' GSAP count-up animations and reading final settled values,
not the "0" placeholder mid-animation state):
- Pricing: ₱24,999 install (one-time), ₱2,500/mo maintenance, agent tiers
  ₱7,999 (1st) / ₱6,499 each (2nd–3rd) / ₱4,999 each (4th+) / ₱29,999 (all
  six).
- Case studies: Turté "1,000+ orders handled, Live/running daily, powered
  by Argo"; Gray Kitchen "₱10,000+ booked in 2 months, 24/7 self-serve
  booking, powered by Hora" (**note:** the reference site itself shows this
  as "$10,000+" — a dollar sign, inconsistent with every other price on
  their site which uses ₱. Judgment call made: fixed it to ₱ on our site
  for internal consistency. Flag this to the user if it ever comes up.);
  AeroTek "1 quote to delivery, Live/fleet scheduling."
- Contact email: `hello@dova.ph`.

## 6. Current site structure (top to bottom, as of end of this session)

Section IDs and numbering (the `<span>0XX</span>` labels), in order:

| # | id | Heading | Notes |
|---|----|---------|-------|
| — | `#hero` | "Built to fit how [cycling]." | Cycling headline typewriter (see below); tag: "Est. 2026 · Enterprise-grade, SME-priced · Angeles City, Pampanga" |
| 001 | `#grow` | "Run a bigger business with a smaller team." | **New this session.** Orbiting-icons visual (5 module icons circling the D-mark, CSS-only animation) + 3 numbered value props |
| 002 | `#what` | "What is DOVA" (positioning) | Founder-led-studio positioning statement + the "same engine, two outputs" diagram (kept from Gen 1, still valid) |
| 003 | `#trusted` | "Businesses running on what we built." | **Redesigned this session** into 3 scattered/tilted cards (AeroTek, Turté, Gray Kitchen) with a fly-in-and-settle entrance + hover "un-scatter" (straighten+lift) interaction |
| 004 | `#presets` | "Where we start" | Horizontal-pinned-scroll, 7 preset cards + 1 "bring the awkward part" capstone card (8 total). Reuses the original 4-pillar horizontal-scroll mechanic, just extended |
| 005 | `#agents-live` | "Every service has a specialist behind it." | **Expanded this session** from a 4-word strip to **5 full cards** (Reads/Decides/Acts/Reports/**Nothing it does is permanent**), each with icon+description+link. Below that: the auto-scrolling vertical "Live — a normal Tuesday" ticker (12 duplicated entries, pauses on hover) |
| 006 | `#agents` | "Six agents. One job each." | Grid of 6 agent bio cards (Echo/Hora/Charis rounded, Argo/Obol/Eos sharp) |
| 007 | `#process` | "How a build runs" | 4-step pinned staggered reveal (reuses the original "we notice/we say" mechanic, repurposed) |
| 008 | `#work` | "Same studio, three different systems." | 3 real case studies in a pinned 3D card-stack (reuses the original "verticals" café/restaurant/sports mechanic, repurposed), with GSAP count-up stats |
| 009 | `#pricing` | "Multinational standard. Local price." | **Headline updated this session.** Installation + Maintenance cards, 4-tier agent pricing row, all with count-up numbers |
| 010 | `#faq` | "The ones we always get." | 6-item accordion, click to expand, morphing +/– icon |
| 011 | `#contact` | "Show us how you actually work." | Contact form (name/business/email/type/message), success state on submit. **Note: form has no backend** — it just shows a client-side success message, doesn't actually send anywhere. Flagged to user, not yet resolved. |

Footer: logo + tagline ("A local startup building affordable systems for
businesses ready to grow."), nav links, location + `hello@dova.ph`,
infinite marquee of "DOVA", copyright with "Established 2026".

### New JS features added this session
- **`initHeroCycle()`** — typewriter cycles the hero's second line through
  `['you work.', 'you get paid.', 'you book.', 'you grow.']` after the
  entrance animation completes. Respects `reduceMotion` (shows static first
  phrase only).
- **`initTrustedCards()`** — scattered-cards-fly-in-and-settle entrance +
  hover un-scatter, described above.
- Orbit visual and the 5 flow-cards / 3 value-props needed **no new JS at
  all** — they reuse the existing generic `.reveal-up` system and pure-CSS
  animations (the orbit rotation is a CSS `@keyframes` loop with a clever
  counter-rotation trick to keep icons upright while orbiting; pause-on-
  hover is a plain `:hover` CSS rule).

## 7. Open items / things flagged but not yet resolved

1. **Credentials section (from Gen 3 reference) — NOT built.** The
   reference site has a "Trained abroad, building here" section showing the
   founder's real name (Dominique Uy) and actual Tencent Cloud certificate
   images (4 real, verifiable certifications with IDs — those are legit,
   confirmed content). But: (a) two of the reference site's own "abroad"
   training entries are literal unfinished placeholders ("add name,
   institution, year" — do not copy those as if real), and (b) this
   involves publishing a real person's name/credentials, so **explicit
   confirmation from the user is needed before building this**, plus the
   actual certificate image files (none currently in the project). Last
   status: presented as priority-6/"needs your input" in the recap; user
   said "go ahead and build those in" referring to items 1–4/6/7 from that
   list, which did NOT include Credentials. **Still pending.**
2. **Contact form has no backend.** Shows a success message but doesn't
   actually send an email or hit any API. Needs a real integration
   (Formspree, a serverless function, etc.) before real launch. Flagged
   early in the project, never resolved since there was no backend service
   specified.
3. **Gray Kitchen currency fix** — see §6 note above (we use ₱, their site
   shows $). Worth a quick sanity check with the client since it's their
   own inconsistency, not necessarily our error to "fix" silently forever.
4. No favicon has been set (still `<link rel="icon" href="data:,">`, i.e.
   a blank/no favicon).
5. No git repo — consider setting one up if iterating further, especially
   given how many rounds of changes this project has been through.

## 8. Process notes for whoever picks this up

- The user iterates by pointing at **live reference sites** (Netlify
  preview URLs of their own evolving design) and asking to match content/
  positioning — always fetch and read the full `document.body.innerText`
  (via the browser tool) rather than relying on `get_page_text`, since
  these sites are heavily componentized and static extraction can miss
  content. **Also trigger any animated counters/stats by scrolling them
  into view and waiting for settle** before trusting the numbers — mid-
  animation "0" placeholders are easy to mistake for real content.
- The user cares a lot about **immersive, interactive, GSAP-driven motion**
  with a "morphing" feel, but wants it **restrained and precise** (matches
  the brand's "engineered" half), not playful/bouncy. Every new section
  added should have its own distinct entrance animation and ideally an
  interactive (not just scroll-triggered) touch — hover states, cursor
  response, etc.
- The user has explicitly said **"keep our design as is"** — meaning the
  monochrome brand system is locked even as content keeps evolving from
  new reference sites. Translate new reference content into the existing
  system; don't adopt their color/light-theme choices.
- **Testing environment quirk:** the Claude Code browser preview tool in
  this session only ticks GSAP's `requestAnimationFrame` loop when a
  screenshot is actively captured (not during plain `wait`/`setTimeout`).
  This caused several false "bug" scares (blank screenshots, stuck
  animations, "0" counters) that turned out to be fine once verified via
  `getComputedStyle`/`getBoundingClientRect` or a follow-up screenshot.
  Don't panic at a single odd screenshot — verify programmatically before
  concluding something is broken.
- A real, confirmed bug pattern worth remembering: **never put both a
  mask (`overflow:hidden`) and the slide transform on the same element**
  for a "reveal text line" effect — the mask moves with the transform,
  letting text visually escape into whatever's below it. Always split into
  a static outer mask + an animated inner span. This bit the hero title
  and contact heading once already (fixed).

---

*End of handoff. The live site at the time of writing reflects everything
above — read `index.html`, `css/style.css`, and `js/main.js` directly for
the actual current implementation.*

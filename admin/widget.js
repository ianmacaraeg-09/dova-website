/* ============================================================
   Corner chat widget, Messenger-style: collapsed bubble that
   expands into a small panel. One instance per agent page.

   The send/receive/session/render logic for the enabled (Eos)
   case is the peer session's tested code against the real
   backend (http://127.0.0.1:8787), reshaped from their full-page
   proof-of-concept into this bubble container — same API
   contract: GET /health, POST /chat {message, session_id} ->
   {reply, session_id}.

   For a disabled agent (no backend yet), the widget still shows
   so the page layout is consistent, but the input is disabled
   and it opens straight to a "coming soon" message.
   ============================================================ */

/* Animated liquid-sphere avatar (opt-in per agent via config.avatar ===
   'blob', config.blobPalette - see initAgentWidget). Ported from
   dovastudios.netlify.app's own "identity orbs" technique (read
   directly from its public, unminified inline script - a plain 2D
   canvas effect, not WebGL) rather than approximated from a
   screenshot: a near-circular silhouette built from four layered
   low-amplitude sine harmonics (not a spiky star), filled with
   diagonal colour bands painted small on an offscreen buffer and
   scaled up for softness, then two radial-gradient "sphere shading"
   passes and a fine dot-texture grain on top. The drawing technique
   itself is identical for every agent; only the palette differs -
   see DEFAULT_BLOB_PALETTE and the per-agent admin pages that pass
   their own. Wobble amplitude and speed track real Fish Audio
   playback: talking gates idle vs engaged, level (fed live from an
   AnalyserNode - see attachTalkingLevel below) rides on top of that
   with the actual moment-to-moment loudness, so pauses between
   words/sentences visibly settle instead of one constant "bigger and
   faster" the whole reply through. */
var DEFAULT_BLOB_PALETTE = ['#e2422a', '#f27038', '#f8993d', '#f7bb4d', '#f5d972']; // Eos's, used if an agent page doesn't pass its own
var _blobGrainTexture = null;
function blobGrainTexture() {
  if (_blobGrainTexture) return _blobGrainTexture;
  var tex = document.createElement('canvas');
  tex.width = tex.height = 90;
  var t = tex.getContext('2d');
  if (t) {
    t.fillStyle = 'rgba(0,0,0,0.55)';
    for (var i = 0; i < 1600; i++) {
      t.globalAlpha = 0.10 + Math.random() * 0.18;
      t.fillRect(Math.random() * 90, Math.random() * 90, 1, 1);
    }
  }
  _blobGrainTexture = tex;
  return tex;
}
function makeBlobAvatar(size, idx, palette) {
  var pal = palette || DEFAULT_BLOB_PALETTE;
  var seed = idx * 2.399 + 0.7;
  var baseSpeed = 0.80 + (idx % 4) * 0.12;
  var tilt = -0.34 + (idx % 3) * 0.20;
  var k = [6 + (idx % 3), 8 - (idx % 2), 4 + (idx % 2), 3];

  var reduceMotion = false;
  try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var dpr = Math.min(window.devicePixelRatio || 1, 1.6);
  var cv = document.createElement('canvas');
  cv.style.width = size + 'px';
  cv.style.height = size + 'px';
  cv.style.display = 'block';
  cv.width = Math.round(size * dpr);
  cv.height = Math.round(size * dpr);
  var ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  var pattern = ctx.createPattern(blobGrainTexture(), 'repeat');

  var bs = Math.max(44, Math.min(110, Math.round(size / 3.2)));
  var bcv = document.createElement('canvas');
  bcv.width = bs; bcv.height = bs;
  var bctx = bcv.getContext('2d');

  var talking = false;
  var level = 0; // 0..1, live loudness while talking - see attachTalkingLevel
  var dispAmpMul = 1, dispSpMul = 1; // eased toward the target below each
  // frame - drawing straight from the raw analyser level made the wobble
  // jump around every frame (smoothingTimeConstant only smooths frequency
  // data, not the raw waveform level is sampled from) and snapped hard on
  // the idle<->talking switch; this is the one thing that fixes both.

  function draw(t) {
    var s = size, c = s / 2, R = s * 0.395;
    // Scales with the actual sound instead of a flat "bigger and faster"
    // switch for the whole utterance, so pauses between words/sentences
    // visibly settle instead of wobbling at one constant intensity
    // throughout - that flatness was what read as "not really synced".
    // Only amplitude (wobble size) reacts to live loudness - pulsing
    // bigger/smaller reads as talking. Speed stays a fixed elevated rate
    // whenever talking is true (not level-driven): varying how fast the
    // phase advances, frame to frame, off a noisy live audio level made
    // it look like spinning/stuttering rather than pulsing.
    var targetAmpMul = talking ? (1.15 + level * 1.55) : 1;
    var targetSpMul = talking ? 1.55 : 1;
    dispAmpMul += (targetAmpMul - dispAmpMul) * 0.12;
    dispSpMul += (targetSpMul - dispSpMul) * 0.12;
    var amp = dispAmpMul, sp = baseSpeed * dispSpMul;
    var i, b, x, y, a, r;
    ctx.clearRect(0, 0, s, s);

    ctx.beginPath();
    var N = 108;
    for (i = 0; i <= N; i++) {
      a = i / N * Math.PI * 2;
      r = R * (1
        + amp * 0.056 * Math.sin(k[0] * a + t * 0.00062 * sp + seed)
        + amp * 0.036 * Math.sin(k[1] * a - t * 0.00046 * sp + seed * 1.7)
        + amp * 0.026 * Math.sin(k[2] * a + t * 0.00054 * sp + seed * 2.3)
        + amp * 0.017 * Math.sin(k[3] * a - t * 0.00024 * sp + seed * 3.1));
      x = c + Math.cos(a) * r; y = c + Math.sin(a) * r;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.save();
    ctx.clip();

    var qc = bctx, kk = bs / s;
    qc.setTransform(1, 0, 0, 1, 0, 0);
    qc.save();
    qc.translate(bs / 2, bs / 2); qc.rotate(tilt); qc.translate(-bs / 2, -bs / 2);
    try { qc.filter = 'blur(' + (bs * 0.026) + 'px)'; } catch (e) {}
    qc.fillStyle = pal[0];
    qc.fillRect(-bs, -bs, bs * 3, bs * 3);
    var n = pal.length;
    for (b = 1; b < n; b++) {
      var base = (-s * 0.18 + (s * 1.34) * (b / n)) * kk;
      qc.beginPath();
      qc.moveTo(-bs, bs * 2.2);
      for (x = -bs; x <= bs * 2; x += bs / 14) {
        y = base
          + bs * 0.075 * Math.sin((x / kk) * 0.019 + t * 0.00080 * sp + b * 1.25 + seed)
          + bs * 0.045 * Math.sin((x / kk) * 0.010 - t * 0.00034 * sp + b * 2.10 + seed * 0.6);
        qc.lineTo(x, y);
      }
      qc.lineTo(bs * 2.2, bs * 2.2);
      qc.closePath();
      qc.fillStyle = pal[b];
      qc.fill();
    }
    qc.restore();
    try { qc.filter = 'none'; } catch (e) {}
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(bcv, 0, 0, bs, bs, 0, 0, s, s);

    var lg = ctx.createRadialGradient(c - s * 0.16, c - s * 0.20, s * 0.03, c, c, s * 0.52);
    lg.addColorStop(0, 'rgba(255,255,255,0.30)');
    lg.addColorStop(0.45, 'rgba(255,255,255,0.06)');
    lg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = lg; ctx.fillRect(0, 0, s, s);

    var sg = ctx.createRadialGradient(c + s * 0.20, c + s * 0.24, s * 0.05, c, c, s * 0.56);
    sg.addColorStop(0, 'rgba(40,24,20,0.16)');
    sg.addColorStop(0.55, 'rgba(40,24,20,0.05)');
    sg.addColorStop(1, 'rgba(40,24,20,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, s, s);

    if (pattern) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.26;
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, s, s);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  draw(0);
  if (!reduceMotion) {
    (function loop(now) {
      requestAnimationFrame(loop);
      if (document.hidden) return;
      draw(now);
    })(0);
  }

  return {
    el: cv,
    setTalking: function (v) { talking = v; if (!v) level = 0; },
    setLevel: function (v) { level = v; }
  };
}

/* One AudioContext for the whole page - browsers cap how many can exist,
   and there's no reason to spin up a new graph per reply. Created lazily
   (and resumed from a user-gesture handler, see form submit below) since
   AudioContext starts "suspended" until a gesture allows it. */
var _sharedAudioCtx = null;
function getAudioContext() {
  if (_sharedAudioCtx) return _sharedAudioCtx;
  var Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  try { _sharedAudioCtx = new Ctor(); } catch (e) { return null; }
  return _sharedAudioCtx;
}

/* Feeds the blob's wobble from the sound actually coming out of `audio`,
   frame by frame - this is what makes "talking" track real speech rhythm
   (louder = bigger wobble, pauses = it settles) instead of one constant
   intensity for the whole reply. Routes the element's output through an
   AnalyserNode and back out to the speakers (createMediaElementSource
   takes over the element's audio routing entirely, so skipping the
   reconnect to destination would go silent). Best-effort: if Web Audio
   isn't available or attaching fails, returns a no-op stop and the blob
   just falls back to its old flat "talking" look for this utterance. */
function attachTalkingLevel(audio, setLevel) {
  var ctx = getAudioContext();
  if (!ctx) return function stop() {};
  var source, analyser;
  try {
    source = ctx.createMediaElementSource(audio);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.6;
    source.connect(analyser);
    analyser.connect(ctx.destination);
  } catch (e) {
    return function stop() {};
  }
  var data = new Uint8Array(analyser.frequencyBinCount);
  var raf = requestAnimationFrame(tick);
  function tick() {
    analyser.getByteTimeDomainData(data);
    var sumSquares = 0;
    for (var i = 0; i < data.length; i++) {
      var v = (data[i] - 128) / 128;
      sumSquares += v * v;
    }
    var rms = Math.sqrt(sumSquares / data.length);
    setLevel(Math.min(1, rms * 4.5));
    raf = requestAnimationFrame(tick);
  }
  return function stop() {
    cancelAnimationFrame(raf);
    setLevel(0);
    try { source.disconnect(); } catch (e) {}
    try { analyser.disconnect(); } catch (e) {}
  };
}

function initAgentWidget(config) {
  var agentName = config.agentName;
  var endpoint = config.endpoint;
  var enabled = !!config.enabled;
  var surface = config.surface;
  var getAccessToken = config.getAccessToken;
  var hasBlobAvatar = config.avatar === 'blob';
  var blobPalette = config.blobPalette || DEFAULT_BLOB_PALETTE;
  var hasTTS = !!config.tts;
  var sessionKey = 'dova_' + agentName.toLowerCase() + '_session_id';

  var root = document.createElement('div');
  root.className = 'agent-widget';
  root.innerHTML =
    '<button class="agent-widget-bubble' + (hasBlobAvatar ? ' has-blob' : '') + '" aria-label="Open ' + agentName + ' chat">' +
      (hasBlobAvatar ? '' : agentName.charAt(0)) +
      '<span class="agent-widget-bubble-dot"></span>' +
    '</button>' +
    '<div class="agent-widget-panel">' +
      '<div class="agent-widget-header">' +
        '<span>' + agentName + '</span>' +
        '<span class="agent-widget-header-status"></span>' +
        '<button class="agent-widget-close" aria-label="Close">&times;</button>' +
      '</div>' +
      '<div class="agent-widget-messages"></div>' +
      '<form class="agent-widget-form">' +
        '<input type="text" class="agent-widget-input" placeholder="Message ' + agentName + '&hellip;"' + (enabled ? '' : ' disabled') + '>' +
        '<button type="submit" class="agent-widget-send' + (hasBlobAvatar ? ' has-blob' : '') + '"' + (enabled ? '' : ' disabled') + ' aria-label="Send">' + (hasBlobAvatar ? '' : '&rarr;') + '</button>' +
      '</form>' +
    '</div>';
  document.body.appendChild(root);

  var bubble = root.querySelector('.agent-widget-bubble');
  var dot = root.querySelector('.agent-widget-bubble-dot');
  var panel = root.querySelector('.agent-widget-panel');
  var sendBtn = root.querySelector('.agent-widget-send');
  var blobInstances = [];
  if (hasBlobAvatar) {
    var bubbleBlob = makeBlobAvatar(38, 4, blobPalette);
    bubble.insertBefore(bubbleBlob.el, dot);
    blobInstances.push(bubbleBlob);

    // Send button IS the blob now, not an arrow glyph next to it.
    var sendBlob = makeBlobAvatar(30, 5, blobPalette);
    sendBtn.appendChild(sendBlob.el);
    blobInstances.push(sendBlob);

    // Fixed backdrop, anchored to the panel (not the scrolling messages
    // list) so it stays put in the background regardless of how long the
    // conversation gets - see .agent-widget-avatar-backdrop in admin.css
    // for why the panel (not .agent-widget-messages) is the thing this
    // is positioned against.
    var backdrop = document.createElement('div');
    backdrop.className = 'agent-widget-avatar-backdrop';
    var backdropBlob = makeBlobAvatar(150, 6, blobPalette);
    backdrop.appendChild(backdropBlob.el);
    panel.appendChild(backdrop);
    blobInstances.push(backdropBlob);

    // Small personality touches on the send-button blob - a hover
    // tooltip (throttled so it doesn't nag on every mouse pass) and a
    // canned reply when it's clicked with nothing typed. Both pull from
    // a small pool so repeat use doesn't feel scripted.
    var HOVER_LINES = [
      "I bet you're thinking of a prompt right now 😂",
      "Go on, I don't bite. Type something!",
      "Staring won't summon the answer — try typing 😄",
      "Hi. Yes, you. Got a question for me?"
    ];
    var EMPTY_LINES = [
      "You know I can't help you unless you enter a prompt, right?",
      "Empty message? Bold strategy. Try typing something first.",
      "I'd love to help, but... there's nothing here 👀",
      "Click all you want, I still need actual words."
    ];
    var hint = document.createElement('div');
    hint.className = 'agent-widget-hint';
    // form isn't assigned yet at this point in initAgentWidget's own
    // setup order (it's declared further down) - query it directly here
    // instead of referencing that not-yet-assigned variable.
    root.querySelector('.agent-widget-form').appendChild(hint);
    var hintTimer = null, lastHoverPoke = 0;
    function showHint(text) {
      hint.textContent = text;
      hint.classList.add('show');
      clearTimeout(hintTimer);
      hintTimer = setTimeout(function () { hint.classList.remove('show'); }, 2600);
    }
    sendBtn.addEventListener('mouseenter', function () {
      var now = Date.now();
      if (now - lastHoverPoke < 8000) return;
      lastHoverPoke = now;
      var line = HOVER_LINES[Math.floor(Math.random() * HOVER_LINES.length)];
      showHint(line);
      if (hasTTS) {
        speakReply(line);
      } else {
        setTalking(true);
        setTimeout(function () { setTalking(false); }, 1300);
      }
    });
  }
  function setTalking(isTalking) {
    blobInstances.forEach(function (b) { b.setTalking(isTalking); });
  }
  function setLevel(v) {
    blobInstances.forEach(function (b) { b.setLevel(v); });
  }

  /* Plays a fully-downloaded blob in one shot - the original approach,
     kept as the fallback for browsers that can't MSE-decode raw mp3
     (Firefox/Safari), and reused as the last-resort path if the
     streaming attempt below fails before playback ever starts. */
  function playBufferedAudio(res) {
    return res.blob().then(function (blob) {
      return new Promise(function (resolve) {
        var url = URL.createObjectURL(blob);
        var audio = new Audio(url);
        var stopLevel = function () {};
        function done() { stopLevel(); URL.revokeObjectURL(url); setTalking(false); resolve(); }
        audio.addEventListener('play', function () { setTalking(true); stopLevel = attachTalkingLevel(audio, setLevel); });
        audio.addEventListener('ended', done);
        audio.addEventListener('pause', done);
        audio.addEventListener('error', done);
        audio.play().catch(done);
      });
    });
  }

  /* Plays audio as it arrives instead of waiting for the whole file.
     Fish Audio streams synthesized audio back as it's generated, and
     the /tts proxy now relays it chunk-by-chunk (see eos_agent/server.py) -
     this is the piece that actually spends that: feeds each chunk into a
     MediaSource SourceBuffer as it lands, so playback can start on the
     first buffered chunk rather than the full download. Requires
     MediaSource support for raw audio/mpeg (Chrome/Edge; not Firefox or
     Safari), checked by the caller before this is used. */
  function playStreamedAudio(res) {
    return new Promise(function (resolve) {
      var audio = new Audio();
      var mediaSource = new MediaSource();
      var objectUrl = URL.createObjectURL(mediaSource);
      var settled = false;
      var stopLevel = function () {};

      function cleanup() {
        if (settled) return;
        settled = true;
        stopLevel();
        URL.revokeObjectURL(objectUrl);
        setTalking(false);
        resolve();
      }

      audio.addEventListener('play', function () { setTalking(true); stopLevel = attachTalkingLevel(audio, setLevel); });
      audio.addEventListener('ended', cleanup);
      audio.addEventListener('pause', cleanup);
      audio.addEventListener('error', cleanup);

      mediaSource.addEventListener('sourceopen', function () {
        var sourceBuffer;
        try {
          sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
        } catch (e) {
          cleanup();
          return;
        }

        var reader = res.body.getReader();
        var queue = [];
        var streamDone = false;

        function appendNext() {
          if (sourceBuffer.updating || !queue.length) return;
          sourceBuffer.appendBuffer(queue.shift());
        }
        sourceBuffer.addEventListener('updateend', function () {
          if (queue.length) {
            appendNext();
          } else if (streamDone && mediaSource.readyState === 'open') {
            try { mediaSource.endOfStream(); } catch (e) {}
          }
        });
        sourceBuffer.addEventListener('error', cleanup);

        function pump() {
          reader.read().then(function (result) {
            if (result.done) {
              streamDone = true;
              if (!sourceBuffer.updating && !queue.length && mediaSource.readyState === 'open') {
                try { mediaSource.endOfStream(); } catch (e) {}
              }
              return;
            }
            queue.push(result.value);
            appendNext();
            pump();
          }).catch(cleanup);
        }
        pump();
      });

      audio.src = objectUrl;
      audio.play().catch(cleanup);
    });
  }

  /* Real playback, not a stand-in: fetches speech audio from the agent's
     own /tts endpoint (Fish Audio called server-side there, key never
     touches the browser) and plays it, keeping the blob's talking state
     tied to actual audio play/pause/ended rather than the request/response
     window. Streams when the browser can decode it that way (see
     playStreamedAudio above); falls back to a full-buffer download
     otherwise. Best-effort - if FISH_API_KEY isn't configured yet or the
     call fails, the chat still works via text; it just falls back to
     resolving talking=false immediately (the caller already showed the
     reply either way). */
  function speakReply(text) {
    if (!hasTTS) return Promise.resolve();
    var ttsEndpoint = endpoint.replace(/\/chat\/?$/, '') + '/tts';
    var canStream = !!(window.MediaSource && MediaSource.isTypeSupported('audio/mpeg'));
    return fetch(ttsEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text })
    }).then(function (res) {
      if (!res.ok) throw new Error('tts request failed');
      if (canStream && res.body) return playStreamedAudio(res);
      return playBufferedAudio(res);
    }).catch(function () {
      setTalking(false);
    });
  }
  var closeBtn = root.querySelector('.agent-widget-close');
  var statusEl = root.querySelector('.agent-widget-header-status');
  var messages = root.querySelector('.agent-widget-messages');
  var form = root.querySelector('.agent-widget-form');
  var input = root.querySelector('.agent-widget-input');

  function open() {
    root.classList.add('open');
    if (enabled) input.focus();
  }
  function close() { root.classList.remove('open'); }
  bubble.addEventListener('click', function () {
    root.classList.contains('open') ? close() : open();
  });
  closeBtn.addEventListener('click', close);

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  /* Safe rendering: escape first, then re-introduce only **bold** and
     line breaks — never insert anything that wasn't just escaped. */
  function renderReplyText(text) {
    var safe = escapeHtml(text);
    safe = safe.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    safe = safe.replace(/\n/g, '<br>');
    return safe;
  }

  function addMessage(role, html) {
    var el = document.createElement('div');
    el.className = 'agent-widget-msg ' + role;
    el.innerHTML = html;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  }
  function addText(role, text) { return addMessage(role, escapeHtml(text)); }

  if (!enabled) {
    addText('assistant', agentName + " isn't wired up yet — coming soon.");
    return;
  }

  var sessionId = null;
  try { sessionId = sessionStorage.getItem(sessionKey); } catch (e) {}

  async function checkHealth() {
    try {
      var res = await fetch(endpoint.replace(/\/chat\/?$/, '') + '/health');
      return res.ok;
    } catch (e) {
      return false;
    }
  }
  checkHealth().then(function (ok) {
    dot.classList.toggle('live', ok);
    statusEl.textContent = ok ? 'Connected' : 'Offline';
  });

  addText('assistant', "Hi, I'm " + agentName + ". Ask me anything.");

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) {
      if (hasBlobAvatar) {
        var line = EMPTY_LINES[Math.floor(Math.random() * EMPTY_LINES.length)];
        addText('assistant', line);
        if (hasTTS) {
          var audioCtx = getAudioContext();
          if (audioCtx && audioCtx.state === 'suspended') { audioCtx.resume().catch(function () {}); }
          speakReply(line);
        } else {
          setTalking(true);
          setTimeout(function () { setTalking(false); }, 1300);
        }
      }
      return;
    }
    addText('user', text);
    input.value = '';

    if (hasTTS) {
      // Tied directly to this click so the browser's autoplay policy
      // doesn't later block resuming it after the async chat/TTS round
      // trips - AudioContext.resume() needs to trace back to a gesture.
      var audioCtx = getAudioContext();
      if (audioCtx && audioCtx.state === 'suspended') { audioCtx.resume().catch(function () {}); }
    }

    var typing = addMessage('assistant typing', '<span></span><span></span><span></span>');

    try {
      var payload = { message: text, session_id: sessionId };
      if (surface) payload.surface = surface;
      if (getAccessToken) {
        var token = getAccessToken();
        if (token) payload.access_token = token;
      }
      var res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      var data = await res.json();
      typing.remove();
      if (!res.ok) throw new Error(data.error || ('Request failed (' + res.status + ')'));
      sessionId = data.session_id;
      try { sessionStorage.setItem(sessionKey, sessionId); } catch (e) {}
      dot.classList.add('live');
      statusEl.textContent = 'Connected';
      if (data.handoff) {
        // Backend-side agent handoff (see dova-ai-agents' shared/handoff.py)
        // has no widget-side retargeting yet - reply is deliberately null on
        // this response shape. Surfacing an honest placeholder here instead
        // of feeding null into renderReplyText/speakReply, which used to
        // throw and get mistaken for the backend being down (a real 200 OK
        // read as a false "Offline" status - confirmed live on Table2Eat).
        addText('assistant', agentName + ' wants to bring in another specialist for this - that\'s not supported yet.');
        setTalking(false);
      } else {
        addMessage('assistant', renderReplyText(data.reply));
        if (hasTTS) {
          speakReply(data.reply);
        } else {
          setTalking(false);
        }
      }
    } catch (err) {
      typing.remove();
      addText('error', 'Could not reach ' + agentName + ' — is the backend running at ' + endpoint + '?');
      dot.classList.remove('live');
      statusEl.textContent = 'Offline';
      setTalking(false);
    }
  });
}

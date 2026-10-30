(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- particle network ---------------- */
  var canvas = document.getElementById("particles");
  var ctx = canvas.getContext("2d");
  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var particles = [];
  var mouse = { x: -9999, y: -9999, active: false };

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var target = Math.min(130, Math.floor(W * H / 11000));
    particles = [];
    for (var i = 0; i < target; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.36,
        vy: (Math.random() - 0.5) * 0.36,
        r: Math.random() * 1.7 + 0.6,
        hue: Math.random() < 0.72 ? 187 : 265,
        a: Math.random() * 0.55 + 0.25
      });
    }
  }

  var LINK_DIST = 132;
  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -20) p.x = W + 20;
      if (p.x > W + 20) p.x = -20;
      if (p.y < -20) p.y = H + 20;
      if (p.y > H + 20) p.y = -20;

      if (mouse.active) {
        var dx = p.x - mouse.x, dy = p.y - mouse.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 18000 && d2 > 0.01) {
          var d = Math.sqrt(d2);
          var f = (1 - d / 134) * 0.9;
          p.x += (dx / d) * f;
          p.y += (dy / d) * f;
        }
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "hsla(" + p.hue + ",100%,65%," + p.a + ")";
      ctx.fill();
    }

    for (var a = 0; a < particles.length; a++) {
      for (var b = a + 1; b < particles.length; b++) {
        var pa = particles[a], pb = particles[b];
        var ddx = pa.x - pb.x, ddy = pa.y - pb.y;
        var dist = ddx * ddx + ddy * ddy;
        if (dist < LINK_DIST * LINK_DIST) {
          var alpha = (1 - Math.sqrt(dist) / LINK_DIST) * 0.32;
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.strokeStyle = "rgba(0,234,255," + alpha + ")";
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });
  window.addEventListener("mouseout", function () { mouse.active = false; });
  if (!reduce) draw();

  /* ---------------- reveal on scroll + bars + counters ---------------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      en.target.querySelectorAll(".bar i").forEach(function (bar) {
        bar.style.width = bar.getAttribute("data-w") + "%";
      });
      en.target.querySelectorAll("[data-count]").forEach(function (el) {
        if (el.dataset.done) return;
        el.dataset.done = "1";
        var end = +el.dataset.count, suffix = el.dataset.suffix || "";
        var t0 = performance.now(), dur = 1500;
        function step(t) {
          var k = Math.min((t - t0) / dur, 1);
          var e = 1 - Math.pow(1 - k, 3);
          el.textContent = Math.round(end * e) + suffix;
          if (k < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
      io.unobserve(en.target);
    });
  }, { threshold: 0.16 });

  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  document.querySelectorAll(".course").forEach(function (el) { io.observe(el); });

  /* ---------------- typing effect (文案来自 mock 数据) ---------------- */
  var typingEl = document.getElementById("typing");
  var lines = [];
  var li = 0, ci = 0, deleting = false;

  function tick() {
    var full = lines[li];
    if (!full) return;
    if (!deleting) {
      ci++;
      typingEl.innerHTML = full.slice(0, ci) + '<span class="cursor"></span>';
      if (ci === full.length) {
        deleting = true;
        setTimeout(tick, 1700);
        return;
      }
      setTimeout(tick, 62);
    } else {
      ci--;
      typingEl.innerHTML = full.slice(0, ci) + '<span class="cursor"></span>';
      if (ci === 0) {
        deleting = false;
        li = (li + 1) % lines.length;
        setTimeout(tick, 320);
        return;
      }
      setTimeout(tick, 32);
    }
  }

  window.API.getProfile().then(function (profile) {
    lines = profile.typingLines || [];
    if (!lines.length) return;
    if (!reduce) setTimeout(tick, 700);
    else typingEl.textContent = lines[0];
  });

  /* ---------------- nav + scroll progress ---------------- */
  var nav = document.getElementById("nav");
  var progress = document.getElementById("progress");

  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    if (y > 24) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------- card spotlight ---------------- */
  document.querySelectorAll(".card, .stat").forEach(function (card) {
    card.addEventListener("mousemove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });
})();

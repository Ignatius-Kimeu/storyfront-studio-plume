(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.remove("no-js");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- splash (home only, once per visit) ---------- */
  var splash = $("#splash");
  if (splash) {
    var seen = false;
    try { seen = sessionStorage.getItem("plume-splash") === "1"; sessionStorage.setItem("plume-splash", "1"); } catch (e) {}
    var hide = function () { splash.classList.add("gone"); setTimeout(function () { splash.remove(); }, 800); };
    if (seen || reduced) { splash.remove(); }
    else { window.addEventListener("load", function () { setTimeout(hide, 450); }); setTimeout(hide, 2600); }
  }

  /* ---------- smart sticky header + mobile menu ---------- */
  var header = $(".site-header"), menuBtn = $(".menu-btn"), nav = $("#nav");
  var lastY = window.scrollY;
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle("scrolled", y > 10);
      if (!nav || !nav.classList.contains("open")) header.classList.toggle("hide", y > lastY && y > 160);
    }
    lastY = y;
  }, { passive: true });
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open);
      menuBtn.textContent = open ? "Close" : "Menu";
      document.body.style.overflow = open ? "hidden" : "";
    });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () {
      nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); menuBtn.textContent = "Menu"; document.body.style.overflow = "";
    }); });
  }

  /* ---------- reveal + LED traces ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal").forEach(function (el) { io.observe(el); });

    var ledIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var l = $(".led", e.target); if (!l) return;
        if (e.isIntersecting) l.classList.add("on");
      });
    }, { threshold: 0.2 });
    $$("[data-led]").forEach(function (sec) {
      var r = $(".led rect", sec);
      if (r) { try { var len = Math.ceil(r.getTotalLength()); r.style.setProperty("--len", len); r.style.strokeDasharray = len; r.style.strokeDashoffset = reduced ? 0 : len; } catch (e) {} }
      ledIO.observe(sec);
    });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("in"); });
  }
  // the LED rect is sized in % so its length changes with the section; recompute on resize
  window.addEventListener("resize", function () {
    $$("[data-led] .led rect").forEach(function (r) { try { var len = Math.ceil(r.getTotalLength()); r.style.setProperty("--len", len); r.style.strokeDasharray = len; if (!r.parentNode.parentNode.classList.contains("on")) r.style.strokeDashoffset = len; else r.style.strokeDashoffset = 0; } catch (e) {} });
  });

  /* ---------- hero parallax (pointer + scroll), subtle ---------- */
  var par = $("[data-parallax]");
  if (par && !reduced) {
    var px = 0, py = 0, sy = 0, ticking = false;
    var apply = function () { par.style.transform = "translate3d(" + px * 14 + "px," + (py * 10 + sy * 0.18) + "px,0) scale(1.04)"; ticking = false; };
    var queue = function () { if (!ticking) { ticking = true; requestAnimationFrame(apply); } };
    window.addEventListener("pointermove", function (e) { if (e.pointerType !== "mouse") return; px = e.clientX / innerWidth - 0.5; py = e.clientY / innerHeight - 0.5; queue(); }, { passive: true });
    window.addEventListener("scroll", function () { sy = Math.min(window.scrollY, 900); queue(); }, { passive: true });
  }

  /* ---------- 3D tilt on cards (mouse only) ---------- */
  if (!reduced && window.matchMedia("(hover: hover)").matches) {
    $$(".tilt").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = "perspective(900px) rotateY(" + x * 6 + "deg) rotateX(" + -y * 6 + "deg) translateZ(0)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- flip cards: tap to flip on touch ---------- */
  $$(".flip").forEach(function (f) {
    f.addEventListener("click", function (e) { if (e.target.closest("a")) return; if (!window.matchMedia("(hover: hover)").matches) f.classList.toggle("flipped"); });
    f.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); f.classList.toggle("flipped"); } });
  });

  /* ---------- 3D carousel ---------- */
  $$("[data-carousel]").forEach(function (car) {
    var ring = $(".ring", car), figs = $$("figure", ring), n = figs.length, idx = 0;
    var ctrl = car.nextElementSibling, count = ctrl && $("[data-count]", ctrl);
    var radius = function () { var w = ring.offsetWidth; return Math.round((w / 2) / Math.tan(Math.PI / n)) + 40; };
    var layout = function () {
      var r = radius();
      figs.forEach(function (f, i) { f.style.transform = "rotateY(" + (360 / n) * i + "deg) translateZ(" + r + "px)"; });
      go(idx);
    };
    var go = function (i) {
      idx = (i + n) % n;
      ring.style.transform = "translateZ(" + -radius() + "px) rotateY(" + (-360 / n) * i + "deg)";
      figs.forEach(function (f, k) { f.classList.toggle("front", k === idx); });
      if (count) count.textContent = (idx + 1) + " / " + n;
      cur = i;
    };
    var cur = 0;
    ctrl && $("[data-prev]", ctrl).addEventListener("click", function () { go(cur - 1); stopAuto(); });
    ctrl && $("[data-next]", ctrl).addEventListener("click", function () { go(cur + 1); stopAuto(); });
    car.tabIndex = 0;
    car.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") { go(cur - 1); stopAuto(); } if (e.key === "ArrowRight") { go(cur + 1); stopAuto(); } });
    var sx = null;
    car.addEventListener("pointerdown", function (e) { sx = e.clientX; });
    car.addEventListener("pointerup", function (e) { if (sx === null) return; var dx = e.clientX - sx; if (Math.abs(dx) > 40) { go(cur + (dx < 0 ? 1 : -1)); stopAuto(); } sx = null; });
    var timer = null;
    var startAuto = function () { if (reduced) return; timer = setInterval(function () { go(cur + 1); }, 4200); };
    var stopAuto = function () { clearInterval(timer); timer = null; };
    car.addEventListener("mouseenter", stopAuto);
    window.addEventListener("resize", layout);
    layout(); startAuto();
  });

  /* ---------- films: poster until tapped, poster returns on pause/end, one at a time ---------- */
  var playing = null;
  var ICON_SOUND = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  var ICON_MUTE = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="1.6"/></svg>';
  var ICON_FS = '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  $$(".film[data-src]").forEach(function (tile) {
    var v = null, snd, fs;
    var build = function () {
      v = document.createElement("video");
      v.src = tile.getAttribute("data-src");
      v.preload = "metadata"; v.playsInline = true; v.setAttribute("playsinline", "");
      v.poster = $(".poster", tile).getAttribute("src");
      tile.insertBefore(v, tile.firstChild);
      var ctl = document.createElement("div"); ctl.className = "ctl";
      snd = document.createElement("button"); snd.type = "button"; snd.setAttribute("aria-label", "Mute"); snd.innerHTML = ICON_SOUND;
      fs = document.createElement("button"); fs.type = "button"; fs.setAttribute("aria-label", "Fullscreen"); fs.innerHTML = ICON_FS;
      ctl.appendChild(snd); ctl.appendChild(fs); tile.appendChild(ctl);
      snd.addEventListener("click", function (e) { e.stopPropagation(); setMuted(!v.muted); });
      fs.addEventListener("click", function (e) {
        e.stopPropagation();
        var el = v;
        if (el.requestFullscreen) el.requestFullscreen().catch(function () {});
        else if (el.webkitEnterFullscreen) el.webkitEnterFullscreen();
      });
      v.addEventListener("play", function () { tile.classList.add("playing"); });
      v.addEventListener("pause", function () { tile.classList.remove("playing"); });
      v.addEventListener("ended", function () { tile.classList.remove("playing"); v.currentTime = 0; });
    };
    var setMuted = function (m) {
      v.muted = m; snd.innerHTML = m ? ICON_MUTE : ICON_SOUND; snd.setAttribute("aria-label", m ? "Unmute" : "Mute");
    };
    var toggle = function () {
      if (!v) build();
      if (v.paused) {
        if (playing && playing !== v) playing.pause(); // only one film (and one sound) at a time
        playing = v; setMuted(false);
        var p = v.play(); if (p && p.catch) p.catch(function () { setMuted(true); v.play().catch(function () {}); });
      } else { v.pause(); }
    };
    tile.addEventListener("click", function (e) { if (e.target.closest(".ctl")) return; toggle(); });
    tile.addEventListener("keydown", function (e) { if (e.target !== tile) return; if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
  });
  // pause films that scroll out of view so the poster comes back
  if ("IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting) { var v = $("video", e.target); if (v && !v.paused && !document.fullscreenElement) v.pause(); } }); }, { threshold: 0.15 });
    $$(".film[data-src]").forEach(function (t) { vio.observe(t); });
  }

  /* ---------- hero film modal ---------- */
  var modal = $("#film-modal");
  if (modal) {
    var closeModal = function () { var v = $("video", modal); if (v) v.pause(); modal.hidden = true; document.body.style.overflow = ""; };
    $$("[data-film-modal]").forEach(function (b) { b.addEventListener("click", function () {
      modal.hidden = false; document.body.style.overflow = "hidden";
      var tile = $(".film", modal); tile.focus(); tile.click();
    }); });
    $("[data-close]", modal).addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) closeModal(); });
  }

  /* ---------- lightbox ---------- */
  var lb = $("#lightbox");
  if (lb) {
    var items = [], at = 0, lastFocus = null;
    var img = $("#lb-img"), cap = $("#lb-cap"), cnt = $("#lb-count");
    var show = function (i) { at = (i + items.length) % items.length; var it = items[at]; img.src = it.getAttribute("data-full"); img.alt = it.querySelector("img").alt; cap.textContent = it.getAttribute("data-caption"); cnt.textContent = (at + 1) + " / " + items.length; };
    var open = function (group, el) { items = $$('[data-lightbox="' + group + '"]'); lastFocus = el; show(items.indexOf(el)); lb.hidden = false; document.body.style.overflow = "hidden"; $("[data-lb-close]", lb).focus(); };
    var close = function () { lb.hidden = true; document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); };
    $$("[data-lightbox]").forEach(function (el) { el.addEventListener("click", function () { open(el.getAttribute("data-lightbox"), el); }); });
    $("[data-lb-close]", lb).addEventListener("click", close);
    $("[data-lb-prev]", lb).addEventListener("click", function () { show(at - 1); });
    $("[data-lb-next]", lb).addEventListener("click", function () { show(at + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lb-stage")) close(); });
    document.addEventListener("keydown", function (e) { if (lb.hidden) return; if (e.key === "Escape") close(); if (e.key === "ArrowLeft") show(at - 1); if (e.key === "ArrowRight") show(at + 1); });
    var tx = null;
    lb.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) show(at + (dx < 0 ? 1 : -1)); tx = null; });
  }

  /* ---------- hours: highlight today ---------- */
  var hrs = $("[data-hours]");
  if (hrs) { var r = $('tr[data-d="' + new Date().getDay() + '"]', hrs); if (r) r.classList.add("today"); }

  /* ---------- timetable + booking ---------- */
  var P = window.PLUME; if (!P) return;
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var toMin = function (t) { var p = t.split(":"); return +p[0] * 60 + +p[1]; };
  var fmt = function (m) { var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? "pm" : "am", h12 = h % 12 || 12; return h12 + ":" + (mm < 10 ? "0" : "") + mm + ap; };
  var range = function (t) { var s = toMin(t); return fmt(s) + " – " + fmt(s + 60); };
  var classes = P.classes.map(function (c) { return { day: c[0], start: c[1], cls: c[2], lvl: c[3], who: c[4] }; })
    .sort(function (a, b) { return toMin(a.start) - toMin(b.start); });
  var nowMin = function () { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  var nextDate = function (day) { var d = new Date(); var diff = (day - d.getDay() + 7) % 7; d.setDate(d.getDate() + diff); return d; };
  var iso = function (d) { var m = d.getMonth() + 1, dd = d.getDate(); return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (dd < 10 ? "0" : "") + dd; };

  var slotHTML = function (c, isToday) {
    var past = isToday && toMin(c.start) + 15 < nowMin();
    var lv = c.lvl.toLowerCase();
    return '<article class="slot' + (past ? " past" : "") + '">' +
      '<time>' + range(c.start) + '</time>' +
      '<span class="cls">' + c.cls + '</span>' +
      '<span class="meta"><span class="lvl lvl-' + lv + '">' + c.lvl + '</span>with ' + c.who + '</span>' +
      (past ? '' : '<a class="btn btn-olive btn-sm" href="timetable.html#book" data-req="' + c.day + '|' + c.start + '|' + c.cls + '">Request</a>') +
      '</article>';
  };

  // home: today's remaining classes, else tomorrow's
  var todayBox = $("[data-today]");
  if (todayBox) {
    var d = new Date().getDay();
    var list = classes.filter(function (c) { return c.day === d && toMin(c.start) + 15 >= nowMin(); });
    var label = $("[data-today-label]");
    if (!list.length) { d = (d + 1) % 7; list = classes.filter(function (c) { return c.day === d; }); if (label) label.textContent = "Tomorrow at Plume · " + DAYS[d]; }
    else if (label) label.textContent = "Today at Plume · " + DAYS[d];
    todayBox.innerHTML = list.slice(0, 6).map(function (c) { return slotHTML(c, false); }).join("") || '<p class="empty-note">No classes on the schedule. Message us on WhatsApp for times.</p>';
  }

  // timetable page
  var week = $("[data-week]"), tabs = $("[data-day-tabs]");
  var state = { day: new Date().getDay(), cls: "all", lvl: "all" };
  // if today's classes are all done, open on the next day that still has some
  var firstOpenDay = function (cls) {
    for (var k = 0; k < 7; k++) {
      var dd = (new Date().getDay() + k) % 7;
      if (classes.some(function (c) { return c.day === dd && (!cls || c.cls === cls) && (k > 0 || toMin(c.start) > nowMin()); })) return k;
    }
    return 0;
  };
  state.day = (new Date().getDay() + firstOpenDay()) % 7;
  var renderWeek = function () {
    if (!week) return;
    var isToday = state.day === new Date().getDay();
    var list = classes.filter(function (c) { return c.day === state.day && (state.cls === "all" || c.cls === state.cls) && (state.lvl === "all" || c.lvl === state.lvl); });
    week.innerHTML = list.map(function (c) { return slotHTML(c, isToday); }).join("") ||
      '<p class="empty-note">No ' + (state.cls === "all" ? "" : state.cls.toLowerCase() + " ") + (state.lvl === "all" ? "" : state.lvl.toLowerCase() + " ") + "classes on " + DAYS[state.day] + (state.day === 2 ? " afternoon. Tuesday afternoons are closed." : ". Try another day or level.") + "</p>";
    $$("button", tabs).forEach(function (b) { b.setAttribute("aria-selected", +b.getAttribute("data-d") === state.day); b.tabIndex = +b.getAttribute("data-d") === state.day ? 0 : -1; });
  };
  if (tabs) {
    var order = [1, 2, 3, 4, 5, 6, 0];
    tabs.innerHTML = order.map(function (d) { return '<button type="button" role="tab" data-d="' + d + '">' + SHORT[d] + (d === new Date().getDay() ? '<span class="d">today</span>' : "") + "</button>"; }).join("");
    tabs.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; state.day = +b.getAttribute("data-d"); renderWeek(); });
    tabs.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var i = order.indexOf(state.day) + (e.key === "ArrowRight" ? 1 : -1); state.day = order[(i + 7) % 7]; renderWeek(); $('button[data-d="' + state.day + '"]', tabs).focus();
    });
    $$("[data-filter]").forEach(function (g) {
      g.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return;
        $$("button", g).forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
        state[g.getAttribute("data-filter")] = b.getAttribute("data-v"); renderWeek(); });
    });
    renderWeek();
  }

  // booking form
  var form = $("#book-form");
  var pending = null;
  try { pending = JSON.parse(sessionStorage.getItem("plume-req") || "null"); sessionStorage.removeItem("plume-req"); } catch (e) {}
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-req]"); if (!a) return;
    var p = a.getAttribute("data-req").split("|"); var req = { day: +p[0], start: p[1], cls: p[2] };
    if (form) { e.preventDefault(); fill(req); $("#book").scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); setTimeout(function () { $("#f-name").focus({ preventScroll: true }); }, 600); }
    else { try { sessionStorage.setItem("plume-req", JSON.stringify(req)); } catch (er) {} }
  });
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-book-class]"); if (!a) return;
    var map = { reformer: "Reformer", mat: "Mat Pilates", chair: "Wunda Chair", cadillac: "Cadillac", "private": "Private session" };
    try { sessionStorage.setItem("plume-req", JSON.stringify({ cls: map[a.getAttribute("data-book-class")] })); } catch (er) {}
  });
  if (!form) return;

  var fClass = $("#f-class"), fDate = $("#f-date"), fTime = $("#f-time"), fName = $("#f-name"), err = $("#f-err"), prev = $("#f-preview");
  fDate.min = iso(new Date());
  var max = new Date(); max.setDate(max.getDate() + 60); fDate.max = iso(max);
  var scheduled = function (cls) { return cls === "Reformer" || cls === "Mat Pilates"; };
  var parseDate = function (s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); };

  var fillTimes = function (keep) {
    var cls = fClass.value, opts = [];
    if (scheduled(cls) && fDate.value) {
      var dt = parseDate(fDate.value), isToday = iso(dt) === iso(new Date());
      opts = classes.filter(function (c) { return c.cls === cls && c.day === dt.getDay() && (!isToday || toMin(c.start) > nowMin()); })
        .map(function (c) { return { v: c.start, t: range(c.start) + " · " + c.lvl + " with " + c.who }; });
      if (!opts.length) { fTime.innerHTML = '<option value="">No ' + cls.toLowerCase() + " classes left that day</option>"; fTime.disabled = true; update(); return; }
    } else if (scheduled(cls)) {
      fTime.innerHTML = '<option value="">Pick a date first</option>'; fTime.disabled = true; update(); return;
    } else {
      opts = [{ v: "Morning", t: "Morning (we'll suggest times)" }, { v: "Afternoon", t: "Afternoon (we'll suggest times)" }, { v: "Evening", t: "Evening (we'll suggest times)" }];
    }
    fTime.disabled = false;
    fTime.innerHTML = opts.map(function (o) { return '<option value="' + o.v + '">' + o.t + "</option>"; }).join("");
    if (keep) fTime.value = keep;
    update();
  };
  var message = function () {
    var cls = fClass.value, dt = fDate.value ? parseDate(fDate.value) : null, t = fTime.value;
    var c = scheduled(cls) && dt ? classes.filter(function (x) { return x.cls === cls && x.day === dt.getDay() && x.start === t; })[0] : null;
    var exp = (form.querySelector('input[name="exp"]:checked') || {}).value || "";
    var lines = ["Hi Studio Plume! I'd like to request a class.", "",
      "Class: " + cls + (c ? " (" + c.lvl + ") with " + c.who : ""),
      "Date: " + (dt ? DAYS[dt.getDay()] + " " + dt.getDate() + " " + dt.toLocaleString("en-GB", { month: "long" }) + " " + dt.getFullYear() : "—"),
      "Time: " + (c ? range(c.start) : (t || "—")),
      exp, "Name: " + (fName.value.trim() || "—"), "", "Could you confirm if there's a spot? Thank you!"];
    return lines.join("\n");
  };
  var update = function () { prev.textContent = message(); };
  var fill = function (req) {
    if (req.cls) fClass.value = req.cls;
    if (typeof req.day === "number") { fDate.value = iso(nextDate(req.day)); }
    fillTimes(req.start);
  };

  fClass.addEventListener("change", function () { fillTimes(); });
  fDate.addEventListener("change", function () { fillTimes(); });
  [fTime, fName].forEach(function (el) { el.addEventListener("input", update); el.addEventListener("change", update); });
  $$('input[name="exp"]', form).forEach(function (r) { r.addEventListener("change", update); });

  form.addEventListener("submit", function (e) {
    e.preventDefault(); err.textContent = "";
    var today = iso(new Date());
    if (!fDate.value) { err.textContent = "Choose the date you'd like to come."; fDate.focus(); return; }
    if (fDate.value < today) { err.textContent = "That date has passed. Choose today or a later date."; fDate.focus(); return; }
    if (!fTime.value) { err.textContent = "There's no class at that time. Choose another day or class."; fDate.focus(); return; }
    if (!fName.value.trim()) { err.textContent = "Add your first name so the studio knows who's coming."; fName.focus(); return; }
    window.open("https://wa.me/" + P.whatsapp + "?text=" + encodeURIComponent(message()), "_blank", "noopener");
  });

  if (pending) fill(pending); else { var d0 = new Date(); d0.setDate(d0.getDate() + firstOpenDay("Reformer")); fDate.value = iso(d0); fillTimes(); }
})();

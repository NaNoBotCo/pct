/* trail.js: the PCT as numbers you can walk through, and as pictures made of those numbers.
   Data comes from window.PCT (inlined by tools/build.py from tools/glean/): the elevation profile
   [[mile, ft]], the waypoints [{name, mile, lat, lon, ft, kind}], and the constants each section uses.
     #walkit   drag along the profile: elevation, climb so far, Everests, days, date, moon, daylight, steps
     #ridges   the profile as stacked 100-mile ridgelines; tap one for its numbers
     #bubble   a timetable chart of modeled hikers, date across and mile up; your own line on top
     #now      live weather along the trail (Open-Meteo) and fires near it (NIFC WFIGS)
   Everything here is arithmetic on the data; the model in #bubble is labelled as a model on the page. */
(function () {
'use strict';
var D = window.PCT; if (!D) return;
var TH = document.documentElement.lang === 'th', T = function (en, th) { return TH ? th : en; };
var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var DPR = Math.min(window.devicePixelRatio || 1, 2), MILES = D.miles;
var css = function (n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#888'; };
var fmt = function (n, d) { return (+n).toLocaleString(TH ? 'th-TH' : 'en-US', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); };
var mi2 = function (m) { return TH ? fmt(m * 1.609344) + ' กม.' : fmt(m) + ' mi'; };
var ft2 = function (f) { return TH ? fmt(f * 0.3048) + ' ม.' : fmt(f) + ' ft'; };
var $ = function (id) { return document.getElementById(id); };

/* ---------------- the profile, and what accumulates along it */
var P = D.profile, N = P.length, GAIN = [0], LOSS = [0];
for (var i = 1; i < N; i++) { var dz = P[i][1] - P[i - 1][1]; GAIN[i] = GAIN[i - 1] + Math.max(0, dz); LOSS[i] = LOSS[i - 1] + Math.max(0, -dz); }
// the profile's own climb, scaled to the trail's measured total (D.gain.total), so a coarse profile still adds up right
var KG = D.gain && D.gain.total ? D.gain.total / GAIN[N - 1] : 1, KL = D.gain && D.gain.loss ? D.gain.loss / LOSS[N - 1] : KG;
function at(arr, m) { var lo = 0, hi = N - 1; if (m <= P[0][0]) return arr === null ? P[0][1] : arr[0]; if (m >= P[hi][0]) return arr === null ? P[hi][1] : arr[hi];
  while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (P[mid][0] <= m) lo = mid; else hi = mid; }
  var u = (m - P[lo][0]) / (P[hi][0] - P[lo][0]); return arr === null ? P[lo][1] + (P[hi][1] - P[lo][1]) * u : arr[lo] + (arr[hi] - arr[lo]) * u; }
var elev = function (m) { return at(null, m); }, gain = function (m) { return at(GAIN, m) * KG; }, loss = function (m) { return at(LOSS, m) * KL; };
var W = D.waypoints.slice().sort(function (a, b) { return a.mile - b.mile; });
function latAt(m) { for (var j = 1; j < W.length; j++) if (W[j].mile >= m) { var a = W[j - 1], b = W[j], u = (m - a.mile) / ((b.mile - a.mile) || 1); return a.lat + (b.lat - a.lat) * u; } return W[W.length - 1].lat; }
function stateAt(m) { return m < D.border.or ? 'CA' : m < D.border.wa ? 'OR' : 'WA'; }

/* ---------------- a typical northbound walk: a pace per section, a zero day each week, the snow gate */
var PACE = D.pace; // [{to: mile, mpd: miles per walking day}], from the sources on the page
function walk(startDay, k) { // returns mile -> day (days after 1 Jan) for a hiker who starts on startDay at speed factor k
  var out = [[0, startDay]], m = 0, d = startDay, s = 0, walked = 0, gated = false;
  out.gate = false;
  while (m < MILES && d < startDay + 260) {
    while (PACE[s].to <= m) s++;
    if (m >= D.snow.mile && !gated) { gated = true; if (d < D.snow.day) { out.push([m, d]); d = D.snow.day; out.gate = true; out.push([m, d]); } }
    var step = PACE[s].mpd * k * (s === 0 ? Math.min(1, 0.72 + walked / 260) : 1); // legs come in over the first weeks
    m = Math.min(MILES, m + step); d += 1; walked++;
    if (walked % 7 === 0) d += 1; // a zero a week
    out.push([m, d]);
  }
  return out;
}
var dayOf = function (pts, m) { for (var j = 1; j < pts.length; j++) if (pts[j][0] >= m) { var a = pts[j - 1], b = pts[j]; return a[1] + (b[1] - a[1]) * ((m - a[0]) / ((b[0] - a[0]) || 1)); } return pts[pts.length - 1][1]; };
var YEAR = D.year, jan1 = Date.UTC(YEAR, 0, 1);
var dateOf = function (day) { return new Date(jan1 + day * 864e5); };
var dstr = function (day) { return dateOf(day).toLocaleDateString(TH ? 'th-TH' : 'en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }); };
var doy = function (y, mo, dd) { return (Date.UTC(y, mo - 1, dd) - jan1) / 864e5; };

/* ---------------- sky arithmetic */
function moonPhase(t) { var p = ((t - Date.UTC(2000, 0, 6, 18, 14)) / 864e5) / 29.530588853; return p - Math.floor(p); } // 0 new, .5 full
function daylight(lat, day) { var r = Math.PI / 180, dec = 23.44 * Math.sin(2 * Math.PI * (284 + day + 1) / 365) * r, ph = lat * r;
  var c = (Math.sin(-0.833 * r) - Math.sin(ph) * Math.sin(dec)) / (Math.cos(ph) * Math.cos(dec)); return c <= -1 ? 24 : c >= 1 ? 0 : 2 * Math.acos(c) / r / 15; }
function drawMoon(c, x, y, r, ph, lit, dark) { c.save(); c.translate(x, y); c.fillStyle = dark; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
  var k = Math.cos(ph * 2 * Math.PI), wax = ph < 0.5; c.fillStyle = lit; c.beginPath(); wax ? c.arc(0, 0, r, -Math.PI / 2, Math.PI / 2) : c.arc(0, 0, r, Math.PI / 2, Math.PI * 1.5); c.fill();
  c.fillStyle = k > 0 ? dark : lit; c.beginPath(); c.ellipse(0, 0, Math.abs(k) * r + 0.01, r, 0, 0, 7); c.fill(); c.restore(); }

function canvasOf(cv, h) { var w = cv.clientWidth; cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR); cv.style.height = h + 'px'; var c = cv.getContext('2d'); c.setTransform(DPR, 0, 0, DPR, 0, 0); return { c: c, w: w, h: h }; }
var rng = function (s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };

/* ======================================================================= #walkit */
(function () {
  var cv = $('prof'), rg = $('mi'); if (!cv || !rg) return;
  var START = doy(YEAR, 4, 20), me = walk(START, 1), mile = +rg.value || 1331, G;
  var stars = (function () { var r = rng(7), a = []; for (var j = 0; j < 90; j++) a.push([r(), r() * 0.55, r()]); return a; })();
  function draw() {
    var h = Math.max(220, Math.min(340, cv.clientWidth * 0.36)); G = canvasOf(cv, h); var c = G.c, w = G.w;
    var top = 26, base = h - 30, X = function (m) { return 8 + (m / MILES) * (w - 16); }, Y = function (f) { return base - ((f) / 14000) * (base - top); };
    // sky: night blue to the dusk at the horizon; stars over the high country
    var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0d1030'); g.addColorStop(0.7, '#3a3466'); g.addColorStop(1, '#a8687a'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    stars.forEach(function (s) { c.globalAlpha = 0.35 + 0.6 * s[2]; c.fillStyle = '#fff4d8'; c.fillRect(s[0] * w, s[1] * h, s[2] > 0.9 ? 2 : 1.2, s[2] > 0.9 ? 2 : 1.2); }); c.globalAlpha = 1;
    // three echo ridges behind, then the trail's own profile, coloured by state
    [[0.06, 0.18, '#57507a'], [0.03, 0.3, '#6f5f84']].forEach(function (e, j) { c.fillStyle = e[2]; c.beginPath(); c.moveTo(0, base);
      for (var x = 0; x <= w; x += 3) { var m = ((x / w) * MILES + j * 140) % MILES; c.lineTo(x, Y(elev(m) * (0.82 - e[0]) + 1500)); } c.lineTo(w, base); c.fill(); });
    var cols = { CA: '#c8793c', OR: '#4f8a52', WA: '#2f7d86' };
    ['CA', 'OR', 'WA'].forEach(function (st) { var a = st === 'CA' ? 0 : st === 'OR' ? D.border.or : D.border.wa, b = st === 'CA' ? D.border.or : st === 'OR' ? D.border.wa : MILES;
      c.fillStyle = cols[st]; c.beginPath(); c.moveTo(X(a), base); for (var m = a; m <= b; m += 2) c.lineTo(X(m), Y(elev(m))); c.lineTo(X(b), base); c.fill(); });
    // snow on what stands above 10,000 ft
    c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); var on = false;
    for (var m = 0; m <= MILES; m += 1) { var f = elev(m); if (f > 10000) { if (!on) { c.moveTo(X(m), Y(10000)); on = true; } c.lineTo(X(m), Y(f)); } else if (on) { c.lineTo(X(m), Y(10000)); c.closePath(); on = false; } } c.fill();
    c.strokeStyle = '#1a1420'; c.lineWidth = 1.4; c.beginPath(); for (m = 0; m <= MILES; m += 2) { var x = X(m), y = Y(elev(m)); m ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    c.fillStyle = '#1a1420'; c.fillRect(0, base, w, h - base);
    // the big places, ticked under the ground line
    c.font = '600 10px ' + css('--body'); c.textAlign = 'center';
    W.filter(function (p) { return p.big; }).forEach(function (p, j) { var x = X(p.mile); c.fillStyle = '#f3e9d2'; c.fillRect(x - 0.5, base, 1, 5); c.globalAlpha = 0.8; c.fillText(p.short || p.name, Math.max(24, Math.min(w - 24, x)), base + 15 + (j % 2) * 10); c.globalAlpha = 1; });
    // the walker: a line down to the ground, a dot, a small figure with a pack
    var x0 = X(mile), y0 = Y(elev(mile));
    c.strokeStyle = 'rgba(255,217,122,.75)'; c.setLineDash([3, 4]); c.beginPath(); c.moveTo(x0, top - 10); c.lineTo(x0, base); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#ffd97a'; c.beginPath(); c.arc(x0, y0, 4.5, 0, 7); c.fill();
    c.strokeStyle = '#ffd97a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, y0 - 6); c.lineTo(x0, y0 - 18); c.moveTo(x0, y0 - 12); c.lineTo(x0 + 6, y0 - 6); c.moveTo(x0 + 6, y0 - 20); c.lineTo(x0 + 9, y0 - 4); c.stroke();
    c.beginPath(); c.arc(x0, y0 - 22, 3.2, 0, 7); c.fill(); c.fillRect(x0 - 6, y0 - 18, 4, 8);
    // that night's moon, top right
    var day = dayOf(me, mile), ph = moonPhase(jan1 + day * 864e5); drawMoon(c, w - 26, 24, 12, ph, '#f6eccb', '#2a2f58');
    read(day, ph);
  }
  function read(day, ph) {
    var f = elev(mile), gn = gain(mile), ls = loss(mile), lat = latAt(mile), dl = daylight(lat, day);
    var prev = null, next = null; W.forEach(function (p) { if (p.mile <= mile) prev = p; else if (!next) next = p; });
    var days = Math.round(day - START), ph8 = ['new', 'waxing crescent', 'first quarter', 'waxing gibbous', 'full', 'waning gibbous', 'last quarter', 'waning crescent'][Math.round(ph * 8) % 8];
    var ph8th = ['เดือนดับ', 'ข้างขึ้นเสี้ยว', 'ขึ้นครึ่งดวง', 'ข้างขึ้นเกือบเต็ม', 'เต็มดวง', 'ข้างแรมเกือบเต็ม', 'แรมครึ่งดวง', 'ข้างแรมเสี้ยว'][Math.round(ph * 8) % 8];
    $('w-mile').textContent = TH ? fmt(mile * 1.609344) + ' กม.' : 'Mile ' + fmt(mile);
    $('w-where').textContent = (prev ? prev.name : '') + (next ? T(' → next: ', ' → ถัดไป: ') + next.name + ' · ' + mi2(next.mile - mile) : '');
    $('w-elev').textContent = ft2(f);
    $('w-gain').textContent = ft2(gn);
    $('w-ev').textContent = fmt(gn / 29032, 1);
    $('w-loss').textContent = ft2(ls);
    $('w-steps').textContent = fmt(mile * D.stepsPerMile / 1e6, 2) + T(' million', ' ล้าน');
    $('w-days').textContent = fmt(days);
    $('w-date').textContent = dstr(day);
    $('w-moon').textContent = T(ph8, ph8th);
    $('w-light').textContent = fmt(dl, 1) + T(' h', ' ชม.');
    $('w-state').textContent = { CA: T('California', 'แคลิฟอร์เนีย'), OR: T('Oregon', 'โอเรกอน'), WA: T('Washington', 'วอชิงตัน') }[stateAt(mile)];
    $('w-pct').textContent = fmt((mile / MILES) * 100) + '%';
    $('w-left').textContent = mi2(MILES - mile);
  }
  rg.addEventListener('input', function () { mile = +rg.value; draw(); });
  var drag = function (e) { var b = cv.getBoundingClientRect(), x = (e.touches ? e.touches[0].clientX : e.clientX) - b.left; mile = Math.round(Math.max(0, Math.min(MILES, ((x - 8) / (b.width - 16)) * MILES))); rg.value = mile; draw(); };
  var down = false; cv.addEventListener('pointerdown', function (e) { down = true; cv.setPointerCapture(e.pointerId); drag(e); });
  cv.addEventListener('pointermove', function (e) { if (down) drag(e); }); cv.addEventListener('pointerup', function () { down = false; });
  document.querySelectorAll('[data-mile]').forEach(function (b) { b.addEventListener('click', function () { mile = +b.dataset.mile; rg.value = mile; draw(); }); });
  addEventListener('resize', draw); draw();
})();

/* ======================================================================= #ridges */
(function () {
  var cv = $('ridges-cv'); if (!cv) return;
  var ROWS = Math.ceil(MILES / 100), sel = 7, G;
  function draw() {
    var w = cv.clientWidth, rowH = w < 560 ? 16 : 24, h = ROWS * rowH + 150; G = canvasOf(cv, h); var c = G.c;
    var bg = css('--lines-bg'), ink = css('--lines-ink'), hot = '#ff8a4c', L = w < 560 ? 34 : 56, R = w - 14, K = (rowH * 3.6) / 7500; // one scale for every line: rise above the line's own lowest point
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    for (var r = 0; r < ROWS; r++) {
      var a = r * 100, b = Math.min(MILES, a + 100), y0 = 120 + r * rowH, pts = [];
      var lowR = 1e9; for (var mm = a; mm <= b; mm += 0.5) lowR = Math.min(lowR, elev(mm));
      for (var m = a; m <= b; m += 0.5) pts.push([L + ((m - a) / 100) * (R - L), y0 - (elev(m) - lowR) * K]);
      c.fillStyle = bg; c.beginPath(); c.moveTo(pts[0][0], y0 + 3); pts.forEach(function (p) { c.lineTo(p[0], p[1]); }); c.lineTo(pts[pts.length - 1][0], y0 + 3); c.closePath(); c.fill();
      var u = r / (ROWS - 1), tint = 'rgb(' + Math.round(246 - 70 * u) + ',' + Math.round(214 + 10 * u) + ',' + Math.round(170 + 80 * u) + ')'; // desert to glacier
      c.strokeStyle = r === sel ? hot : tint; c.lineWidth = r === sel ? 2.2 : 1.3; c.globalAlpha = r === sel ? 1 : 0.95; c.beginPath(); pts.forEach(function (p, j) { j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.stroke(); c.globalAlpha = 1;
      c.fillStyle = r === sel ? hot : ink; c.globalAlpha = r === sel ? 1 : 0.45; c.font = (w < 560 ? 9 : 10) + 'px ' + css('--body'); c.textAlign = 'right'; c.fillText(TH ? fmt(a * 1.609344) : a, L - 8, y0 + 3); c.globalAlpha = 1;
    }
    c.fillStyle = ink; c.globalAlpha = 0.6; c.font = '700 10px ' + css('--body'); c.textAlign = 'left'; c.fillText(T('MEXICO', 'เม็กซิโก'), L, 16); c.fillText(T('CANADA', 'แคนาดา'), L, h - 8); c.globalAlpha = 1;
    var m0 = sel * 100, m1 = Math.min(MILES, m0 + 100), hi = 0, him = m0, lo = 1e9, lom = m0; for (var m = m0; m <= m1; m += 0.5) { var f = elev(m); if (f > hi) { hi = f; him = m; } if (f < lo) { lo = f; lom = m; } }
    var names = W.filter(function (p) { return p.mile >= m0 && p.mile < m1; }).map(function (p) { return p.name; });
    $('rg-cap').innerHTML = '<b>' + (TH ? 'กม. ' + fmt(m0 * 1.609344) + '–' + fmt(m1 * 1.609344) : 'Miles ' + m0 + '–' + m1) + '</b> · ' + T('high point ', 'จุดสูงสุด ') + ft2(hi) + T(' at mile ', ' ที่ไมล์ ') + fmt(him) +
      ' · ' + T('low ', 'ต่ำสุด ') + ft2(lo) + ' · ' + T('climb ', 'ขึ้นรวม ') + ft2(gain(m1) - gain(m0)) + (names.length ? ' · ' + names.join(', ') : '');
  }
  cv.addEventListener('click', function (e) { var b = cv.getBoundingClientRect(), rowH = b.width < 560 ? 16 : 24, r = Math.floor((e.clientY - b.top - 120 + rowH * 0.9) / rowH); if (r >= 0 && r < ROWS) { sel = r; draw(); } });
  addEventListener('resize', draw); draw();
})();

/* ======================================================================= #bubble */
(function () {
  var cv = $('bub'), sd = $('b-start'), sp = $('b-pace'); if (!cv) return;
  var M = D.model, r = rng(1331), H = [];
  for (var j = 0; j < M.hikers; j++) {
    var u = r(), start = M.startFrom + Math.round((u < 0.5 ? Math.sqrt(u / 2) : 1 - Math.sqrt((1 - u) / 2)) * (M.startTo - M.startFrom)); // a triangle: most start mid-April
    var k = Math.max(0.7, Math.min(1.35, 1 + (r() + r() + r() - 1.5) * 0.22)), pts = walk(start, k);
    var quit = r() < M.quit ? 200 + r() * 2300 : MILES + 1; // some lines stop: not everyone finishes
    H.push({ pts: pts, quit: quit });
  }
  var G, d0 = doy(YEAR, 3, 1), d1 = doy(YEAR, 10, 20);
  function draw() {
    var w = cv.clientWidth, h = Math.max(300, Math.min(520, w * 0.62)); G = canvasOf(cv, h); var c = G.c;
    var L = w < 560 ? 30 : 118, R = w - 12, top = 34, bot = h - 26, X = function (d) { return L + ((d - d0) / (d1 - d0)) * (R - L); }, Y = function (m) { return bot - (m / MILES) * (bot - top); };
    c.fillStyle = css('--ridge-bg'); c.fillRect(0, 0, w, h);
    // months, and the full moons across the top
    c.font = '10px ' + css('--body'); c.fillStyle = css('--mute'); c.textAlign = 'center';
    for (var mo = 3; mo <= 10; mo++) { var dd = doy(YEAR, mo, 1), x = X(dd); c.globalAlpha = 0.25; c.fillRect(x, top, 1, bot - top); c.globalAlpha = 1; c.fillText(dateOf(dd).toLocaleDateString(TH ? 'th-TH' : 'en-US', { month: 'short', timeZone: 'UTC' }), x + 14, bot + 15); }
    var fulls = 0; for (var d = d0; d <= d1; d += 0.25) { var p = moonPhase(jan1 + d * 864e5), q = moonPhase(jan1 + (d + 0.25) * 864e5); if (p < 0.5 && q >= 0.5) { drawMoon(c, X(d), 16, 7, 0.5, '#f6eccb', '#2a2f58'); fulls++; } }
    // the places as level lines
    W.filter(function (p) { return p.line; }).forEach(function (p) { var y = Y(p.mile); c.globalAlpha = 0.35; c.fillStyle = css('--ink'); c.fillRect(L, y, R - L, 1); c.globalAlpha = 0.9; c.textAlign = 'right'; if (w >= 560) c.fillText(p.short || p.name, L - 6, y + 3); c.globalAlpha = 1; });
    // the hikers
    c.lineWidth = 1; c.strokeStyle = css('--bubble'); c.globalAlpha = 0.22;
    H.forEach(function (hk) { c.beginPath(); var on = false; hk.pts.forEach(function (pt) { if (pt[0] > hk.quit) return; var x = X(pt[1]), y = Y(pt[0]); on ? c.lineTo(x, y) : c.moveTo(x, y); on = true; }); c.stroke(); });
    c.globalAlpha = 0.55; c.strokeStyle = '#e0a400'; c.lineWidth = 2.2;   // the wait for the snow: flat at Kennedy Meadows
    H.forEach(function (hk) { for (var j = 1; j < hk.pts.length; j++) { var a = hk.pts[j - 1], b = hk.pts[j]; if (a[0] === b[0] && b[1] - a[1] > 0.5) { c.beginPath(); c.moveTo(X(a[1]), Y(a[0])); c.lineTo(X(b[1]), Y(b[0])); c.stroke(); } } });
    c.globalAlpha = 1; c.lineWidth = 1;
    // your line
    var my = walk(doy(YEAR, +sd.value.slice(5, 7), +sd.value.slice(8, 10)), +sp.value);
    c.strokeStyle = css('--hot'); c.lineWidth = 2.6; c.beginPath(); my.forEach(function (pt, j) { var x = X(pt[1]), y = Y(pt[0]); j ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
    var end = my[my.length - 1], km = dayOf(my, D.snow.mile), wait = my.gate ? Math.max(0, Math.round(D.snow.day - km)) : 0;
    var chester = dayOf(my, D.chester), near = H.filter(function (hk) { return hk.quit > D.chester && Math.abs(dayOf(hk.pts, D.chester) - chester) <= 1; }).length;
    $('b-out').innerHTML = T('Canada on <b>' + dstr(end[1]) + '</b>, ' + Math.round(end[1] - my[0][1]) + ' days. ', 'ถึงแคนาดา <b>' + dstr(end[1]) + '</b> ใช้ ' + Math.round(end[1] - my[0][1]) + ' วัน ') +
      (wait ? T('At Kennedy Meadows on ' + dstr(km) + ', waiting ' + wait + ' days for the Sierra snow. ', 'ถึงเคนเนดีเมโดวส์ ' + dstr(km) + ' รอหิมะเซียร์รา ' + wait + ' วัน ') : T('Into the Sierra on ' + dstr(km) + '. ', 'เข้าเซียร์รา ' + dstr(km) + ' ')) +
      T('Through Chester on ' + dstr(chester) + ' with ' + near + ' of the ' + M.hikers + ' modeled hikers within a day of you. ', 'ผ่านเชสเตอร์ ' + dstr(chester) + ' พร้อมนักเดินจำลอง ' + near + ' จาก ' + M.hikers + ' คน ห่างกันไม่เกินหนึ่งวัน ') +
      T(fulls + ' full moons on the chart.', 'พระจันทร์เต็มดวง ' + fulls + ' ครั้งบนแผนภูมิ');
  }
  [sd, sp].forEach(function (el) { el.addEventListener('input', draw); });
  addEventListener('resize', draw); draw();
})();

/* ======================================================================= #now */
(function () {
  var box = $('now-list'); if (!box) return;
  var pts = W.filter(function (p) { return p.live; });
  var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + pts.map(function (p) { return p.lat.toFixed(3); }).join(',') + '&longitude=' + pts.map(function (p) { return p.lon.toFixed(3); }).join(',') +
    '&current=temperature_2m,weather_code,snow_depth,wind_speed_10m,is_day&daily=sunrise,sunset&timezone=America%2FLos_Angeles&forecast_days=1&temperature_unit=' + (TH ? 'celsius' : 'fahrenheit');
  var WX = { 0: ['clear', 'แจ่มใส'], 1: ['mostly clear', 'ค่อนข้างแจ่มใส'], 2: ['partly cloudy', 'มีเมฆบางส่วน'], 3: ['overcast', 'เมฆครึ้ม'], 45: ['fog', 'หมอก'], 48: ['rime fog', 'หมอกน้ำค้างแข็ง'], 51: ['drizzle', 'ฝนปรอย'], 53: ['drizzle', 'ฝนปรอย'], 55: ['drizzle', 'ฝนปรอย'], 61: ['rain', 'ฝน'], 63: ['rain', 'ฝน'], 65: ['heavy rain', 'ฝนหนัก'], 71: ['snow', 'หิมะ'], 73: ['snow', 'หิมะ'], 75: ['heavy snow', 'หิมะหนัก'], 77: ['snow grains', 'เกล็ดหิมะ'], 80: ['showers', 'ฝนซู่'], 81: ['showers', 'ฝนซู่'], 82: ['downpours', 'ฝนกระหน่ำ'], 85: ['snow showers', 'หิมะโปรย'], 86: ['snow showers', 'หิมะโปรย'], 95: ['thunderstorms', 'พายุฝนฟ้าคะนอง'], 96: ['thunderstorms, hail', 'พายุ ลูกเห็บ'], 99: ['thunderstorms, hail', 'พายุ ลูกเห็บ'] };
  var deg = TH ? '°C' : '°F';
  var hm = function (iso) { var s = (iso || '').slice(11, 16); if (!s || TH) return s; var h = +s.slice(0, 2), m = s.slice(3); return ((h + 11) % 12 + 1) + ':' + m + (h < 12 ? ' am' : ' pm'); };
  function show(list, when, snap) {
    var temps = list.map(function (x) { return x.t; }), hi = list[temps.indexOf(Math.max.apply(null, temps))], lo = list[temps.indexOf(Math.min.apply(null, temps))];
    var snowy = list.filter(function (x) { return x.snow > 0.005; });
    box.innerHTML = list.map(function (x) {
      var wx = WX[x.code] || ['', ''];
      return '<li style="--t:' + Math.round(((x.t - (TH ? -10 : 14)) / (TH ? 45 : 81)) * 100) + '"><span class="nm">' + x.p.name + '<small>' + mi2(x.p.mile) + '</small></span><b>' + Math.round(x.t) + deg + '</b><span class="wx">' + T(wx[0], wx[1]) + (x.snow > 0.005 ? ' · ' + T(fmt(x.snow * 39.37) + ' in snow', fmt(x.snow * 100) + ' ซม. หิมะ') : '') + '</span><span class="ss">' + T('sunset ', 'ตก ') + (x.set || '') + '</span></li>';
    }).join('');
    $('now-sum').innerHTML = (snap ? T('Snapshot of ', 'ภาพ ณ ') : T('Live, ', 'สด ณ ')) + when + '. ' + T('Warmest: <b>' + hi.p.name + ' ' + Math.round(hi.t) + deg + '</b>. Coldest: <b>' + lo.p.name + ' ' + Math.round(lo.t) + deg + '</b>, a spread of ' + Math.round(hi.t - lo.t) + ' degrees along one footpath. ',
      'อุ่นสุด <b>' + hi.p.name + ' ' + Math.round(hi.t) + deg + '</b> หนาวสุด <b>' + lo.p.name + ' ' + Math.round(lo.t) + deg + '</b> ต่างกัน ' + Math.round(hi.t - lo.t) + ' องศาบนทางเดินเส้นเดียว ') +
      T('Snow on the ground at ' + snowy.length + ' of ' + list.length + ' places.', 'มีหิมะบนพื้น ' + snowy.length + ' จาก ' + list.length + ' จุด');
  }
  fetch(url).then(function (r) { return r.json(); }).then(function (js) {
    var arr = Array.isArray(js) ? js : [js];
    show(arr.map(function (d, j) { return { p: pts[j], t: d.current.temperature_2m, code: d.current.weather_code, snow: d.current.snow_depth || 0, set: hm(d.daily.sunset[0]) }; }), new Date().toLocaleString(TH ? 'th-TH' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }), false);
  }).catch(function () { if (D.snapshot) show(D.snapshot.list.map(function (x) { x.p = pts[x.i]; return x; }), D.snapshot.when, true); else $('now-sum').textContent = T('Live weather did not load here.', 'โหลดสภาพอากาศสดไม่ได้'); });

  // fires: every incident NIFC lists today inside the trail's box, then only those within 25 miles of a waypoint
  var F = 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query?where=1%3D1&geometry=-124.5,32.4,-115.9,49.2&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=IncidentName,IncidentSize,PercentContained,IncidentTypeCategory&returnGeometry=true&outSR=4326&f=json&resultRecordCount=500';
  var dist = function (a, b, c, d) { var r = Math.PI / 180, x = (d - b) * r * Math.cos((a + c) / 2 * r), y = (c - a) * r; return Math.sqrt(x * x + y * y) * 3958.8; };
  var near = function (lat, lon) { var best = 1e9, bp = null; for (var m = 0; m <= MILES; m += 5) { var p = trackAt(m), dd = dist(lat, lon, p[0], p[1]); if (dd < best) { best = dd; bp = m; } } return [best, bp]; };
  function trackAt(m) { for (var j = 1; j < W.length; j++) if (W[j].mile >= m) { var a = W[j - 1], b = W[j], u = (m - a.mile) / ((b.mile - a.mile) || 1); return [a.lat + (b.lat - a.lat) * u, a.lon + (b.lon - a.lon) * u]; } var z = W[W.length - 1]; return [z.lat, z.lon]; }
  fetch(F).then(function (r) { return r.json(); }).then(function (js) {
    var wf = [], rx = 0; (js.features || []).forEach(function (f) { var a = f.attributes, g = f.geometry; if (!g) return; var n = near(g.y, g.x); if (n[0] > 25) return; if (a.IncidentTypeCategory === 'RX') { rx++; return; } wf.push({ name: a.IncidentName, acres: a.IncidentSize, pc: a.PercentContained, d: n[0], m: n[1] }); });
    wf.sort(function (a, b) { return (b.acres || 0) - (a.acres || 0); });
    var el = $('now-fire'); if (!el) return;
    el.innerHTML = T('Wildfires NIFC lists today within 25 miles of the trail (by the line through its waypoints): <b>' + wf.length + '</b>. ', 'ไฟป่าที่ NIFC รายงานวันนี้ ห่างเส้นทางไม่เกิน 40 กม.: <b>' + wf.length + '</b> ') +
      (wf.length ? wf.slice(0, 4).map(function (f) { return '<b>' + f.name.replace(/</g, '') + '</b> ' + (f.acres ? fmt(f.acres) + T(' acres', ' เอเคอร์') : '') + (f.pc != null ? ', ' + fmt(f.pc) + T('% contained', '% ควบคุมได้') : '') + T(', near mile ', ' ใกล้ไมล์ ') + fmt(f.m); }).join(' · ') + '. ' : '') +
      T('Prescribed burns in the same band: ' + rx + '.', 'การเผาตามแผนในแนวเดียวกัน: ' + rx);
  }).catch(function () { var el = $('now-fire'); if (el) el.textContent = T('The fire list did not load here; the links below open the maps.', 'โหลดรายการไฟป่าไม่ได้ ลิงก์ด้านล่างเปิดแผนที่ได้'); });
})();
})();

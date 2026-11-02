/* Shared data loading and SVG chart helpers (vanilla JS). Styling lives in css/style.css. */
const AI = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const base = document.documentElement.dataset.base || ".";
  let cache;

  async function load() {
    if (cache) return cache;
    const [data, map] = await Promise.all([
      fetch(`${base}/data/africa.json`).then(r => r.json()),
      fetch(`${base}/data/africa-map.json`).then(r => r.json()),
    ]);
    data.map = map;
    data.byIso = Object.fromEntries(data.countries.map(c => [c.iso3, c]));
    cache = data;
    return data;
  }

  function el(name, attrs = {}, parent) {
    const n = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) n.setAttribute(k, v);
    if (parent) parent.appendChild(n);
    return n;
  }
  function text(parent, x, y, str, attrs = {}) {
    const t = el("text", { x, y, ...attrs }, parent);
    t.textContent = str;
    return t;
  }
  function svg(container, w, h, label) {
    container.innerHTML = "";
    return el("svg", { viewBox: `0 0 ${w} ${h}`, role: "img", "aria-label": label }, container);
  }
  function unavailable(container, msg) {
    container.innerHTML = `<p class="unavailable">${msg || "Data unavailable for this selection."}</p>`;
  }

  const tip = document.createElement("div");
  tip.className = "tooltip";
  document.addEventListener("DOMContentLoaded", () => document.body.appendChild(tip));
  function hover(node, html) {
    node.addEventListener("mousemove", e => {
      tip.innerHTML = html();
      tip.classList.add("show");
      const x = Math.min(e.clientX + 14, window.innerWidth - 250);
      tip.style.left = `${x}px`;
      tip.style.top = `${e.clientY + 14}px`;
    });
    node.addEventListener("mouseleave", () => tip.classList.remove("show"));
  }

  const fmt = (v, d = 1) => (v === undefined || v === null ? "n/a" : Number(v).toFixed(d));

  /* Horizontal bar chart. rows: [{label, value, cls, tip}] */
  function hbar(container, rows, { max, unit = "", label = "Bar chart" } = {}) {
    if (!rows.length) return unavailable(container);
    const rowH = 20, left = 170, right = 60, w = 760, h = rows.length * rowH + 30;
    const m = max || Math.max(...rows.map(r => r.value));
    const s = svg(container, w, h, label);
    const g = el("g", { class: "grid" }, s);
    for (let i = 0; i <= 4; i++) {
      const x = left + ((w - left - right) * i) / 4;
      el("line", { x1: x, x2: x, y1: 0, y2: h - 20 }, g);
      text(s, x, h - 5, fmt((m * i) / 4, 0) + unit, { "text-anchor": "middle" });
    }
    rows.forEach((r, i) => {
      const y = i * rowH + 4;
      text(s, left - 8, y + 12, r.label, { "text-anchor": "end", class: r.cls && r.cls.includes("togo") ? "label-strong" : "" });
      const bw = Math.max(1, ((w - left - right) * r.value) / m);
      const b = el("rect", { x: left, y, width: bw, height: rowH - 6, class: `bar ${r.cls || ""}` }, s);
      text(s, left + bw + 5, y + 12, fmt(r.value) + unit);
      if (r.tip) hover(b, r.tip);
    });
  }

  /* Scatter plot. points: [{x, y, label, cls, tip}] */
  function scatter(container, pts, { xLabel, yLabel, xMax = 100, yMax = 100, label = "Scatter plot" } = {}) {
    if (pts.length < 3) return unavailable(container, "Not enough countries with data for both indicators.");
    const w = 760, h = 440, l = 56, r = 20, t = 16, b = 50;
    const X = v => l + ((w - l - r) * v) / xMax, Y = v => h - b - ((h - t - b) * v) / yMax;
    const s = svg(container, w, h, label);
    const g = el("g", { class: "grid" }, s);
    for (let i = 0; i <= 5; i++) {
      el("line", { x1: X((xMax * i) / 5), x2: X((xMax * i) / 5), y1: t, y2: h - b }, g);
      el("line", { x1: l, x2: w - r, y1: Y((yMax * i) / 5), y2: Y((yMax * i) / 5) }, g);
      text(s, X((xMax * i) / 5), h - b + 16, fmt((xMax * i) / 5, 0), { "text-anchor": "middle" });
      text(s, l - 8, Y((yMax * i) / 5) + 4, fmt((yMax * i) / 5, 0), { "text-anchor": "end" });
    }
    text(s, (l + w - r) / 2, h - 10, xLabel, { "text-anchor": "middle", class: "label-strong" });
    text(s, 14, (t + h - b) / 2, yLabel, { "text-anchor": "middle", class: "label-strong", transform: `rotate(-90 14 ${(t + h - b) / 2})` });
    // least-squares line, descriptive only
    const n = pts.length, mx = pts.reduce((a, p) => a + p.x, 0) / n, my = pts.reduce((a, p) => a + p.y, 0) / n;
    const sxy = pts.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0), sxx = pts.reduce((a, p) => a + (p.x - mx) ** 2, 0);
    const syy = pts.reduce((a, p) => a + (p.y - my) ** 2, 0);
    const k = sxy / sxx, c0 = my - k * mx;
    const xs = pts.map(p => p.x), x0 = Math.min(...xs), x1 = Math.max(...xs);
    el("line", { x1: X(x0), y1: Y(c0 + k * x0), x2: X(x1), y2: Y(c0 + k * x1), class: "trend" }, s);
    pts.forEach(p => {
      const d = el("circle", { cx: X(p.x), cy: Y(p.y), r: p.cls === "togo" ? 7 : 5, class: `dot ${p.cls || ""}` }, s);
      if (p.cls === "togo") text(s, X(p.x) + 9, Y(p.y) + 4, p.label, { class: "label-strong" });
      hover(d, p.tip);
    });
    return { r: sxy / Math.sqrt(sxx * syy), n };
  }

  /* Line chart. series: [{label, values: {year: v}}] */
  function lines(container, series, { yMax = 100, unit = "%", from = 2000, to = 2024, label = "Line chart" } = {}) {
    series = series.filter(s => s.values && Object.keys(s.values).length);
    if (!series.length) return unavailable(container);
    const w = 760, h = 360, l = 50, r = 120, t = 16, b = 36;
    const X = y => l + ((w - l - r) * (y - from)) / (to - from), Y = v => h - b - ((h - t - b) * v) / yMax;
    const s = svg(container, w, h, label);
    const g = el("g", { class: "grid" }, s);
    for (let i = 0; i <= 5; i++) {
      el("line", { x1: l, x2: w - r, y1: Y((yMax * i) / 5), y2: Y((yMax * i) / 5) }, g);
      text(s, l - 8, Y((yMax * i) / 5) + 4, fmt((yMax * i) / 5, 0) + unit, { "text-anchor": "end" });
    }
    for (let y = from; y <= to; y += 4) text(s, X(y), h - b + 18, y, { "text-anchor": "middle" });
    series.forEach((se, i) => {
      const pts = Object.entries(se.values).map(([y, v]) => [+y, v]).filter(([y]) => y >= from && y <= to).sort((a, b) => a[0] - b[0]);
      if (!pts.length) return;
      el("path", { d: "M" + pts.map(([y, v]) => `${X(y)} ${Y(v)}`).join("L"), class: `line s${i % 5}` }, s);
      pts.forEach(([y, v]) => {
        const c = el("circle", { cx: X(y), cy: Y(v), r: 3, class: `f${i % 5}` }, s);
        hover(c, () => `<strong>${se.label}</strong><br>${y}: ${fmt(v)}${unit}`);
      });
      const [ly, lv] = pts[pts.length - 1];
      text(s, X(ly) + 6, Y(lv) + 4, se.label, { class: `label-strong` });
    });
  }

  /* Choropleth of Africa */
  function choropleth(container, data, key, { unit = "", label = "Map of Africa", tipFn } = {}) {
    const vals = data.countries.map(c => c[key]).filter(v => v !== undefined && v !== null);
    if (!vals.length) return unavailable(container);
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const breaks = [1, 2, 3, 4].map(i => lo + ((hi - lo) * i) / 5);
    const q = v => (v === undefined || v === null ? 0 : 1 + breaks.filter(b => v >= b).length);
    const s = svg(container, 760, 760, label);
    const g = el("g", { transform: "translate(0,10)" }, s);
    for (const [iso, d] of Object.entries(data.map)) {
      const c = data.byIso[iso];
      const v = c ? c[key] : undefined;
      const p = el("path", { d, class: `country q${q(v)} ${iso === "TGO" ? "togo" : ""}` }, g);
      hover(p, () => (c ? (tipFn ? tipFn(c) : `<strong>${c.name}</strong><br>${fmt(v)}${unit}`) : "<strong>Western Sahara</strong><br>Not covered"));
    }
    const lg = el("g", { transform: "translate(20,620)" }, s);
    text(lg, 0, -8, "Legend", { class: "label-strong" });
    const edges = [lo, ...breaks, hi];
    for (let i = 1; i <= 5; i++) {
      el("rect", { x: 0, y: (i - 1) * 20, width: 16, height: 14, class: `legend-q${i}` }, lg);
      text(lg, 22, (i - 1) * 20 + 11, `${fmt(edges[i - 1])} – ${fmt(edges[i])}${unit}`);
    }
    el("rect", { x: 0, y: 100, width: 16, height: 14, class: "legend-q0" }, lg);
    text(lg, 22, 111, "No data");
  }

  function chips(container, items, selected, onChange) {
    container.innerHTML = "";
    items.forEach(it => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = it.name;
      b.setAttribute("aria-pressed", selected.has(it.iso3));
      b.addEventListener("click", () => {
        selected.has(it.iso3) ? selected.delete(it.iso3) : selected.add(it.iso3);
        b.setAttribute("aria-pressed", selected.has(it.iso3));
        onChange();
      });
      container.appendChild(b);
    });
  }

  function navToggle() {
    const btn = document.querySelector(".nav-toggle"), ul = document.querySelector(".nav ul");
    if (btn) btn.addEventListener("click", () => { ul.classList.toggle("open"); btn.setAttribute("aria-expanded", ul.classList.contains("open")); });
  }
  document.addEventListener("DOMContentLoaded", navToggle);

  const short = n => n.replace("Congo, Dem. Rep.", "DR Congo").replace("Congo, Rep.", "Congo").replace("Egypt, Arab Rep.", "Egypt").replace("Gambia, The", "Gambia").replace("Sao Tome and Principe", "São Tomé & P.").replace("Central African Republic", "Central African Rep.");

  return { load, hbar, scatter, lines, choropleth, chips, fmt, unavailable, short };
})();

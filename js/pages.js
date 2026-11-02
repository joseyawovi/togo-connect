/* Page-specific visualizations. Each page sets <body data-page="...">. */
const OX = "Source: Oxford Insights, Government AI Readiness Index 2025 (score 0–100).";
const wbSrc = (d, k) => `Source: World Bank Open Data, “${d.indicators[k].label}” (${d.indicators[k].code}). Latest available year per country, shown in tooltips.`;
const FOCUS = ["TGO", "GHA", "NGA", "SEN", "RWA", "KEN", "ZAF", "EGY"];
const NEIGH = ["TGO", "GHA", "BEN", "BFA"];
const $ = s => document.querySelector(s);
const caption = (sel, t) => { const n = $(sel); if (n) n.textContent = t; };

function readinessTip(c) {
  return `<strong>${c.name}</strong><br>Score: ${AI.fmt(c.readiness)} / 100<br>Africa rank: ${c.africaRank} of 54<br>Global rank: ${c.globalRank}`;
}

const pages = {
  async home(d) {
    const tg = d.byIso.TGO;
    const af = d.countries.filter(c => c.readiness);
    const avg = af.reduce((a, c) => a + c.readiness, 0) / af.length;
    $("#kpi-countries").textContent = af.length;
    $("#kpi-avg").textContent = AI.fmt(avg);
    $("#kpi-togo").textContent = AI.fmt(tg.readiness);
    $("#kpi-togo-rank").textContent = `${tg.africaRank} / 54`;
  },

  async readiness(d) {
    const af = d.countries.filter(c => c.readiness).sort((a, b) => b.readiness - a.readiness);
    AI.choropleth($("#map"), d, "readiness", { label: "AI readiness by African country", tipFn: readinessTip });
    caption("#map-cap", `${OX} Hover a country for its score and ranks. Togo is outlined. Classes are equal intervals between the lowest and highest African score.`);

    const drawRank = () => {
      const n = $("#rank-n").value;
      const rows = (n === "all" ? af : af.slice(0, +n)).map(c => ({ label: AI.short(c.name), value: c.readiness, cls: c.iso3 === "TGO" ? "togo" : "", tip: () => readinessTip(c) }));
      if (n !== "all" && !rows.some(r => r.cls)) { const t = d.byIso.TGO; rows.push({ label: "Togo", value: t.readiness, cls: "togo", tip: () => readinessTip(t) }); }
      AI.hbar($("#rank"), rows, { max: 100, label: "Ranking of African countries" });
    };
    $("#rank-n").addEventListener("change", drawRank);
    drawRank();
    caption("#rank-cap", OX);

    const sel = new Set(FOCUS);
    const pillars = [["ox_policy_capacity", "Policy capacity"], ["ox_ai_infrastructure", "AI infrastructure"], ["ox_governance", "Governance"], ["ox_public_sector_adoption", "Public-sector adoption"], ["ox_development_diffusion", "Development & diffusion"], ["ox_resilience", "Resilience"], ["readiness", "Total score"]];
    const p = $("#pillar");
    pillars.forEach(([k, l]) => p.add(new Option(l, k, k === "readiness", k === "readiness")));
    const drawCmp = () => {
      const k = p.value;
      const rows = af.filter(c => sel.has(c.iso3)).map(c => ({ label: AI.short(c.name), value: c[k] ?? 0, cls: c.iso3 === "TGO" ? "togo" : "", tip: () => `<strong>${c.name}</strong><br>${p.selectedOptions[0].text}: ${AI.fmt(c[k])}` })).sort((a, b) => b.value - a.value);
      AI.hbar($("#compare"), rows, { max: 100, label: "Comparison of selected countries" });
    };
    AI.chips($("#compare-chips"), af.slice().sort((a, b) => a.name.localeCompare(b.name)), sel, drawCmp);
    p.addEventListener("change", drawCmp);
    drawCmp();
    caption("#compare-cap", `${OX} The six pillars are the index's sub-scores (0–100). Click countries to add or remove them.`);

    const avg = af.reduce((a, c) => a + c.readiness, 0) / af.length;
    const rows = [
      ...d.globalLeaders.slice(0, 5).map(g => ({ label: `${g.name} (#${g.rank})`, value: g.readiness, cls: "leader", tip: () => `<strong>${g.name}</strong><br>Global rank ${g.rank} of ${d.oxfordCount}` })),
      ...af.slice(0, 3).map(c => ({ label: `${AI.short(c.name)} (#${c.globalRank})`, value: c.readiness, tip: () => readinessTip(c) })),
      { label: "African average", value: avg, cls: "africa-avg", tip: () => `<strong>Average of ${af.length} African countries</strong><br>${AI.fmt(avg)}` },
      { label: `Togo (#${d.byIso.TGO.globalRank})`, value: d.byIso.TGO.readiness, cls: "togo", tip: () => readinessTip(d.byIso.TGO) },
    ];
    AI.hbar($("#global"), rows, { max: 100, label: "Africa versus global leaders" });
    caption("#global-cap", `${OX} Global ranks out of ${d.oxfordCount} countries. Dark bars: top five worldwide; green: unweighted mean of African countries.`);
  },

  async infrastructure(d) {
    const ind = $("#infra-ind");
    const units = { internet: "%", electricity: "%", mobile: "" };
    const drawMap = () => {
      const k = ind.value;
      AI.choropleth($("#infra-map"), d, k, { unit: units[k], label: "Infrastructure map", tipFn: c => `<strong>${c.name}</strong><br>${AI.fmt(c[k])}${units[k]} (${c[k + "Year"] || "n/a"})` });
      const rows = d.countries.filter(c => c[k] != null).sort((a, b) => b[k] - a[k]).map(c => ({ label: AI.short(c.name), value: c[k], cls: c.iso3 === "TGO" ? "togo" : "", tip: () => `<strong>${c.name}</strong><br>${AI.fmt(c[k])}${units[k]} in ${c[k + "Year"]}` }));
      AI.hbar($("#infra-bar"), rows, { max: k === "mobile" ? undefined : 100, unit: units[k], label: "Infrastructure ranking" });
      caption("#infra-map-cap", wbSrc(d, k));
      caption("#infra-bar-cap", wbSrc(d, k));
    };
    ind.addEventListener("change", drawMap);
    drawMap();

    const sx = $("#sc-x");
    const drawSc = () => {
      const k = sx.value;
      const pts = d.countries.filter(c => c[k] != null && c.readiness).map(c => ({ x: c[k], y: c.readiness, label: c.name, cls: c.iso3 === "TGO" ? "togo" : "", tip: () => `<strong>${c.name}</strong><br>${sx.selectedOptions[0].text}: ${AI.fmt(c[k])}${units[k]} (${c[k + "Year"]})<br>AI readiness: ${AI.fmt(c.readiness)}` }));
      const xMax = k === "mobile" ? 200 : 100;
      const res = AI.scatter($("#scatter"), pts, { xLabel: sx.selectedOptions[0].text, yLabel: "AI readiness (0–100)", xMax, yMax: 100 });
      $("#corr").textContent = res ? `Pearson r = ${AI.fmt(res.r, 2)} across ${res.n} countries. This describes association only; it does not show that one causes the other.` : "";
    };
    sx.addEventListener("change", drawSc);
    drawSc();
    caption("#scatter-cap", `${OX} Combined with World Bank indicators (latest year per country). Dashed line: least-squares fit, descriptive only.`);

    const sel = new Set(["TGO", "GHA", "NGA", "KEN", "ZAF"]);
    const li = $("#line-ind");
    const drawLines = () => {
      const k = li.value;
      const series = [...sel].map(i => ({ label: AI.short(d.byIso[i].name), values: d.series[k][i] }));
      AI.lines($("#lines"), series, { yMax: k === "mobile" ? 200 : 100, unit: units[k] });
      caption("#lines-cap", wbSrc(d, k).replace("Latest available year per country, shown in tooltips.", "Years without a reported value are skipped."));
    };
    AI.chips($("#line-chips"), d.countries.slice().sort((a, b) => a.name.localeCompare(b.name)), sel, drawLines);
    li.addEventListener("change", drawLines);
    drawLines();
  },

  async skills(d) {
    const ind = $("#hc-ind");
    const cfg = { tertiary: ["%", 100], rd: ["% of GDP", 1.5], researchers: ["", 1000], ox_human_capital: ["", 100] };
    const draw = () => {
      const k = ind.value, [u] = cfg[k];
      const rows = d.countries.filter(c => c[k] != null).sort((a, b) => b[k] - a[k]).map(c => ({ label: AI.short(c.name), value: c[k], cls: c.iso3 === "TGO" ? "togo" : "", tip: () => `<strong>${c.name}</strong><br>${AI.fmt(c[k], 2)} ${u}${c[k + "Year"] ? ` (${c[k + "Year"]})` : ""}` }));
      AI.hbar($("#hc-bar"), rows, { unit: "", label: "Human capital indicator" });
      const has = d.countries.filter(c => c[k] != null).length;
      $("#hc-missing").textContent = `${has} of 54 countries report this indicator; ${54 - has} have no data and are not shown.${d.byIso.TGO[k] == null ? " Togo has no reported value." : ""}`;
      caption("#hc-cap", k === "ox_human_capital" ? `${OX} “Human capital” sub-pillar.` : wbSrc(d, k));
    };
    ind.addEventListener("change", draw);
    draw();

    const sx = $("#hc-x");
    const drawSc = () => {
      const k = sx.value, [u, xMax] = cfg[k];
      const pts = d.countries.filter(c => c[k] != null && c.readiness).map(c => ({ x: Math.min(c[k], xMax), y: c.readiness, label: c.name, cls: c.iso3 === "TGO" ? "togo" : "", tip: () => `<strong>${c.name}</strong><br>${sx.selectedOptions[0].text}: ${AI.fmt(c[k], 2)} ${u} (${c[k + "Year"]})<br>AI readiness: ${AI.fmt(c.readiness)}` }));
      const res = AI.scatter($("#hc-scatter"), pts, { xLabel: sx.selectedOptions[0].text, yLabel: "AI readiness (0–100)", xMax, yMax: 100 });
      $("#hc-corr").textContent = res ? `Pearson r = ${AI.fmt(res.r, 2)} across ${res.n} countries. Association only, not causation.` : "";
    };
    sx.addEventListener("change", drawSc);
    drawSc();
    caption("#hc-scatter-cap", `${OX} Combined with World Bank indicators (latest year per country).`);

    const regs = {};
    d.countries.filter(c => c.readiness).forEach(c => {
      const r = c.region === "Sub-Saharan Africa" ? "Sub-Saharan Africa" : "North Africa";
      (regs[r] ||= []).push(c);
    });
    const avg = (arr, k) => { const v = arr.map(c => c[k]).filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
    const rows = [];
    for (const [r, arr] of Object.entries(regs)) {
      rows.push({ label: `${r}: AI readiness`, value: avg(arr, "readiness"), tip: () => `<strong>${r}</strong><br>${arr.length} countries` });
      rows.push({ label: `${r}: human capital`, value: avg(arr, "ox_human_capital"), cls: "africa-avg", tip: () => `<strong>${r}</strong><br>Oxford human-capital sub-pillar` });
      rows.push({ label: `${r}: tertiary enrol.`, value: avg(arr, "tertiary"), cls: "leader", tip: () => `<strong>${r}</strong><br>Mean gross tertiary enrolment, %` });
    }
    AI.hbar($("#region"), rows, { max: 100, label: "Regional comparison" });
    caption("#region-cap", `${OX} World Bank ${d.indicators.tertiary.code}. Unweighted means of countries with data. North Africa = Algeria, Egypt, Libya, Morocco, Tunisia, Djibouti (World Bank MENA members in Africa).`);
  },

  async togo(d) {
    const t = d.byIso.TGO;
    const rowsP = [
      ["AI readiness (Oxford Insights 2025)", `${AI.fmt(t.readiness)} / 100`],
      ["Rank in Africa", `${t.africaRank} of 54`],
      ["Global rank", `${t.globalRank} of ${d.oxfordCount}`],
      ["Income group (World Bank)", t.income],
      ["Individuals using the internet", `${AI.fmt(t.internet)}% (${t.internetYear})`],
      ["Access to electricity", `${AI.fmt(t.electricity)}% (${t.electricityYear})`],
      ["Mobile subscriptions per 100 people", `${AI.fmt(t.mobile)} (${t.mobileYear})`],
      ["Tertiary enrolment (gross)", t.tertiary != null ? `${AI.fmt(t.tertiary)}% (${t.tertiaryYear})` : "Data unavailable"],
      ["R&D expenditure", t.rd != null ? `${AI.fmt(t.rd, 2)}% of GDP (${t.rdYear})` : "Data unavailable"],
      ["Researchers per million", t.researchers != null ? `${AI.fmt(t.researchers, 0)} (${t.researchersYear})` : "Data unavailable"],
    ];
    $("#profile").innerHTML = rowsP.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join("");
    $("#t-score").textContent = AI.fmt(t.readiness);
    $("#t-rank").textContent = `${t.africaRank}/54`;
    $("#t-net").textContent = `${AI.fmt(t.internet, 0)}%`;
    $("#t-elec").textContent = `${AI.fmt(t.electricity, 0)}%`;

    const ind = $("#t-ind");
    const opts = [["readiness", "AI readiness (0–100)", 100, ""], ["internet", "Internet users (%)", 100, "%"], ["electricity", "Electricity access (%)", 100, "%"], ["mobile", "Mobile subscriptions / 100", null, ""], ["ox_ai_infrastructure", "Oxford: AI infrastructure", 100, ""], ["ox_human_capital", "Oxford: human capital", 100, ""], ["ox_governance", "Oxford: governance", 100, ""]];
    opts.forEach(([k, l]) => ind.add(new Option(l, k)));
    const draw = () => {
      const [k, l, max, u] = opts.find(o => o[0] === ind.value);
      const rows = NEIGH.map(i => d.byIso[i]).map(c => ({ label: AI.short(c.name), value: c[k] ?? 0, cls: c.iso3 === "TGO" ? "togo" : "", tip: () => `<strong>${c.name}</strong><br>${l}: ${AI.fmt(c[k])}${c[k + "Year"] ? ` (${c[k + "Year"]})` : ""}` }));
      AI.hbar($("#t-compare"), rows, { max: max || undefined, unit: u, label: "Togo and neighbours" });
      caption("#t-compare-cap", k.startsWith("ox_") || k === "readiness" ? OX : wbSrc(d, k));
    };
    ind.addEventListener("change", draw);
    draw();

    AI.lines($("#t-lines"), NEIGH.map(i => ({ label: AI.short(d.byIso[i].name), values: d.series.internet[i] })), { yMax: 100 });
    caption("#t-lines-cap", wbSrc(d, "internet").replace(" Latest available year per country, shown in tooltips.", ""));
  },

  async future(d) {
    const af = d.countries.filter(c => c.readiness);
    const top = af.slice().sort((a, b) => b.readiness - a.readiness);
    const q = Math.floor(top.length / 4);
    const avg = (arr, k) => { const v = arr.map(c => c[k]).filter(x => x != null); return v.reduce((a, b) => a + b, 0) / v.length; };
    const groups = [["Top quarter by AI readiness", top.slice(0, q)], ["Bottom quarter by AI readiness", top.slice(-q)]];
    const rows = [];
    for (const k of ["internet", "electricity"]) for (const [g, arr] of groups) rows.push({ label: `${k === "internet" ? "Internet" : "Electricity"} – ${g.split(" ")[0]} 25%`, value: avg(arr, k), cls: g.startsWith("Top") ? "leader" : "togo", tip: () => `<strong>${g}</strong><br>${arr.map(c => AI.short(c.name)).join(", ")}` });
    AI.hbar($("#divide"), rows, { max: 100, unit: "%", label: "Digital divide" });
    caption("#divide-cap", `${OX} Countries split into quarters by score (${q} each); bars show unweighted mean World Bank internet use (${d.indicators.internet.code}) and electricity access (${d.indicators.electricity.code}), latest year per country.`);
  },
};

document.addEventListener("DOMContentLoaded", async () => {
  const page = document.body.dataset.page;
  if (!pages[page]) return;
  try {
    const d = await AI.load();
    await pages[page](d);
  } catch (e) {
    console.error(e);
    document.querySelectorAll(".chart").forEach(c => AI.unavailable(c, "The dataset could not be loaded. If you opened the file directly, serve the folder through a web server or GitHub Pages."));
  }
});

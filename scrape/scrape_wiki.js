import fs from "fs";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const seeds = JSON.parse(fs.readFileSync(new URL("./seeds.json", import.meta.url)));
const OUT = new URL("../data/dataset.json", import.meta.url);

const LEXICON = [
  "cancel", "backlash", "outrage", "harassment", "abuse",
  "bully", "cyberbully", "dox", "doxing", "shaming",
  "defamation", "hate", "controversy", "allegation", "accusation"
];

const wikiUrl = (title) =>
  `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;

async function fetchPageviews(title) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);

  const fmt = (d) =>
    `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;

  const api = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${encodeURIComponent(title)}/daily/${fmt(start)}/${fmt(end)}`;

  const res = await fetch(api, {
    headers: { "User-Agent": "gossip-garden/1.0 (education project)" }
  });

  if (!res.ok) return 0;
  const json = await res.json();
  const items = json.items || [];
  return items.reduce((sum, it) => sum + (it.views || 0), 0);
}

async function scrapeOne(title) {
  const url = wikiUrl(title);
  const res = await fetch(url, {
    headers: { "User-Agent": "gossip-garden/1.0 (education project)" }
  });

  if (!res.ok) throw new Error(`Fetch failed for ${title}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  const pageTitle = $("#firstHeading").text().trim();
  const lead = $("#mw-content-text .mw-parser-output > p")
    .first()
    .text()
    .replace(/\[\d+\]/g, "")
    .trim()
    .slice(0, 500);

  const sectionsCount = $("#mw-content-text h2").length;
  const linksCount = $("#mw-content-text a[href^='/wiki/']").length;

  const lower = lead.toLowerCase();
  const lexHits = LEXICON.reduce(
    (sum, w) => sum + (lower.includes(w) ? 1 : 0),
    0
  );

  const pageviews30d = await fetchPageviews(pageTitle);

  const attention = Math.log10(pageviews30d + 1);
  const structure = 1 + sectionsCount / 8 + linksCount / 800;
  const lexBoost = 1 + lexHits / 10;
  const gossipIndex = Math.round(attention * structure * lexBoost * 100);

  return {
    title: pageTitle,
    url,
    sectionsCount,
    linksCount,
    lexHits,
    pageviews30d,
    gossipIndex
  };
}

async function main() {
  const out = [];
  for (const t of seeds) {
    console.log("Scraping:", t);
    const row = await scrapeOne(t);
    out.push(row);
  }

  fs.mkdirSync(new URL("../data/", import.meta.url), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ items: out }, null, 2));

  console.log("Dataset saved to data/dataset.json");
}

main().catch(console.error);
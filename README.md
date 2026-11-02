# AI in Africa — Data Visualization Website

Is the African continent ready for the AI revolution? This project investigates Africa's
position in the global AI landscape through data visualization, comparing 54 countries on
AI readiness, digital infrastructure and human capital — with a special focus on **Togo**.

Built for the course **Data Visualization (90529)** at the Università di Genova.

## Author

**Yawovi Joseph Essossima** — student ID 9980192 — [9980192@studenti.unige.it](mailto:9980192@studenti.unige.it)

## View the site

The site is static HTML + CSS + vanilla JavaScript, hosted on GitHub Pages:

> https://<your-username>.github.io/<your-repo-name>/

*(Replace the address above with your actual GitHub Pages URL after publishing.)*

## What you will find

| # | Page | Content |
|---|------|---------|
| 01 | **The AI Readiness Gap** | Choropleth map, full ranking and country comparisons from the Oxford Insights Government AI Readiness Index 2025 (score 0–100) |
| 02 | **Digital Foundations** | Internet use, electricity access and mobile subscriptions, and how they correlate with AI readiness |
| 03 | **The Human Capital Question** | Tertiary education, R&D spending and researchers per million as proxies for AI skills |
| 04 | **Togo: A Case Study** | Country profile and comparison with Ghana, Benin and Burkina Faso |
| 05 | **The Road Ahead** | Opportunities, risks and the digital divide between the most and least AI-ready countries |
| 06 | **Data** | Download links for every dataset and a full data dictionary |

Highlights of the findings:

- **Egypt (59.1), South Africa (53.9) and Mauritius (52.8)** lead the continent; the African average is about **30** — far below global leaders such as the United States and Singapore.
- **Togo scores 30.6/100**, ranking **22nd of 54** in Africa and **124th of 195** worldwide — close to the African average, above Burkina Faso but below Ghana (47.4) and Benin (41.7).
- Internet use correlates moderately with AI readiness (Pearson **r ≈ 0.46** across 54 countries) — an association, not proof of causation.
- Togo's main constraints are incomplete electricity (56%) and internet access (39%), and a small research base (~58 researchers per million people, ~0.2% of GDP spent on R&D).

## Data sources

- [Oxford Insights, Government AI Readiness Index 2025](https://oxfordinsights.com/ai-readiness/government-ai-readiness-index-2025/) — readiness score, global rank and eight sub-pillars.
- [World Bank Open Data](https://data.worldbank.org/) (World Development Indicators) — internet use, electricity access, mobile subscriptions, tertiary enrolment, R&D expenditure, researchers and GDP per capita, with the latest available year per country.

Values were downloaded from these public sources and lightly cleaned for this project.
Reference years differ between countries and indicators, which is why each value carries
its own year. An empty cell means the source reports no value; charts skip or flag these
as "no data".

## Datasets

All data behind the charts is downloadable, both on the site's **Data** page and directly from [`site/data/`](site/data/):

- `africa-indicators.csv` — one row per African country, all indicators (opens in Excel/Google Sheets)
- `africa.json` — same data plus World Bank time series, global leaders and indicator metadata
- `africa-map.json` — simplified country borders for the maps

## How the site is built

- **No frameworks, no build step**: plain HTML, CSS and vanilla JavaScript (ES2020).
- Charts are hand-drawn SVG generated in the browser from the datasets — maps, bar charts, scatter plots with least-squares trend lines, line charts and interactive country selectors.
- Interactive elements (dropdowns, chips, mobile menu) are accessible: `aria-pressed`, `aria-current`, `aria-label`, keyboard-focusable links.
- Togo is highlighted (outlined / colored) in every chart for easy comparison.

```
site/
├── index.html          # Home with key figures and chapter cards
├── css/style.css       # Styling (dark-ink & gold palette, serif/sans pairing)
├── js/charts.js        # Shared SVG chart helpers and data loading
├── js/pages.js         # Page-specific visualizations
├── data/               # Datasets (CSV + JSON)
└── pages/              # Readiness, Infrastructure, Human capital, Togo, Future, Data
```

## Run it locally

Because the pages fetch their data with `fetch()`, open them through a small web server
rather than double-clicking the files:

```sh
cd site
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deployment (GitHub Pages)

1. Create a GitHub repository and upload the contents of `site/` (the site folder ships with a `.nojekyll` file).
2. In the repository settings, enable **Pages** → deploy from the `main` branch, root folder.
3. Update the live URL at the top of this README.

## Notes

- The Togo policy timeline mentions only dates confirmed from official sources; items not yet officially published are marked as such.
- The two "Congo" countries, Egypt, Gambia and São Tomé & Príncipe use shortened labels in charts for readability.
- All charts show unweighted averages where aggregates are used.

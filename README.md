# Jailbreak Tree

A lineage-aware visual encyclopedia of LLM jailbreak techniques for red teamers, defenders, and researchers.

[![v0](https://img.shields.io/badge/status-v0-blue)]() [![data as of](https://img.shields.io/badge/data-May%202026-green)]() [![dual-use policy](https://img.shields.io/badge/dual--use-mechanism%20only-orange)]()

> Security through obscurity isn't security. Defenders should understand every published jailbreak as well as attackers do.

## What this is

Existing jailbreak resources are flat lists ([HarmBench](https://github.com/centerforaisafety/HarmBench), [JailbreakBench](https://jailbreakbench.github.io/)) or buried in dense survey papers. None show how techniques *evolved from each other*. This site is:

- A **graph** showing technique lineage — DAN → Skeleton Key, GCG → AutoDAN → AdvPrompter, PAIR → TAP → Reasoning-agent attacker, etc.
- A **frontier-model matrix** showing per-technique Attack Success Rate (ASR) on GPT-5.5, Claude Opus 4.7, Gemini 3.1 Pro, Llama 4, DeepSeek V4 Pro, Grok 4 — with sources.
- A **per-node side panel** with mechanism, origin paper, defenses, and per-model ASR with citations.

## What this is not

- **Not a payload repository.** Per the dual-use policy ([DESIGN.md §8](DESIGN.md)), we publish mechanisms + citations, not working prompts.
- **Not a benchmark.** Use [HarmBench](https://github.com/centerforaisafety/HarmBench) / [JailbreakBench](https://jailbreakbench.github.io/) for that.
- **Not a real-time vuln scanner.** Status data is best-effort and dated; cells are marked `HISTORICAL` when evidence is older than 12 months.

## Run it locally

```bash
python3 -m http.server 8000
```

Open <http://localhost:8000>. Static site — no build step.

## Project structure

| Path | What |
|---|---|
| `index.html`, `app.js`, `styles.css` | The site |
| `data/nodes.json` | Technique nodes (28 at v0) — id, mechanism, origin, status[], defenses, tags |
| `data/edges.json` | Lineage edges (33 at v0) — `evolved-from`, `inspired-by`, `generalizes`, `combines`, `defense-bypass-of` |
| `data/models.json` | The six current frontier models with vendor-family alias chains |
| `data/SOURCES.md` | Provenance for the seed dataset |
| `DESIGN.md` | Information model, UX, dual-use policy, roadmap |
| `INGESTION.md` | How nodes get added — manual curation now, optional automated pipeline later |

## Honest limitations

- **Most current frontier × technique cells are empty.** The public literature has tested specific older models against specific techniques, not all 6 frontier models against all 28 techniques. Empty cells mean "no public eval data" — *not* "patched."
- **Verified ASRs are mostly from 2023–2024 papers.** The matrix surfaces these via vendor-family aliases (e.g. claude-opus-4.7 inherits historical data from claude-2 in the GCG paper) and tags them `HISTORICAL`. Real numbers, older models.
- **`anecdotal` confidence tier exists in the schema but no v0 entries use it.** Single-tweet jailbreaks were excluded from seed.

For a public launch, the v3 work is to commission specific 2026 evals against current frontier APIs and replace `HISTORICAL` data points one by one.

## Contributing

PRs welcome — see [DESIGN.md §8](DESIGN.md) for the dual-use policy that submissions are reviewed against. Add a node by editing `data/nodes.json` + `data/edges.json` and including:

- A primary citation (paper, vendor disclosure, or system card)
- A confidence tier (`peer-reviewed` / `vendor-confirmed` / `community-reproduced` / `anecdotal`)
- ≥1 lineage edge to an existing node
- ASR numbers only with a cited source — otherwise omit the status entry

## Stack

- [Cytoscape.js](https://js.cytoscape.org/) + [dagre layout](https://github.com/cytoscape/cytoscape.js-dagre) for the graph
- Vanilla JS — no framework, no build
- Static hosting (works on Vercel, Cloudflare Pages, GitHub Pages, or `python3 -m http.server`)

## License

TBD before public launch. Likely CC BY-SA 4.0 for content + MIT for code.

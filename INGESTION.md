# Ingestion & Continuous Update Plan

How the tree gets seeded and stays current. Companion to DESIGN.md.

The honest answer: **fully automated scraping → tree is a bad idea**. Jailbreak claims are noisy, half are duplicates, a third don't reproduce, and dual-use review can't be automated. The right architecture is *automated discovery + human-in-the-loop review*. Cast a wide net cheaply, let an LLM pre-classify, surface a daily review queue, maintainer merges via PR.

---

## 1. Sources (tiered by signal-to-noise)

### Tier A — high signal, structured, easy to ingest

| Source | Method | Cadence |
|---|---|---|
| arXiv `cs.CR` + `cs.CL` + `cs.AI` | RSS feed, keyword filter (`jailbreak`, `prompt injection`, `adversarial prompt`, `red team`, `LLM safety`) | Hourly |
| HuggingFace Papers | RSS / scrape, same keyword filter | Daily |
| Vendor system cards & safety blogs (Anthropic, OpenAI, Google DeepMind, Meta) | RSS where available, scrape otherwise | Daily |
| HarmBench / JailbreakBench / AdvBench dataset releases | GitHub API (releases, commits to `main`) | Daily |
| CVE / MITRE ATLAS updates | RSS | Daily |

### Tier B — medium signal, noisy, needs filtering

| Source | Method | Cadence |
|---|---|---|
| Reddit: `r/ChatGPTJailbreak`, `r/LocalLLaMA`, `r/PromptEngineering`, `r/MachineLearning` | Reddit JSON API (`.json` suffix, no auth needed for public) | Hourly |
| Hacker News | Algolia API, keyword query | Hourly |
| GitHub: trending repos + watch list (L1B3RT4S, awesome-jailbreak, jailbreakchat archives) | GitHub API search + repo watch | Daily |
| Lobsters | RSS | Daily |

### Tier C — high signal but hard to ingest

| Source | Method | Cadence |
|---|---|---|
| Twitter/X (Pliny, jailbreak researchers) | No reliable API at our budget. **Manual flagging** via a bookmarklet that POSTs a URL to our review queue. | Ad hoc |
| Discord servers (BASI, Pliny's, etc.) | No scraping (ToS + ethics). Maintainers in the servers manually flag. | Ad hoc |
| AI Village / DEF CON talks | Scrape conference programs post-event; manual for live coverage. | Per conference |
| Vendor disclosure emails / private channels | Manual. | Ad hoc |

We do **not** scrape sources that prohibit it (Discord, gated forums). Public web only.

## 2. Pipeline

```
[Scrapers (Tier A/B)]  [Manual flag (Tier C)]
        ↓                       ↓
    [Raw items table] ← dedup by URL hash
        ↓
   [LLM classifier] — Claude/Haiku tags: is_jailbreak (bool),
                     family_guess, mechanism_summary,
                     novelty_guess (new | variant | duplicate),
                     dual_use_risk (low | med | high)
        ↓
   [Review queue UI] — maintainer sees one card per item:
                       title, source, summary, suggested family,
                       suggested parent node, citations
        ↓
   [Decision]
        ├── Reject (spam, duplicate, not a jailbreak)
        ├── Merge into existing node (add citation/status update)
        └── New node → auto-generate JSON + MDX skeleton → PR
```

### 2.1 Scrapers

- One Python service per source, dead-simple. Output: `{ url, title, body, source, fetched_at }` rows in Postgres (Supabase free tier).
- Dedup on normalized URL + content hash.
- Keyword pre-filter cuts ~95% of noise before the LLM step.

### 2.2 LLM classifier

- Cheap model (Haiku) with a structured-output prompt.
- Inputs: title, first 4k chars of body, source.
- Outputs (JSON):
  ```json
  {
    "is_jailbreak": true,
    "family_guess": "persona-roleplay",
    "mechanism_summary": "One-sentence description.",
    "novelty_guess": "variant",
    "candidate_parent_node_id": "dan-v1",
    "dual_use_risk": "medium",
    "rationale": "Why this is or isn't a jailbreak; what makes it novel."
  }
  ```
- Cost: ~$0.01 per item at Haiku rates. At ~500 items/day post-filter, that's ~$5/day = $150/mo. Fine.

### 2.3 Review queue

- Lightweight web UI (same Next.js app, gated route for maintainers).
- Card per item: source link, LLM's suggested classification, three buttons: **Reject** / **Merge into [node]** / **Create new node**.
- "Create new node" opens a pre-filled form (name, mechanism, family, parent, citation). Submit → opens a GitHub PR via the GitHub API with the JSON entry + MDX writeup stub.
- Target: 5–10 minutes of maintainer time per day to clear the queue.

### 2.4 Status updates (separate flow)

Patch status rots. Separate from new-node ingestion:

- Quarterly automated re-test against an eval harness (PAIR-style or HarmBench subset) for the top ~30 nodes.
- "Report a status change" button on every node — community submission, maintainer-reviewed.
- Vendor-confirmed updates (system card releases) auto-flagged for review.

## 3. Bootstrapping the initial 60 nodes

Don't try to scrape your way to v1. The initial corpus is small enough to hand-curate from known sources:

1. **Survey papers** as anchors — "A Survey on Jailbreak Attacks on LLMs" (multiple), Liu et al., Yi et al. — gives you a ready-made taxonomy and citation list.
2. **HarmBench + JailbreakBench paper appendices** — every technique they evaluate is a node.
3. **Vendor system cards** (Claude, GPT-4, Llama) — list known attack categories.
4. **Existing awesome-lists** (`awesome-jailbreak-on-llms`, `awesome-llm-jailbreak`) — link dump, but each link is a candidate node.

A maintainer can hand-curate 60 nodes in ~2 weekends. The scraper pipeline is for *staying current after launch*, not for building the seed.

## 4. Daily-update workflow (post-launch)

```
07:00  Scrapers run overnight, classifier processes, queue populated.
08:00  Maintainer opens review queue, ~20–40 items.
08:10  Reject obvious noise (~70%).
08:20  Merge citation/status updates into existing nodes (~20%).
08:30  Create new-node PRs for genuinely novel items (~10%, so 2–4 per day).
       PRs auto-deploy to a preview URL; second maintainer reviews + merges.
08:45  Done.
```

A second maintainer reviewing PRs (not just creating them) is the dual-use safety net. Two-person review on every new node.

## 5. What we explicitly don't do

- **No auto-merging.** Every node and every status change is human-reviewed. Automated trees fill with garbage; we'd rather be slow than wrong.
- **No scraping Discord, gated forums, or paywalled content.**
- **No reproducing payloads.** The classifier extracts mechanism, not prompt text. Working payloads in scraped content are dropped before storage.
- **No vendor-private info.** If a maintainer learns of a 0-day through a private channel, it doesn't go in until disclosed publicly or vendor-cleared.

## 6. Costs (rough)

| Item | Monthly |
|---|---|
| Hosting (Vercel free) | $0 |
| Supabase (free tier likely fine at v1) | $0–$25 |
| Claude Haiku classifier | ~$150 |
| Domain | $1 |
| Eval harness compute (quarterly status re-test) | ~$50 amortized |
| **Total** | **~$200/mo** |

Sponsorable. Don't take vendor money for the first 6 months — credibility matters more than runway.

## 7. Open questions

1. Should the review queue be public read-only? Argument for: transparency, lets the community see what's coming. Against: tips off attackers to active research before maintainer review.
2. How to handle non-English sources? Chinese AI safety papers (Tsinghua, etc.) often lead by 3–6 months. Need a translator step or a Mandarin-reading maintainer.
3. Do we re-classify older items when the classifier prompt improves? Probably yes, but cap at last 90 days.
4. What's the SLA on dual-use takedown requests? Define before launch.

## 8. Build order

1. **Manual seed first** (§3) — proves the schema and UX before any pipeline exists.
2. **Reddit + arXiv scrapers + classifier + review queue** — lowest-effort, highest-yield two sources. Get the daily flow working.
3. **HN + GitHub + HuggingFace** — add once the queue UX is tuned.
4. **Manual flag bookmarklet** for Twitter/Discord — small, useful, last.
5. **Quarterly eval re-test** — only after the tree has nodes worth re-testing.

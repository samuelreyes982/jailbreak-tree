# Jailbreak Tree — Design Doc

A public, lineage-aware visual encyclopedia of LLM jailbreak techniques for red teamers, defenders, and researchers.

Working title: **Jailbreak Tree** (placeholder — alternatives: BreakGraph, RedTree, Lineage).

---

## 1. Problem

Jailbreak knowledge is fragmented across arXiv papers, Twitter threads, Discord servers, and benchmark repos (HarmBench, JailbreakBench). Existing resources are either:

- **Flat taxonomies** (lists of attack categories) — no evolution, no lineage.
- **Benchmarks** — measure success rates but don't explain *how techniques descended from each other*.
- **Paper-specific** — buried in dense academic text most practitioners don't read.

Consequence: red teamers re-derive known attacks, defenders patch symptoms instead of root mechanisms, and novel research effort is wasted on already-explored branches.

## 2. Goal

A single, navigable, NeetCode-style DAG where every node is a jailbreak technique and every edge is a *typed* relationship (descended-from, combines, generalizes, bypasses-defense). Each node has mechanism, citations, per-model patch status, and defense mapping.

**Primary users:** red teamers, AI safety researchers, model providers' safety teams, security-curious developers.

**Non-goals:**
- Not a working-payload repository (dual-use risk — see §8).
- Not a benchmark (HarmBench/JailbreakBench already do this well; we link to them).
- Not a real-time vulnerability scanner.

## 3. Success criteria

- 60+ seeded nodes across 8 root families at launch.
- Every node has ≥1 primary citation and a confidence tier.
- Patch-status claims are dated and tied to a specific model+version.
- External contributors can submit a node via PR with a JSON entry + markdown writeup.
- Page loads in under 1s on the graph view; search returns results in under 100ms.

## 4. Information model

### 4.1 Node schema

```json
{
  "id": "crescendo",
  "name": "Crescendo",
  "family": "persona-roleplay",
  "mechanism": "Multi-turn gradual escalation that uses the model's own prior outputs as justification for each next step.",
  "origin": {
    "type": "paper",
    "title": "Great, Now Write an Article About That: The Crescendo Multi-Turn LLM Jailbreak Attack",
    "authors": ["Russinovich et al."],
    "date": "2024-04",
    "url": "https://arxiv.org/abs/2404.01833"
  },
  "confidence": "peer-reviewed",
  "status": [
    { "model": "gpt-4", "version": "2024-04", "result": "vulnerable", "evidence_url": "..." },
    { "model": "claude-3-opus", "version": "2024-05", "result": "partially-patched", "evidence_url": "..." }
  ],
  "defenses": ["multi-turn-classifier", "conversation-level-monitoring"],
  "tags": ["multi-turn", "self-referential", "no-suffix"],
  "writeup": "writeups/crescendo.md"
}
```

### 4.2 Edge schema

```json
{
  "from": "gradual-escalation-roleplay",
  "to": "crescendo",
  "type": "evolved-from",
  "note": "Crescendo formalizes self-referential escalation that DAN-era roleplay used informally."
}
```

Edge types:
- `evolved-from` — direct lineage / refinement.
- `combines` — N parents merged into one technique.
- `generalizes` — abstract version of a specific attack.
- `defense-bypass-of` — explicitly defeats a published defense.
- `inspired-by` — weaker claim, used for cross-domain borrowings (e.g. classical infosec).

### 4.3 Confidence tiers

| Tier | Meaning |
|---|---|
| `peer-reviewed` | Published paper or vendor disclosure. |
| `vendor-confirmed` | Acknowledged by a model provider (system card, blog, advisory). |
| `community-reproduced` | Multiple independent reproductions on public models. |
| `anecdotal` | Single source, screenshots, folklore. Rendered with dashed border. |

### 4.4 Status values

`vulnerable` · `partially-patched` · `patched` · `unverified` · `deprecated` (technique no longer applies — e.g. relied on a feature that was removed).

## 5. Root families (initial seed)

1. **Persona / roleplay** — DAN → DAN variants → STAN → DUDE → crescendo → policy puppetry.
2. **Prompt injection** — direct → indirect (web/doc) → tool/agent injection → memory injection → MCP-server injection.
3. **Context manipulation** — many-shot → long-context distraction → conversation poisoning → token smuggling.
4. **Encoding / obfuscation** — base64 → cipher (Caesar, ROT, custom) → low-resource language → leetspeak → ASCII art (ArtPrompt) → typographic image.
5. **Optimization-based** — GCG → AutoDAN → transferable suffixes → multimodal GCG → PAIR / TAP (LLM-as-attacker).
6. **Multimodal** — image jailbreaks → audio → typographic → visual prompt injection.
7. **Fine-tuning / weight attacks** — BadLlama → harmful FT → LoRA-based attacks → emergent misalignment.
8. **Agentic** — tool misuse → browser/DOM injection → cross-tool exfil → memory poisoning across sessions.

Each family gets a root node; each technique is a child; cross-family edges (e.g. `combines`) are explicit.

## 6. UX

### 6.1 Graph view (primary)

- React Flow canvas, dark theme, NeetCode-style rounded rectangle nodes.
- Color = family. Border style = confidence (solid = verified, dashed = anecdotal).
- Status bar inside node: green/yellow/red/gray segment showing aggregate patch status across tracked frontier models.
- Click node → side panel with full writeup, citations, status table, defense links.
- Filters: family, confidence, status, model, year.
- Search: fuzzy on name + tags + mechanism.

### 6.2 Node detail page

Standalone URL (`/n/crescendo`) with:
- Mechanism (1 paragraph).
- Lineage breadcrumb (parents → this → children).
- Per-model status table with dates and evidence links.
- Defenses that mitigate it.
- Citations.
- "How to test for this" — generic, defensive framing only (no working payloads).

### 6.3 Submission flow

- "Propose a node" button → opens GitHub PR template with JSON skeleton.
- Required fields: mechanism, ≥1 citation, confidence tier, ≥1 lineage edge.
- Maintainer review for accuracy + dual-use check before merge.

## 7. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript | Static export, good SEO for educational content. |
| Graph | React Flow | DAG layout, custom nodes, pan/zoom out of the box. |
| Layout | dagre or elkjs | Auto-layout the DAG; manual overrides per-node. |
| Content | JSON nodes + MDX writeups in `/data` | Source-of-truth in git, PR-reviewable. |
| Search | FlexSearch (client-side) | No backend needed at launch. |
| Hosting | Vercel | Free tier, preview deploys per PR. |
| Analytics | Plausible | Privacy-respecting, public dashboard. |

No backend at v1. Everything is static + git. If we later need user accounts (saved views, contributions without GitHub), add Supabase.

## 8. Dual-use policy

This is the most important section.

**What we publish:**
- Technique names, mechanisms (conceptual, not operational).
- Citations to primary sources.
- Patch status with evidence links.
- Defense mappings.

**What we do NOT publish:**
- Working prompt payloads.
- Step-by-step exploitation guides.
- Currently-unpatched zero-days against named production models without prior vendor disclosure (90-day standard).

**Review:** every PR is checked against this policy before merge. Maintainers reserve the right to redact a technique to mechanism-only if the working payload is the only contribution.

This mirrors how HarmBench and JailbreakBench operate, and how classical infosec disclosure (CVE process) handles dual-use. State the policy on the homepage; link to it from every node.

## 9. Roadmap

**v0 — Skeleton (week 1–2)**
- Repo setup, JSON schemas, MDX pipeline.
- 5 root families × 2 nodes each = 10 seed nodes (DAN, crescendo, GCG, base64, indirect injection, etc.).
- Graph renders, click → detail panel works.

**v1 — Public launch (week 3–6)**
- 60+ nodes across all 8 families.
- Search, filters, per-node pages with stable URLs.
- PR template + contribution guide.
- Dual-use policy page.
- Deploy to a real domain.

**v2 — Community (month 2–3)**
- Open contributions, maintainer team of 2–3.
- Twitter/Bluesky/HN launch.
- Reach out to HarmBench, JailbreakBench, AI Village to cross-link.

**v3 — Depth (month 3+)**
- Per-model timeline view ("what worked on Claude 3.5 in March 2025?").
- Defense pages (each defense as a first-class node).
- API for programmatic access (read-only).
- Optional: integrate with eval harnesses for live patch-status verification.

## 10. Open questions

1. **Naming** — "Jailbreak Tree" is descriptive but a bit on the nose for a security audience. Alternatives?
2. **Verification cadence** — patch status rots fast. Do we re-test quarterly? Crowdsource? Partner with a benchmark?
3. **Vendor relationships** — should we offer pre-publication review to model providers for status claims about their models?
4. **Anecdotal nodes** — include them at all? Argument for: tracks early signal. Argument against: dilutes credibility. Current answer: include with dashed border + `anecdotal` tier.
5. **Monetization** — none at v1. If it grows, sponsor logos (HackerOne, Lakera, Anthropic, etc.) on the about page only.

## 11. Risks

- **Dual-use criticism** — mitigated by §8 policy and mechanism-only stance.
- **Maintenance burden** — patch status rots; cap initial scope, build tooling for re-verification, recruit maintainers early.
- **Vendor pushback** — possible if status claims are wrong. Mitigated by required evidence links and a public correction process.
- **Scope creep** — temptation to cover prompt-engineering generally. Hard line: only attacks that violate the model's intended safety behavior.

## 12. Next steps

1. Lock the node + edge schemas (this doc).
2. Hand-write the first 10 seed nodes as JSON + MDX (DAN family fully fleshed out — 5 nodes, then 5 across other families).
3. Build the graph renderer against those 10 nodes.
4. Iterate on layout + side panel.
5. Open the repo publicly and start v1 buildout.
